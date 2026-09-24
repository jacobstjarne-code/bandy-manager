/**
 * measure-penalty-conversion.ts — CODE-ORDER B2 STRAFFKALIBRERING (2026-09-24).
 *
 * Isolerad mätning av resolvePenalty (samma funktion motorn använder i
 * AI-auto-resolve-grenen, matchCore.ts:1021-1033 — nu med den fixade
 * riktningsfördelningen, se aiDir nedan). Kompletterar
 * measure-penalty-goalpct.ts (den fulla matchmotorn, aggregatmått) med
 * segmenterade mått ordern efterfrågar: skytt-/målvaktsnivå, samtliga
 * riktning/höjd-kombinationer, och ett explicit monotonicitetstest.
 */
import { resolveAIPenaltyKeeperDive, resolveAIPenaltyShot, resolvePenalty } from '../src/domain/services/penaltyInteractionService'
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

/** matchCore.ts:1021-1033s AI-auto-resolve-gren, isolerad. */
function simulateOnePenalty(
  shooterSkill: number, keeperSkill: number, mentality: 'offensive' | 'defensive', rand: () => number,
): 'goal' | 'save' | 'miss' {
  const keeperDive = resolveAIPenaltyKeeperDive(mentality, rand)
  const { dir, height } = resolveAIPenaltyShot(rand)
  const penData = {
    minute: 45, shooterName: 'X', shooterId: 'x', shooterSkill,
    keeperName: 'Y', keeperSkill,
  }
  const outcome = resolvePenalty(penData, dir, height, keeperDive, rand)
  return outcome.type
}

const N = 20_000
const seed = Number(process.argv[2] ?? 1)
const rand = mulberry32(seed)

console.log(`\n=== B2 — straffkonvertering, AI-auto-resolve (matchCore.ts:1021-1033, EFTER B2-fixen), N=${N}/cell, seed=${seed} ===\n`)
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

console.log('\nSkill-gap (skytt fast 60, MV varierar) — monotonicitetskontroll')
const skillGapResults: number[] = []
for (const gkTier of TIERS) {
  let goals = 0
  for (let i = 0; i < N; i++) {
    const r = simulateOnePenalty(60, gkTier.skill, 'offensive', rand)
    if (r === 'goal') goals++
  }
  const pct = goals / N * 100
  skillGapResults.push(pct)
  console.log(`  skytt=60 vs mv=${gkTier.label}: ${pct.toFixed(1)}% mål`)
}
const monotonicKeeper = skillGapResults[0] > skillGapResults[1] && skillGapResults[1] > skillGapResults[2]
console.log(`  Monoton (bättre målvakt → färre mål)?  ${monotonicKeeper ? 'JA' : 'NEJ — FEL'}`)

console.log('\nSkytt-gap (MV fast 60, skytt varierar) — monotonicitetskontroll')
const shooterGapResults: number[] = []
for (const shTier of TIERS) {
  let goals = 0
  for (let i = 0; i < N; i++) {
    const r = simulateOnePenalty(shTier.skill, 60, 'offensive', rand)
    if (r === 'goal') goals++
  }
  const pct = goals / N * 100
  shooterGapResults.push(pct)
  console.log(`  skytt=${shTier.label} vs mv=60: ${pct.toFixed(1)}% mål`)
}
const monotonicShooter = shooterGapResults[0] < shooterGapResults[1] && shooterGapResults[1] < shooterGapResults[2]
console.log(`  Monoton (bättre skytt → fler mål)?  ${monotonicShooter ? 'JA' : 'NEJ — FEL'}`)

console.log('\nMentalitet (skytt=60, mv=60)')
for (const m of MENTALITIES) {
  let goals = 0
  for (let i = 0; i < N; i++) {
    const r = simulateOnePenalty(60, 60, m, rand)
    if (r === 'goal') goals++
  }
  console.log(`  mentalitet=${m}: ${(goals / N * 100).toFixed(1)}% mål`)
}

console.log('\nSamtliga riktning/höjd-kombinationer (skytt=60, mv=60, keeperDive slumpad offensive)')
const DIRS: PenaltyDirection[] = ['left', 'center', 'right']
const HEIGHTS: PenaltyHeight[] = ['low', 'high']
const N_CELL = 20_000
for (const dir of DIRS) {
  for (const height of HEIGHTS) {
    let goals = 0, saves = 0, misses = 0
    for (let i = 0; i < N_CELL; i++) {
      const keeperDive = resolveAIPenaltyKeeperDive('offensive', rand)
      const outcome = resolvePenalty(
        { minute: 45, shooterName: 'X', shooterId: 'x', shooterSkill: 60, keeperName: 'Y', keeperSkill: 60 },
        dir, height, keeperDive, rand,
      )
      if (outcome.type === 'goal') goals++; else if (outcome.type === 'save') saves++; else misses++
    }
    console.log(`  dir=${dir.padEnd(6)} height=${height.padEnd(4)}: ${(goals / N_CELL * 100).toFixed(1)}% mål  (${goals}/${saves}/${misses} mål/räddat/missat)`)
  }
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
