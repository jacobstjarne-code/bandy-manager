/**
 * galaSceneCopy — HANDOFF-GALAN-GESTALTNING_2026-09-10 §3: "Alltid, men
 * tonen skiftar". Opus levererar den faktiska svenska texten per ton
 * separat, efter att GalaScene.tsx:s form är byggd (Jacobs körorder
 * 2026-09-11). SVENSK TEXT — CODE SKRIVER ALDRIG: tills poolerna är
 * fyllda returnerar denna fil bara `undefined` per fält, och GalaScene
 * utelämnar den raden i stället för att hitta på en platshållarmening.
 *
 * Två av tre toner är mekaniskt utlösbara idag (hasWinner → 'triumf',
 * annars 'gra'). 'bitter' (avskeds-/försäljningston, §3) kräver ett
 * signal-fält som inte finns vid galans genereringstillfälle — ingen
 * spelare är ännu flaggad för försäljning/pension när säsongsslutets
 * event skapas, det avgörs senare i sommarflödet. Typen är förberedd,
 * men resolveGalaTone() (GalaScene.tsx) väljer aldrig 'bitter' än.
 */

export type GalaTone = 'triumf' | 'gra' | 'bitter'

export interface GalaSceneCopy {
  /** Georgia-kursiv rad ovanför medaljen — sätter platsen/kvällen. */
  setting?: string
  /** Kort rad under den hållna prisvinnarens stat — poetiskt eko (t.ex. blodslinje). */
  awardLine?: string
  /** Frågan ovanför Gå/Skippa-valet. */
  decisionQuestion?: string
}

const EMPTY: GalaSceneCopy = {}

export function getGalaSceneCopy(_tone: GalaTone): GalaSceneCopy {
  return EMPTY
}
