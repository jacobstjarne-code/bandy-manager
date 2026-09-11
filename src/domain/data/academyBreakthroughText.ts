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
 * Språksvep 4 B (2026-09-12): tre av raderna gör ett tidspåstående ("två år",
 * "gav det tre", "sedan han var tolv") som valdes på hash oavsett spelarens
 * verkliga akademitid — en 16-åring kunde få "två års väntan". Poolen är nu
 * delad: tidsneutrala rader gäller alla; tidsbundna rader kräver att
 * anroparen skickar `seasonsInAcademy` och att talet håller. Utan argument
 * (äldre anropare) används bara den neutrala poolen — hellre tyst än falsk.
 *
 * Rösten: akademitränaren som går i god för grabben. Bandysvensk
 * understatement, ingen klyscha, ingen AI-ton. SVENSK TEXT AV OPUS — Code
 * skriver aldrig egen prosa här (CLAUDE.md).
 */

const NEUTRAL_QUOTES: readonly string[] = [
  'Vi har vetat länge. Han stannade kvar efter varje pass, ensam med bollen.',
  'Ingen har tvivlat på tekniken. Frågan var om han vågade. Nu vet vi.',
  'Han är lugnast på plan av allihop. Det märks först när det smäller.',
  'Han frågade aldrig om speltid. Han bara tog den, till slut.',
  'Han sa aldrig mycket i omklädningsrummet. Han lät bollen sköta snacket.',
  'Det är inte tur. Det har suttit i honom hela tiden — vi la bara inte fingrarna emellan.',
]

/** Rader som bara är sanna vid minst så många säsonger i akademin. */
const TENURE_QUOTES: ReadonlyArray<{ minSeasons: number; text: string }> = [
  { minSeasons: 2, text: 'Han har varit den mest hungrige på träning i två år. Det är inte tur.' },
  { minSeasons: 3, text: 'Vi sa åt honom att ge det ett år till. Han gav det tre. Nu betalar det sig.' },
  { minSeasons: 4, text: 'Det där har suttit i honom sedan han var tolv. Vi la bara inte fingrarna emellan.' },
]

/**
 * Returnerar en genombrottsreplik, deterministiskt vald ur playerId så att en
 * given spelare alltid får samma rad men olika spelare får olika.
 * `seasonsInAcademy` (hela säsonger i klubbens akademi vid genombrottet)
 * öppnar de tidsbundna raderna; utelämnad → bara neutrala rader.
 */
export function academyBreakthroughQuote(playerId: string, seasonsInAcademy?: number): string {
  const pool = [
    ...NEUTRAL_QUOTES,
    ...TENURE_QUOTES
      .filter(q => seasonsInAcademy !== undefined && seasonsInAcademy >= q.minSeasons)
      .map(q => q.text),
  ]
  const idx = Math.abs(stringHash(playerId)) % pool.length
  return pool[idx]
}
