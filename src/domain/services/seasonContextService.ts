import type { SaveGame } from '../entities/SaveGame'
import { FixtureStatus } from '../enums'

export type SeasonContext = 'firstSeason' | 'relegationFight' | 'topRace' | 'midTable'

export function getSeasonContext(game: SaveGame): SeasonContext {
  if (game.currentSeason === 1) return 'firstSeason'

  const completedLeague = game.fixtures.filter(
    f => f.status === FixtureStatus.Completed && !f.isCup &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  ).length

  if (completedLeague < 8) return 'midTable'

  const pos = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 6
  if (pos >= 9) return 'relegationFight'
  if (pos <= 3) return 'topRace'
  return 'midTable'
}
