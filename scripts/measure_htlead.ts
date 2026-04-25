/**
 * Sprint 25-HT — halvtidsledning-analys
 * Mäter htLeadWinPct och relaterade statistik.
 * Kör med: node_modules/.bin/vite-node scripts/measure_htlead.ts
 */

import { simulateFirstHalf, simulateSecondHalf } from '../src/domain/services/matchCore'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'

// ── Player/squad factory (same as calibrate.ts) ──────────────────────────────

const CLUB_CAS = [85, 78, 68, 65, 63, 62, 60, 55, 52, 50, 48, 45]

function pickMatchupCA(seed: number): [number, number] {
  const rng = (s: number) => { s = ((s * 1664525 + 1013904223) | 0) >>> 0; return s / 0xffffffff }
  const r1 = rng(seed * 7919)
  const r2 = rng(seed * 6271 + 31)
  let i = Math.floor(r1 * CLUB_CAS.length)
  let j = Math.floor(r2 * CLUB_CAS.length)
  if (j === i) j = (j + 1) % CLUB_CAS.length
  return [CLUB_CAS[i], CLUB_CAS[j]]
}

let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca = 55): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: `${id}`, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75,
    isFullTimePro: false,
    currentAbility: ca,
    potentialAbility: ca,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20,
    },
    isInjured: false, injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  }
}

function makeSquad(clubId: string, ca = 55): Player[] {
  return [
    makePlayer(clubId, PlayerPosition.Goalkeeper, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Goalkeeper, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
    makePlayer(clubId, PlayerPosition.Forward, ca),
  ]
}

const defaultTactic = {
  mentality: 'balanced' as const,
  tempo: 'normal' as const,
  press: 'medium' as const,
  width: 'normal' as const,
  attackingFocus: 'mixed' as const,
  cornerStrategy: 'standard' as const,
  passingRisk: 'safe' as const,
  penaltyKillStyle: 'active' as const,
}

// ── Counters ──────────────────────────────────────────────────────────────────

// Overall htLead tracking
let totalMatches = 0
let htLeadMatches = 0          // matches where either team leads at HT
let htLeaderWins  = 0          // htLeader wins full match
let htLeaderDraws = 0          // htLeader draws
let htLeaderLoses = 0          // htLeader loses

// By who leads at HT
let homeLeadsHT = 0, homeLeadWins = 0, homeLeadDraws = 0, homeLeadLoses = 0
let awayLeadsHT = 0, awayLeadWins = 0, awayLeadDraws = 0, awayLeadLoses = 0

// By margin at HT
let lead1HT = 0, lead1Wins = 0, lead1Draws = 0, lead1Loses = 0
let lead2plusHT = 0, lead2plusWins = 0, lead2plusDraws = 0, lead2plusLoses = 0

// Second half goals for leading/trailing teams (when HT score != 0-0)
let sh2GoalsLeader  = 0
let sh2GoalsTrailer = 0
let sh2Matches      = 0  // matches with HT lead (data source for above)

// 2H goal timing per 15-min bucket [45-60, 60-75, 75-90] for leader vs trailer
const leaderGoalsByPeriod  = [0, 0, 0]
const trailerGoalsByPeriod = [0, 0, 0]

// Shots in 2H for leader vs trailer (as proxy for attack frequency)
let sh2ShotsLeader  = 0
let sh2ShotsTrailer = 0

// ── Run simulations ───────────────────────────────────────────────────────────

const SEEDS = 10
const MATCHES_PER_SEED = 200
const TOTAL = SEEDS * MATCHES_PER_SEED

for (let seed = 0; seed < SEEDS; seed++) {
  for (let m = 0; m < MATCHES_PER_SEED; m++) {
    const matchIdx = seed * MATCHES_PER_SEED + m
    const [homeCA, awayCA] = pickMatchupCA(matchIdx)
    const homeId = `h${matchIdx}`
    const awayId = `a${matchIdx}`
    _pid = 0
    const homePlayers = makeSquad(homeId, homeCA)
    const awayPlayers = makeSquad(awayId, awayCA)
    const homeLineup: TeamSelection = {
      startingPlayerIds: homePlayers.slice(0, 11).map(p => p.id),
      benchPlayerIds: homePlayers.slice(11, 16).map(p => p.id),
      tactic: defaultTactic,
    }
    const awayLineup: TeamSelection = {
      startingPlayerIds: awayPlayers.slice(0, 11).map(p => p.id),
      benchPlayerIds: awayPlayers.slice(11, 16).map(p => p.id),
      tactic: defaultTactic,
    }

    const fixture: Fixture = {
      id: `fix${matchIdx}`,
      homeClubId: homeId, awayClubId: awayId,
      season: 1, matchday: m + 1, roundNumber: m + 1,
      status: FixtureStatus.Scheduled,
      date: '2025-01-01',
      homeScore: 0, awayScore: 0,
      events: [], attendance: 500,
      isCup: false, isKnockout: false, isNeutralVenue: false,
    }

    const matchSeed = seed * 1337 + m * 97

    const coreInput = {
      fixture,
      homeLineup, awayLineup,
      homePlayers, awayPlayers,
      homeAdvantage: 0.14,
      seed: matchSeed,
      mode: 'fast' as const,
    }

    // ── First half ────────────────────────────────────────────────────────────
    let lastFH = { homeScore: 0, awayScore: 0, shotsHome: 0, shotsAway: 0, cornersHome: 0, cornersAway: 0, activeSuspensions: { homeCount: 0, awayCount: 0 } }
    for (const step of simulateFirstHalf(coreInput)) {
      lastFH = step as typeof lastFH
    }
    const htHome = lastFH.homeScore
    const htAway = lastFH.awayScore

    // ── Second half ───────────────────────────────────────────────────────────
    const secondHalfInput = {
      ...coreInput,
      initialHomeScore: htHome,
      initialAwayScore: htAway,
      initialShotsHome: lastFH.shotsHome,
      initialShotsAway: lastFH.shotsAway,
      initialCornersHome: lastFH.cornersHome,
      initialCornersAway: lastFH.cornersAway,
      initialHomeSuspensions: lastFH.activeSuspensions.homeCount,
      initialAwaySuspensions: lastFH.activeSuspensions.awayCount,
    }

    let lastSH = { homeScore: htHome, awayScore: htAway, shotsHome: lastFH.shotsHome, shotsAway: lastFH.shotsAway }
    const sh2Events: Array<{ type: MatchEventType; clubId: string; minute: number }> = []
    for (const step of simulateSecondHalf(secondHalfInput)) {
      lastSH = step as typeof lastSH
      for (const ev of step.events) {
        if (ev.type === MatchEventType.Goal) {
          sh2Events.push({ type: ev.type, clubId: ev.clubId, minute: ev.minute })
        }
      }
    }

    const finalHome = lastSH.homeScore
    const finalAway = lastSH.awayScore

    totalMatches++

    // ── Classify ──────────────────────────────────────────────────────────────
    const htDiff = htHome - htAway
    const htLeading = htDiff > 0 ? 'home' : htDiff < 0 ? 'away' : 'draw'

    if (htLeading === 'draw') continue  // skip tied-at-HT matches

    htLeadMatches++
    const htMargin = Math.abs(htDiff)

    // Who is the "leader"
    const leaderIsHome = htLeading === 'home'
    const leaderFinalScore = leaderIsHome ? finalHome : finalAway
    const trailerFinalScore = leaderIsHome ? finalAway : finalHome
    const leaderHtScore = leaderIsHome ? htHome : htAway
    const trailerHtScore = leaderIsHome ? htAway : htHome

    const leaderClubId = leaderIsHome ? homeId : awayId
    const trailerClubId = leaderIsHome ? awayId : homeId

    // Leader outcome
    if (leaderFinalScore > trailerFinalScore) {
      htLeaderWins++
    } else if (leaderFinalScore === trailerFinalScore) {
      htLeaderDraws++
    } else {
      htLeaderLoses++
    }

    // By who leads
    if (leaderIsHome) {
      homeLeadsHT++
      if (finalHome > finalAway) homeLeadWins++
      else if (finalHome === finalAway) homeLeadDraws++
      else homeLeadLoses++
    } else {
      awayLeadsHT++
      if (finalAway > finalHome) awayLeadWins++
      else if (finalAway === finalHome) awayLeadDraws++
      else awayLeadLoses++
    }

    // By margin
    if (htMargin === 1) {
      lead1HT++
      if (leaderFinalScore > trailerFinalScore) lead1Wins++
      else if (leaderFinalScore === trailerFinalScore) lead1Draws++
      else lead1Loses++
    } else {
      lead2plusHT++
      if (leaderFinalScore > trailerFinalScore) lead2plusWins++
      else if (leaderFinalScore === trailerFinalScore) lead2plusDraws++
      else lead2plusLoses++
    }

    // ── 2H goal analysis ──────────────────────────────────────────────────────
    sh2Matches++

    // Track shots per team in 2H
    const sh2Home = lastSH.shotsHome - lastFH.shotsHome
    const sh2Away = lastSH.shotsAway - lastFH.shotsAway
    if (leaderIsHome) {
      sh2ShotsLeader  += sh2Home
      sh2ShotsTrailer += sh2Away
    } else {
      sh2ShotsLeader  += sh2Away
      sh2ShotsTrailer += sh2Home
    }

    // Track goals per team in 2H and by time period
    let leaderGoalsIn2H  = 0
    let trailerGoalsIn2H = 0

    for (const ev of sh2Events) {
      const minute = ev.minute
      const isLeaderGoal = ev.clubId === leaderClubId
      if (isLeaderGoal) leaderGoalsIn2H++
      else trailerGoalsIn2H++

      // Time bucket: 45-60, 60-75, 75-90
      const bucket = minute < 60 ? 0 : minute < 75 ? 1 : 2
      if (isLeaderGoal) leaderGoalsByPeriod[bucket]++
      else trailerGoalsByPeriod[bucket]++
    }

    sh2GoalsLeader  += leaderGoalsIn2H
    sh2GoalsTrailer += trailerGoalsIn2H

    void leaderHtScore
    void trailerHtScore
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

const tied = totalMatches - htLeadMatches
console.log(`\n=== Sprint 25-HT — Halvtidsledning-analys (${totalMatches} matcher) ===\n`)

console.log(`Halvtidsläge:`)
console.log(`  Leder vid HT: ${htLeadMatches} (${pct(htLeadMatches, totalMatches)})`)
console.log(`  Lika vid HT:  ${tied} (${pct(tied, totalMatches)})`)

console.log(`\nHuvudmått:`)
console.log(`  htLeadWinPct:  ${pct(htLeaderWins, htLeadMatches)}   ← mål 60-70%`)
console.log(`  htLeadDrawPct: ${pct(htLeaderDraws, htLeadMatches)}`)
console.log(`  htLeadLosePct: ${pct(htLeaderLoses, htLeadMatches)}`)

console.log(`\nUppdela på vem leder vid HT:`)
console.log(`  Hemmalag leder vid HT: n=${homeLeadsHT}`)
console.log(`    Hemmalag vinner: ${pct(homeLeadWins, homeLeadsHT)}`)
console.log(`    Oavgjort:        ${pct(homeLeadDraws, homeLeadsHT)}`)
console.log(`    Hemmalag förlorar: ${pct(homeLeadLoses, homeLeadsHT)}`)
console.log(`  Bortalag leder vid HT: n=${awayLeadsHT}`)
console.log(`    Bortalag vinner: ${pct(awayLeadWins, awayLeadsHT)}`)
console.log(`    Oavgjort:        ${pct(awayLeadDraws, awayLeadsHT)}`)
console.log(`    Bortalag förlorar: ${pct(awayLeadLoses, awayLeadsHT)}`)

console.log(`\nUppdela på ledningens storlek vid HT:`)
console.log(`  1 måls ledning (n=${lead1HT}):`)
console.log(`    Vinner: ${pct(lead1Wins, lead1HT)}  Oavgjort: ${pct(lead1Draws, lead1HT)}  Förlorar: ${pct(lead1Loses, lead1HT)}`)
console.log(`  2+ måls ledning (n=${lead2plusHT}):`)
console.log(`    Vinner: ${pct(lead2plusWins, lead2plusHT)}  Oavgjort: ${pct(lead2plusDraws, lead2plusHT)}  Förlorar: ${pct(lead2plusLoses, lead2plusHT)}`)

console.log(`\n2H mål (n=${sh2Matches} matcher med ledning vid HT):`)
console.log(`  Mål/match för ledande lag i 2H: ${(sh2GoalsLeader / sh2Matches).toFixed(2)}`)
console.log(`  Mål/match för jagande lag i 2H: ${(sh2GoalsTrailer / sh2Matches).toFixed(2)}`)
console.log(`  Ratio jag/led: ${(sh2GoalsTrailer / Math.max(1, sh2GoalsLeader)).toFixed(2)}x`)

console.log(`\n2H skott (proxy för attack-frekvens):`)
console.log(`  Skott/match ledande lag: ${(sh2ShotsLeader / sh2Matches).toFixed(2)}`)
console.log(`  Skott/match jagande lag: ${(sh2ShotsTrailer / sh2Matches).toFixed(2)}`)
console.log(`  Ratio jag/led: ${(sh2ShotsTrailer / Math.max(1, sh2ShotsLeader)).toFixed(2)}x`)

const totalLeaderGoals  = leaderGoalsByPeriod.reduce((a, b) => a + b, 0)
const totalTrailerGoals = trailerGoalsByPeriod.reduce((a, b) => a + b, 0)
console.log(`\nMål per 15-minuters-period i 2H (absoluta tal):`)
console.log(`  Period      Ledare    Jagare    Ratio jag/led`)
const periodLabels = ['45–60 min', '60–75 min', '75–90 min']
for (let i = 0; i < 3; i++) {
  const l = leaderGoalsByPeriod[i]
  const t = trailerGoalsByPeriod[i]
  const ratio = t / Math.max(1, l)
  console.log(`  ${periodLabels[i]}  ${String(l).padStart(7)}   ${String(t).padStart(6)}    ${ratio.toFixed(2)}x`)
}
console.log(`  TOTALT      ${String(totalLeaderGoals).padStart(7)}   ${String(totalTrailerGoals).padStart(6)}    ${(totalTrailerGoals / Math.max(1, totalLeaderGoals)).toFixed(2)}x`)

console.log(`\nKonversionseffektivitet i 2H (mål per skott):`)
const leaderConv  = sh2GoalsLeader  / Math.max(1, sh2ShotsLeader)
const trailerConv = sh2GoalsTrailer / Math.max(1, sh2ShotsTrailer)
console.log(`  Ledande lag:  ${(leaderConv * 100).toFixed(1)}%`)
console.log(`  Jagande lag:  ${(trailerConv * 100).toFixed(1)}%`)

function pct(n: number, d: number): string {
  if (d === 0) return '—'
  return `${(n / d * 100).toFixed(1)}%`
}

// This is already the end of the file
