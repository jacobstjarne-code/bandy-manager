/**
 * measure-penalty-goalpct.ts — BETATEST_ERIK B2 (2026-09-24).
 *
 * Samma matchkonstruktion som scripts/calibrate.ts (redan verifierad mot
 * Bandygrytan-targets), men läser fixture.events direkt (inte den
 * persisterade report.penaltiesHome/Away — se docs/BETATEST_B2_
 * STRAFFPROCENT_2026-09-24.md: det fältet räknar TILLDELADE straffar,
 * dvs MatchEventType.Penalty-events, inte gjorda straffMÅL. isPenaltyGoal
 * på Goal-events är den enda korrekta källan för penaltyGoalPct).
 */
import { simulateMatch } from '../src/domain/services/matchEngine'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import type { Tactic } from '../src/domain/entities/Club'

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
  } as unknown as Player
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
  mentality: 'balanced' as const, tempo: 'normal' as const, formation: '532_tvatoppar' as const,
  width: 'normal' as const, attackingFocus: 'mixed' as const, cornerStrategy: 'standard' as const,
  passingRisk: 'safe' as const, penaltyKillStyle: 'active' as const,
} as unknown as Tactic

const N = Number(process.argv[2] ?? 2000)
let totalGoals = 0
let penaltyGoals = 0
let totalPenaltyEvents = 0  // MatchEventType.Penalty — tilldelade, för jämförelse

for (let i = 0; i < N; i++) {
  const [homeCA, awayCA] = pickMatchupCA(i)
  _pid = 0
  const homePlayers = makeSquad('home', homeCA)
  const awayPlayers = makeSquad('away', awayCA)
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
    homeClubId: 'home', awayClubId: 'away',
    season: 1, matchday: i + 1, roundNumber: i + 1,
    status: FixtureStatus.Scheduled, date: '2025-01-01',
    homeScore: 0, awayScore: 0, events: [], attendance: 500,
    isCup: false, isKnockout: false, isNeutralVenue: false,
  }
  const result = simulateMatch({
    fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
    homeAdvantage: 0.14, seed: i * 1337,
  })
  const f = result.fixture
  const gs = (f.homeScore ?? 0) + (f.awayScore ?? 0)
  totalGoals += gs
  penaltyGoals += f.events.filter(e => e.isPenaltyGoal).length
  totalPenaltyEvents += f.events.filter(e => e.type === MatchEventType.Penalty).length
}

console.log(`\n=== B2 — penaltyGoalPct, korrekt källa (isPenaltyGoal), N=${N} matcher ===\n`)
console.log(`Totalt mål: ${totalGoals}`)
console.log(`Straffmål (isPenaltyGoal): ${penaltyGoals}`)
console.log(`penaltyGoalPct: ${(penaltyGoals / totalGoals * 100).toFixed(2)}%  (mål: 5.4%)`)
console.log(`Tilldelade straffar (MatchEventType.Penalty, = report.penaltiesHome/Away): ${totalPenaltyEvents}`)
console.log(`Straffar per mål: ${(totalPenaltyEvents / totalGoals * 100).toFixed(2)}% (detta är INTE samma tal som penaltyGoalPct — förklarar aggregatmätningens 10.13%-felfynd)`)
console.log(`Konvertering (straffmål / tilldelade straffar): ${(penaltyGoals / totalPenaltyEvents * 100).toFixed(1)}%  (mål: 70.0%)`)
console.log('')
