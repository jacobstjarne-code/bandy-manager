import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import { simulateMatch } from '../src/domain/services/matchEngine'
import { simulateFirstHalf, simulateSecondHalf } from '../src/domain/services/matchCore'
import { mulberry32, stableStringSeed } from '../src/domain/utils/random'
const hashedSeeds=process.argv.includes('--hashed-seeds')
const prefix=hashedSeeds?'audit-score-hashed':'audit-score'
type Row={homeScore:number;awayScore:number;group:string;id:string}
const raw=JSON.parse(readFileSync('docs/data/bandygrytan_detailed.json','utf8'))
const all=raw.herr.matches
const ids=new Set<string>()
const source=all.filter((m:any)=>{
  if(m.___EXAMPLE||m.phase!=='regular'||m.overtime===true||m.wentToOvertime===true||m.penalties===true||m.wentToPenalties===true)return false
  if(!Number.isInteger(m.homeScore)||!Number.isInteger(m.awayScore)||m.homeScore<0||m.awayScore<0)return false
  if(ids.has(m.matchId))return false
  ids.add(m.matchId);return true
})
const real:Row[]=source.map((m:any)=>({homeScore:m.homeScore,awayScore:m.awayScore,group:m.season,id:m.matchId}))
const fast:Row[]=[],full:Row[]=[]
const originalRandom=Math.random
try{
for(let world=0;world<24;world++){
  const worldSeed=810000+world
  Math.random=mulberry32(worldSeed)
  const game=createHeadlessGame(worldSeed)
  const selections=new Map(game.clubs.map(c=>[c.id,autoSelectLineup({...game,managedClubId:c.id}).managedClubPendingLineup!]))
  const fixtures=game.fixtures.filter(f=>!f.isCup&&!f.isKnockout&&f.season===game.currentSeason)
  for(const [index,fixture] of fixtures.entries()){
    const seed=hashedSeeds?stableStringSeed(`score-audit:${worldSeed}:${index}`):worldSeed*1000+index
    const home=game.clubs.find(c=>c.id===fixture.homeClubId)!,away=game.clubs.find(c=>c.id===fixture.awayClubId)!
    const input={fixture,homeLineup:selections.get(home.id)!,awayLineup:selections.get(away.id)!,
      homePlayers:game.players.filter(p=>p.clubId===home.id),awayPlayers:game.players.filter(p=>p.clubId===away.id),
      homeClubName:home.name,awayClubName:away.name,seed}
    Math.random=mulberry32(seed+123)
    const f=simulateMatch(input).fixture
    fast.push({homeScore:f.homeScore!,awayScore:f.awayScore!,group:String(world),id:fixture.id})
    Math.random=mulberry32(seed+123)
    const first=[...simulateFirstHalf({...input,mode:'full'})],half=first.at(-1)!
    const second=[...simulateSecondHalf({...input,mode:'full',initialHomeScore:half.homeScore,initialAwayScore:half.awayScore,
      initialShotsHome:half.shotsHome,initialShotsAway:half.shotsAway,initialOnTargetHome:half.onTargetHome,initialOnTargetAway:half.onTargetAway,
      initialCornersHome:half.cornersHome,initialCornersAway:half.cornersAway,
      initialHomeSuspensions:half.activeSuspensions.homeCount,initialAwaySuspensions:half.activeSuspensions.awayCount,
      initialHomeSuspensionTimers:half.activeSuspensions.homeTimers,initialAwaySuspensionTimers:half.activeSuspensions.awayTimers,matchProfile:half.matchProfile})]
    const last=second.at(-1)!
    full.push({homeScore:last.homeScore,awayScore:last.awayScore,group:String(world),id:fixture.id})
  }
}
}finally{Math.random=originalRandom}
function summarize(a:Row[]){
  const n=a.length,totals=a.map(m=>m.homeScore+m.awayScore).sort((a,b)=>a-b),margins=a.map(m=>Math.abs(m.homeScore-m.awayScore))
  const mean=totals.reduce((a,b)=>a+b,0)/n
  const wilson=(k:number)=>{const p=k/n,z=1.96,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return{count:k,pct:100*p,approx95pct:[100*(c-h),100*(c+h)]}}
  const rate=(test:(m:Row)=>boolean)=>wilson(a.filter(test).length)
  const hist=(values:number[])=>Object.fromEntries([...new Set(values)].sort((a,b)=>a-b).map(v=>[v,values.filter(x=>x===v).length]))
  const scores=new Map<string,number>();for(const m of a){const key=`${m.homeScore}-${m.awayScore}`;scores.set(key,(scores.get(key)??0)+1)}
  return {n,mean,variance:totals.reduce((s,v)=>s+(v-mean)**2,0)/(n-1),p50:totals[Math.ceil(n*.5)-1],p90:totals[Math.ceil(n*.9)-1],p95:totals[Math.ceil(n*.95)-1],p99:totals[Math.ceil(n*.99)-1],max:totals.at(-1),
    rates:{draw:rate(m=>m.homeScore===m.awayScore),homeWin:rate(m=>m.homeScore>m.awayScore),goals12plus:rate(m=>m.homeScore+m.awayScore>=12),goals15plus:rate(m=>m.homeScore+m.awayScore>=15),goals20plus:rate(m=>m.homeScore+m.awayScore>=20),goals4minus:rate(m=>m.homeScore+m.awayScore<=4),team10plus:rate(m=>Math.max(m.homeScore,m.awayScore)>=10),cleanSheet:rate(m=>Math.min(m.homeScore,m.awayScore)===0),margin5plus:rate(m=>Math.abs(m.homeScore-m.awayScore)>=5)},
    totalHistogram:hist(totals),marginHistogram:hist(margins),mostCommon:[...scores].sort((a,b)=>b[1]-a[1]).slice(0,15),scoreMatrix:Object.fromEntries(scores)}
}
const groups=(a:Row[])=>Object.fromEntries([...new Set(a.map(m=>m.group))].map(g=>{const {n,mean,rates}=summarize(a.filter(m=>m.group===g));return[g,{n,mean,rates}]}))
const realSummary=summarize(real),fastSummary=summarize(fast),fullSummary=summarize(full)
const referenceGates={
  mean:{target:realSummary.mean,tolerance:0.30},
  goals15plus:{target:realSummary.rates.goals15plus.pct,tolerancePercentagePoints:1.5},
  goals4minus:{target:realSummary.rates.goals4minus.pct,tolerancePercentagePoints:1.5},
}
const fastLiveMismatches=fast.filter((match,index)=>match.homeScore!==full[index]?.homeScore||match.awayScore!==full[index]?.awayScore).length
const gates={
  mean:Math.abs(fastSummary.mean-referenceGates.mean.target)<=referenceGates.mean.tolerance,
  goals15plus:Math.abs(fastSummary.rates.goals15plus.pct-referenceGates.goals15plus.target)<=referenceGates.goals15plus.tolerancePercentagePoints,
  goals4minus:Math.abs(fastSummary.rates.goals4minus.pct-referenceGates.goals4minus.target)<=referenceGates.goals4minus.tolerancePercentagePoints,
  fastLiveIdentical:fastLiveMismatches===0,
}
const output={seedMethod:hashedSeeds?'stableStringSeed(score-audit:worldSeed:index)':'worldSeed*1000+fixtureIndex',method:'Frozen initial rosters; 24 worlds, actual league fixtures, best available XI per club; no season evolution, weather, manager decisions or interactive resolutions. Full mode auto-resolves both teams (managedIsHome undefined). Both modes carry matchProfile between halves.',
  source:{path:'docs/data/bandygrytan_detailed.json',scrapedAt:raw._meta.scrapedAt,allMen:all.length,regularBeforeFilters:all.filter((m:any)=>m.phase==='regular').length,regularAfterFilters:real.length,competitions:[...new Set(source.map((m:any)=>m.competitionName))],warning:'Elitserien historical sample vs fictional lower-division game league; not a matched team-strength sample. CI is match-level descriptive Wilson, ignores team/season clustering; group results provided.'},
  referenceGates,gates,fastLiveMismatches,
  real:realSummary,realRecent:summarize(real.filter(m=>['2024-25','2025-26'].includes(m.group))),fast:fastSummary,full:fullSummary,bySeason:groups(real),byWorldFast:groups(fast),byWorldFull:groups(full)}
// Only consume a separately requested fresh stress run, never an old repository artifact by accident.
if(process.argv.includes('--with-fresh-careers')&&existsSync('scripts/stress/season_stats.json')){
  const career=JSON.parse(readFileSync('scripts/stress/season_stats.json','utf8'))
  const seen=new Set<string>()
  const careerRows:Row[]=career.seasons.flatMap((s:any)=>s.matches.filter((m:any)=>m.phase==='regular').map((m:any)=>({homeScore:m.homeScore,awayScore:m.awayScore,group:String(s.season),id:`${s.seed}:${s.season}:${m.round}:${m.homeClubId}:${m.awayClubId}`}))).filter((m:Row)=>{if(seen.has(m.id))return false;seen.add(m.id);return true})
  Object.assign(output,{careers:{meta:career._meta,summary:summarize(careerRows),byCareerSeason:groups(careerRows)}})
  writeFileSync('audit-career-score-rows.json',JSON.stringify(careerRows))
}
writeFileSync(`${prefix}-distribution.json`,JSON.stringify(output,null,2))
writeFileSync(`${prefix}-rows.json`,JSON.stringify({real,fast,full}))
console.log(JSON.stringify({method:output.method,source:output.source,real:output.real,fast:output.fast,full:output.full},null,2))
if(process.argv.includes('--assert-gates')&&Object.values(gates).some(value=>!value)){
  console.error(JSON.stringify({referenceGates,gates,fastLiveMismatches},null,2))
  process.exitCode=1
}
