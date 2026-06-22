/**
 * Mätscript — sponsorNetworkMood hävstång
 * Fristående, rör inte spel-bundeln.
 * Kör med: node_modules/.bin/vite-node scripts/mat-sponsorgunst.ts
 *
 * Syfte: avgöra om board-rewards → sponsorNetworkMood → sponsorintäkt-kedjan
 * ger kännbar ekonomisk effekt, eller om deltana är kosmetiska.
 */

const ROUNDS = 22
const START_MOOD = 50
const DRIFT_RATE = 0.03   // mood += (50 - mood) * DRIFT_RATE per omgång
const MOOD_COEFF = 0.004  // sponsorMoodMultiplier = 1 + (mood - 50) * MOOD_COEFF

const CHECK_IN_ROUNDS = [7, 14, 22]

type Scenario = { name: string; deltas: Record<number, number> }

const SCENARIOS: Scenario[] = [
  { name: 'A — flaggskepp×3', deltas: { 7: +6, 14: +6, 22: +6 } },
  { name: 'B — rutin×3',      deltas: { 7: +3, 14: +3, 22: +3 } },
  { name: 'C — miss×3',       deltas: { 7: -4, 14: -4, 22: -4 } },
  { name: 'D — blandat',      deltas: { 7: +6, 14: -4, 22: +6 } },
]

const BASES = [
  { name: 'Låg (bruksklubb)',   weeklyKr: 8_000 },
  { name: 'Hög (etablerad)',    weeklyKr: 25_000 },
]

function simulateMood(scenario: Scenario): number[] {
  const moods: number[] = []
  let mood = START_MOOD
  for (let r = 1; r <= ROUNDS; r++) {
    // Check-in delta appliceras FÖRE driften varje check-in-omgång
    if (scenario.deltas[r] !== undefined) {
      mood += scenario.deltas[r]
      mood = Math.max(0, Math.min(100, mood))
    }
    mood += (50 - mood) * DRIFT_RATE
    moods.push(mood)
  }
  return moods
}

function multiplier(mood: number): number {
  return 1 + (mood - 50) * MOOD_COEFF
}

function fmt2(n: number): string {
  return n.toFixed(2)
}

function fmtPct(n: number): string {
  return (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%'
}

// Baslinje: mood = 50 varje omgång → multiplier = 1.0 hela säsongen
const baseMultiplier = 1.0

console.log('='.repeat(72))
console.log('SPONSORGUNST-MÄTNING — mood-bana × intäkts-hävstång')
console.log('='.repeat(72))
console.log()

// Per-scenario rapport
for (const scenario of SCENARIOS) {
  const moods = simulateMood(scenario)
  console.log(`\n── ${scenario.name} ──`)

  // Mood vid nyckelomgångar
  console.log('\n  Mood-kurva (nyckelomgångar):')
  const keyRounds = [6, 7, 8, 13, 14, 15, 21, 22]
  const headerCols = keyRounds.map(r => `Omg${r}`.padStart(7)).join(' ')
  const moodCols   = keyRounds.map(r => fmt2(moods[r - 1]).padStart(7)).join(' ')
  const multCols   = keyRounds.map(r => fmt2(multiplier(moods[r - 1])).padStart(7)).join(' ')
  console.log(`  ${headerCols}`)
  console.log(`  ${moodCols}   ← mood`)
  console.log(`  ${multCols}   ← mult`)

  // Per-bas: topp-multiplikator, drift-erosion, säsongsdelta
  console.log('\n  Intäktseffekt:')
  for (const base of BASES) {
    const baseTotal = base.weeklyKr * ROUNDS  // vid mood = 50 hela säsongen
    const scenTotal = moods.reduce((sum, m) => sum + base.weeklyKr * multiplier(m), 0)
    const deltaKr   = scenTotal - baseTotal
    const deltaPct  = deltaKr / baseTotal

    // Peak multiplier = max(multiplier per round)
    const peakMult   = Math.max(...moods.map(multiplier))
    // Multiplier vid omg 6 (omgången FÖRE check-in 7)
    const preMult7   = multiplier(moods[5])
    // Multiplier vid omg 13 (FÖRE check-in 14)
    const preMult14  = multiplier(moods[12])

    console.log(`\n    ${base.name} (${base.weeklyKr.toLocaleString('sv-SE')} kr/omg):`)
    console.log(`      Topp-multiplier:          ×${fmt2(peakMult)}`)
    console.log(`      Mult omg 6 (pre check-in 7):  ×${fmt2(preMult7)}`)
    console.log(`      Mult omg 13 (pre check-in 14): ×${fmt2(preMult14)}`)
    console.log(`      Säsongsdelta:             ${Math.round(deltaKr).toLocaleString('sv-SE')} kr  (${fmtPct(deltaPct)})`)
  }
}

// Skalningsanalys: vad behövs för ±5 % och ±10 % säsongseffekt vid flaggskepp/miss?
console.log('\n' + '='.repeat(72))
console.log('SKALNINGSANALYS — vad koefficienten behöver vara för ±5–10 % säsongseffekt')
console.log('='.repeat(72))
console.log()

// Säsongsdelta = sum(weeklyKr * (mood_r - 50) * COEFF) / (weeklyKr * 22)
// = COEFF * sum(mood_r - 50) / 22
// → COEFF_target = targetPct * 22 / sum(mood_r - 50)

const flaggMoods = simulateMood(SCENARIOS[0]) // A — flaggskepp
const missMoods  = simulateMood(SCENARIOS[2]) // C — miss

const flaggMoodSum = flaggMoods.reduce((s, m) => s + (m - 50), 0)
const missMoodSum  = missMoods.reduce((s, m)  => s + (m - 50), 0)

for (const targetPct of [0.05, 0.10]) {
  const coeffForFlagg = (targetPct * ROUNDS) / flaggMoodSum
  const coeffForMiss  = (targetPct * ROUNDS) / Math.abs(missMoodSum)
  console.log(`  Mål ${(targetPct * 100).toFixed(0)} % säsongsdelta:`)
  console.log(`    Flaggskepp (mood-sum ${fmt2(flaggMoodSum)}): MOOD_COEFF = ${coeffForFlagg.toFixed(4)}`)
  console.log(`    Miss       (mood-sum ${fmt2(missMoodSum)}): MOOD_COEFF = ${coeffForMiss.toFixed(4)}`)
}

console.log()
console.log('Nuvarande MOOD_COEFF:', MOOD_COEFF)
console.log()
console.log('Notering: check-in-deltan (+6/+3/−4) och drift (3 %/omg) är oförändrade ovan.')
console.log('Justerar Opus MOOD_COEFF uppåt → alla scenarion skalas proportionellt.')
