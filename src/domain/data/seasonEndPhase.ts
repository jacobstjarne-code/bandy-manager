import type { SaveGame } from '../entities/SaveGame'
import { PlayoffStatus } from '../enums'
import { getCurrentLeagueRound, isManagedClubInPlayoff } from './seasonPhases'

export type SeasonEndPhase =
  | 'pre_season'
  | 'regular_active'
  | 'regular_done'
  | 'playoff_active'
  | 'playoff_spectator'
  | 'season_done'

export function getSeasonEndPhase(game: SaveGame): SeasonEndPhase {
  if (game.playoffBracket) {
    if (game.playoffBracket.status === PlayoffStatus.Completed) return 'season_done'
    if (isManagedClubInPlayoff(game)) return 'playoff_active'
    return 'playoff_spectator'
  }

  const leagueRound = getCurrentLeagueRound(game)
  if (leagueRound >= 22) return 'regular_done'
  if (leagueRound > 0) return 'regular_active'
  return 'pre_season'
}
