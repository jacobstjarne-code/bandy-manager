/**
 * galaSceneCopy — HANDOFF-GALAN-GESTALTNING_2026-09-10 §3: "Alltid, men
 * tonen skiftar". Opus svensk text per ton (Jacobs körorder 2026-09-11).
 * SVENSK TEXT — CODE SKRIVER ALDRIG. Ofyllda fält returneras som
 * `undefined`; GalaScene utelämnar då raden i stället för att hitta på en
 * platshållarmening.
 *
 * 'triumf' och 'gra' är fyllda (mekaniskt utlösbara: hasWinner → 'triumf',
 * annars 'gra'). 'bitter' (avskeds-/försäljningston, §3) är avsiktligt tom:
 * den kräver ett signal-fält som inte finns vid galans genereringstillfälle
 * — ingen spelare är flaggad för försäljning/pension när säsongsslutets event
 * skapas, det avgörs senare i sommarflödet. resolveGalaTone() väljer aldrig
 * 'bitter' än; copyn skrivs när signalen wiras (spårad post-launch-rad).
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

const TRIUMF: GalaSceneCopy = {
  setting: 'Folkets hus, en kväll i april. Snön har släppt taget om orten, och bygden har tagit på sig det rena. Strålkastaren vänder sig mot en av era egna.',
  awardLine: 'Orten reser sig ur stolarna. Sånt minns man längre än en tabell.',
  decisionQuestion: 'Kvällen är er. Går du dit och tar emot den med dem?',
}

const GRA: GalaSceneCopy = {
  setting: 'Folkets hus, en kväll i april. Priserna delas ut, men inget bär era färger i år. Du sitter med de andra.',
  awardLine: 'En annan klubbs kväll. Ni var där ändå — det räknas också.',
  decisionQuestion: 'Galan hålls oavsett. Går du dit ändå?',
}

/** bitter: väntar sitt datasignal-fält (se filhuvudet). Tom tills dess. */
const EMPTY: GalaSceneCopy = {}

export function getGalaSceneCopy(tone: GalaTone): GalaSceneCopy {
  switch (tone) {
    case 'triumf': return TRIUMF
    case 'gra': return GRA
    default: return EMPTY
  }
}
