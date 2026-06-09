/**
 * C-N1 — NU-fliken, Lager 1: Stillness beats.
 *
 * Sexton ambient-rader som speglar dagsläget mellan matcherna.
 * Taggade så Code kan vikta mot aktuell kontext — välj bästa matchning,
 * fall back på untagged om inget stämmer.
 *
 * Tonregel: konkret bild, bandysvensk vardag, inget melodrama.
 * Inga generella sanningar. Inga råd.
 */

export type StillnessWeather = 'cold' | 'snow' | 'mild'
export type StillnessSeasonTime = 'early' | 'mid' | 'late' | 'playoff'
export type StillnessForm = 'good' | 'poor'
export type StillnessProximity = 'eve' | 'day_after' | 'rest'

export interface StillnessBeat {
  body: string
  weather?: StillnessWeather
  seasonTime?: StillnessSeasonTime
  form?: StillnessForm
  proximity?: StillnessProximity
}

export const STILLNESS_BEATS: StillnessBeat[] = [
  // ── Väder ────────────────────────────────────────────────────────────
  {
    body: 'Isen lade sig i natt. Hallen luktar mer skrapa än vanligt.',
    weather: 'cold',
  },
  {
    body: 'Minus sju, ingen vind. Perfekt väder för bandy och ingenting annat.',
    weather: 'cold',
  },
  {
    body: 'Det snöade under natten men planen är borstad. Matchen spelas.',
    weather: 'snow',
  },
  {
    body: 'Snön lägger sig tyst på orten. Inga matchljud från hallen i dag.',
    weather: 'snow',
    proximity: 'rest',
  },
  {
    body: 'För mild väderlek. Isen håller, men knappt. Spelarna märker det.',
    weather: 'mild',
  },

  // ── Säsongstid ───────────────────────────────────────────────────────
  {
    body: 'Säsongen är sex omgångar gammal. För tidigt att veta vad den är.',
    seasonTime: 'early',
  },
  {
    body: 'Tabellen börjar säga något på riktigt. Tolv omgångar in, ingen kan skylla på slump.',
    seasonTime: 'mid',
  },
  {
    body: 'De sista omgångarna avgör vad resten var värd.',
    seasonTime: 'late',
  },
  {
    body: 'Grundserien är borta. Nu handlar det om bäst av fem.',
    seasonTime: 'playoff',
  },

  // ── Form ─────────────────────────────────────────────────────────────
  {
    body: 'Tre raka segrar. Siffrorna stämmer med känslan — det är sällan det händer.',
    form: 'good',
  },
  {
    body: 'Truppen tränar som ett lag som tror på varandra. Det märks i detaljerna.',
    form: 'good',
  },
  {
    body: 'Fyra matcher utan poäng. Det börjar inte synas i ansiktena ännu, men det är på väg.',
    form: 'poor',
  },
  {
    body: 'Något har slappnat av i träningen. Inte dramatiskt — men märkbart.',
    form: 'poor',
  },

  // ── Matchnärhet ──────────────────────────────────────────────────────
  {
    body: 'I morgon är det match. I dag handlar om att inte spänna sig för hårt.',
    proximity: 'eve',
  },
  {
    body: 'Dagen efter en match är sällan särskilt mycket. Benen vet vad de gjort.',
    proximity: 'day_after',
  },
  {
    body: 'Tolv dagar utan match. Truppen börjar bli lite rastlös, vilket är bättre än det låter.',
    proximity: 'rest',
  },
]
