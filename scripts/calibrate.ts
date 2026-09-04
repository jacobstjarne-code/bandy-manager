/**
 * Kalibreringsskript — kör matcher med varierad lagstyrka och jämför mot Bandygrytan-data.
 * Kör med: node_modules/.bin/vite-node scripts/calibrate.ts [--matches=10000]
 */

import { simulateMatch } from '../src/domain/services/matchEngine'
import { MATCH_TOTAL_GOAL_CAP } from '../src/domain/services/matchCore'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import type { Tactic } from '../src/domain/entities/Club'

// ── Targets från Bandygrytan 1124-matchs-dataset (detaljdata) ────────────────
const TARGETS = {
  goalsPerMatch:   { target: 9.12,  tolerance: 1.5  },
  cornerGoalShare: { target: 0.222, tolerance: 0.03 },
  homeWinRate:     { target: 0.502, tolerance: 0.05 },
  drawRate:        { target: 0.116, tolerance: 0.03 },
  secondHalfShare: { target: 0.542, tolerance: 0.03 },
}

// ── Realistic CA spread based on CLUB_TEMPLATES reputation ──────────────────
// Forsbacka 85, Västanfors 78, Karlsborg 68, Målilla 65, Gagnef 63,
// Lesjöfors 62, Hälleforsnäs 60, Söderfors 55, Skutskär 52,
// Rögle 50, Slottsbron 48, Heros 45
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

// ── Player factory ────────────────────────────────────────────────────────────
let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca = 55): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: `${id}`, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, seasonForm: 70,
    isFullTimePro: false,
    currentAbility: ca,
    potentialAbility: ca, developmentRate: 50, injuryProneness: 50, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20, cornerRecovery: ca,
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
    // bench
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
  formation: '532_tvatoppar' as const,
  width: 'normal' as const,
  attackingFocus: 'mixed' as const,
  cornerStrategy: 'standard' as const,
  passingRisk: 'safe' as const,
  penaltyKillStyle: 'active' as const,
} as unknown as Tactic

// ── Run simulations ───────────────────────────────────────────────────────────
const matchesArg = process.argv.find(arg => arg.startsWith('--matches='))
const N = matchesArg ? Number.parseInt(matchesArg.split('=')[1], 10) : 200
if (!Number.isFinite(N) || N <= 0) throw new Error('--matches måste vara ett positivt heltal')
let totalGoals = 0
let cornerGoals = 0
let homeWins = 0
let draws = 0
let secondHalfGoals = 0
const totalGoalHistogram = new Map<number, number>()
let goalPairs = 0
let extensions = 0
let equalizersWithNextGoal = 0
let equalizerExtensions = 0
let responses = 0
let quickResponses = 0
const responseByPostGoalLead = new Map<number, { responses: number; total: number }>()

for (let i = 0; i < N; i++) {
  const [homeCA, awayCA] = pickMatchupCA(i)
  const homeId = 'home'
  const awayId = 'away'
  _pid = 0 // reset player IDs per match
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
    id: `fix${i}`, leagueId: 'calibration',
    homeClubId: homeId, awayClubId: awayId,
    season: 1, matchday: i + 1, roundNumber: i + 1,
    status: FixtureStatus.Scheduled,
    date: '2025-01-01',
    homeScore: 0, awayScore: 0,
    events: [], attendance: 500,
    isCup: false, isKnockout: false, isNeutralVenue: false,
  }

  const result = simulateMatch({
    fixture, homeLineup, awayLineup,
    homePlayers, awayPlayers,
    homeAdvantage: 0.14, seed: i * 1337,
  })

  const f = result.fixture
  const gs = (f.homeScore ?? 0) + (f.awayScore ?? 0)
  totalGoals += gs
  totalGoalHistogram.set(gs, (totalGoalHistogram.get(gs) ?? 0) + 1)
  if ((f.homeScore ?? 0) > (f.awayScore ?? 0)) homeWins++
  if ((f.homeScore ?? 0) === (f.awayScore ?? 0)) draws++

  for (const ev of f.events) {
    if (ev.type === MatchEventType.Goal) {
      if (ev.minute >= 45) secondHalfGoals++
      if (ev.isCornerGoal) cornerGoals++
    }
  }

  // Momentum mäts på intilliggande mål, på samma sätt som ANALYS_MOMENTUM:
  // samma lag gör nästa mål = utökning; motståndaren = svar. Resultatet gör
  // c-m3 reproducerbar mot aktuell motor i stället för en gammal dataexport.
  const goals = f.events
    .filter(ev => ev.type === MatchEventType.Goal)
    .sort((a, b) => a.minute - b.minute)
  let homeGoals = 0
  let awayGoals = 0
  for (let goalIndex = 0; goalIndex < goals.length; goalIndex++) {
    const goal = goals[goalIndex]
    const scorerIsHome = goal.clubId === homeId
    const previousScorerDiff = scorerIsHome
      ? homeGoals - awayGoals
      : awayGoals - homeGoals
    if (scorerIsHome) homeGoals++
    else awayGoals++
    const postGoalScorerDiff = scorerIsHome
      ? homeGoals - awayGoals
      : awayGoals - homeGoals

    const nextGoal = goals[goalIndex + 1]
    if (!nextGoal) continue
    const sameTeamScoresNext = nextGoal.clubId === goal.clubId
    const bucket = responseByPostGoalLead.get(postGoalScorerDiff) ?? { responses: 0, total: 0 }
    bucket.total++
    goalPairs++
    if (sameTeamScoresNext) {
      extensions++
    } else {
      bucket.responses++
      responses++
      if (nextGoal.minute - goal.minute <= 5) quickResponses++
    }
    responseByPostGoalLead.set(postGoalScorerDiff, bucket)

    if (previousScorerDiff === -1 && postGoalScorerDiff === 0) {
      equalizersWithNextGoal++
      if (sameTeamScoresNext) equalizerExtensions++
    }
  }
}

const totalGoalCount = totalGoals
const goalsPerMatch  = totalGoalCount / N
const homeWinRate    = homeWins / N
const drawRate       = draws / N
const cornerShare    = totalGoalCount > 0 ? cornerGoals / totalGoalCount : 0
const shGoals        = secondHalfGoals
const shShare        = totalGoalCount > 0 ? shGoals / totalGoalCount : 0
const extensionRate  = goalPairs > 0 ? extensions / goalPairs : 0
const equalizerMomentumRate = equalizersWithNextGoal > 0
  ? equalizerExtensions / equalizersWithNextGoal
  : 0
const quickResponseRate = responses > 0 ? quickResponses / responses : 0

// ── Report ─────────────────────────────────────────────────────────────────
console.log(`\\n=== Kalibrering (${N} matcher, varierad lagstyrka) ===\\n`)

function check(name: string, value: number, t: { target: number; tolerance: number }) {
  const ok = Math.abs(value - t.target) <= t.tolerance
  const status = ok ? '✅' : '❌'
  const diff = (value - t.target).toFixed(3)
  console.log(`${status} ${name.padEnd(18)} ${value.toFixed(3)}  (mål ${t.target} ±${t.tolerance}, diff ${diff > '0' ? '+' : ''}${diff})`)
}

check('goalsPerMatch',   goalsPerMatch,  TARGETS.goalsPerMatch)
check('cornerGoalShare', cornerShare,    TARGETS.cornerGoalShare)
check('homeWinRate',     homeWinRate,    TARGETS.homeWinRate)
check('drawRate',        drawRate,       TARGETS.drawRate)
check('secondHalfShare', shShare,        TARGETS.secondHalfShare)

const capMatches = totalGoalHistogram.get(MATCH_TOTAL_GOAL_CAP) ?? 0
console.log(`\nMatcher på exakt ${MATCH_TOTAL_GOAL_CAP} mål: ${capMatches}/${N} (${(capMatches / N * 100).toFixed(2)}%)`)
console.log(`Högsta observerade målantal: ${Math.max(...totalGoalHistogram.keys())}`)
const tailFrom = Math.max(0, MATCH_TOTAL_GOAL_CAP - 5)
console.log(`Svans ${tailFrom}–${MATCH_TOTAL_GOAL_CAP}: ${Array.from({ length: MATCH_TOTAL_GOAL_CAP - tailFrom + 1 }, (_, index) => {
  const goals = tailFrom + index
  return `${goals}:${totalGoalHistogram.get(goals) ?? 0}`
}).join(' · ')}`)

console.log(`\nMomentum (${goalPairs} intilliggande målpar):`)
console.log(`Utökningsgrad: ${(extensionRate * 100).toFixed(1)}% (verkligt herrmål 55,0%, mål 52–58%)`)
console.log(`Kvitteraren gör nästa mål: ${(equalizerMomentumRate * 100).toFixed(1)}% (verkligt herrmål 51,0%)`)
console.log(`Snabbt svar ≤5 min: ${(quickResponseRate * 100).toFixed(1)}% (verkligt herrmål 43,2%)`)
console.log(`Svar efter målskyttens ledning: ${[...responseByPostGoalLead.entries()]
  .filter(([, value]) => value.total >= Math.max(20, N / 100))
  .sort(([a], [b]) => a - b)
  .map(([lead, value]) => `${lead >= 0 ? '+' : ''}${lead}:${(value.responses / value.total * 100).toFixed(1)}% (n=${value.total})`)
  .join(' · ')}`)

console.log()
