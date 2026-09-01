import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'
import { safeStandingPosition } from './standingsService'

export type SeasonContext = 'firstSeason' | 'relegationFight' | 'topRace' | 'midTable'

export function getSeasonContext(game: SaveGame): SeasonContext {
  if ((game.seasonSummaries?.length ?? 0) === 0) return 'firstSeason'

  const completedLeague = game.fixtures.filter(
    f => f.status === FixtureStatus.Completed && !f.isCup && !f.isKnockout &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  ).length

  if (completedLeague < 8) return 'midTable'

  // Redan gated av completedLeague<8 ovan, men safeStandingPosition
  // (PASTAENDEKARTAN, LÄST-FÖRE-INITIERING, 2026-08-26) är den kanoniska
  // vägen — konsekvent med övriga fixade instanser, inte en ny gissning.
  const pos = safeStandingPosition(game.standings, game.managedClubId) ?? 6
  if (pos >= 9) return 'relegationFight'
  if (pos <= 3) return 'topRace'
  return 'midTable'
}
