/**
 * Jacobs order (2026-08-26): magnituderna för mecenat-/patronramperna
 * (1%→15% resp. 2%→8%) är gissningar. "Mät i stället: hur många mecenater
 * får en klubb över tio säsonger vid cs 40, 60, 80, 100 med kandidatrampen?
 * Jag dömer mot fördelningen, inte mot talen." Samma fråga för patronen,
 * men "hur ofta över en karriär", inte sannolikhet per omgång.
 *
 * Detta är en ISOLERAD, analytisk mätning — inte en full spelsimulering.
 * Motivering: en full 10-säsongers speluppdrag med FIXERAD communityStanding
 * kräver att man forcerar cs varje omgång (cs drivs annars av dussintals
 * andra system), vilket introducerar lika mycket brus som det mäter bort.
 * Isolerad modell: samma rond-fönster/tak/cooldown-regler som de riktiga
 * funktionerna (eventProcessor.ts:458-491, roundProcessor.ts:1352-1372),
 * bara med den föreslagna sannolikhetsrampen ersättande den nuvarande
 * hårda tröskeln — cs hålls konstant per körning, exakt som Jacob bad om.
 *
 * Kör: node_modules/.bin/vite-node scripts/mecenat-patron-frekvens-matning-2026-08-26.ts
 */

function clampedRamp(cs: number, floorCs: number, ceilCs: number, floorP: number, ceilP: number): number {
  const t = Math.max(0, Math.min(1, (cs - floorCs) / (ceilCs - floorCs)))
  return floorP + t * (ceilP - floorP)
}

// ── Kandidatramper (Jacobs siffror, flaggade som gissningar) ───────────────
function mecenatProb(cs: number): number {
  return clampedRamp(cs, 0, 65, 0.01, 0.15) // golv 1%, tak 15% vid cs=65 ("taket där det redan ligger")
}
function patronProb(cs: number): number {
  return clampedRamp(cs, 0, 60, 0.02, 0.08) // golv 2%, tak 8% vid cs=60 (lägre tak än mecenatens)
}
function maxMecenater(cs: number): number {
  return cs >= 85 ? 3 : cs >= 70 ? 2 : 1 // OFÖRÄNDRAT, förblir diskret (Jacobs dom)
}

const SEASONS = 10
const MECENAT_ROUNDS_PER_SEASON = 13 // rond 6-18, eventProcessor.ts:458-464
const PATRON_ROUNDS_PER_SEASON = 22  // varje omgång, roundProcessor.ts (ingen rond-gate förutom era/cs)
const TRIALS = 2000

function simulateMecenatCount(cs: number, rng: () => number): number {
  let totalArrivals = 0
  let active = 0
  for (let season = 0; season < SEASONS; season++) {
    let spawnedThisSeason = false
    const cap = maxMecenater(cs)
    for (let round = 0; round < MECENAT_ROUNDS_PER_SEASON; round++) {
      if (spawnedThisSeason) continue
      if (active >= cap) continue
      if (rng() < mecenatProb(cs)) {
        active++
        totalArrivals++
        spawnedThisSeason = true
      }
    }
  }
  return totalArrivals
}

// Patronen: EN plats, INGEN modellerad avgång (bekräftat kodläst — cs
// påverkar aldrig happiness/avhopp, bara ankomst, se rapporten). En gång
// anländ förblir den (i denna isolerade modell) aktiv resten av mätningen
// — "antal" är därför binärt/nästan-binärt, "första ankomstsäsong" är det
// informativa talet.
function simulatePatronFirstArrivalSeason(cs: number, rng: () => number): number | null {
  let active = false
  for (let season = 0; season < SEASONS; season++) {
    if (active) return season // redan anländ, ingen mer att mäta
    for (let round = 0; round < PATRON_ROUNDS_PER_SEASON; round++) {
      if (active) break
      if (rng() < patronProb(cs)) {
        active = true
        return season
      }
    }
  }
  return null // aldrig, inom tio säsonger
}

// Enkel mulberry32-liknande PRNG för reproducerbarhet
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function stats(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b)
  const mean = nums.reduce((s, x) => s + x, 0) / nums.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const median = sorted[Math.floor(sorted.length / 2)]
  return `medel=${mean.toFixed(2)} median=${median} min=${min} max=${max}`
}

function main(): void {
  console.log(`\n=== Mecenat/patron-frekvens, kandidatramper, ${TRIALS} körningar × ${SEASONS} säsonger ===\n`)

  console.log('--- MECENAT: antal ANLÄNDA över tio säsonger ---')
  for (const cs of [40, 60, 80, 100]) {
    const counts: number[] = []
    for (let trial = 0; trial < TRIALS; trial++) {
      const rng = makeRng(cs * 1_000_000 + trial)
      counts.push(simulateMecenatCount(cs, rng))
    }
    const zeroPct = Math.round(counts.filter(c => c === 0).length / TRIALS * 100)
    console.log(`  cs=${cs} (tak ${maxMecenater(cs)} samtidiga, sannolikhet/omgång ${(mecenatProb(cs) * 100).toFixed(1)}%): ${stats(counts)} · andel med NOLL på tio säsonger: ${zeroPct}%`)
  }

  console.log('\n--- PATRON: första ankomstsäsong (av tio), eller aldrig ---')
  for (const cs of [40, 60, 80, 100]) {
    const arrivals: (number | null)[] = []
    for (let trial = 0; trial < TRIALS; trial++) {
      const rng = makeRng(cs * 2_000_000 + trial)
      arrivals.push(simulatePatronFirstArrivalSeason(cs, rng))
    }
    const everGot = arrivals.filter(a => a !== null) as number[]
    const neverPct = Math.round((TRIALS - everGot.length) / TRIALS * 100)
    const avgSeason = everGot.length > 0 ? (everGot.reduce((s, x) => s + x, 0) / everGot.length + 1).toFixed(1) : '—'
    console.log(`  cs=${cs} (sannolikhet/omgång ${(patronProb(cs) * 100).toFixed(1)}%): fick patron inom tio säsonger: ${100 - neverPct}% (medel-ankomstsäsong ${avgSeason}) · ALDRIG: ${neverPct}%`)
  }

  console.log('\n=== SLUT ===\n')
}

main()
