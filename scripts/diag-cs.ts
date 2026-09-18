import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents, autoBuildCheapestAffordableFacility } from './stress/fixtures'
const seed = Number(process.argv[2] ?? 0); const ignore = process.argv[3] === 'ignore'
let game = createHeadlessGame(seed); let step = seed*100000+1000
const types = new Map<string, number>(); let pendingMax = 0; const seen = new Set<string>()
const cs: string[] = []
for (let i=0;i<200;i++){
  game = autoSelectLineup(game); game = autoBuildCheapestAffordableFacility(game)
  const pend = game.pendingEvents ?? []
  pendingMax = Math.max(pendingMax, pend.length)
  for (const e of pend) { if (!seen.has(e.id)) { seen.add(e.id); types.set(e.type,(types.get(e.type)??0)+1) } }
  if (!ignore) game = autoResolvePendingEvents(game, Math.random)
  const before = game.communityStanding
  const r = advanceToNextEvent(game, step++); game = r.game
  if (r.roundPlayed!==null) cs.push(`${r.roundPlayed}:${game.communityStanding}`)
  if (r.seasonEnded) break
  game = autoResolvePendingScreen(game).game
}
console.log(ignore?'IGNORE':'NOOP', 'pendingMax', pendingMax, 'inbox', game.inbox.length)
console.log([...types.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([t,n])=>`${t}:${n}`).join(' '))
console.log(cs.join(' '))
