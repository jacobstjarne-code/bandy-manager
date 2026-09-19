import { writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import { simulateFirstHalf, simulateSecondHalf, type MatchCoreInput } from '../src/domain/services/matchCore'
import { commentary, pickCommentary } from '../src/domain/data/matchCommentary'
import { getRivalry, RIVALRIES } from '../src/domain/data/rivalries'
import { MatchEventType, WeatherCondition } from '../src/domain/enums'
import { mulberry32 } from '../src/domain/utils/random'
import { deriveEventText } from '../src/presentation/screens/match/deriveEventText'
const findings: Record<string,{count:number;examples:unknown[]}> = {}
function hit(key:string,value:unknown){const b=findings[key]??={count:0,examples:[]};b.count++;if(b.examples.length<8)b.examples.push(value)}
const counts:Record<string,number>={}
const pools=Object.fromEntries(Object.entries(commentary).map(([k,v])=>[k,v.length]))
let rows=0,goals=0,repeatMatches=0,adjacent=0,within6=0,insideHalfAdjacent=0,fullNames=0,lastNames=0
const freq=new Map<string,number>()
const originalRandom=Math.random
const gameplayHash = createHash('sha256')
try {
for(let world=0;world<12;world++) {
  Math.random=mulberry32(400000+world)
  const game=createHeadlessGame(400000+world)
  const modes=['regular','derby','cup-quarter','cup-final','indoor-snow']
  for(const scenario of modes)for(let sample=0;sample<40;sample++){
    const seed=700000+world*10000+modes.indexOf(scenario)*1000+sample
    Math.random=mulberry32(seed+9000000)
    const pair=scenario==='derby'?RIVALRIES[world%RIVALRIES.length].clubIds:[game.clubs[world%game.clubs.length].id,game.clubs[(world+1)%game.clubs.length].id]
    const home=game.clubs.find(c=>c.id===pair[0])!,away=game.clubs.find(c=>c.id===pair[1])!
    const homePlayers=game.players.filter(p=>p.clubId===home.id),awayPlayers=game.players.filter(p=>p.clubId===away.id)
    const fixture={...game.fixtures[0],id:`audit-${scenario}-${world}-${sample}`,homeClubId:home.id,awayClubId:away.id,
      isCup:scenario.startsWith('cup'),isKnockout:scenario.startsWith('cup'),isFinaldag:false,isNeutralVenue:false,
      roundNumber:scenario==='cup-final'?4:scenario==='cup-quarter'?2:10,
      matchday:scenario==='cup-final'?4:scenario==='cup-quarter'?2:14,attendance:400}
    const input:MatchCoreInput={fixture,homePlayers,awayPlayers,homeClubName:home.name,awayClubName:away.name,
      homeLineup:autoSelectLineup({...game,managedClubId:home.id}).managedClubPendingLineup!,
      awayLineup:autoSelectLineup({...game,managedClubId:away.id}).managedClubPendingLineup!,
      mode:'full',seed,rivalry:scenario==='derby'?getRivalry(home.id,away.id)??undefined:undefined,
      hallInomhus:scenario==='indoor-snow',weather:scenario==='indoor-snow'?{condition:WeatherCondition.HeavySnow,temperature:-8,windSpeed:0} as any:undefined,
      isCupFinalhelgen:scenario==='cup-final'}
    const first=[...simulateFirstHalf(input)],half=first.at(-1)!
    const second=[...simulateSecondHalf({...input,initialHomeScore:half.homeScore,initialAwayScore:half.awayScore,
      initialShotsHome:half.shotsHome,initialShotsAway:half.shotsAway,initialOnTargetHome:half.onTargetHome,initialOnTargetAway:half.onTargetAway,
      initialCornersHome:half.cornersHome,initialCornersAway:half.cornersAway,
      initialHomeSuspensions:half.activeSuspensions.homeCount,initialAwaySuspensions:half.activeSuspensions.awayCount,
      initialHomeSuspensionTimers:half.activeSuspensions.homeTimers,initialAwaySuspensionTimers:half.activeSuspensions.awayTimers,matchProfile:half.matchProfile,commentaryMemory:half.commentaryMemory})]
    counts[scenario]=(counts[scenario]??0)+1
    let hs=0,as=0,lastMinute=-1,lastText='',previousStep=-1,hadRepeat=false,previousShots=0
    const recent:string[]=[],seen=new Set<string>()
    for(const s of [...first,...second]){
      gameplayHash.update(JSON.stringify([s.step, s.minute, s.homeScore, s.awayScore, s.shotsHome, s.shotsAway, s.onTargetHome, s.onTargetAway, s.events]))
      const t=s.commentary?.trim()??'',goal=s.events.find(e=>e.type===MatchEventType.Goal)
      const example={scenario,seed,minute:s.minute,step:s.step,score:`${s.homeScore}-${s.awayScore}`,text:t}
      if(s.minute<lastMinute)hit('minutesBackwards',example)
      lastMinute=s.minute
      if(s.phase!=='penalties'){
        const gh=s.events.filter(e=>e.type===MatchEventType.Goal&&e.clubId===home.id).length
        const ga=s.events.filter(e=>e.type===MatchEventType.Goal&&e.clubId===away.id).length
        if(s.homeScore-hs!==gh||s.awayScore-as!==ga)hit('goalDeltaMismatch',example)
      }
      hs=s.homeScore;as=s.awayScore
      const shotDelta=s.shotsHome+s.shotsAway-previousShots
      previousShots=s.shotsHome+s.shotsAway
      const hasCorner=s.events.some(e=>e.type===MatchEventType.Corner)
      if(hasCorner&&!goal&&shotDelta===0&&/skott|stolp|burgavel|avslut|skjuter/i.test(t))hit('cornerShotTextWithoutShot',example)
      if(!hasCorner&&!goal&&!s.events.some(e=>e.type===MatchEventType.Save)&&shotDelta===0&&/^Friläge! Men avslutet går rakt på målvakten/.test(t))hit('neutralSaveTextWithoutShot',example)
      const isHalftimeText=/halvtid|^Paus\. Tränarna väntar|^45 minuter spelade/i.test(t)
      if(goal){goals++;if(isHalftimeText)hit('goalTaggedAsHalftime',{...example,rendered:deriveEventText(t,goal,'Mål',[...homePlayers,...awayPlayers])})}
      if(s.events.some(e=>e.type===MatchEventType.Suspension)&&isHalftimeText)hit('suspensionTaggedAsHalftime',example)
      if(s.events.some(e=>e.type===MatchEventType.Save)&&(isHalftimeText||/^(Försiktigt nu\.|Det här är schack på is\.|Millimeterbandy\.|Jämnt som tusan\.|Tränaren pekar framåt|Publiksiffran annonseras|Speaker meddelar)/i.test(t)))hit('saveWithNonSaveText',example)
      if(scenario==='derby'&&/har fått sitt första mål/.test(t)&&hs+as>1)hit('falseDerbyOpener',example)
      if(scenario==='cup-quarter'&&/cupfinal|lyfta bucklan/i.test(t))hit('quarterCalledCupFinal',example)
      if(scenario==='cup-quarter'&&/Kvarten väntar/.test(t))hit('quarterWinPromisesQuarter',example)
      if(scenario==='cup-quarter'&&/Oktober/.test(t))hit('augustCupClaimsOctober',example)
      if(/Ingen vill släppa in det första målet/.test(t)&&hs+as>0)hit('firstGoalAlreadyScored',example)
      if(scenario==='indoor-snow'&&/snö|tung is|slask|slaskig|isen.*tung/i.test(t))hit('indoorSnowCandidate',example)
      if(/\{[a-zA-Z][^}]*\}|undefined|\[object Object\]/.test(t))hit('unresolvedTemplate',example)
      const namedPlayerIds=new Set(s.events.map(e=>e.playerId).filter(Boolean))
      for(const p of [...homePlayers,...awayPlayers])if(namedPlayerIds.has(p.id)&&t.includes(p.lastName)){
        if(t.includes(`${p.firstName} ${p.lastName}`))fullNames++;else lastNames++
      }
      if(t){rows++;freq.set(t,(freq.get(t)??0)+1);if(seen.has(t))hadRepeat=true;seen.add(t)
        if(lastText===t){adjacent++;if(!(previousStep===30&&s.step===31))insideHalfAdjacent++;hit('adjacentRepeat',example)}
        if(recent.includes(t))within6++;recent.push(t);if(recent.length>6)recent.shift();lastText=t;previousStep=s.step}
    }
    if(hadRepeat)repeatMatches++
  }
}
} finally {Math.random=originalRandom}
const h=new Map<string[],string[]>(),p=['ett','två','tre','fyra']
const forcedRepeat=[pickCommentary(p,()=>0,h),pickCommentary(p,()=>0,h)]
const result={method:'12 independent worlds × 5 scenarios × 40 seeds; full commentary, no managed interaction; seeded Math.random for trait text; carry matchProfile to second half',counts,rows,goals,repeatMatches,adjacent,insideHalfAdjacent,within6,nameMentions:{fullNames,lastNames,warning:'Only references to players attached to this steps events; excludes unrelated prose. Not a full NLP name audit.'},poolSizes:pools,forcedRepeat,topExact:[...freq].sort((a,b)=>b[1]-a[1]).slice(0,20),findings}
Object.assign(result, { gameplayHash: gameplayHash.digest('hex') })
writeFileSync(process.env.AUDIT_OUTPUT ?? 'audit-match-depth.json',JSON.stringify(result,null,2))
console.log(JSON.stringify({...result,poolSizes:undefined,topExact:result.topExact.slice(0,3)},null,2))
