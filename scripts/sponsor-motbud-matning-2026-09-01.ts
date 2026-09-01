/**
 * SPONSOR-MOTBUD — mätning mot domens "GODKÄNT NÄR" 1–4.
 * DOM_SPONSOR_MOTBUD_2026-08-31.md.
 *
 * Ren funktionsanalys (inget behov av en full karriärsim — mekaniken är
 * self-contained i sponsorCounterService.ts, oberoende av matchsimulering).
 * Monte Carlo över tusen rullningar per (personlighet, aggressivitet)-par
 * för att mäta VERKLIGA utfallsfrekvenser, inte bara den analytiska
 * sannolikheten.
 *
 * Kör: node_modules/.bin/vite-node scripts/sponsor-motbud-matning-2026-09-01.ts
 */
import {
  computeSponsorReservation,
  resolveSponsorCounter,
  type SponsorPersonality,
} from '../src/domain/services/sponsorCounterService'

const PERSONALITIES: SponsorPersonality[] = ['local', 'regional', 'foundation']
const X = 1000 // originalerbjudande, kr/vecka — resultaten är kvoter, absolutbeloppet är godtyckligt
const CS = 50 // baslinje-communityStanding (ingen hävstång)
const TRIALS = 5000

let seed = 42
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

function monteCarlo(y: number, personality: SponsorPersonality, cs: number, trials: number) {
  let accepted = 0, stoodFirm = 0, walkedAway = 0
  for (let i = 0; i < trials; i++) {
    const r = resolveSponsorCounter(y, X, personality, cs, rand)
    if (r.outcome === 'accepted') accepted++
    else if (r.outcome === 'stood_firm') stoodFirm++
    else walkedAway++
  }
  return { pAccept: accepted / trials, pStandFirm: stoodFirm / trials, pWalk: walkedAway / trials }
}

console.log('═══ SPONSOR-MOTBUD — mätning 2026-09-01 ═══')
console.log(`X (original) = ${X} kr/vecka · CS = ${CS} · ${TRIALS} rullningar per cell\n`)

for (const personality of PERSONALITIES) {
  const reservation = computeSponsorReservation(X, personality, CS)
  console.log(`── ${personality} (reservation ≈ ${Math.round(reservation)} kr, ${(reservation / X).toFixed(2)}×X) ──`)

  const scenarios: { label: string; y: number }[] = [
    { label: 'modest (0.5× vägen till reservation)', y: Math.round(X + (reservation - X) * 0.5) },
    { label: 'vid reservation', y: Math.round(reservation) },
    { label: 'aggressiv (1.5× reservation)', y: Math.round(reservation * 1.5) },
    { label: 'mycket aggressiv (2× reservation)', y: Math.round(reservation * 2) },
    { label: 'kräv alltid maximalt (5× reservation)', y: Math.round(reservation * 5) },
  ]

  for (const s of scenarios) {
    const { pAccept, pStandFirm, pWalk } = monteCarlo(s.y, personality, CS, TRIALS)
    const evCounter = pAccept * s.y + pStandFirm * X + pWalk * 0
    const evOriginal = X
    const delta = evCounter - evOriginal
    console.log(
      `  ${s.label.padEnd(38)} Y=${String(s.y).padStart(6)}  ` +
      `accept=${(pAccept * 100).toFixed(0).padStart(3)}%  standFirm=${(pStandFirm * 100).toFixed(0).padStart(3)}%  walk=${(pWalk * 100).toFixed(0).padStart(3)}%  ` +
      `EV-delta vs original=${delta >= 0 ? '+' : ''}${Math.round(delta)}`
    )
  }
  console.log('')
}

console.log('═══ GODKÄNT NÄR ═══')

// 1. Aggressivt motbud förlorar affären tillräckligt ofta.
console.log('1. Aggressivt motbud (2× reservation), walk-sannolikhet per personlighet:')
for (const p of PERSONALITIES) {
  const reservation = computeSponsorReservation(X, p, CS)
  const { pWalk } = monteCarlo(Math.round(reservation * 2), p, CS, TRIALS)
  console.log(`   ${p.padEnd(12)} walk=${(pWalk * 100).toFixed(0)}%`)
}

// 2. Modest motbud lyckas oftast.
console.log('2. Modest motbud (0.5x vägen till reservation), accept-sannolikhet:')
for (const p of PERSONALITIES) {
  const reservation = computeSponsorReservation(X, p, CS)
  const y = Math.round(X + (reservation - X) * 0.5)
  const { pAccept } = monteCarlo(y, p, CS, TRIALS)
  console.log(`   ${p.padEnd(12)} accept=${(pAccept * 100).toFixed(0)}% (vinst per lyckat bud: +${y - X} kr/vecka)`)
}

// 3. Personlighet avläsbar: regional har HÖGRE tak men bryter LÄTTARE.
const localRes = computeSponsorReservation(X, 'local', CS)
const regionalRes = computeSponsorReservation(X, 'regional', CS)
const aggressiveY = Math.round(Math.max(localRes, regionalRes) * 1.5)
const localAtY = monteCarlo(aggressiveY, 'local', CS, TRIALS)
const regionalAtY = monteCarlo(aggressiveY, 'regional', CS, TRIALS)
console.log(`3. Personlighet avläsbar: regional tak ${(regionalRes / X).toFixed(2)}×X > local ${(localRes / X).toFixed(2)}×X.`)
console.log(`   Vid samma aggressiva Y=${aggressiveY}: local walk=${(localAtY.pWalk * 100).toFixed(0)}% vs regional walk=${(regionalAtY.pWalk * 100).toFixed(0)}% (regional bryter lättare vid samma Y)`)

// 4. Ingen freebie: "kräv alltid maximalt" (5x reservation) ska ha negativt EV.
console.log('4. "Kräv alltid maximalt" (5× reservation) — EV-delta vs acceptera originalet:')
let allNegative = true
for (const p of PERSONALITIES) {
  const reservation = computeSponsorReservation(X, p, CS)
  const y = Math.round(reservation * 5)
  const { pAccept, pStandFirm, pWalk } = monteCarlo(y, p, CS, TRIALS)
  const delta = pAccept * y + pStandFirm * X + pWalk * 0 - X
  if (delta >= 0) allNegative = false
  console.log(`   ${p.padEnd(12)} EV-delta=${delta >= 0 ? '+' : ''}${Math.round(delta)} kr/vecka ${delta < 0 ? '✓ negativt' : '✗ INTE negativt'}`)
}
console.log(`   Alla personligheter negativt EV vid "kräv alltid maximalt": ${allNegative ? 'JA' : 'NEJ'}`)
