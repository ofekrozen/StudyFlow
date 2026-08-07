import type { SupabaseClient } from '@supabase/supabase-js'
import { calculateBattery, type BatteryColor } from '@/app/api/socratic/utils/battery'

export interface PastSession {
  ai_score: number | null
  weak_points: unknown[]
  session_date: string | null
}

export interface WeakPointFrequency {
  label: string
  count: number
}

export type DifficultyBand = 'foundational' | 'intermediate' | 'advanced'

export interface KnowledgeProfile {
  masteryScore: number | null
  currentBattery: number | null
  batteryColor: BatteryColor | null
  daysSinceLastPractice: number | null
  sessionHistorySummary: string
  recurringWeakPoints: WeakPointFrequency[]
  difficultyBand: DifficultyBand
}

/**
 * Turns recent completed sessions into a human-readable bullet list for the
 * prompt, e.g. "- 3 days ago: score 62, weak points: [normalization, indexing]".
 */
export function buildSessionHistorySummary(sessions: PastSession[]): string {
  if (sessions.length === 0) return ''

  const lines = sessions.map((s) => {
    const daysAgo = s.session_date
      ? Math.round((Date.now() - new Date(s.session_date).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const when = daysAgo !== null ? `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago` : 'previously'
    const score = s.ai_score !== null ? `score ${s.ai_score}` : 'score unknown'
    const wp =
      Array.isArray(s.weak_points) && s.weak_points.length > 0
        ? `, weak points: [${(s.weak_points as string[]).join(', ')}]`
        : ''
    return `- ${when}: ${score}${wp}`
  })

  return `Session history for this subject (most recent first):\n${lines.join('\n')}`
}

/** Tallies weak-point labels across sessions, normalized and sorted by frequency. */
function tallyRecurringWeakPoints(sessions: PastSession[]): WeakPointFrequency[] {
  const counts = new Map<string, number>()

  for (const s of sessions) {
    if (!Array.isArray(s.weak_points)) continue
    for (const raw of s.weak_points) {
      if (typeof raw !== 'string') continue
      const label = raw.trim().toLowerCase()
      if (!label) continue
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function difficultyFromScore(masteryScore: number | null): DifficultyBand {
  if (masteryScore === null) return 'foundational'
  if (masteryScore > 70) return 'advanced'
  if (masteryScore >= 40) return 'intermediate'
  return 'foundational'
}

/**
 * A single prompt line that calibrates question difficulty to the student's
 * mastery band.
 */
export function difficultyGuidance(band: DifficultyBand): string {
  switch (band) {
    case 'advanced':
      return (
        'The student has strong mastery here. Ask a question that probes edge cases, ' +
        'limitations, trade-offs, or synthesis across multiple concepts in the material.'
      )
    case 'intermediate':
      return (
        'The student has partial mastery here. Ask a question that pushes them to apply ' +
        'a concept to a concrete scenario or connect two ideas from the material.'
      )
    case 'foundational':
    default:
      return (
        'The student is new to or weak on this topic. Ask a foundational but still ' +
        'open-ended question that helps them reason through a core concept in the material — ' +
        'not a fact-recall question.'
      )
  }
}

/**
 * Assembles what the system knows about a student's understanding of a subject:
 * current mastery/decay, recent session history, recurring weak points, and a
 * difficulty band used to calibrate question hardness.
 */
export async function buildKnowledgeProfile(
  supabase: SupabaseClient,
  enrollmentId: string,
  subjectId: string
): Promise<KnowledgeProfile> {
  // Current mastery / decay state.
  const { data: mastery } = await supabase
    .from('subject_mastery')
    .select('mastery_score, decay_rate, last_practiced_at')
    .eq('enrollment_id', enrollmentId)
    .eq('subject_id', subjectId)
    .maybeSingle()

  let currentBattery: number | null = null
  let batteryColor: BatteryColor | null = null
  let daysSinceLastPractice: number | null = null
  const masteryScore: number | null = mastery?.mastery_score ?? null

  if (mastery) {
    const battery = calculateBattery(
      mastery.mastery_score,
      mastery.decay_rate,
      mastery.last_practiced_at
    )
    currentBattery = battery.currentBattery
    batteryColor = battery.color
    if (mastery.last_practiced_at) {
      daysSinceLastPractice = Math.round(
        (Date.now() - new Date(mastery.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    }
  }

  // Recent completed sessions for history + recurring weak points.
  const { data: pastSessions } = await supabase
    .from('socratic_tutor_sessions')
    .select('ai_score, weak_points, session_date')
    .eq('enrollment_id', enrollmentId)
    .eq('subject_id', subjectId)
    .eq('session_status', 'completed')
    .order('session_date', { ascending: false })
    .limit(5)

  const sessions = (pastSessions ?? []) as PastSession[]

  return {
    masteryScore,
    currentBattery,
    batteryColor,
    daysSinceLastPractice,
    sessionHistorySummary: buildSessionHistorySummary(sessions),
    recurringWeakPoints: tallyRecurringWeakPoints(sessions),
    difficultyBand: difficultyFromScore(masteryScore),
  }
}
