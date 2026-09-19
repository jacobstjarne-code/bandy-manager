/**
 * verify-corridor.ts — TEXTLEVERANS §D, kontroll efter bygge.
 *
 * Acceptansen gäller "en klubb som är ute ur både slutspel och cup", så
 * mätningen får inte blanda in klubbar som fortfarande spelar — de har
 * matchtexter och är inte problemet. Räknar därför bara omgångar 28–36 där
 * isOutOfEverything är sant.
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents } from './stress/fixtures'
import { isOutOfEverything, CORRIDOR_FIRST_ROUND, CORRIDOR_LAST_ROUND } from '../src/domain/services/corridorService'

const seeds = (process.argv[2] ?? '0,1,2,3,4,5,6').split(',').map(Number)
const seasons = Number(process.argv[3] ?? 3)
const words = (s: string) => (s ?? '').trim().split(/\s+/).filter(Boolean).length

let outRounds = 0, emptyRounds = 0, corridorPosts = 0
const wordsPerRound: number[] = []
const bodySeen = new Map<string, number>()

for (const seed of seeds) {
  let game = createHeadlessGame(seed)
  let step = seed * 100_000 + 21_000
  for (let season = 1; season <= seasons; season++) {
    let seen = new Set(game.inbox.map(i => i.id))
    let done = false
    for (let i = 0; i < 200 && !done; i++) {
      game = autoSelectLineup(game)
      game = autoResolvePendingEvents(game, Math.random)
      const r = advanceToNextEvent(game, step++)
      game = r.game
      if (r.roundPlayed !== null && r.roundPlayed >= CORRIDOR_FIRST_ROUND && r.roundPlayed <= CORRIDOR_LAST_ROUND && isOutOfEverything(game)) {
        outRounds++
        let w = 0
        for (const item of game.inbox) {
          if (seen.has(item.id)) continue
          seen.add(item.id)
          w += words(item.title) + words(item.body)
          if (item.id.startsWith('inbox_corridor_')) {
            corridorPosts++
            bodySeen.set(item.body, (bodySeen.get(item.body) ?? 0) + 1)
          }
        }
        wordsPerRound.push(w)
        if (w === 0) emptyRounds++
      } else {
        for (const item of game.inbox) seen.add(item.id)
      }
      if (r.seasonEnded || game.managerFired) done = true
      game = autoResolvePendingScreen(game).game
    }
    if (game.managerFired) break
  }
}

const sorted = [...wordsPerRound].sort((a, b) => a - b)
const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
const inBand = wordsPerRound.filter(w => w >= 40 && w <= 90).length
const repeats = [...bodySeen.values()].filter(v => v > 1).length

console.log(`\n=== KORRIDOREN (§D) — ${seeds.length} seeds × ${seasons} säsonger ===\n`)
console.log(`omgångar 28–36 där klubben är UTE : ${outRounds}`)
console.log(`korridorsposter                   : ${corridorPosts}`)
console.log(`tomma omgångar (noll ord)         : ${emptyRounds}   (krav 0)`)
console.log(`ord/omgång  median ${median}  min ${sorted[0] ?? 0}  max ${sorted[sorted.length - 1] ?? 0}   (mål 40–90)`)
console.log(`omgångar inom 40–90 ord           : ${inBand}/${wordsPerRound.length}`)
console.log(`rader som gått mer än en gång     : ${repeats}   (krav 0)`)
console.log('')
