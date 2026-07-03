import type { ActiveAnniversary } from '../services/clubMemoryService'
import { seededPick } from '../utils/random'

/**
 * Kafferum-rader när ett eko är aktivt. En mening + datum-känsla.
 * Tonregel: vad som hände, inte utförlig återberättelse.
 *
 * coffeeRoomService konsumerar som 4-tupel [speaker1, quote1, speaker2, quote2].
 * pickAnniversaryKafferum() används av anropare som vill ha context-aware sträng.
 */

// Textaudit domän 2 (2026-07-03): poolerna delades per event-typ. Tidigare
// fick ALLA won-ekon guld-/finalspråk (även derbysegrar och storsegrar) och
// ALLA neutrala ekon pensioneringsspråk med {subject} — även skandaler och
// serieettan (som saknar subject → oresolverad token). Lärdom #9: en pool-
// sträng får bara hävda vad triggern garanterar. Typen finns i echo — använd den.

const GULD_KAFFERUM: string[] = [
  'Någon nämnde guldåret vid kaffet. Det blev tyst en stund, på det bra sättet.',
  'De pratade om den där finalen. Sture log hela vägen genom rasten.',
  'Birgitta hade bakat. "Som det året vi vann", sa hon. Ingen sa emot.',
]

const WON_KAFFERUM: string[] = [
  'Tre stycken stod kvar och mindes segern. Kaffet kallnade men ingen brydde sig.',
  'Den matchen kom på tal igen. Alla mindes den lite olika. Alla mindes den.',
  'Någon drog historien om segern igen. Den blir lite bättre för varje år.',
]

const LOST_FINAL_LINE = 'De nämnde finalen som gick åt skogen. Sture rörde om i koppen lite för länge.'

const LOST_KAFFERUM: string[] = [
  'Förlusten kom på tal igen. Kort, sen bytte de ämne. Sånt gör man här.',
  '"Den här veckan var det", sa någon. Alla visste vad. Ingen behövde säga mer.',
  'Tystare än vanligt vid bordet i dag. Det var den här veckan det small, det året.',
]

const RETIRED_LINE = 'De pratade om {subject}. Han som la av. Bra karl, sa de alla.'

const PERSON_KAFFERUM: string[] = [
  'De pratade om {subject}. "Den där matchen", sa Sture. Resten nickade.',
  'Snacket kom in på {subject}. Det var ju den här veckan, det där.',
  '{subject} kom på tal vid kaffet. Gamla historier håller sig varma här.',
]

const NEUTRAL_GENERIC_KAFFERUM: string[] = [
  'Det som hände den här veckan, det året — det kom på tal igen. Kort.',
  '"Den här veckan, va", sa någon vid kaffet. Ingen behövde säga mer.',
]

export function pickAnniversaryKafferum(echo: ActiveAnniversary): string {
  const isFinal = echo.type === 'sm_final' || echo.type === 'cup_final'
  const pool =
    echo.outcome === 'won'
      ? (echo.type === 'sm_final' ? GULD_KAFFERUM : WON_KAFFERUM)
      : echo.outcome === 'lost'
        ? (isFinal ? [LOST_FINAL_LINE, ...LOST_KAFFERUM] : LOST_KAFFERUM)
        : echo.type === 'retirement'
          ? [RETIRED_LINE, ...PERSON_KAFFERUM]
          : echo.subjectPlayerId
            ? PERSON_KAFFERUM
            : NEUTRAL_GENERIC_KAFFERUM

  const seed = echo.originalSeason + echo.matchday
  return seededPick(pool, seed)
}

// coffeeRoomService importerar ANNIVERSARY_KAFFERUM som 4-tupel-array
// [speaker1, text1, speaker2, text2] → returneras som samtal
// Vi konverterar Opus-poolerna till det formatet
export const ANNIVERSARY_KAFFERUM: Array<[string, string, string, string]> = [
  ['Sture', 'Den här veckan, va', 'Birgitta', 'Ja. Man glömmer inte.'],
  ['Kioskvakten', 'Vid den här tiden, det året...', 'Sture', 'Vet. Man tänker på det.'],
  ['Birgitta', 'Samma vecka som det hände', 'Ragnhild', 'Det sätter sig, det gör det.'],
  ['Kioskvakten', 'Minns du?', 'Sture', 'Tydligt. Hela resan.'],
]
