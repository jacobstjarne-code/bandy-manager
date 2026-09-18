import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents, autoBuildCheapestAffordableFacility } from './stress/fixtures'
const seed = Number(process.argv[2] ?? 3)
let game = createHeadlessGame(seed); let step = seed*100000+1000
const seenRounds = new Map<string, number[]>()
let round = 0
for (let i=0;i<200;i++){
  game = autoSelectLineup(game); game = autoBuildCheapestAffordableFacility(game)
  for (const e of game.pendingEvents ?? []) { const k=`${e.type}|${e.id}`; seenRounds.set(k,[...(seenRounds.get(k)??[]),round]) }
  game = autoResolvePendingEvents(game, Math.random)
  const r = advanceToNextEvent(game, step++); game = r.game
  if (r.roundPlayed!==null) round = r.roundPlayed
  if (r.seasonEnded) break
  game = autoResolvePendingScreen(game).game
}
const rep = [...seenRounds.entries()].filter(([,v])=>v.length>1).sort((a,b)=>b[1].length-a[1].length)
console.log('ids seen in >1 round after being resolved:', rep.length, 'of', seenRounds.size)
for (const [k,v] of rep.slice(0,15)) console.log(v.length, k, v.join(','))
console.log('resolvedEventIds', (game.resolvedEventIds??[]).length)
