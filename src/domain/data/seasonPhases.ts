import { FixtureStatus } from '../enums'

// ── Functionary-system (Swedish phase names, used by functionaries.ts) ───────

export type FunctionaryPhase =
  | 'höststart'
  | 'höst'
  | 'annandagen'
  | 'vinter'
  | 'vinterkris'
  | 'våroffensiv'
  | 'slutspurt'

export function getFunctionaryPhase(roundNumber: number, tablePosition: number, totalTeams: number): FunctionaryPhase {
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

// ── Dashboard / SEASON_MOOD phase ─────────────────────────────────────────────

export type SeasonPhase = 'pre_season' | 'early' | 'mid' | 'endgame' | 'playoff' | 'spectator'

export function getCurrentLeagueRound(game: import('../entities/SaveGame').SaveGame): number {
  return game.fixtures
    .filter(f => f.status === FixtureStatus.Completed && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
}

export function getSeasonPhase(leagueRound: number, isPlayoff: boolean, isSpectator: boolean = false): SeasonPhase {
  if (isSpectator) return 'spectator'
  if (isPlayoff) return 'playoff'
  if (leagueRound <= 3) return 'early'
  if (leagueRound <= 11) return 'mid'
  return 'endgame'
}

/**
 * Returnerar true om managed club fortfarande är aktiv i slutspelet
 * (inte eliminerad och har kvarvarande scheduled fixtures i sin serie).
 *
 * Används som `isPlayoff`-parameter till getSeasonPhase för korrekt fas:
 * eliminerade spelare hamnar i 'endgame', inte 'playoff'.
 */
export function isManagedClubInPlayoff(game: import('../entities/SaveGame').SaveGame): boolean {
  if (!game.playoffBracket) return false
  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]
  return allSeries.some(s => {
    const isInSeries = s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
    if (!isInSeries) return false
    if (s.loserId === game.managedClubId) return false
    return s.fixtures.some((fid: string) => {
      const f = game.fixtures.find(ff => ff.id === fid)
      return f?.status === FixtureStatus.Scheduled
    })
  })
}

/**
 * Returnerar true när managed klubb inte längre har egna playoff-matcher
 * men andras playoff fortfarande pågår (åskådarläge).
 *
 * Täcker två fall:
 * 1. Managed eliminerades i en serie (loserId === managedClubId)
 * 2. Managed kom aldrig till playoff (8:e plats eller sämre) men bracket har startats
 */
export function isManagedClubSpectator(game: import('../entities/SaveGame').SaveGame): boolean {
  if (!game.playoffBracket) return false

  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]

  const otherPlayoffMatchesRemaining = allSeries.some(s => {
    const managedInSeries = s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
    if (managedInSeries) return false
    return s.fixtures.some((fid: string) => {
      const f = game.fixtures.find(ff => ff.id === fid)
      return f?.status === FixtureStatus.Scheduled
    })
  })

  if (!otherPlayoffMatchesRemaining) return false

  const managedEliminated = allSeries.some(s => s.loserId === game.managedClubId)
  const managedInBracket = allSeries.some(s =>
    s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
  )

  return managedEliminated || !managedInBracket
}
