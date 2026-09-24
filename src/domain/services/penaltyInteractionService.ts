export type PenaltyDirection = 'left' | 'center' | 'right'
export type PenaltyHeight = 'low' | 'high'

export interface PenaltyInteractionData {
  minute: number
  shooterName: string
  shooterId: string
  shooterSkill: number
  keeperName: string
  keeperSkill: number
}

export interface PenaltyOutcome {
  type: 'goal' | 'save' | 'miss'
  description: string
  shooterDirection: PenaltyDirection
  keeperDive: PenaltyDirection
}

export function resolveAIPenaltyKeeperDive(
  coachStyle: string,
  rand: () => number,
): PenaltyDirection {
  // Defensiv AI gissar mer (center bias)
  // Offensiv AI gissar brett (left/right bias)
  const r = rand()
  if (coachStyle === 'defensive') {
    if (r < 0.35) return 'left'
    if (r < 0.65) return 'center'
    return 'right'
  }
  if (r < 0.40) return 'left'
  if (r < 0.60) return 'center'
  return 'right'
}

/**
 * CODE-ORDER B2 STRAFFKALIBRERING (2026-09-24) — rotorsak till det gamla
 * matchCore.ts-uttrycket (`rand()<0.4?'left':rand()<0.7?'right':'center'`):
 * två separata rand()-uttag i samma villkor. Det andra rullades bara när
 * det första missade "left" (60% av fallen), vilket gav en OAVSIKTLIG
 * fördelning (~40/42/18 vänster/höger/mitten) i stället för den avsedda —
 * och att grenarna konsumerar rand() olika många gånger gjorde sekvensen
 * svårrevisionerad. Extraherad hit (utanför matchCore.ts:s stora
 * simuleringsfunktion) EN dedikerad rand()-roll, uttryckligen satt
 * tredjedelsfördelning (samma vikt vänster/mitten/höger) — så den går att
 * enhetstesta direkt, inte bara indirekt via en fullständig matchkörning.
 */
export function resolveAIPenaltyShot(rand: () => number): { dir: PenaltyDirection; height: PenaltyHeight } {
  const dirRoll = rand()
  const dir: PenaltyDirection = dirRoll < 1 / 3 ? 'left' : dirRoll < 2 / 3 ? 'right' : 'center'
  const height: PenaltyHeight = rand() < 0.65 ? 'low' : 'high'
  return { dir, height }
}

// CODE-ORDER B2 STRAFFKALIBRERING (2026-09-24) — rotorsak: varje senare
// specialfall (height==='high', dir==='center') GJORDE OM goalChance från
// grunden (`goalChance = ...`) i stället för att justera den — så
// skyttens/målvaktens kvalitetsterm, satt EN gång tidigast i funktionen,
// försvann tyst så fort ett skott var högt eller mitten. Det förklarar både
// "spelar- och målvaktskvalitet påverkar för lite" och "center = en dold
// nitlott" (0,10 oavsett kvalitet om målvakten också gissade mitten).
//
// Ny modell: EN sammanhängande beräkning, bara `+=`/`clamp`, aldrig `=`,
// efter att direction-basen satts. Riktning ger en bas (samma/olika sida
// som målvakten gissade — mitten har en egen, lägre bas eftersom
// målvakten inte behöver förflytta sig dit). Höjd lägger på en bonus
// (aldrig en omskrivning) plus en SEPARAT, oberoende risk att skjuta över
// — rullad EN gång, före mål/räddning-slaget, som redan i den gamla
// modellen. Kvaliteten (skytt minus målvakt) adderas SIST, garanterat
// aldrig överskriven. Ett golv/tak (clamp) gör att inget normalt val
// någonsin blir en bokstavlig nitlott eller en garanti, oavsett
// kvalitetsskillnad.
const PENALTY_DIRECTION_SAME: Record<PenaltyDirection, number> = { left: 0.67, right: 0.67, center: 0.43 }
const PENALTY_DIRECTION_DIFF: Record<PenaltyDirection, number> = { left: 0.87, right: 0.87, center: 0.73 }
const PENALTY_HEIGHT_HIGH_BONUS = 0.05
const PENALTY_SKILL_WEIGHT = 0.15
const PENALTY_MIN_CHANCE = 0.05
const PENALTY_MAX_CHANCE = 0.95
const PENALTY_HEIGHT_MISS_BASE = 0.12
const PENALTY_HEIGHT_MISS_SKILL_REDUCTION = 0.05
const PENALTY_MIN_MISS_CHANCE = 0.03
const PENALTY_MAX_MISS_CHANCE = 0.20

export function resolvePenalty(
  data: PenaltyInteractionData,
  dir: PenaltyDirection,
  height: PenaltyHeight,
  keeperDive: PenaltyDirection,
  rand: () => number,
): PenaltyOutcome {
  const same = dir === keeperDive
  let goalChance = same ? PENALTY_DIRECTION_SAME[dir] : PENALTY_DIRECTION_DIFF[dir]

  if (height === 'high') {
    goalChance += PENALTY_HEIGHT_HIGH_BONUS

    // Risken att skjuta över ribban hör till TRÄFFSÄKERHETEN (skytten),
    // inte till målvaktens gissning — rullas oberoende av same/diff, och
    // FÖRE mål/räddning-slaget, precis som i den gamla modellen. Bättre
    // skytt missar mer sällan över.
    const missChance = clampPenaltyValue(
      PENALTY_HEIGHT_MISS_BASE - (data.shooterSkill - 50) / 100 * PENALTY_HEIGHT_MISS_SKILL_REDUCTION,
      PENALTY_MIN_MISS_CHANCE, PENALTY_MAX_MISS_CHANCE,
    )
    if (rand() < missChance) {
      return { type: 'miss', description: 'Skottet seglar över ribban!',
               shooterDirection: dir, keeperDive }
    }
  }

  // Kvalitetstermen — sist, ADDITIV, aldrig skriven över av grenarna ovan.
  goalChance += (data.shooterSkill - data.keeperSkill) / 100 * PENALTY_SKILL_WEIGHT
  goalChance = clampPenaltyValue(goalChance, PENALTY_MIN_CHANCE, PENALTY_MAX_CHANCE)

  if (rand() < goalChance) {
    const dirText = dir === 'left' ? 'vänstra hörnet'
      : dir === 'right' ? 'högra hörnet' : 'mitten'
    return { type: 'goal',
      description: `MÅL! Bollen i ${dirText}. Målvakten chanslös.`,
      shooterDirection: dir, keeperDive }
  }

  return { type: 'save',
    description: 'Räddning! Målvakten läser skottet och parerar.',
    shooterDirection: dir, keeperDive }
}

function clampPenaltyValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
