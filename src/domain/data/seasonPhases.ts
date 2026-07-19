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

// ── Portal-kortbagens fas (B1, 2026-07-19) ────────────────────────────────────
//
// Ersätter SeasonPhase (nedan) SPECIFIKT för kortsuppression/viktbias
// (dashboardCardBag.ts's suppressIn, seasonPhaseBias.ts's PHASE_BIAS) — de
// operationerna är rena tal/booleans, ingen ny text krävs. SeasonPhase självt
// rörs INTE: SEASON_MOOD (dailyBriefingService.ts) och PortalPhaseMark.tsx:s
// PHASEMARK_LABELS är genuina textpooler bundna till den 3-ställiga modellen —
// att bredda DEM till sju faser kräver ny Opus-text för vinter/vinterkris/
// våroffensiv/slutspurt (höststart/höst/annandagen skulle också behöva
// omformulering eftersom gamla early/mid-texten refererar specifika månader
// som inte stämmer på de nya gränserna). Det är inte denna specs uppgift
// (B1 är Code, ingen Fable-leverans begärd) — flaggat, inte tyst ihopblandat.
export type PortalPhase = FunctionaryPhase | 'playoff' | 'spectator'

export function getPortalPhase(
  leagueRound: number,
  tablePosition: number,
  totalTeams: number,
  isPlayoff: boolean,
  isSpectator: boolean = false,
): PortalPhase {
  if (isSpectator) return 'spectator'
  if (isPlayoff) return 'playoff'
  return getFunctionaryPhase(leagueRound, tablePosition, totalTeams)
}

// ── Dashboard / SEASON_MOOD phase ─────────────────────────────────────────────
// OFÖRÄNDRAD av B1 — se kommentar ovan. Driver SEASON_MOOD (dailyBriefingService)
// + PortalPhaseMark.tsx:s engångsbanner, inte kortbagen.
//
// B1 (2026-07-19): 'pre_season' borttagen ur unionen — getSeasonPhase()
// returnerade den aldrig (verifierat), den var en gren som aldrig nåddes.
// Motsvarande död SEASON_MOOD-rad och ALL_SEASON_PHASES-listpost i
// interruptClassifier.ts städade samtidigt.
export type SeasonPhase = 'early' | 'mid' | 'endgame' | 'playoff' | 'spectator'

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
