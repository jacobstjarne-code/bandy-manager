import type { ActiveAnniversary } from '../services/clubMemoryService'

/**
 * Klack-banderol vid big eko. Kort, högt, från läktaren.
 * Tonregel: klacken talar i nutid om det förflutna. Trots, stolthet, sorg.
 */

const WON_KLACK: string[] = [
  'Klacken rullade ut en banderoll: "VI MINNS GULDET".',
  'Från ståplats: "Ett år sen — och vi sjunger om det än."',
  'Banderoll på kortsidan: "DET ÄR VÅRT, FÖR ALLTID".',
]

const LOST_KLACK: string[] = [
  'Klacken teg en minut. Sen kom sången, trotsigare än vanligt.',
  'Banderoll: "VI GLÖMMER INTE. VI KOMMER TILLBAKA."',
  'Från läktaren: "Förra året tog det slut här. Inte i år."',
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
  return pool[seed % pool.length]
}

// Bakåtkompatibel export för matchCore.ts som importerar ANNIVERSARY_KLACK som array
// matchCore plockar direkt från arrayen med rand() — vi delegerar till won/lost/neutral-pooler
// för enkel konsumtion. Merge alla tre pooler.
export const ANNIVERSARY_KLACK: string[] = [
  ...WON_KLACK,
  ...LOST_KLACK,
  ...NEUTRAL_KLACK,
]
