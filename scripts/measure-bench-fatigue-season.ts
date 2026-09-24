/**
 * measure-bench-fatigue-season.ts — BETATEST_ERIK B3 (2026-09-24), före/efter.
 *
 * Körorderns krav: "rapportera före/efter för form och fatigue över en
 * säsong" för den mekaniska bokföringsfixen (bänkspelare fick tidigare
 * flygande-byten-minuter i seasonStats men ren återhämtning + skärpestraff
 * i fitness/form — nu proportionell konditionskostnad + skärpeökning för
 * utespelare, målvakten oförändrad).
 *
 * Simulerar en representativ utespelares kondition/skärpa över 22 omgångar,
 * där hen är bänkad var tredje omgång (en realistisk rotationsandel) och
 * startar övriga — samma formler som playerStateProcessor.ts, EN gång med
 * den gamla bänk-grenen (ren återhämtning, skärpa -5, ingen kostnad) och EN
 * gång med den nya (proportionell kostnad, skärpa +).
 */
import { recoveryGain, FITNESS_RECOVERY_CEILING } from '../src/domain/services/fitnessRecoveryService'

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEASON_ROUNDS = 22
const STAMINA = 65
const PLAYER_ID = 'seasonrep'

function simulate(mode: 'old' | 'new') {
  let fitness = 90
  let sharpness = 75
  const fitnessHistory: number[] = [fitness]
  const sharpnessHistory: number[] = [sharpness]

  for (let round = 1; round <= SEASON_ROUNDS; round++) {
    const isBench = round % 3 === 0  // var tredje omgång bänkad, resten startar
    const localRand = mulberry32(round * 9999 + 42)

    if (!isBench) {
      // Startare — oförändrad formel (orört av B3)
      const baseFitnessLoss = 13 + Math.floor(localRand() * 8)
      const afterMatchCost = Math.max(0, fitness - baseFitnessLoss)
      fitness = Math.min(FITNESS_RECOVERY_CEILING, afterMatchCost + recoveryGain(afterMatchCost, 'started', { stamina: STAMINA, daysBetweenFixtures: 7 }))
      sharpness = Math.min(100, sharpness + 10)
    } else if (mode === 'old') {
      // Gamla bänk-grenen: ren återhämtning, ingen kostnad, skärpestraff -5
      fitness = Math.min(FITNESS_RECOVERY_CEILING, fitness + recoveryGain(fitness, 'bench', { stamina: STAMINA, daysBetweenFixtures: 7 }))
      sharpness = Math.max(0, sharpness - 5)
    } else {
      // Nya bänk-grenen: proportionell kostnad + proportionell skärpeökning
      const benchRand = mulberry32(round * 7919 + PLAYER_ID.charCodeAt(0) * 31 + PLAYER_ID.charCodeAt(PLAYER_ID.length - 1))
      const benchMinutes = 30 + Math.floor(benchRand() * 11)
      const minutesShare = benchMinutes / 90
      const baseFitnessLoss = Math.round((13 + Math.floor(benchRand() * 8)) * minutesShare)
      const afterMatchCost = Math.max(0, fitness - baseFitnessLoss)
      fitness = Math.min(FITNESS_RECOVERY_CEILING, afterMatchCost + recoveryGain(afterMatchCost, 'bench', { stamina: STAMINA, daysBetweenFixtures: 7 }))
      sharpness = Math.min(100, sharpness + Math.round(10 * minutesShare))
    }
    fitnessHistory.push(Math.round(fitness))
    sharpnessHistory.push(Math.round(sharpness))
  }
  return { fitnessHistory, sharpnessHistory }
}

const before = simulate('old')
const after = simulate('new')

console.log('\n=== B3 — bänkspelarens kondition/skärpa över en säsong (22 omgångar, bänkad var 3:e), FÖRE vs EFTER ===\n')
console.log('Omgång:  ' + Array.from({ length: SEASON_ROUNDS + 1 }, (_, i) => i).map(n => String(n).padStart(4)).join(''))
console.log('Kondition FÖRE:  ' + before.fitnessHistory.map(v => String(v).padStart(4)).join(''))
console.log('Kondition EFTER: ' + after.fitnessHistory.map(v => String(v).padStart(4)).join(''))
console.log('Skärpa FÖRE:     ' + before.sharpnessHistory.map(v => String(v).padStart(4)).join(''))
console.log('Skärpa EFTER:    ' + after.sharpnessHistory.map(v => String(v).padStart(4)).join(''))
console.log('')
console.log(`Kondition vid säsongsslut: FÖRE ${before.fitnessHistory.at(-1)}, EFTER ${after.fitnessHistory.at(-1)} (diff ${(after.fitnessHistory.at(-1)! - before.fitnessHistory.at(-1)!)})`)
console.log(`Skärpa vid säsongsslut:    FÖRE ${before.sharpnessHistory.at(-1)}, EFTER ${after.sharpnessHistory.at(-1)} (diff ${(after.sharpnessHistory.at(-1)! - before.sharpnessHistory.at(-1)!)})`)
console.log(`Kondition, snitt över säsongen: FÖRE ${(before.fitnessHistory.reduce((a, b) => a + b, 0) / before.fitnessHistory.length).toFixed(1)}, EFTER ${(after.fitnessHistory.reduce((a, b) => a + b, 0) / after.fitnessHistory.length).toFixed(1)}`)
console.log(`Skärpa, snitt över säsongen:    FÖRE ${(before.sharpnessHistory.reduce((a, b) => a + b, 0) / before.sharpnessHistory.length).toFixed(1)}, EFTER ${(after.sharpnessHistory.reduce((a, b) => a + b, 0) / after.sharpnessHistory.length).toFixed(1)}`)
console.log('')
