/** Fas 1 testfall 5 — stil-kontinuum. Mät-körning, ingen motoändring. */
import { simulateMatch } from '../src/domain/services/matchEngine'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import { writeFileSync } from 'fs'
let _pid=0
function mp(c:string,p:PlayerPosition,ca:number):Player{const id=`p${++_pid}`;const gk=p===PlayerPosition.Goalkeeper;return{id,firstName:'X',lastName:id,age:26,nationality:'SWE',clubId:c,academyClubId:undefined,isHomegrown:false,position:p,archetype:gk?PlayerArchetype.ReflexGoalkeeper:PlayerArchetype.TwoWaySkater,salary:0,contractUntilSeason:2,marketValue:0,morale:70,form:70,fitness:85,sharpness:75,isFullTimePro:false,currentAbility:ca,potentialAbility:ca,attributes:{skating:ca,acceleration:ca,stamina:ca,ballControl:ca,passing:ca,shooting:ca,dribbling:ca,vision:ca,decisions:ca,workRate:ca,positioning:ca,defending:ca,cornerSkill:ca,goalkeeping:gk?Math.min(100,ca+20):20},isInjured:false,injuryDaysRemaining:0,suspensionGamesRemaining:0,isCharacterPlayer:false,trait:undefined,seasonStats:{gamesPlayed:0,goals:0,assists:0,cornerGoals:0,penaltyGoals:0,yellowCards:0,redCards:0,suspensions:0,averageRating:0,minutesPlayed:0},careerStats:{totalGames:0,totalGoals:0,totalAssists:0,seasonsPlayed:0},careerMilestones:[]} as Player}
function sq(c:string,ca:number){const ps=[0,1,1,1,2,2,2,3,3,3,3,0,1,2,3,3].map(i=>[PlayerPosition.Goalkeeper,PlayerPosition.Defender,PlayerPosition.Half,PlayerPosition.Forward][i]);return ps.map(p=>mp(c,p,ca))}
const CAS=[85,78,68,65,63,62,60,55,52,50,48,45]
function rng(s:number){s=((s*1664525+1013904223)|0)>>>0;return s/0xffffffff}
function clusterCount(mins:number[]):number{const s=[...mins].sort((a,b)=>a-b);let cl=0,i=0;while(i<s.length){let j=i+1;while(j<s.length&&s[j]-s[i]<=5)j++;if(j-i>=2){cl++;i=j}else i++}return cl}

// Spelets faktiska taktik-dimensioner, spänd över omställning↔hörnberoende
const base={mentality:'balanced',tempo:'normal',press:'medium',width:'normal',attackingFocus:'mixed',cornerStrategy:'standard',passingRisk:'safe',penaltyKillStyle:'active'}
const profiles:{namn:string,t:any}[]=[
  {namn:'Omställning/öppet (max)', t:{...base,mentality:'offensive',tempo:'high',passingRisk:'direct',attackingFocus:'central',cornerStrategy:'safe',width:'narrow'}},
  {namn:'Offensiv',               t:{...base,mentality:'offensive',tempo:'high',attackingFocus:'central',cornerStrategy:'safe'}},
  {namn:'Balanserad',             t:{...base}},
  {namn:'Hörnlutande',            t:{...base,attackingFocus:'wings',cornerStrategy:'aggressive',width:'wide'}},
  {namn:'Hörnberoende (max)',     t:{...base,mentality:'defensive',tempo:'low',passingRisk:'safe',attackingFocus:'wings',cornerStrategy:'aggressive',width:'wide'}},
]

const N=600
const out:any[]=[]
for(const pf of profiles){
  let clTot=0,clN=0,goals=0,corner=0,open=0,pen=0
  for(let i=0;i<N;i++){
    const r1=rng(i*7919),r2=rng(i*6271+31);let hi=Math.floor(r1*12),aj=Math.floor(r2*12);if(aj===hi)aj=(aj+1)%12
    _pid=0;const hp=sq('home',CAS[hi]),ap=sq('away',CAS[aj])
    const hl:TeamSelection={startingPlayerIds:hp.slice(0,11).map(p=>p.id),benchPlayerIds:hp.slice(11,16).map(p=>p.id),tactic:pf.t}
    const al:TeamSelection={startingPlayerIds:ap.slice(0,11).map(p=>p.id),benchPlayerIds:ap.slice(11,16).map(p=>p.id),tactic:pf.t}
    const fx:Fixture={id:`f${i}`,homeClubId:'home',awayClubId:'away',season:1,matchday:i+1,roundNumber:i+1,status:FixtureStatus.Scheduled,date:'2025-01-01',homeScore:0,awayScore:0,events:[],attendance:500,isCup:false,isKnockout:false,isNeutralVenue:false} as any
    const f=simulateMatch({fixture:fx,homeLineup:hl,awayLineup:al,homePlayers:hp,awayPlayers:ap,homeAdvantage:0.14,seed:i*1337}).fixture
    const hm:number[]=[],am:number[]=[]
    for(const e of f.events){if(e.type!==MatchEventType.Goal)continue;goals++;if(e.isCornerGoal)corner++;else if(e.isPenaltyGoal)pen++;else open++;if(e.clubId==='home')hm.push(e.minute);else am.push(e.minute)}
    clTot+=clusterCount(hm)+clusterCount(am);clN+=2
  }
  const r={namn:pf.namn,cluster_freq:+(clTot/clN).toFixed(3),corner_goal_pct:+(corner/goals*100).toFixed(1),open_play_pct:+(open/goals*100).toFixed(1)}
  out.push(r)
  console.log(`${pf.namn.padEnd(24)} kluster ${r.cluster_freq.toFixed(2)} | hörnmål ${r.corner_goal_pct}% | öppet ${r.open_play_pct}%`)
}
const cf=out.map(o=>o.cluster_freq), cg=out.map(o=>o.corner_goal_pct)
console.log(`\nMotor-spann: kluster ${Math.min(...cf).toFixed(2)}–${Math.max(...cf).toFixed(2)} | hörnmål ${Math.min(...cg)}–${Math.max(...cg)}%`)
console.log(`Verkligt:    kluster 0,57–1,18 | hörnmål 19,3–23,6%`)
writeFileSync('docs/data/motor_stil_spann.json',JSON.stringify({_meta:{N,date:'2026-06-07',real:{cluster:[0.57,1.18],corner_pct:[19.3,23.6],open_pct:[71.4,75.9]}},profiles:out},null,2))
console.log('\n✓ docs/data/motor_stil_spann.json')
