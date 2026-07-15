import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { openai } from '@/lib/openai'
import { AI_MODELS, AI_TEMPERATURES } from '@/lib/ai-config'
import { fetchRAGContext } from '@/lib/rag'

interface HintBody {
  session_id: string
  question_index: number
}

interface AiQuestion {
  index: number
  question: string
  hints_used: number
  type: 'initial' | 'next' | 'dig_deeper'
}

interface HintResult {
  hint_text: string
  material_ref: string | null
  move_on: boolean
}

async function checkRateLimit(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, enrollmentId: string): Promise<boolean> {
  const { count } = await supabase
    .from('socratic_tutor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
    .eq('session_status', 'in_progress')
    .gte('session_date', new Date(Date.now() - 60 * 60 * 1000).toISOString())

  return (count ?? 0) > 3
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: HintBody = await request.json()
  const { session_id, question_index } = body

  if (!session_id || question_index === undefined || question_index === null) {
    return NextResponse.json({ error: 'session_id and question_index are required' }, { status: 400 })
  }

  try {
    // Fetch session (RLS handles ownership)
    const { data: session } = await supabase
      .from('socratic_tutor_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Rate limit check using session.enrollment_id
    const rateLimited = await checkRateLimit(supabase, session.enrollment_id)
    if (rateLimited) {
      return NextResponse.json({ error: 'Too many active sessions' }, { status: 429 })
    }

    const questions = (session.ai_questions ?? []) as AiQuestion[]
    const question = questions[question_index]

    if (!question) {
      return NextResponse.json({ error: 'Question not found at given index' }, { status: 400 })
    }

    if (question.hints_used >= 1) {
      return NextResponse.json({ error: 'Max hints reached' }, { status: 400 })
    }

    // Fetch subject name for the prompt
    const { data: subject } = await supabase
      .from('course_subjects')
      .select('subject_name')
      .eq('subject_id', session.subject_id)
      .single()

    const subjectName = subject?.subject_name ?? 'this subject'

    // Fetch RAG content
    const ragContent = await fetchRAGContext(supabase, session.enrollment_id)

    const ragSection = ragContent
      ? `Relevant course material:\n---\n${ragContent}\n---`
      : `No course materials have been uploaded yet. Use your general academic knowledge about "${subjectName}".`

    const systemPrompt = [
      `You are a Socratic tutor providing a hint to a student who is stuck.`,
      `Question: "${question.question}"`,
      ragSection,
      `IMPORTANT: Only reference concepts covered in the provided course materials. ` +
      `If no materials are provided, restrict your hints to topics that clearly fall ` +
      `under the subject name and description. Do not introduce external concepts, ` +
      `terminology, or frameworks that the student may not have encountered in this course.`,
      `Provide a guiding nudge that points the student toward the right concept or principle ` +
      `without giving away the answer. If relevant course material exists, reference the ` +
      `specific topic or section they should review. Never answer directly. ` +
      `Set move_on to true if the student has clearly exhausted meaningful engagement with this question.`,
    ].join('\n\n')

    const response = await openai.chat.completions.create({
      model: AI_MODELS.HINT_GENERATION,
      temperature: AI_TEMPERATURES.HINT_GENERATION,
      messages: [{ role: 'system', content: systemPrompt }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_hint',
            description: 'Generate a hint for the student without revealing the answer.',
            parameters: {
              type: 'object',
              properties: {
                hint_text: {
                  type: 'string',
                  description:
                    'A guiding nudge pointing the student toward the concept without giving the answer.',
                },
                material_ref: {
                  type: ['string', 'null'],
                  description:
                    'A short reference to a specific course topic or principle that is relevant, or null if not applicable.',
                },
                move_on: {
                  type: 'boolean',
                  description:
                    'True if the student appears to have exhausted engagement with this question.',
                },
              },
              required: ['hint_text', 'material_ref', 'move_on'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'generate_hint' } },
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as
      | { function: { arguments: string } }
      | undefined
    if (!toolCall) throw new Error('OpenAI did not return a tool call')

    const result = JSON.parse(toolCall.function.arguments) as HintResult

    // Increment hints_used for this question
    const updatedQuestions = questions.map((q, i) =>
      i === question_index ? { ...q, hints_used: q.hints_used + 1 } : q
    )

    const { error: updateError } = await supabase
      .from('socratic_tutor_sessions')
      .update({
        ai_questions: updatedQuestions,
        hints_given: (session.hints_given ?? 0) + 1,
      })
      .eq('session_id', session_id)

    if (updateError) throw new Error('Failed to update session')

    return NextResponse.json({
      hint_text: result.hint_text,
      material_ref: result.material_ref,
      move_on: result.move_on,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate hint'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
