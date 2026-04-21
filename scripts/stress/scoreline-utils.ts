/**
 * Scoreline classification utilities.
 * Used by both calibrate_v2.ts (bandygrytan data) and analyze-stress.ts (stress data).
 */

export type ScorelineState = 'leading' | 'tied' | 'trailing'

/**
 * Given a goal list and a minute, reconstruct score at that minute and classify perspective.
 * Tie-break: if a goal and event occur at the same minute, assume event = after goal.
 * (So scoreAtMinute(75) = all goals with minute <= 75)
 */
export function classifyAtMinute(
  goals: Array<{ minute: number; team: 'home' | 'away' }>,
  minute: number,
  perspective: 'home' | 'away',
): ScorelineState {
  // Tie-break: include goals at same minute (foul happens after goal at same minute)
  let homeGoals = 0
  let awayGoals = 0
  for (const g of goals) {
    if (g.minute <= minute) {
      if (g.team === 'home') homeGoals++
      else awayGoals++
    }
  }
  const diff = perspective === 'home' ? homeGoals - awayGoals : awayGoals - homeGoals
  if (diff > 0) return 'leading'
  if (diff < 0) return 'trailing'
  return 'tied'
}

export interface ScorelineMinutes {
  leading: number
  tied: number
  trailing: number
}

/**
 * Per match, accumulate minutes spent in each scoreline state per team.
 * Steps minute 1..totalMinutes inclusive.
 */
export function accumulateScorelineMinutes(
  goals: Array<{ minute: number; team: 'home' | 'away' }>,
  totalMinutes = 90,
): { home: ScorelineMinutes; away: ScorelineMinutes } {
  const home: ScorelineMinutes = { leading: 0, tied: 0, trailing: 0 }
  const away: ScorelineMinutes = { leading: 0, tied: 0, trailing: 0 }
  let h = 0
  let a = 0
  // Sort goals by minute to step through
  const sorted = [...goals].sort((x, y) => x.minute - y.minute)
  let gi = 0
  for (let min = 1; min <= totalMinutes; min++) {
    // Apply all goals at this minute before classifying
    while (gi < sorted.length && sorted[gi].minute <= min) {
      if (sorted[gi].team === 'home') h++
      else a++
      gi++
    }
    const diff = h - a
    if (diff > 0)      { home.leading++; away.trailing++ }
    else if (diff < 0) { home.trailing++; away.leading++ }
    else               { home.tied++;    away.tied++ }
  }
  return { home, away }
}

/** Bucket a minute into 10-min period label (0-9, 10-19, ..., 80-89, 90+) */
export function bucket10min(min: number): string {
  if (min >= 90) return '90+'
  const b = Math.floor(min / 10) * 10
  return `${b}-${b + 9}`
}

/** Bucket a minute into 15-min period label for penalty analysis */
export function bucket15min(min: number): string {
  if (min >= 90) return '90+'
  const b = Math.floor(min / 15) * 15
  return `${b}-${b + 14}`
}

/** Bucket a minute into broad 30-min period (0-29, 30-59, 60-89, 90+) */
export function bucket30min(min: number): string {
  if (min >= 90) return '90+'
  if (min >= 60) return '60-89'
  if (min >= 30) return '30-59'
  return '0-29'
}
