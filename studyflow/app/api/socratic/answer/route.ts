import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { openai } from '@/lib/openai'
import { AI_MODELS, AI_TEMPERATURES, RAG_MATCH_COUNTS } from '@/lib/ai-config'
import { getDecayRate } from '@/app/api/socratic/utils/battery'
import { fetchRAGContext, formatRagChunksForPrompt } from '@/lib/rag'
import {
  buildKnowledgeProfile,
  difficultyGuidance,
} from '@/app/api/socratic/utils/knowledgeProfile'

// Hard ceiling on questions per session (adaptive early completion still allowed).
const MAX_QUESTIONS = 5

// ── JSONB item types ──────────────────────────────────────────────────────────

interface AiQuestion {
  index: number
  question: string
  hints_used: number
  type: 'initial' | 'next' | 'dig_deeper'
}

interface UserAnswer {
  index: number
  question_index: number
  answer: string
  answered_at: string
}

interface AiFeedbackTurn {
  question_index: number
  action: string
  reason: string
}

interface AiFeedbackFinal {
  type: 'final'
  score: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  weak_points: string[]
}

type AiFeedbackEntry = AiFeedbackTurn | AiFeedbackFinal

// ── Shared helpers ────────────────────────────────────────────────────────────

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>

async function checkRateLimit(supabase: SupabaseClientType, enrollmentId: string): Promise<boolean> {
  const { count } = await supabase
    .from('socratic_tutor_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
    .eq('session_status', 'in_progress')
    .gte('session_date', new Date(Date.now() - 60 * 60 * 1000).toISOString())

  return (count ?? 0) > 3
}

function buildConversationHistory(questions: AiQuestion[], answers: UserAnswer[]): string {
  const answerMap = new Map(answers.map((a) => [a.question_index, a.answer]))
  return questions
    .map((q, i) => {
      const answer = answerMap.get(q.index)
      const qLine = `Q${i + 1}: ${q.question}`
      return answer ? `${qLine}\nA${i + 1}: ${answer}` : qLine
    })
    .join('\n')
}

// ── completeSession (BE-5) ────────────────────────────────────────────────────

interface CompletionResult {
  score: number
  feedback: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
}

async function completeSession(
  supabase: SupabaseClientType,
  session: Record<string, unknown>,
  updatedAnswers: UserAnswer[],
  courseName: string,
  subjectName: string
): Promise<CompletionResult> {
  const questions = (session.ai_questions ?? []) as AiQuestion[]
  const existingFeedback = (session.ai_feedback ?? []) as AiFeedbackEntry[]

  const fullTranscript = buildConversationHistory(questions, updatedAnswers)

  const systemPrompt = [
    `You are a Socratic tutor generating final session feedback.`,
    `Course: "${courseName}", Subject: "${subjectName}".`,
    `Full session transcript:\n${fullTranscript}`,
    `IMPORTANT: Only evaluate understanding of concepts covered in the provided course materials. ` +
    `If no materials are provided, restrict evaluation to topics that clearly fall ` +
    `under the subject name and description. Do not introduce external concepts, ` +
    `terminology, or frameworks that the student may not have encountered in this course.`,
    `Score 0-100 honestly: 75-95 = solid understanding, 40-70 = partial, 0-40 = significant gaps. ` +
    `Cite specific student answers in strengths/weaknesses. ` +
    `Give concrete, actionable recommendations. ` +
    `Extract short concept labels (1-4 words each) as weak_points for future sessions.`,
  ].join('\n\n')

  const response = await openai.chat.completions.create({
    model: AI_MODELS.FEEDBACK_GENERATION,
    temperature: AI_TEMPERATURES.FEEDBACK_GENERATION,
    messages: [{ role: 'system', content: systemPrompt }],
    tools: [
      {
        type: 'function',
        function: {
          name: 'generate_feedback',
          description: 'Generate final feedback and score for a completed Socratic session.',
          parameters: {
            type: 'object',
            properties: {
              score: {
                type: 'integer',
                description: 'Overall mastery score 0-100.',
              },
              strengths: {
                type: 'array',
                items: { type: 'string' },
                description: '2-4 specific things the student demonstrated understanding of.',
              },
              weaknesses: {
                type: 'array',
                items: { type: 'string' },
                description: '2-4 specific concepts or areas the student struggled with.',
              },
              recommendations: {
                type: 'array',
                items: { type: 'string' },
                description: '2-3 actionable study suggestions.',
              },
              weak_points: {
                type: 'array',
                items: { type: 'string' },
                description: 'Short concept labels (1-4 words) representing the student\'s weakest areas.',
              },
            },
            required: ['score', 'strengths', 'weaknesses', 'recommendations', 'weak_points'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'generate_feedback' } },
  })

  const toolCall = response.choices[0]?.message?.tool_calls?.[0] as
    | { function: { arguments: string } }
    | undefined
  if (!toolCall) throw new Error('OpenAI did not return feedback tool call')

  const { score, strengths, weaknesses, recommendations, weak_points } = JSON.parse(
    toolCall.function.arguments
  ) as AiFeedbackFinal

  const finalEntry: AiFeedbackFinal = {
    type: 'final',
    score,
    strengths,
    weaknesses,
    recommendations,
    weak_points,
  }

  // Update session to completed
  const { error: sessionUpdateError } = await supabase
    .from('socratic_tutor_sessions')
    .update({
      ai_score: score,
      ai_feedback: [...existingFeedback, finalEntry],
      weak_points,
      user_answers: updatedAnswers,
      session_status: 'completed',
      questions_count: questions.length,
    })
    .eq('session_id', session.session_id as string)

  if (sessionUpdateError) throw new Error('Failed to update session on completion')

  // Calculate new decay rate and next review date
  const newDecayRate = getDecayRate(score)

  let nextReviewDays: number
  if (score > 70 && newDecayRate > 0) {
    nextReviewDays = Math.max(1, Math.floor(Math.log(score / 70) / newDecayRate))
  } else {
    nextReviewDays = 1
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + nextReviewDays)

  // Upsert subject mastery
  const { error: masteryError } = await supabase
    .from('subject_mastery')
    .upsert(
      {
        enrollment_id: session.enrollment_id as string,
        subject_id: session.subject_id as string,
        mastery_score: score,
        decay_rate: newDecayRate,
        last_practiced_at: new Date().toISOString(),
        next_review_at: nextReviewAt.toISOString(),
      },
      { onConflict: 'enrollment_id,subject_id' }
    )

  if (masteryError) throw new Error('Failed to upsert subject mastery')

  return { score, feedback: { strengths, weaknesses, recommendations } }
}

// ── Main handler (BE-3) ───────────────────────────────────────────────────────

interface AnswerBody {
  session_id: string
  answer_text: string
}

interface AnalyzeResult {
  action: 'NEXT_QUESTION' | 'DIG_DEEPER' | 'COMPLETE'
  next_question?: string
  reason: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: AnswerBody = await request.json()
  const { session_id, answer_text } = body

  if (!session_id || !answer_text) {
    return NextResponse.json({ error: 'session_id and answer_text are required' }, { status: 400 })
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

    if (session.session_status === 'completed') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
    }

    const questions = (session.ai_questions ?? []) as AiQuestion[]
    const existingAnswers = (session.user_answers ?? []) as UserAnswer[]
    const existingFeedback = (session.ai_feedback ?? []) as AiFeedbackEntry[]

    const currentIndex = existingAnswers.length

    const updatedAnswers: UserAnswer[] = [
      ...existingAnswers,
      {
        index: currentIndex,
        question_index: currentIndex,
        answer: answer_text,
        answered_at: new Date().toISOString(),
      },
    ]

    const conversationHistory = buildConversationHistory(questions, updatedAnswers)

    // Fetch course name for AI context
    const { data: enrollment } = await supabase
      .from('course_enrollment')
      .select('course_id')
      .eq('enrollment_id', session.enrollment_id)
      .single()

    const { data: course } = enrollment
      ? await supabase.from('courses').select('course_name').eq('course_id', enrollment.course_id).single()
      : { data: null }

    const courseName = course?.course_name ?? 'this course'

    const { data: subject } = await supabase
      .from('course_subjects')
      .select('subject_name')
      .eq('subject_id', session.subject_id)
      .single()

    const subjectName = subject?.subject_name ?? 'this subject'

    // Retrieve material relevant to what the student just said, excluding chunks
    // already surfaced this session so follow-ups explore fresh ground.
    const coveredChunkIds = (session.covered_chunk_ids ?? []) as string[]
    const latestQuestion = questions[currentIndex]?.question ?? ''
    const ragQuery = `${latestQuestion}\n${answer_text}`.trim()
    const ragChunks = enrollment?.course_id
      ? await fetchRAGContext(supabase, enrollment.course_id, session.enrollment_id, ragQuery, {
          matchCount: RAG_MATCH_COUNTS.ANSWER,
          excludeChunkIds: coveredChunkIds,
        })
      : []

    // Calibrate difficulty from what we know about the student's mastery here.
    const profile = await buildKnowledgeProfile(supabase, session.enrollment_id, session.subject_id)

    const materialSection =
      ragChunks.length > 0
        ? `Relevant course material (ground the next question in a specific detail from here):\n---\n${formatRagChunksForPrompt(ragChunks)}\n---`
        : `No course materials are available. Restrict the next question to topics that clearly fall under the subject name.`

    const askedQuestions = questions.map((q) => `- ${q.question}`).join('\n')

    const systemPrompt = [
      `You are a Socratic tutor evaluating a student's response in an active tutoring session.`,
      `Course: "${courseName}", Subject: "${subjectName}".`,
      `Conversation so far:\n${conversationHistory}`,
      materialSection,
      `IMPORTANT: Only ask about concepts covered in the provided course materials. ` +
      `If no materials are provided, restrict your questions to topics that clearly fall ` +
      `under the subject name and description. Do not introduce external concepts, ` +
      `terminology, or frameworks that the student may not have encountered in this course.`,
      difficultyGuidance(profile.difficultyBand),
      `Already-asked questions — do NOT repeat or closely rephrase any of these:\n${askedQuestions}`,
      `Rules:\n` +
      `- Never reveal the correct answer, even when providing feedback.\n` +
      `- Ground any follow-up question in a SPECIFIC concept, example, or detail from the material above — avoid generic phrasing.\n` +
      `- NEXT_QUESTION: the answer shows reasonable understanding; move to a new angle or concept within the subject.\n` +
      `- DIG_DEEPER: the answer is vague, partially correct, or reveals a gap — probe further on the same point.\n` +
      `- COMPLETE: at least 3 exchanges have occurred AND the student has demonstrated sufficient overall understanding, OR the student has clearly exhausted meaningful engagement.\n` +
      `- When generating a follow-up question, guide through reasoning — never state the correct concept.`,
    ].join('\n\n')

    const response = await openai.chat.completions.create({
      model: AI_MODELS.ANSWER_ANALYSIS,
      temperature: AI_TEMPERATURES.ANSWER_ANALYSIS,
      messages: [{ role: 'system', content: systemPrompt }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'analyze_answer',
            description: "Analyze the student's latest answer and decide the next action.",
            parameters: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['NEXT_QUESTION', 'DIG_DEEPER', 'COMPLETE'],
                  description:
                    'NEXT_QUESTION: answer acceptable, new angle. DIG_DEEPER: answer incomplete, probe further. COMPLETE: sufficient questions asked and understanding demonstrated.',
                },
                next_question: {
                  type: ['string', 'null'],
                  description:
                    'The follow-up Socratic question when action is NEXT_QUESTION or DIG_DEEPER; null when action is COMPLETE.',
                },
                reason: {
                  type: 'string',
                  description: 'Internal reasoning for the chosen action. Not shown to student.',
                },
              },
              required: ['action', 'next_question', 'reason'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'analyze_answer' } },
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as
      | { function: { arguments: string } }
      | undefined
    if (!toolCall) throw new Error('OpenAI did not return a tool call')

    let parsed = JSON.parse(toolCall.function.arguments) as AnalyzeResult

    // Hard minimum guard: don't COMPLETE before 3 answers
    if (parsed.action === 'COMPLETE' && updatedAnswers.length < 3) {
      parsed = {
        action: 'DIG_DEEPER',
        next_question: parsed.next_question ?? 'Can you elaborate further on that?',
        reason: parsed.reason,
      }
    }

    // Hard ceiling: force completion once MAX_QUESTIONS answers are in.
    if (parsed.action !== 'COMPLETE' && updatedAnswers.length >= MAX_QUESTIONS) {
      parsed = {
        action: 'COMPLETE',
        reason: `Reached the ${MAX_QUESTIONS}-question ceiling for this session.`,
      }
    }

    // Append feedback entry for this turn
    const feedbackEntry: AiFeedbackTurn = {
      question_index: currentIndex,
      action: parsed.action,
      reason: parsed.reason,
    }
    const updatedFeedback: AiFeedbackEntry[] = [...existingFeedback, feedbackEntry]

    if (parsed.action === 'COMPLETE') {
      const result = await completeSession(
        supabase,
        session,
        updatedAnswers,
        courseName,
        subjectName
      )
      return NextResponse.json({ action: 'COMPLETE', ...result })
    }

    // NEXT_QUESTION or DIG_DEEPER — ensure we have a follow-up question
    const nextQuestion = parsed.next_question ?? 'Can you elaborate further on that?'
    const newIdx = questions.length
    const updatedQuestions: AiQuestion[] = [
      ...questions,
      {
        index: newIdx,
        question: nextQuestion,
        hints_used: 0,
        type: parsed.action === 'DIG_DEEPER' ? 'dig_deeper' : 'next',
      },
    ]

    const { error: updateError } = await supabase
      .from('socratic_tutor_sessions')
      .update({
        user_answers: updatedAnswers,
        ai_questions: updatedQuestions,
        ai_feedback: updatedFeedback,
        covered_chunk_ids: [...coveredChunkIds, ...ragChunks.map((c) => c.chunk_id)],
      })
      .eq('session_id', session_id)

    if (updateError) throw new Error('Failed to update session')

    return NextResponse.json({
      action: parsed.action,
      next_question: nextQuestion,
      question_index: newIdx,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process answer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
