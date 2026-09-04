import { getSeasonEndPhase, type SeasonEndPhase } from '../data/seasonEndPhase'
import { getCurrentLeagueRound } from '../data/seasonPhases'
import type { SaveGame } from '../entities/SaveGame'

/**
 * SPEC_BERATTAREN_2026-09-04 §6 — Berättarens enda klocka.
 *
 * `matchday` är den globala händelseaxeln. `leagueRound` är en projektion
 * av faktiskt spelade ligamatcher och kan därför ligga still under cupveckor.
 * Ytor får aldrig använda den ena som om den vore den andra.
 */
export interface CurrentChronology {
  season: number
  matchday: number
  leagueRound: number
  phase: SeasonEndPhase
}

export function currentChronology(game: SaveGame): CurrentChronology {
  return {
    season: game.currentSeason,
    matchday: game.currentMatchday,
    leagueRound: getCurrentLeagueRound(game),
    phase: getSeasonEndPhase(game),
  }
}
