export type BatteryColor = 'green' | 'yellow' | 'red'

export interface BatteryResult {
  currentBattery: number
  color: BatteryColor
  daysUntilRed: number
}

function colorFromScore(score: number): BatteryColor {
  if (score > 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

/**
 * Calculates the current battery level for a subject using Ebbinghaus decay.
 * Formula: battery = masteryScore * e^(-decayRate * daysSincePractice)
 *
 * If lastPracticedAt is null (never practiced), decay is skipped and
 * masteryScore is returned directly.
 */
export function calculateBattery(
  masteryScore: number,
  decayRate: number,
  lastPracticedAt: string | null
): BatteryResult {
  let currentBattery: number

  if (lastPracticedAt === null) {
    currentBattery = masteryScore
  } else {
    const now = Date.now()
    const lastMs = new Date(lastPracticedAt).getTime()
    const daysSince = (now - lastMs) / (1000 * 60 * 60 * 24)
    currentBattery = masteryScore * Math.exp(-decayRate * daysSince)
  }

  currentBattery = Math.max(0, Math.min(100, Math.round(currentBattery)))

  // Solve: masteryScore * e^(-decayRate * d) = 40
  // → d = ln(masteryScore / 40) / decayRate
  let daysUntilRed = 0
  if (masteryScore > 40 && decayRate > 0) {
    daysUntilRed = Math.max(0, Math.floor(Math.log(masteryScore / 40) / decayRate))
  }

  return {
    currentBattery,
    color: colorFromScore(currentBattery),
    daysUntilRed,
  }
}

/**
 * Maps a mastery score to a decay rate.
 * Higher scores decay slower (student is confident); lower scores decay faster.
 */
export function getDecayRate(score: number): number {
  if (score >= 90) return 0.10
  if (score >= 70) return 0.15
  if (score >= 50) return 0.23
  return 0.35
}
