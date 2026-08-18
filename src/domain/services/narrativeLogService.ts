import type { SaveGame } from '../entities/SaveGame'
import type { NarrativeLogEntry } from '../entities/Narrative'

/**
 * U5 (SLUTTEST_KO.md, 2026-08-17) — DOM GIVEN: "EN mekanism, ny liten logg".
 *
 * En delad, tidsstämplad logg (SaveGame.narrativeLog) med EN skrivväg
 * (logNarrativeBeat) och TVÅ läsvägar:
 *   - isOnCooldown: per-semanticKey-slagning, svarar U5:s "har vi visat DEN
 *     HÄR bågen nyligen?" (Birger-finaltalet, Helena/Folke-profilen).
 *   - systemhandelseBudgetOk: aggregatfråga över alla systemhandelse-taggade
 *     poster denna säsong, svarar O19:s säsongsbudget (2-3/säsong, aldrig
 *     två i samma omgång).
 *
 * Ersätter INTE de åtta befintliga mekanismerna under migreringen — de
 * ligger kvar parallellt tills alla nio källor skriver hit (se
 * SLUTTEST_KO.md:s U5-status för vilka som är wiring:ade).
 */
export function logNarrativeBeat(
  game: SaveGame,
  semanticKey: string,
  season: number,
  round: number,
  systemhandelse?: boolean,
): NarrativeLogEntry[] {
  const entry: NarrativeLogEntry = { semanticKey, season, round, ...(systemhandelse !== undefined && { systemhandelse }) }
  return [...(game.narrativeLog ?? []), entry]
}

/**
 * Narrativ cooldown: har `semanticKey` visats inom `minSeasonsApart`
 * säsonger? `minSeasonsApart=1` betyder "inte samma säsong igen",
 * `minSeasonsApart=3` betyder "inte förrän tre säsonger har passerat".
 */
export function isOnCooldown(game: SaveGame, semanticKey: string, minSeasonsApart: number, currentSeason: number): boolean {
  const log = game.narrativeLog ?? []
  return log.some(e => e.semanticKey === semanticKey && currentSeason - e.season < minSeasonsApart)
}

/**
 * Säsongsbudget: får ännu en systemhändelse trigga denna omgång? Nej om
 * budgeten (maxPerSeason) redan är nådd för säsongen, och nej om den
 * senaste systemhändelsen låg för nära (minRoundsBetween) — "aldrig två i
 * samma omgång" ur varsel-mallen (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md).
 */
export function systemhandelseBudgetOk(
  game: SaveGame,
  currentSeason: number,
  currentRound: number,
  maxPerSeason = 3,
  minRoundsBetween = 1,
): boolean {
  const log = game.narrativeLog ?? []
  const thisSeason = log.filter(e => e.systemhandelse && e.season === currentSeason)
  if (thisSeason.length >= maxPerSeason) return false
  const mostRecentRound = thisSeason.reduce((max, e) => Math.max(max, e.round), -Infinity)
  if (mostRecentRound === -Infinity) return true
  return currentRound - mostRecentRound >= minRoundsBetween
}
