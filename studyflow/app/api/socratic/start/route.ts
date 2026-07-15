import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { openai } from '@/lib/openai'
import { AI_MODELS, AI_TEMPERATURES } from '@/lib/ai-config'
import { fetchRAGContext } from '@/lib/rag'

interface StartBody {
  enrollment_id: string
  subject_id: string
}

interface PastSession {
  ai_score: number | null
  weak_points: unknown[]
  session_date: string | null
}

function buildSessionHistory(sessions: PastSession[]): string {
  if (sessions.length === 0) return ''

  const lines = sessions.map((s) => {
    const daysAgo = s.session_date
      ? Math.round((Date.now() - new Date(s.session_date).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const when = daysAgo !== null ? `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago` : 'previously'
    const score = s.ai_score !== null ? `score ${s.ai_score}` : 'score unknown'
    const wp = Array.isArray(s.weak_points) && s.weak_points.length > 0
      ? `, weak points: [${(s.weak_points as string[]).join(', ')}]`
      : ''
    return `- ${when}: ${score}${wp}`
  })

  return `Session history for this subject (most recent first):\n${lines.join('\n')}`
}

function buildSystemPrompt(
  courseName: string,
  subjectName: string,
  subjectDescription: string | null,
  ragContent: string,
  sessionHistory: string
): string {
  const parts: string[] = [
    `You are a Socratic tutor for the course "${courseName}", subject: "${subjectName}".`,
  ]

  if (subjectDescription) {
    parts.push(`Subject description: ${subjectDescription}`)
  }

  if (ragContent) {
    parts.push(`The following course material is available for context:\n---\n${ragContent}\n---`)
  } else {
    parts.push(
      `No course materials have been uploaded yet. Use your general academic knowledge about "${subjectName}" in the context of "${courseName}".`
    )
  }

  if (sessionHistory) {
    parts.push(sessionHistory)
  }

  parts.push(
    `IMPORTANT: Only ask about concepts covered in the provided course materials. ` +
    `If no materials are provided, restrict your questions to topics that clearly fall ` +
    `under the subject name and description. Do not introduce external concepts, ` +
    `terminology, or frameworks that the student may not have encountered in this course.`,
    `Rules:`,
    `- Ask ONE open-ended question to begin assessing the student's understanding.`,
    `- Never give away answers, definitions, or solutions.`,
    `- The question must require the student to explain, reason, or apply a concept — not recall a fact.`,
    `- If prior session history exists, prioritize probing concepts the student has repeatedly struggled with.`,
    `- The question should be answerable in 2-4 sentences by a student who understands the material.`
  )

  return parts.join('\n\n')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: StartBody = await request.json()
  const { enrollment_id, subject_id } = body

  if (!enrollment_id || !subject_id) {
    return NextResponse.json({ error: 'enrollment_id and subject_id are required' }, { status: 400 })
  }

  try {
    // Verify enrollment ownership
    const { data: enrollment } = await supabase
      .from('course_enrollment')
      .select('enrollment_id, course_id')
      .eq('enrollment_id', enrollment_id)
      .eq('user_id', user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Fetch subject details
    const { data: subject } = await supabase
      .from('course_subjects')
      .select('subject_name, subject_description')
      .eq('subject_id', subject_id)
      .single()

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Fetch course name
    const { data: course } = await supabase
      .from('courses')
      .select('course_name')
      .eq('course_id', enrollment.course_id)
      .single()

    const courseName = course?.course_name ?? 'this course'

    // Fetch last 5 completed sessions for cross-session context
    const { data: pastSessions } = await supabase
      .from('socratic_tutor_sessions')
      .select('ai_score, weak_points, session_date')
      .eq('enrollment_id', enrollment_id)
      .eq('subject_id', subject_id)
      .eq('session_status', 'completed')
      .order('session_date', { ascending: false })
      .limit(5)

    const sessionHistory = buildSessionHistory((pastSessions ?? []) as PastSession[])

    // Fetch RAG content
    const ragContent = await fetchRAGContext(supabase, enrollment_id)

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      courseName,
      subject.subject_name,
      subject.subject_description,
      ragContent,
      sessionHistory
    )

    // Call GPT-4o to generate the opening question
    const response = await openai.chat.completions.create({
      model: AI_MODELS.QUESTION_GENERATION,
      temperature: AI_TEMPERATURES.QUESTION_GENERATION,
      messages: [{ role: 'system', content: systemPrompt }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_question',
            description: 'Generate the opening Socratic question for a tutoring session.',
            parameters: {
              type: 'object',
              properties: {
                question: {
                  type: 'string',
                  description:
                    'A single Socratic question that probes the student\'s understanding. Must not give away any answer.',
                },
              },
              required: ['question'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'generate_question' } },
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as
      | { function: { arguments: string } }
      | undefined
    if (!toolCall) throw new Error('OpenAI did not return a tool call')

    const { question } = JSON.parse(toolCall.function.arguments) as { question: string }

    // Insert new session
    const { data: session, error: insertError } = await supabase
      .from('socratic_tutor_sessions')
      .insert({
        enrollment_id,
        subject_id,
        session_date: new Date().toISOString(),
        ai_questions: [{ index: 0, question, hints_used: 0, type: 'initial' }],
        user_answers: [],
        ai_feedback: [],
        weak_points: [],
        hints_given: 0,
        session_status: 'in_progress',
      })
      .select('session_id')
      .single()

    if (insertError || !session) throw new Error('Failed to create session')

    return NextResponse.json({ session_id: session.session_id, question })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to start session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
