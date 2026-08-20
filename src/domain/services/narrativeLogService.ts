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
 * ligger kvar parallellt.
 *
 * **8 källor skriver hit, en gör det medvetet INTE.** Jacobs dom
 * (2026-08-17): en logg som bara HÄLFTEN av källorna skriver till är sämre
 * än åtta ärliga mekanismer — men det gäller ofullständighet av försummelse,
 * inte en källa som inte hör hemma. `cardStaleTracking` (gameStore.ts:
 * `recordPortalShown`) mäter hur länge ett portalkort legat framme —
 * en annan fråga än "när hände den här bågen senast", och den fylls på vid
 * nästan varje rendering, inte vid en narrativ händelse. Ett kort som
 * renderades igen är inte en beat, och "kortet roterade ut ur påsen" är ett
 * urvalsbeslut, inte något som hände i spelvärlden — att kalla det en beat
 * luddar upp kategorin, och kategorin är det enda som gör loggen användbar.
 * 8/9 är den slutgiltiga siffran, inte en lucka att fylla i senare.
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

/**
 * U5 forts (SLUTTEST_KO.md, 2026-08-20) — systemhandelseBudgetOk:s faktiska
 * gating, applicerad på en BATCH nygenererade items (t.ex. en omgångs
 * `allNewEvents`) i ordning. `game.narrativeLog` uppdateras bara vid
 * RESOLUTION (spelaren svarar), inte vid generering — utan den provisoriska,
 * ALDRIG persisterade räkningen här hade två systemhandelse-items genererade
 * i SAMMA batch (innan någotdera hunnit resolvas) båda slunkit igenom, trots
 * att varsel-mallen kräver "aldrig två i samma omgång". Släppta items tappas
 * för denna omgång — inget efterköat återförsök.
 */
export function filterSystemhandelseBudget<T extends { id: string; systemhandelse?: boolean }>(
  items: T[],
  game: SaveGame,
  currentSeason: number,
  currentRound: number,
  maxPerSeason = 3,
  minRoundsBetween = 1,
): T[] {
  let provisional = game
  return items.filter(item => {
    if (!item.systemhandelse) return true
    if (!systemhandelseBudgetOk(provisional, currentSeason, currentRound, maxPerSeason, minRoundsBetween)) return false
    provisional = { ...provisional, narrativeLog: logNarrativeBeat(provisional, `provisional_${item.id}`, currentSeason, currentRound, true) }
    return true
  })
}
