import type { Fixture } from '../../domain/entities/Fixture'
import type { Club } from '../../domain/entities/Club'
import { deriveUtfall } from '../../domain/services/matchTypeAxes'

export interface FormResult {
  result: 'V' | 'O' | 'F'
  score: string
  opponent: string
  opponentId?: string
  opponentFullName?: string
}

export function getFormResults(
  clubId: string,
  fixtures: Fixture[],
  clubs: Club[],
  count: number = 5,
): FormResult[] {
  const completed = fixtures
    .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout && (f.homeClubId === clubId || f.awayClubId === clubId))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, count)

  return completed.map(f => {
    const isHome = f.homeClubId === clubId
    const myScore = isHome ? f.homeScore : f.awayScore
    const theirScore = isHome ? f.awayScore : f.homeScore
    const opponentId = isHome ? f.awayClubId : f.homeClubId
    const opponentClub = clubs.find(c => c.id === opponentId)
    const utfall = deriveUtfall(f, clubId)
    const result: 'V' | 'O' | 'F' = utfall === 'vunnet' ? 'V' : utfall === 'forlorat' ? 'F' : 'O'
    return {
      result,
      score: `${myScore}–${theirScore}`,
      opponent: opponentClub?.shortName ?? opponentClub?.name ?? '?',
      opponentId,
      opponentFullName: opponentClub?.name,
    }
  })
}
