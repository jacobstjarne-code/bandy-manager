/**
 * measure_structure.ts — Motor-kalibrering Fas 1 (MÄTNING, ej tuning)
 *
 * Kör motorn i skala och mäter de fem strukturmåtten mot verklig data.
 * Tunar INGENTING. Output: docs/data/motor_kalibrering_scorecard.json
 *
 * Kör: node_modules/.bin/vite-node scripts/measure_structure.ts
 */
import { simulateMatch } from '../src/domain/services/matchEngine'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import { writeFileSync } from 'fs'

let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca: number): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: id, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, seasonForm: 70, isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: { skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca,
      shooting: ca, dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca,
      defending: ca, cornerSkill: ca, goalkeeping: isGK ? Math.min(100, ca + 20) : 20, cornerRecovery: ca },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  }
}
function makeSquad(clubId: string, ca = 55): Player[] {
  const pos = [PlayerPosition.Goalkeeper, PlayerPosition.Defender, PlayerPosition.Defender,
    PlayerPosition.Defender, PlayerPosition.Half, PlayerPosition.Half, PlayerPosition.Half,
    PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward, PlayerPosition.Forward,
    PlayerPosition.Goalkeeper, PlayerPosition.Defender, PlayerPosition.Half, PlayerPosition.Forward, PlayerPosition.Forward]
  return pos.map(p => makePlayer(clubId, p, ca))
}
const T = (o: any) => ({ mentality:'balanced', tempo:'normal', formation:'532_tvatoppar', width:'normal',
  attackingFocus:'mixed', cornerStrategy:'standard', passingRisk:'safe', penaltyKillStyle:'active', ...o })

// CA-spridning matchande CLUB_TEMPLATES
const CLUB_CAS = [85,78,68,65,63,62,60,55,52,50,48,45]
function rng(s:number){ s=((s*1664525+1013904223)|0)>>>0; return s/0xffffffff }

// ── Cluster helper (≥2 goals by same club within 5 min) ─────────────────────
function clusterCount(goalMins: number[]): number {
  const s = [...goalMins].sort((a,b)=>a-b); let cl=0,i=0
  while(i<s.length){ let j=i+1; while(j<s.length && s[j]-s[i]<=5) j++
    if(j-i>=2){ cl++; i=j } else i++ }
  return cl
}

const N = 1000
let totalGoals=0, cornerGoals=0
let aggHW=0, aggDR=0, aggAW=0
let clusterTot=0, clusterMatchN=0
// post-paus window: comeback by 2H first-reduction window
let cbElig=0, cb=0, win5155N=0, win5155cb=0
// home/away by strength tier
const tierRec: Record<string,{hw:number,hn:number,aw:number,an:number}> = {strong:{hw:0,hn:0,aw:0,an:0}, mid:{hw:0,hn:0,aw:0,an:0}}
// goal minute distribution
const minBuckets: Record<number,number> = {}

for(let i=0;i<N;i++){
  const r1=rng(i*7919), r2=rng(i*6271+31)
  let hi=Math.floor(r1*CLUB_CAS.length), aj=Math.floor(r2*CLUB_CAS.length)
  if(aj===hi) aj=(aj+1)%CLUB_CAS.length
  const homeCA=CLUB_CAS[hi], awayCA=CLUB_CAS[aj]
  _pid=0
  const hp=makeSquad('home',homeCA), ap=makeSquad('away',awayCA)
  const hl:TeamSelection={startingPlayerIds:hp.slice(0,11).map(p=>p.id),benchPlayerIds:hp.slice(11,16).map(p=>p.id),tactic:T({}) as any}
  const al:TeamSelection={startingPlayerIds:ap.slice(0,11).map(p=>p.id),benchPlayerIds:ap.slice(11,16).map(p=>p.id),tactic:T({}) as any}
  const fixture:Fixture={id:`f${i}`,homeClubId:'home',awayClubId:'away',season:1,matchday:i+1,roundNumber:i+1,
    status:FixtureStatus.Scheduled,date:'2025-01-01',homeScore:0,awayScore:0,events:[],attendance:500,
    isCup:false,isKnockout:false,isNeutralVenue:false} as any
  const res=simulateMatch({fixture,homeLineup:hl,awayLineup:al,homePlayers:hp,awayPlayers:ap,homeAdvantage:0.14,seed:i*1337})
  const f=res.fixture
  const hs=f.homeScore??0, as_=f.awayScore??0
  totalGoals+=hs+as_
  if(hs>as_) aggHW++; else if(hs===as_) aggDR++; else aggAW++

  // goal events per club + minutes
  const homeMins:number[]=[], awayMins:number[]=[]
  let htHome=0, htAway=0
  for(const ev of f.events){
    if(ev.type!==MatchEventType.Goal) continue
    if(ev.isCornerGoal) cornerGoals++
    const b=Math.floor(ev.minute/10)*10; minBuckets[b]=(minBuckets[b]||0)+1
    if(ev.clubId==='home'){ homeMins.push(ev.minute); if(ev.minute<45) htHome++ }
    else { awayMins.push(ev.minute); if(ev.minute<45) htAway++ }
  }
  clusterTot+=clusterCount(homeMins)+clusterCount(awayMins); clusterMatchN+=2

  // post-paus comeback: trailing at HT (minute<45 split) wins
  if(htHome!==htAway){
    cbElig++
    const trail = htHome>htAway ? 'away':'home'
    const won = trail==='away' ? as_>hs : hs>as_
    if(won) cb++
    // first 2H reduction by trailing team in window 51-55
    const trailMins=(trail==='home'?homeMins:awayMins).filter(m=>m>=45).sort((a,b)=>a-b)
    if(trailMins.length){ const fr=trailMins[0]; if(fr>=51&&fr<=55){ win5155N++; if(won) win5155cb++ } }
  }

  // home/away by tier (strong = top4 CA, mid = rest)
  const hTier = homeCA>=65?'strong':'mid', aTier=awayCA>=65?'strong':'mid'
  tierRec[hTier].hn++; if(hs>as_) tierRec[hTier].hw++
  tierRec[aTier].an++; if(as_>hs) tierRec[aTier].aw++
}

const goalsPM=totalGoals/N
const cornerShare=cornerGoals/totalGoals
const clusterFreq=clusterTot/clusterMatchN
const cbRate=cb/cbElig
const win5155=win5155N>0?win5155cb/win5155N:0
const strongGap=(tierRec.strong.hw/tierRec.strong.hn - tierRec.strong.aw/tierRec.strong.an)*100
const midGap=(tierRec.mid.hw/tierRec.mid.hn - tierRec.mid.aw/tierRec.mid.an)*100

const scorecard = {
  _meta:{description:'Motor-kalibrering Fas 1 scorecard — mätning, ej tuning',N,date:'2026-06-05',
    note:'Sim-minut: 2H=minut 45-90. Fönster 51-55 = 6-10 min in i 2H, jämförbart med Finding 051.'},
  metrics:[
    {namn:'Målklustring (kluster/lag-match)', prioritet:1, verkligt:'0,80 (liga) — 0,61–1,27 per stil', motor:clusterFreq.toFixed(3),
     gap:`motor ${clusterFreq.toFixed(2)} vs liga 0,80`},
    {namn:'Post-paus comeback (basfrekvens)', prioritet:2, verkligt:'13,3%', motor:(cbRate*100).toFixed(1)+'%', gap:((cbRate*100)-13.3).toFixed(1)+'pp'},
    {namn:'Post-paus fönster 51-55', prioritet:2, verkligt:'27%', motor:(win5155*100).toFixed(1)+'%', gap:((win5155*100)-27).toFixed(1)+'pp', n:win5155N},
    {namn:'Hörnmålsandel', prioritet:3, verkligt:'21,9%', motor:(cornerShare*100).toFixed(1)+'%', gap:((cornerShare*100)-21.9).toFixed(1)+'pp'},
    {namn:'Lagspecifik hemmafördel (gap)', prioritet:4, verkligt:'Villa +0,2 / Sirius/snittlag varierar; liga +12,5pp',
     motor:`stark ${strongGap.toFixed(1)}pp / mitt ${midGap.toFixed(1)}pp`, gap:'se not'},
    {namn:'Mål/match (marginal-kontroll)', prioritet:0, verkligt:'9,08', motor:goalsPM.toFixed(2), gap:(goalsPM-9.08).toFixed(2)},
  ],
  goal_minute_buckets: minBuckets,
  raw:{goalsPM,cornerShare,clusterFreq,cbRate,win5155,win5155N,strongGap,midGap,tierRec},
}
writeFileSync('docs/data/motor_kalibrering_scorecard.json', JSON.stringify(scorecard,null,2))

console.log(`\n=== MOTOR FAS 1 SCORECARD (${N} matcher) ===\n`)
console.log(`Mål/match:              motor ${goalsPM.toFixed(2)}  | verkligt 9,08   (marginal-kontroll)`)
console.log(`Hemvinst/oavgj/borta:   motor ${(aggHW/N*100).toFixed(1)}% / ${(aggDR/N*100).toFixed(1)}% / ${(aggAW/N*100).toFixed(1)}% | verkligt 50,9 / 10,7 / 38,4`)
console.log(`Hörnmålsandel:          motor ${(cornerShare*100).toFixed(1)}% | verkligt 21,9%`)
console.log(`\n── STRUKTUR ──`)
console.log(`Målklustring/lag-match: motor ${clusterFreq.toFixed(3)} | verkligt 0,80 (liga), 0,61–1,27 per stil   [PRIO 1]`)
console.log(`Post-paus comeback:     motor ${(cbRate*100).toFixed(1)}% | verkligt 13,3%   [PRIO 2]`)
console.log(`  fönster 51-55:        motor ${(win5155*100).toFixed(1)}% (n=${win5155N}) | verkligt 27%`)
console.log(`Hemmafördel-gap:        motor stark ${strongGap.toFixed(1)}pp / mitt ${midGap.toFixed(1)}pp | verkligt liga +12,5pp   [PRIO 4]`)
console.log(`\nMålminut-buckets:`, Object.entries(minBuckets).sort((a,b)=>+a[0]-+b[0]).map(([k,v])=>`${k}:${v}`).join(' '))
console.log(`\n✓ docs/data/motor_kalibrering_scorecard.json`)
