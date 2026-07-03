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

// Neutralt eko UTAN subject = serieettan (enda big-neutrala händelsen utan
// spelare — season_finish pos 1, sig 100). {subject}-poolen skulle läcka
// oresolverad token här. (Textaudit domän 2, 2026-07-03.)
const SEASON_TOP_KLACK: string[] = [
  'Banderoll på kortsidan: "VI STOD ÖVERST".',
  'Från ståplats: "Vi minns det året. Hela vägen."',
]

export function pickAnniversaryKlack(echo: ActiveAnniversary): string {
  const pool =
    echo.outcome === 'won' ? WON_KLACK :
    echo.outcome === 'lost' ? LOST_KLACK :
    echo.subjectPlayerId ? NEUTRAL_KLACK :
    SEASON_TOP_KLACK

  const seed = echo.originalSeason + echo.matchday + echo.yearsAgo
  return seededPick(pool, seed)
}

