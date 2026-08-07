import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { openai } from '@/lib/openai'
import { AI_MODELS, AI_TEMPERATURES, RAG_MATCH_COUNTS } from '@/lib/ai-config'
import { fetchRAGContext, formatRagChunksForPrompt, type RagChunk } from '@/lib/rag'
import {
  buildKnowledgeProfile,
  difficultyGuidance,
  type KnowledgeProfile,
} from '@/app/api/socratic/utils/knowledgeProfile'

interface StartBody {
  enrollment_id: string
  subject_id: string
}

interface PastAiQuestion {
  question?: string
  type?: string
}

function buildSystemPrompt(
  courseName: string,
  subjectName: string,
  subjectDescription: string | null,
  ragChunks: RagChunk[],
  profile: KnowledgeProfile,
  priorQuestions: string[]
): string {
  const parts: string[] = [
    `You are a Socratic tutor for the course "${courseName}", subject: "${subjectName}".`,
  ]

  if (subjectDescription) {
    parts.push(`Subject description: ${subjectDescription}`)
  }

  if (ragChunks.length > 0) {
    parts.push(
      `The following course material is available for context:\n---\n${formatRagChunksForPrompt(ragChunks)}\n---`
    )
  } else {
    parts.push(
      `No course materials have been uploaded yet. Use your general academic knowledge about "${subjectName}" in the context of "${courseName}".`
    )
  }

  if (profile.sessionHistorySummary) {
    parts.push(profile.sessionHistorySummary)
  }

  if (profile.recurringWeakPoints.length > 0) {
    const labels = profile.recurringWeakPoints.map((w) => w.label).join(', ')
    parts.push(
      `The student has repeatedly struggled with these concepts across past sessions (prioritize probing them): [${labels}].`
    )
  }

  if (priorQuestions.length > 0) {
    const list = priorQuestions.map((q) => `- ${q}`).join('\n')
    parts.push(`Do not repeat or closely rephrase these previously-asked opening questions:\n${list}`)
  }

  parts.push(
    `IMPORTANT: Only ask about concepts covered in the provided course materials. ` +
      `If no materials are provided, restrict your questions to topics that clearly fall ` +
      `under the subject name and description. Do not introduce external concepts, ` +
      `terminology, or frameworks that the student may not have encountered in this course.`,
    difficultyGuidance(profile.difficultyBand),
    `Rules:`,
    `- Ask ONE open-ended question to begin assessing the student's understanding.`,
    `- Ground the question in a SPECIFIC concept, example, term, or detail from the material above — ` +
      `do NOT use generic phrasing like "explain the core principle" or "describe this topic in your own words."`,
    `- Never give away answers, definitions, or solutions.`,
    `- The question must require the student to explain, reason, or apply a concept — not recall a fact.`,
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

    // Assemble what we know about the student's understanding of this subject.
    const profile = await buildKnowledgeProfile(supabase, enrollment_id, subject_id)

    // Pull the opening questions of recent sessions so we don't repeat them.
    const { data: recentSessions } = await supabase
      .from('socratic_tutor_sessions')
      .select('ai_questions')
      .eq('enrollment_id', enrollment_id)
      .eq('subject_id', subject_id)
      .eq('session_status', 'completed')
      .order('session_date', { ascending: false })
      .limit(3)

    const priorQuestions = (recentSessions ?? [])
      .map((s) => {
        const questions = (s.ai_questions ?? []) as PastAiQuestion[]
        const initial = questions.find((q) => q.type === 'initial') ?? questions[0]
        return initial?.question
      })
      .filter((q): q is string => Boolean(q))

    // Retrieve material relevant to the subject to ground the opening question.
    const ragQuery = `${subject.subject_name} ${subject.subject_description ?? ''}`.trim()
    const ragChunks = await fetchRAGContext(supabase, enrollment.course_id, enrollment_id, ragQuery, {
      matchCount: RAG_MATCH_COUNTS.START,
    })

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      courseName,
      subject.subject_name,
      subject.subject_description,
      ragChunks,
      profile,
      priorQuestions
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
        covered_chunk_ids: ragChunks.map((c) => c.chunk_id),
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
