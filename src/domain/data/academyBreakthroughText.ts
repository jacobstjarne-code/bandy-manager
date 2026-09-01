import { stringHash } from '../utils/random'

/**
 * Akademins genombrottsrepliker (HIGH 8, audit 2026-08-29).
 *
 * WEAK-017:s breakthrough-event hade EN hårdkodad akademitränarreplik som
 * återanvändes för varje ung spelare som slog igenom ("Han har varit den mest
 * hungrige på träning i två år"). Auditen läste det som upprepning. Poolen
 * nedan väljs deterministiskt per spelare (playerId), så två genombrott aldrig
 * låter likadana. Code fixar separat event-id:t så samma spelare inte re-fyrar
 * över omgångar; det här dödar upprepningen MELLAN spelare.
 *
 * Rösten: akademitränaren som går i god för grabben. Bandysvensk
 * understatement, ingen klyscha, ingen AI-ton. SVENSK TEXT AV OPUS — Code
 * skriver aldrig egen prosa här (CLAUDE.md).
 */

const BREAKTHROUGH_QUOTES: readonly string[] = [
  'Han har varit den mest hungrige på träning i två år. Det är inte tur.',
  'Vi har vetat länge. Han stannade kvar efter varje pass, ensam med bollen.',
  'Ingen har tvivlat på tekniken. Frågan var om han vågade. Nu vet vi.',
  'Han är lugnast på plan av allihop. Det märks först när det smäller.',
  'Vi sa åt honom att ge det ett år till. Han gav det tre. Nu betalar det sig.',
  'Han frågade aldrig om speltid. Han bara tog den, till slut.',
  'Det där har suttit i honom sedan han var tolv. Vi la bara inte fingrarna emellan.',
  'Han sa aldrig mycket i omklädningsrummet. Han lät bollen sköta snacket.',
]

/**
 * Returnerar en genombrottsreplik, deterministiskt vald ur playerId så att en
 * given spelare alltid får samma rad men olika spelare får olika.
 */
export function academyBreakthroughQuote(playerId: string): string {
  const idx = Math.abs(stringHash(playerId)) % BREAKTHROUGH_QUOTES.length
  return BREAKTHROUGH_QUOTES[idx]
}
