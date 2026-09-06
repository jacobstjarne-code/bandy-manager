import { getSeasonEndPhase, type SeasonEndPhase } from '../data/seasonEndPhase'
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

/**
 * Berättarens projektion av en historisk global matchdag till ligaomgång.
 * Cup- och slutspelsveckor får aldrig öka omgången, och en matchdag som inte
 * innehåller en ordinarie ligamatch ska heller aldrig kallas "omgång".
 */
export function leagueRoundAtMatchday(game: SaveGame, season: number, matchday: number): number {
  return game.fixtures
    .filter(f => f.season === season
      && f.matchday <= matchday
      && f.status === 'completed'
      && !f.isCup
      && !f.isKnockout)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
}

/** Spelarvänd etikett för en liggarposts faktiska tidsaxel. */
export function chronologyPointLabel(game: SaveGame, season: number, matchday: number): string {
  const isLeagueMatchday = game.fixtures.some(f => f.season === season
    && f.matchday === matchday
    && f.status === 'completed'
    && !f.isCup
    && !f.isKnockout)
  return isLeagueMatchday
    ? `omgång ${leagueRoundAtMatchday(game, season, matchday)}`
    : `matchdag ${matchday}`
}

export function currentChronology(game: SaveGame): CurrentChronology {
  return {
    season: game.currentSeason,
    matchday: game.currentMatchday,
    leagueRound: leagueRoundAtMatchday(game, game.currentSeason, game.currentMatchday),
    phase: getSeasonEndPhase(game),
  }
}
