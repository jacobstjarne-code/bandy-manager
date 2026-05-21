import type { ActiveAnniversary } from '../services/clubMemoryService'

/**
 * Kafferum-rader när ett eko är aktivt. En mening + datum-känsla.
 * Tonregel: vad som hände, inte utförlig återberättelse.
 *
 * coffeeRoomService konsumerar som 4-tupel [speaker1, quote1, speaker2, quote2].
 * pickAnniversaryKafferum() används av anropare som vill ha context-aware sträng.
 */

const WON_KAFFERUM: string[] = [
  'Någon nämnde guldåret vid kaffet. Det blev tyst en stund, på det bra sättet.',
  'De pratade om förra vårens final. Sture log hela vägen genom rasten.',
  'Birgitta hade bakat. "Som det året vi vann", sa hon. Ingen sa emot.',
  'Tre stycken stod kvar och mindes segern. Kaffet kallnade men ingen brydde sig.',
]

const LOST_KAFFERUM: string[] = [
  'Förlusten kom på tal igen. Kort, sen bytte de ämne. Sånt gör man här.',
  '"Ett år sen nu", sa någon. Alla visste vad. Ingen behövde säga mer.',
  'De nämnde finalen som gick åt skogen. Sture rörde om i koppen lite för länge.',
  'Tystare än vanligt vid bordet idag. Det var den här veckan det small, i fjol.',
]

const NEUTRAL_KAFFERUM: string[] = [
  'De pratade om {subject}. Ett år sen han la av. Bra karl, sa de alla.',
  'Någon tog upp {subject}. "Den där sista matchen", sa Sture. Resten nickade.',
  'Snacket gick om gamla spelare. {subject} kom på tal. Det var ju den här veckan.',
]

export function pickAnniversaryKafferum(echo: ActiveAnniversary): string {
  const pool =
    echo.outcome === 'won' ? WON_KAFFERUM :
    echo.outcome === 'lost' ? LOST_KAFFERUM :
    NEUTRAL_KAFFERUM

  const seed = echo.originalSeason + echo.matchday
  return pool[seed % pool.length]
}

// coffeeRoomService importerar ANNIVERSARY_KAFFERUM som 4-tupel-array
// [speaker1, text1, speaker2, text2] → returneras som samtal
// Vi konverterar Opus-poolerna till det formatet
export const ANNIVERSARY_KAFFERUM: Array<[string, string, string, string]> = [
  ['Sture', 'Det är ett år nu', 'Birgitta', 'Ja. Man glömmer inte.'],
  ['Kioskvakten', 'Förra säsongen vid den här tiden...', 'Sture', 'Vet. Man tänker på det.'],
  ['Birgitta', 'Samma vecka som det hände', 'Ragnhild', 'Det sätter sig, det gör det.'],
  ['Kioskvakten', 'Minns du för ett år sen?', 'Sture', 'Tydligt. Hela rasen.'],
]
