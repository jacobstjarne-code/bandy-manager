import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen, autoResolvePendingEvents, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { TrainingType, TrainingIntensity } from '../src/domain/enums'
const seeds = (process.argv[2] ?? '0,2,5').split(',').map(Number); const light = process.argv[3] === 'light'
const acc: number[] = []; let injuries = 0; let earlyDrop = 0
for (const seed of seeds) {
  let game = createHeadlessGame(seed); let step = seed*100000+1000
  let prevInj = new Set<string>(); let f5 = 0
  for (let i=0;i<120;i++){
    if (light) game = { ...game, managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Light } }
    game = autoSelectLineup(game); game = autoBuildCheapestAffordableFacility(game); game = autoResolvePendingEvents(game, Math.random)
    const r = advanceToNextEvent(game, step++); game = r.game
    if (r.roundPlayed!==null) {
      const mine = game.players.filter(p => p.clubId === game.managedClubId)
      const top = [...mine].sort((a,b)=>b.currentAbility-a.currentAbility).slice(0,11)
      const f = top.reduce((a,p)=>a+p.fitness,0)/top.length
      if (r.roundPlayed===5) f5=f
      if (r.roundPlayed>=9 && r.roundPlayed<=25) acc.push(f)
      const inj = new Set(mine.filter(p=>p.isInjured).map(p=>p.id)); for (const id of inj) if (!prevInj.has(id)) injuries++; prevInj = inj
    }
    if (r.seasonEnded) break
    game = autoResolvePendingScreen(game).game
  }
}
const m = acc.reduce((a,b)=>a+b,0)/acc.length; const mn = Math.min(...acc)
console.log(`${light?'light ':'normal'} rec=${process.env.BM_REC_STARTED??'0.16'} loss=${process.env.BM_LOSS_BASE??'15'}+${process.env.BM_LOSS_SPAN??'10'} | bästa elvan omg 9–25: snitt ${m.toFixed(1)} min ${mn.toFixed(1)} | skador/säsong ${(injuries/seeds.length).toFixed(1)}`)
