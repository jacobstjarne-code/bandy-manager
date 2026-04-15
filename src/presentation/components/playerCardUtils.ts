import type { Fixture } from '../../domain/entities/Fixture'
import type { Club } from '../../domain/entities/Club'

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
    const homeScore = f.homeScore
    const awayScore = f.awayScore
    const managedScore = isHome ? homeScore : awayScore
    const opponentScore = isHome ? awayScore : homeScore
    const result: 'V' | 'O' | 'F' =
      managedScore > opponentScore ? 'V' :
      managedScore < opponentScore ? 'F' : 'O'
    const opponentId = isHome ? f.awayClubId : f.homeClubId
    const opponentShortName = clubMap.get(opponentId)?.shortName ?? '???'
    return { rating, result, opponentShortName }
  })
}
