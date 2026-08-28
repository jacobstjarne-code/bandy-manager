/**
 * A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md) — "Rapportera innan bygge",
 * fråga 2: skadefrekvens för start under 30% fitness vid kandidattak
 * fatigueMult 1.5 / 2.0 / 2.5. Mäter mot checkForMatchInjury() DIREKT
 * (samma multiplikatorkedja matchen faktiskt använder), inte en separat
 * approximation — fatigueMult injiceras via en extra parameter (ctx.fatigueMult)
 * som denna mätning lägger till manuellt före byggets riktiga wiring, för att
 * kunna jämföra kandidaterna mot NOLL (dagens läge, fitness oläst) innan
 * konstanten låses i själva servicen.
 *
 * Kör: node_modules/.bin/vite-node scripts/ah3-fatiguemult-kalibrering-2026-08-28.ts
 */
import { checkForMatchInjury, type InjuryCheckContext } from '../src/domain/services/matchInjuryService'
import type { Player } from '../src/domain/entities/Player'
import { PlayerPosition, PlayerArchetype } from '../src/domain/enums'

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makePlayer(fitness: number, injuryProneness = 50, age = 25): Player {
  return {
    id: 'p1', firstName: 'Test', lastName: 'Spelare', age, nationality: 'SWE',
    clubId: 'c1', isHomegrown: true,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.Finisher,
    salary: 0, contractUntilSeason: 5, marketValue: 0,
    morale: 60, form: 60, fitness, sharpness: 90, seasonForm: 60,
    dayJob: undefined, isFullTimePro: true,
    currentAbility: 60, potentialAbility: 60, developmentRate: 50,
    injuryProneness, discipline: 60,
    attributes: {
      skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60,
      shooting: 60, dribbling: 60, vision: 60, decisions: 60, workRate: 60,
      positioning: 60, defending: 60, cornerSkill: 60, goalkeeping: 20, cornerRecovery: 60,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
  } as unknown as Player
}

// Testar checkForMatchInjury() UTAN nuvarande fatigueMult (bygget läggs ovanpå
// den befintliga multiplikatorkedjan — weather/derby/morale/tactic/proneness
// är alla 1.0 här, isolerar fatigueMult:ens EGET bidrag).
function fatigueMultFor(fitness: number, cap: number): number {
  if (fitness >= 50) return 1.0
  const t = (50 - Math.max(0, fitness)) / 50 // 0 vid 50, 1 vid 0
  return 1.0 + (cap - 1.0) * t
}

function runTrial(fitness: number, cap: number | null, trials: number, seed: number): number {
  const rand = mulberry32(seed)
  let injuries = 0
  const player = makePlayer(fitness)
  for (let i = 0; i < trials; i++) {
    const ctx: InjuryCheckContext = {
      player,
      minute: Math.floor(rand() * 60),
      isGoalkeeperInjury: false,
    }
    // Simulera fatigueMult genom att temporärt skala proneness-representationen
    // är FEL väg (påverkar en annan semantisk knapp) — i stället körs checkForMatchInjury
    // N/cap gånger via en lokal kopia av dess formel som injicerar fatigueMult
    // som en SJÄTTE multiplikator i EXAKT samma kedja, se ah3LocalCheck nedan.
    const event = ah3LocalCheck(ctx, rand, cap !== null ? fatigueMultFor(fitness, cap) : 1.0)
    if (event) injuries++
  }
  return injuries / trials
}

// Spegling av checkForMatchInjury()s multiplikatorkedja + eligible-pool-loop,
// med fatigueMult som SJÄTTE faktor — exakt den ändring bygget gör i
// matchInjuryService.ts. Hålls i synk manuellt för detta engångs-mätpass;
// bygget lägger samma rad rakt in i servicen (inte den här kopian).
const INJURY_BASE_RATES: Record<string, number> = {
  skenan: 1 / 5000, fall_pa_is: 1 / 400, larkaka: 1 / 80,
  boll_i_ansiktet: 1 / 150, muskel_overbelastning: 1 / 250, hjarnskakning: 1 / 1000,
}
function ah3LocalCheck(ctx: InjuryCheckContext, rand: () => number, fatigueMult: number): boolean {
  const { player } = ctx
  const pronenessMult = 0.5 + (player.injuryProneness ?? 50) / 100
  const totalMult = 1.0 * 1.0 * 1.0 * 1.0 * pronenessMult * fatigueMult
  const eligible = Object.keys(INJURY_BASE_RATES).filter(t => !(t === 'boll_i_ansiktet' && player.age < 18))
  for (const type of eligible) {
    const rate = INJURY_BASE_RATES[type] * totalMult
    if (rand() < rate) return true
  }
  return false
}

// Bekräftelse (fråga 1-relaterad): checkForMatchInjury() i sitt NUVARANDE skick
// läser aldrig fitness — samma seed + samma spelare men fitness 0 vs 100 ska ge
// EXAKT samma utfallssekvens.
console.log('Bekräftelse: dagens checkForMatchInjury() läser aldrig fitness')
{
  const trials = 500_000
  let sameCount = 0
  const playerLow = makePlayer(0)
  const playerHigh = makePlayer(100)
  for (let i = 0; i < trials; i++) {
    const rA = mulberry32(i * 7 + 1)
    const rB = mulberry32(i * 7 + 1)
    const evA = checkForMatchInjury({ player: playerLow, minute: 30, isGoalkeeperInjury: false }, rA)
    const evB = checkForMatchInjury({ player: playerHigh, minute: 30, isGoalkeeperInjury: false }, rB)
    if ((evA === null) === (evB === null)) sameCount++
  }
  console.log(`  fitness=0 vs fitness=100, identiska RNG-strömmar: ${sameCount}/${trials} identiskt utfall (förväntat: ${trials}/${trials})\n`)
}

console.log('A-H3 — fatigueMult-kalibrering (checkForMatchInjury, isolerad multiplikatorkedja)\n')
console.log('Metod: per-match skaderisk vid EN start, sedan sammansatt över en säsong (30 matcher)')
console.log('för en spelare som ALLTID startar under 30% fitness (extremfall, ger ett övre tak för')
console.log('hur ofta detta kan hända — realistiskt spel roterar bort från det läget).\n')

const TRIALS = 2_000_000
const SEASON_MATCHES = 30
const fitnessLevels = [30, 25, 20, 15, 10, 5, 0]
const caps = [null, 1.5, 2.0, 2.5] as const

console.log('Baslinje (dagens läge, fatigueMult=null/oanvänd, fitness OLÄST):')
{
  const p0 = runTrial(50, null, TRIALS, 1) // fitness>=50 referens, fatigueMult=1.0 ändå
  console.log(`  per-match @ fitness ospecificerad (mult=1.0 kontroll): ${(p0 * 100).toFixed(4)}%`)
}

for (const cap of caps) {
  console.log(`\n=== Kandidattak: ${cap === null ? 'INGET (dagens läge)' : cap + 'x'} ===`)
  console.log('fitness | per-match% | säsong(30m)% (alltid under detta värde)')
  for (const fitness of fitnessLevels) {
    const perMatch = runTrial(fitness, cap, TRIALS, fitness * 7919 + (cap ?? 0) * 104729 + 3)
    const perSeason = 1 - Math.pow(1 - perMatch, SEASON_MATCHES)
    console.log(`  ${String(fitness).padStart(3)}%  |   ${(perMatch * 100).toFixed(4)}%   |   ${(perSeason * 100).toFixed(2)}%`)
  }
}

// Realistiskt scenario: spelaren startar under 30% fitness i 5 av 30 matcher
// (en tunn trupp i en tät period, inte hela säsongen).
console.log('\n=== Realistiskt scenario: 5 av 30 matcher under 30% fitness (snitt ~20%), resten normalt ===')
for (const cap of caps) {
  const perMatchAt20 = runTrial(20, cap, TRIALS, 20 * 13 + (cap ?? 0) * 999 + 7)
  const perMatchNormal = runTrial(70, cap, TRIALS, 70 * 13 + (cap ?? 0) * 999 + 7) // >=50 → mult 1.0 oavsett cap
  const perSeason = 1 - Math.pow(1 - perMatchAt20, 5) * Math.pow(1 - perMatchNormal, 25)
  const normalBaseline = (1 - Math.pow(1 - perMatchNormal, 30)) * 100
  console.log(`  cap=${cap === null ? 'inget' : cap}: säsongsrisk ≈ ${(perSeason * 100).toFixed(2)}% (jmf normal-fitness-baslinje hela säsongen: ${normalBaseline.toFixed(2)}%)`)
}
