import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { isRivalryMatch } from './rivalries'
import { getNextManagedFixture } from '../services/portal/triggers/matchTriggers'

export type RoundCharacter =
  | 'standard'
  | 'post_loss'
  | 'pre_derby'
  | 'cup_day'
  | 'premiere'
  | 'winning_streak'
  | 'losing_streak'

function outcome(f: Fixture, managedId: string): 'win' | 'loss' | 'draw' {
  const isHome = f.homeClubId === managedId
  const us = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0)
  const them = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0)
  return us > them ? 'win' : us < them ? 'loss' : 'draw'
}

export function getRoundCharacter(game: SaveGame): RoundCharacter {
  const managedId = game.managedClubId
  const nextManaged = getNextManagedFixture(game)

  if (nextManaged?.isCup) return 'cup_day'

  if (nextManaged) {
    const opponentId =
      nextManaged.homeClubId === managedId ? nextManaged.awayClubId : nextManaged.homeClubId
    if (isRivalryMatch(managedId, opponentId)) return 'pre_derby'
  }

  const recent = game.fixtures
    .filter(f => f.status === 'completed' &&
      (f.homeClubId === managedId || f.awayClubId === managedId))
    .sort((a, b) => b.matchday - a.matchday)

  if (recent.length === 0) return 'premiere'

  let winStreak = 0
  let lossStreak = 0
  for (const f of recent) {
    const r = outcome(f, managedId)
    if (r === 'win') {
      if (lossStreak > 0) break
      winStreak++
    } else if (r === 'loss') {
      if (winStreak > 0) break
      lossStreak++
    } else {
      break  // draw breaks streak
    }
  }

  if (lossStreak >= 3) return 'losing_streak'
  if (winStreak >= 3) return 'winning_streak'
  if (outcome(recent[0], managedId) === 'loss') return 'post_loss'

  return 'standard'
}
