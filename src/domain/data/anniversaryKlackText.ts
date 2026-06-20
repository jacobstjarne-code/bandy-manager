import type { ActiveAnniversary } from '../services/clubMemoryService'
import { seededPick } from '../utils/random'

/**
 * Klack-banderol vid big eko. Kort, högt, från läktaren.
 * Tonregel: klacken talar i nutid om det förflutna. Trots, stolthet, sorg.
 */

const WON_KLACK: string[] = [
  'Klacken rullade ut en banderoll: "VI MINNS GULDET".',
  'Från ståplats: "Vi sjunger om det än."',
  'Banderoll på kortsidan: "DET ÄR VÅRT, FÖR ALLTID".',
]

const LOST_KLACK: string[] = [
  'Klacken teg en minut. Sen kom sången, trotsigare än vanligt.',
  'Banderoll: "VI GLÖMMER INTE. VI KOMMER TILLBAKA."',
  'Från läktaren: "Här tog det slut då. Inte i år."',
]

const NEUTRAL_KLACK: string[] = [
  'Klacken höll upp {subject}s nummer. En hel match.',
  'Banderoll med {subject}s namn. "EN AV OSS — ALLTID".',
]

export function pickAnniversaryKlack(echo: ActiveAnniversary): string {
  const pool =
    echo.outcome === 'won' ? WON_KLACK :
    echo.outcome === 'lost' ? LOST_KLACK :
    NEUTRAL_KLACK

  const seed = echo.originalSeason + echo.matchday + echo.yearsAgo
  return seededPick(pool, seed)
}

// matchCore plockar direkt med rand() — inga template-vars kan resolvas där.
// NEUTRAL_KLACK innehåller {subject} och exkluderas; de visas bara via pickAnniversaryKlack()
// som anropas med eko-kontext där subject är tillgänglig.
export const ANNIVERSARY_KLACK: string[] = [
  ...WON_KLACK,
  ...LOST_KLACK,
]
