/**
 * measure-penalty-conversion.ts — BETATEST_ERIK B2 (2026-09-24).
 *
 * "Straffprocenten måste vara sann." Ingen UI visar en frikopplad
 * straffprocent (grep-bekräftat, se docs/BETATEST_B2_STRAFFPROCENT_2026-09-24.md)
 * — sanningskällan är i stället docs/data/SCORELINE_REFERENCE.md rad 103:
 * "648 straffmål totalt (5.4% av mål). Estimerat 926 straffar (÷ 0.70
 * konvertering)." — dvs ett dokumenterat 70%-mål för konverteringsgraden
 * (mål/tilldelade straffar), inte bara straffFREKVENSEN (som redan är
 * kalibrerad separat, se matchCore.ts:1337 "Base 0.19 calibrated for
 * ~5.4% penaltyGoalPct").
 *
 * Detta skript mäter den FAKTISKA konverteringsgraden ur samma
 * sanningskälla matchmotorn använder (resolveAIPenaltyKeeperDive +
 * resolvePenalty, matchCore.ts:1021-1033 — AI-auto-resolve-grenen, som
 * körs för ALLA icke-interaktiva straffar, dvs i praktiken varje straff
 * utom de en spelare själv tar i full/commentary-läge), segmenterat på
 * skytt-/målvaktsnivå.
 */
import { resolveAIPenaltyKeeperDive, resolvePenalty } from '../src/domain/services/penaltyInteractionService'
import type { PenaltyDirection, PenaltyHeight } from '../src/domain/services/penaltyInteractionService'

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Ordagrant matchCore.ts:1021-1033s AI-auto-resolve-gren, isolerad. */
function simulateOnePenalty(
  shooterSkill: number, keeperSkill: number, mentality: 'offensive' | 'defensive', rand: () => number,
): 'goal' | 'save' | 'miss' {
  const keeperDive = resolveAIPenaltyKeeperDive(mentality, rand)
  const aiDir: PenaltyDirection = rand() < 0.4 ? 'left' : rand() < 0.7 ? 'right' : 'center'
  const aiHeight: PenaltyHeight = rand() < 0.65 ? 'low' : 'high'
  const penData = {
    minute: 45, shooterName: 'X', shooterId: 'x', shooterSkill,
    keeperName: 'Y', keeperSkill,
  }
  const outcome = resolvePenalty(penData, aiDir, aiHeight, keeperDive, rand)
  return outcome.type
}

const N = 20_000
const seed = Number(process.argv[2] ?? 1)
const rand = mulberry32(seed)

console.log(`\n=== B2 — straffkonvertering, AI-auto-resolve (matchCore.ts:1021-1033), N=${N}/cell, seed=${seed} ===\n`)
console.log('Sanningskälla: docs/data/SCORELINE_REFERENCE.md rad 103 — 70% konvertering (926 straffar → 648 mål).\n')

const TIERS = [
  { label: 'låg (40)', skill: 40 },
  { label: 'mid (60)', skill: 60 },
  { label: 'hög (80)', skill: 80 },
]
const MENTALITIES: Array<'offensive' | 'defensive'> = ['offensive', 'defensive']

console.log('Skytt \\ MV (samma nivå, mentalitet=offensive)')
for (const shooter of TIERS) {
  let goals = 0, saves = 0, misses = 0
  for (let i = 0; i < N; i++) {
    const r = simulateOnePenalty(shooter.skill, shooter.skill, 'offensive', rand)
    if (r === 'goal') goals++; else if (r === 'save') saves++; else misses++
  }
  const pct = (goals / N * 100).toFixed(1)
  console.log(`  skytt=${shooter.label} vs mv=${shooter.label}: ${pct}% mål  (${goals} mål, ${saves} räddade, ${misses} missade / ${N})`)
}

console.log('\nSkill-gap (skytt fast 60, MV varierar)')
for (const gkTier of TIERS) {
  let goals = 0
  for (let i = 0; i < N; i++) {
    const r = simulateOnePenalty(60, gkTier.skill, 'offensive', rand)
    if (r === 'goal') goals++
  }
  console.log(`  skytt=60 vs mv=${gkTier.label}: ${(goals / N * 100).toFixed(1)}% mål`)
}

console.log('\nMentalitet (skytt=60, mv=60)')
for (const m of MENTALITIES) {
  let goals = 0
  for (let i = 0; i < N; i++) {
    const r = simulateOnePenalty(60, 60, m, rand)
    if (r === 'goal') goals++
  }
  console.log(`  mentalitet=${m}: ${(goals / N * 100).toFixed(1)}% mål`)
}

// Övergripande, realistisk mix (skill uniform 40-80, båda mentaliteter 50/50)
let totalGoals = 0, totalN = 0
for (let i = 0; i < N * 3; i++) {
  const shooterSkill = 40 + Math.floor(rand() * 41)
  const keeperSkill = 40 + Math.floor(rand() * 41)
  const mentality: 'offensive' | 'defensive' = rand() < 0.5 ? 'offensive' : 'defensive'
  const r = simulateOnePenalty(shooterSkill, keeperSkill, mentality, rand)
  if (r === 'goal') totalGoals++
  totalN++
}
console.log(`\nÖvergripande (skill uniform 40-80, mentalitet 50/50), N=${totalN}: ${(totalGoals / totalN * 100).toFixed(1)}% mål`)
console.log(`Mål (SCORELINE_REFERENCE.md): 70.0%`)
console.log('')
