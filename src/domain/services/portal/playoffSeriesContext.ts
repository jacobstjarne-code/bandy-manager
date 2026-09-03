import type { SaveGame } from '../../entities/SaveGame'
import { PlayoffRound } from '../../enums'
import { deriveUtfall } from '../matchTypeAxes'

export interface PlayoffSeriesContext {
  round: PlayoffRound
  criticality: 'open' | 'matchpuck' | 'decisive'
  weight: 1 | 2 | 3
  wins: number
  losses: number
  nextGame: number
}

export interface PlayoffFixtureContext {
  round: PlayoffRound
  gameNumber: number
}

/**
 * Slutspelsidentiteten för en BESTÄMD fixture. Används av retrospektiva
 * ytor, som Granska, där "nästa match" är fel tidsriktning. Medlemskapet i
 * serien är facit även efter att serien precis har avgjorts.
 */
export function getPlayoffFixtureContext(game: SaveGame, fixtureId: string): PlayoffFixtureContext | null {
  const bracket = game.playoffBracket
  if (!bracket) return null
  const allSeries = [
    ...bracket.quarterFinals,
    ...bracket.semiFinals,
    ...(bracket.final ? [bracket.final] : []),
  ]
  const series = allSeries.find(candidate => candidate.fixtures.includes(fixtureId))
  if (!series) return null
  return {
    round: series.round,
    gameNumber: series.fixtures.indexOf(fixtureId) + 1,
  }
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

  // DOMLOGG §4 (2026-08-31): rå homeScore/awayScore gav en straffseger som
  // förlust — förlängning/straff är oavgjort i grundtiden (homeScore===
  // awayScore), rå jämförelse (myGoals>theirGoals) föll då på else-grenen.
  // Samma mönster som deriveUtfall (matchTypeAxes.ts) redan löser: läs
  // wentToPenalties/overtimeResult FÖRE råscore. Återanvänd den direkt i
  // stället för en tredje kopia av samma utfallslogik.
  let wins = 0, losses = 0
  for (const g of completedGames) {
    const utfall = deriveUtfall(g, game.managedClubId)
    if (utfall === 'vunnet') wins++
    else if (utfall === 'forlorat') losses++
    // 'oavgjort' ska inte förekomma i en avslutad slutspelsmatch (R027 —
    // förlängning/straff avgör alltid) — räknas medvetet inte som vare sig
    // vinst eller förlust om datan ändå skulle säga det.
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
