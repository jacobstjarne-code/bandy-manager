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

export type SeasonPhase = 'pre_season' | 'early' | 'mid' | 'endgame' | 'playoff'

export function getSeasonPhase(leagueRound: number, isPlayoff: boolean): SeasonPhase {
  if (isPlayoff) return 'playoff'
  if (leagueRound <= 3) return 'early'
  if (leagueRound <= 11) return 'mid'
  return 'endgame'
}
