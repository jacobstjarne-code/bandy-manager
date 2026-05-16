import type { SaveGame } from '../../entities/SaveGame'
import { PlayoffRound } from '../../enums'

export interface PlayoffSeriesContext {
  round: PlayoffRound
  criticality: 'open' | 'matchpuck' | 'decisive'
  weight: 1 | 2 | 3
  wins: number
  losses: number
  nextGame: number
}

const ROUND_BASE_WEIGHT: Record<PlayoffRound, number> = {
  [PlayoffRound.QuarterFinal]: 1,
  [PlayoffRound.SemiFinal]: 2,
  [PlayoffRound.Final]: 3,
}

export function getPlayoffSeriesContext(game: SaveGame): PlayoffSeriesContext | null {
  const bracket = game.playoffBracket
  if (!bracket) return null

  const allSeries = [
    ...bracket.quarterFinals,
    ...bracket.semiFinals,
    ...(bracket.final ? [bracket.final] : []),
  ]
  // Find active series managed club is playing in (winnerId === null)
  const series = allSeries.find(
    s => (s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId)
         && s.winnerId === null
  )
  if (!series) return null

  const completedGames = series.fixtures
    .map(fid => game.fixtures.find(f => f.id === fid))
    .filter((f): f is NonNullable<typeof f> => !!f && f.status === 'completed')

  let wins = 0, losses = 0
  for (const g of completedGames) {
    const isHome = g.homeClubId === game.managedClubId
    const myGoals = isHome ? g.homeScore : g.awayScore
    const theirGoals = isHome ? g.awayScore : g.homeScore
    if (myGoals > theirGoals) wins++; else losses++
  }

  const nextGame = wins + losses + 1

  let criticality: 'open' | 'matchpuck' | 'decisive' = 'open'
  if (wins === 2 && losses === 2) criticality = 'decisive'
  else if (wins === 2 || losses === 2) criticality = 'matchpuck'

  const baseWeight = ROUND_BASE_WEIGHT[series.round]
  const critBonus = criticality === 'decisive' ? 2 : criticality === 'matchpuck' ? 1 : 0
  const cap = series.round === PlayoffRound.Final ? 3 : 2
  const weight = Math.min(cap, baseWeight + critBonus) as 1 | 2 | 3

  return { round: series.round, criticality, weight, wins, losses, nextGame }
}
