/**
 * diag-ca.ts — KÖRORDER 2026-09-18 §3.3.
 *
 * Mäter vad ett träningsval faktiskt är värt i CA över en säsong, uppdelat på
 * U24 och 24+. Finns för att §3.3:s mål är formulerat i CA per säsong medan
 * spaken sitter på en per-omgång-term — utan den här mätningen sätts talen på
 * gissning, och Jacobs beslut (Normal +0,5–1 CA för U24, Hård det dubbla, Lätt
 * noll eller svagt negativt) går inte att verifiera.
 *
 * Rapporterar också hur många ≤22-åringar som passerar galans nykomlingströskel,
 * eftersom §3.3 flyttar den fördelningen.
 *
 * Kör: node_modules/.bin/vite-node scripts/diag-ca.ts [seeds] [light|normal|hard]
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import {
  createHeadlessGame, autoSelectLineup, autoResolvePendingScreen,
  autoResolvePendingEvents, autoBuildCheapestAffordableFacility,
} from './stress/fixtures'
import { TrainingType, TrainingIntensity } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const seeds = (process.argv[2] ?? '0,2,5').split(',').map(Number)
const mode = process.argv[3] ?? 'normal'
const intensity = mode === 'light' ? TrainingIntensity.Light
  : mode === 'hard' ? TrainingIntensity.Hard
  : TrainingIntensity.Normal

const youngDeltas: number[] = []
const oldDeltas: number[] = []
const u22Deltas: number[] = []
let rounds = 0

for (const seed of seeds) {
  let game: SaveGame = createHeadlessGame(seed)
  game = { ...game, managedClubTraining: { type: TrainingType.Physical, intensity } }
  const startCA = new Map(game.players.map(p => [p.id, p.currentAbility]))
  const startAge = new Map(game.players.map(p => [p.id, p.age]))
  let step = seed * 100_000 + 4000
  let seasonRounds = 0

  for (let i = 0; i < 120; i++) {
    game = { ...game, managedClubTraining: { type: TrainingType.Physical, intensity } }
    game = autoSelectLineup(game)
    game = autoBuildCheapestAffordableFacility(game)
    game = autoResolvePendingEvents(game, Math.random)
    const r = advanceToNextEvent(game, step++)
    game = r.game
    if (r.roundPlayed !== null) seasonRounds++
    if (r.seasonEnded || game.managerFired) break
    game = autoResolvePendingScreen(game).game
  }
  rounds += seasonRounds

  for (const p of game.players.filter(p => p.clubId === game.managedClubId)) {
    const before = startCA.get(p.id), age = startAge.get(p.id)
    if (before === undefined || age === undefined) continue
    const delta = p.currentAbility - before
    if (age <= 23) youngDeltas.push(delta); else oldDeltas.push(delta)
    if (age <= 22) u22Deltas.push(delta)
  }
}

const mean = (a: number[]) => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0
const pct = (a: number[], t: number) => a.length ? a.filter(v => v >= t).length / a.length * 100 : 0

console.log(`\n=== CA-UTVECKLING PER SÄSONG (§3.3) — träning: ${mode}, ${seeds.length} seeds ===`)
console.log(`omgångar/säsong (snitt)      : ${(rounds / seeds.length).toFixed(1)}`)
console.log(`U24 (≤23 vid säsongsstart)   : snitt ${mean(youngDeltas).toFixed(2)} CA   (n=${youngDeltas.length})`)
console.log(`24+                          : snitt ${mean(oldDeltas).toFixed(2)} CA   (n=${oldDeltas.length})`)
console.log(`\ngalans nykomlingströskel (≤22-åringar, n=${u22Deltas.length}):`)
for (const t of [1, 2, 3, 4, 5, 6]) {
  console.log(`   ≥ +${t} CA: ${pct(u22Deltas, t).toFixed(0)} %`)
}
console.log('')
