import type { Fixture } from '../../domain/entities/Fixture'
import type { Club } from '../../domain/entities/Club'
import { deriveUtfall } from '../../domain/services/matchTypeAxes'

export interface RecentMatchRating {
  rating: number
  result: 'V' | 'O' | 'F'
  opponentShortName: string
}

export function getRecentMatchRatings(
  fixtures: Fixture[],
  clubs: Club[],
  playerId: string,
  managedClubId: string,
  count = 5
): RecentMatchRating[] {
  const clubMap = new Map(clubs.map(c => [c.id, c]))

  const played = fixtures
    .filter(f =>
      f.status === 'completed' &&
      f.report?.playerRatings[playerId] != null &&
      (f.homeClubId === managedClubId || f.awayClubId === managedClubId)
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, count)
    .reverse()

  return played.map(f => {
    const rating = f.report!.playerRatings[playerId]
    const isHome = f.homeClubId === managedClubId
    const utfall = deriveUtfall(f, managedClubId)
    const result: 'V' | 'O' | 'F' = utfall === 'vunnet' ? 'V' : utfall === 'forlorat' ? 'F' : 'O'
    const opponentId = isHome ? f.awayClubId : f.homeClubId
    const opponentShortName = clubMap.get(opponentId)?.shortName ?? '???'
    return { rating, result, opponentShortName }
  })
}
