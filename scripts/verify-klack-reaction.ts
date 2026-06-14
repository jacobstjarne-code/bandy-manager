/**
 * Verifiering — klack-matchreaktion (kartfynd 8a).
 * Simulerar en säsong UTAN att röra supporter-events och loggar supporterGroup.mood
 * mot matchutfall. Förväntat: moodet rör sig med resultaten (inte parkerat på 60).
 *
 * Kör: node_modules/.bin/vite-node scripts/verify-klack-reaction.ts [--seed=3]
 */
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus } from '../src/domain/enums'
import { getRivalry } from '../src/domain/data/rivalries'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'

const seedArg = process.argv.slice(2).find(a => a.startsWith('--seed='))
const seed = seedArg ? parseInt(seedArg.split('=')[1], 10) : 3

let game = createHeadlessGame(seed)
const managedId = game.managedClubId
const startMood = game.supporterGroup?.mood ?? -1
console.log(`Seed ${seed} · managed=${managedId} · startMood=${startMood}`)
console.log('round | result            | derby | klackMood')
console.log('------|-------------------|-------|----------')

let seen = new Set(game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id))
let stepSeed = seed * 1000
let moods: number[] = [startMood]
let guard = 0

while (guard++ < 400) {
  game = autoSelectLineup(game)
  const result = advanceToNextEvent(game, stepSeed++)
  game = result.game

  const newlyManaged = game.fixtures.filter(f =>
    f.status === FixtureStatus.Completed && !seen.has(f.id) &&
    (f.homeClubId === managedId || f.awayClubId === managedId)
  )
  seen = new Set(game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id))

  for (const f of newlyManaged) {
    const isHome = f.homeClubId === managedId
    const my = (isHome ? f.homeScore : f.awayScore) ?? 0
    const their = (isHome ? f.awayScore : f.homeScore) ?? 0
    const res = my > their ? 'WIN ' : my < their ? 'LOSS' : 'DRAW'
    const derby = getRivalry(f.homeClubId, f.awayClubId) ? 'JA' : '  '
    const mood = game.supporterGroup?.mood ?? -1
    moods.push(mood)
    console.log(`${String(result.roundPlayed ?? '–').padStart(5)} | ${res} ${String(my)}–${String(their)} (${isHome ? 'hemma' : 'borta'})`.padEnd(35) + ` | ${derby}    | ${mood}`)
  }

  game = autoResolvePendingScreen(game).game
  if (result.seasonEnded || game.managerFired) break
}

const min = Math.min(...moods), max = Math.max(...moods), final = moods[moods.length - 1]
console.log('------')
console.log(`mood: start=${startMood} min=${min} max=${max} final=${final} · spann=${max - min}`)
console.log(min <= 0 || max >= 100 ? '⚠️  TRÄFFAR GOLV/TAK — överväg svag reversion' : '✓ inom (0,100), ingen golv/tak-fastning')
console.log(max - min >= 5 ? '✓ moodet rör sig med resultaten (inte parkerat)' : '⚠️  moodet rör sig knappt')
