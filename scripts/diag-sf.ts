import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { TrainingType, TrainingIntensity } from '../src/domain/enums'
const seed = Number(process.argv[2] ?? 0); const light = process.argv[3] === 'light'
let game = createHeadlessGame(seed); let step = seed*100000+1000
const rows: string[] = []
for (let i=0;i<120;i++){
  if (light) game = { ...game, managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Light } }
  game = autoSelectLineup(game); game = autoBuildCheapestAffordableFacility(game); game = autoResolvePendingEvents(game, Math.random)
  const r = advanceToNextEvent(game, step++); game = r.game
  if (r.roundPlayed!==null && r.roundPlayed % 4 === 1) {
    const ids = new Set(game.managedClubPendingLineup?.startingPlayerIds ?? [])
    const mine = game.players.filter(p => p.clubId === game.managedClubId)
    const st = mine.filter(p => ids.has(p.id)).length ? mine.filter(p => ids.has(p.id)) : mine
    const f = st.reduce((a,p)=>a+p.fitness,0)/st.length, sf = st.reduce((a,p)=>a+(p.seasonForm??60),0)/st.length
    const eff = st.reduce((a,p)=>a+Math.min(p.fitness,(p.seasonForm??60)+3),0)/st.length
    const capped = st.filter(p => p.fitness > (p.seasonForm??60)+3).length
    rows.push(`omg ${r.roundPlayed}: råkondition ${f.toFixed(0)} seasonForm ${sf.toFixed(0)} effektiv ${eff.toFixed(0)} kapade ${capped}/${st.length}`)
  }
  if (r.seasonEnded) break
  game = autoResolvePendingScreen(game).game
}
console.log(rows.join('\n'))
