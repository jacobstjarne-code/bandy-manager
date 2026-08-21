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

/**
 * Returns streak length + type (≥3 only) regardless of cup/derby precedence in getRoundCharacter.
 * Use this instead of relying on getRoundCharacter for band/broken-state detection.
 *
 * O1/SPÅR B B4 (Jacobs dom 2026-08-21, DOM_SPARB_TEXTNIVAER_2026-08-21.md, fix
 * 2026-08-23): läser game.trainerArc — SAMMA consecutiveWins/consecutiveLosses
 * som boardPatience-termen (boardService.ts's updateRunningBoardPatience) och
 * Grind 1 mäter, aldrig en egen räknare. Domen är bindande: "Kortet och
 * patience-zonen läser samma consecutiveLosses ur trainerArcService."
 * Föregående version räknade om oberoende ur game.fixtures UTAN cup-filter
 * (!f.isCup saknades) — cupmatcher kunde alltså förlänga/förkorta svitkortets
 * siffra utan att röra den boardPatience-svit den påstår sig visa, exakt den
 * "två läsare, en sanning"-klass av bugg Grind 1-passet hittade två gånger
 * tidigare samma dag (game.standings, managerFired). trainerArc exkluderar
 * redan cup (trainerArcService.ts) och nollställs vid oavgjort/säsongsslut.
 */
export function getStreakState(game: SaveGame): { length: number; type: 'winning_streak' | 'losing_streak' } | null {
  const arc = game.trainerArc
  if (!arc) return null
  if (arc.consecutiveWins >= 3) return { length: arc.consecutiveWins, type: 'winning_streak' }
  if (arc.consecutiveLosses >= 3) return { length: arc.consecutiveLosses, type: 'losing_streak' }
  return null
}
