import type { SaveGame } from '../entities/SaveGame'
import { isRivalryMatch } from './rivalries'

export type RoundCharacter =
  | 'standard'
  | 'post_loss'
  | 'pre_derby'
  | 'cup_day'
  | 'premiere'
  | 'winning_streak'
  | 'losing_streak'

export function getRoundCharacter(game: SaveGame): RoundCharacter {
  const managedId = game.managedClubId

  // Next scheduled managed fixture
  const nextManaged = game.fixtures
    .filter(f => f.status === 'scheduled' &&
      (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => a.matchday - b.matchday)[0]

  if (nextManaged?.isCup) return 'cup_day'

  if (nextManaged) {
    const opponentId =
      nextManaged.homeClubId === managedId ? nextManaged.awayClubId : nextManaged.homeClubId
    if (isRivalryMatch(managedId, opponentId)) return 'pre_derby'
  }

  // Recent completed managed fixtures (newest first)
  const recent = game.fixtures
    .filter(f => f.status === 'completed' &&
      (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => b.matchday - a.matchday)

  if (recent.length === 0) return 'premiere'

  function wasWin(f: typeof recent[number]): boolean {
    const isHome = f.homeClubId === managedId
    const us = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const them = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return us > them
  }

  function wasLoss(f: typeof recent[number]): boolean {
    const isHome = f.homeClubId === managedId
    const us = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
    const them = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
    return us < them
  }

  // Count consecutive wins/losses from most recent
  let winStreak = 0
  let lossStreak = 0
  for (const f of recent) {
    if (wasWin(f)) {
      if (lossStreak > 0) break
      winStreak++
    } else if (wasLoss(f)) {
      if (winStreak > 0) break
      lossStreak++
    } else {
      break  // draw breaks streak
    }
  }

  if (lossStreak >= 3) return 'losing_streak'
  if (winStreak >= 3) return 'winning_streak'
  if (wasLoss(recent[0])) return 'post_loss'

  return 'standard'
}
