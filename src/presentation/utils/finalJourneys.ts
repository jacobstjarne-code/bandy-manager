import type { PlayoffBracket } from '../../domain/entities/Playoff'
import type { CupBracket } from '../../domain/entities/Cup'
import type { Club } from '../../domain/entities/Club'

export function getFinalJourney(bracket: PlayoffBracket, clubId: string, clubs: Club[]): string {
  const qf = bracket.quarterFinals?.find(s => s.winnerId === clubId)
  const sf = bracket.semiFinals?.find(s => s.winnerId === clubId)
  const qfLoserId = qf ? (qf.homeClubId === clubId ? qf.awayClubId : qf.homeClubId) : null
  const sfLoserId = sf ? (sf.homeClubId === clubId ? sf.awayClubId : sf.homeClubId) : null
  const qfLoser = qfLoserId ? clubs.find(c => c.id === qfLoserId)?.name : null
  const sfLoser = sfLoserId ? clubs.find(c => c.id === sfLoserId)?.name : null
  if (qfLoser && sfLoser) return `Slog ut ${qfLoser} i KF och ${sfLoser} i SF`
  if (sfLoser) return `Slog ut ${sfLoser} i SF`
  return 'Klarade sig till finalen'
}

export function getCupJourney(bracket: CupBracket, clubId: string, clubs: Club[]): string {
  return bracket.matches
    .filter(m => m.winnerId === clubId)
    .sort((a, b) => a.round - b.round)
    .map(m => {
      const oppId = m.homeClubId === clubId ? m.awayClubId : m.homeClubId
      const opp = clubs.find(c => c.id === oppId)?.name ?? '?'
      const roundName = m.round === 1 ? 'KF' : m.round === 2 ? 'SF' : 'Final'
      return `${roundName}: Slog ${opp}`
    })
    .join('\n')
}
