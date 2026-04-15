export type SeasonPhase =
  | 'höststart'
  | 'höst'
  | 'annandagen'
  | 'vinter'
  | 'vinterkris'
  | 'våroffensiv'
  | 'slutspurt'

export function getSeasonPhase(roundNumber: number, tablePosition: number, totalTeams: number): SeasonPhase {
  if (roundNumber <= 3) return 'höststart'
  if (roundNumber <= 6) return 'höst'
  if (roundNumber <= 11) return 'annandagen'
  if (roundNumber <= 16) {
    if (tablePosition > Math.floor(totalTeams * 0.6)) return 'vinterkris'
    return 'vinter'
  }
  if (roundNumber <= 20) return 'våroffensiv'
  return 'slutspurt'
}
