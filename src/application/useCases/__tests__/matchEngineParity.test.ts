/**
 * matchEngineParity.test.ts — B10 Ticket 1
 *
 * Verifies two things:
 * 1. simulateMatch (quicksim-engine) and simulateFirstHalf+simulateSecondHalf (live-engine)
 *    produce statistically equivalent distributions over N=1000 matches each.
 *    Tolerance: ±10% of the quicksim mean for goals, ±15% for corners.
 *
 * 2. When managedClubPendingLineup exists in game state, simulateRound uses it
 *    instead of generateAiLineup for the managed club.
 *
 * Snitt-tabell för båda vägarna skrivs till console.log (visas i PR-beskrivning).
 */

import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../../../domain/services/matchSimulator'
import { simulateFirstHalf, simulateSecondHalf } from '../../../domain/services/matchCore'
import { simulateRound } from '../processors/matchSimProcessor'
import type { Player } from '../../../domain/entities/Player'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
  ClubStyle,
} from '../../../domain/enums'
import type { Tactic } from '../../../domain/entities/Club'
import { mulberry32 } from '../../../domain/utils/random'

// ── helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '5-3-2',
}

function makePlayer(id: string, position: PlayerPosition, clubId: string, ca = 65): Player {
  const attrs = ca
  return {
    id,
    firstName: 'Test',
    lastName: 'Spelare',
    age: 25,
    nationality: 'SE',
    clubId,
    isHomegrown: true,
    position,
    archetype: position === PlayerPosition.Goalkeeper
      ? PlayerArchetype.ReflexGoalkeeper
      : PlayerArchetype.TwoWaySkater,
    salary: 10000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 75,
    form: 75,
    fitness: 75,
    sharpness: 75,
    currentAbility: ca,
    potentialAbility: ca + 10,
    developmentRate: 50,
    injuryProneness: 30,
    discipline: 70,
    attributes: {
      skating: attrs, acceleration: attrs, stamina: attrs, ballControl: attrs,
      passing: attrs, shooting: attrs, dribbling: attrs, vision: attrs,
      decisions: attrs, workRate: attrs, positioning: attrs, defending: attrs,
      cornerSkill: attrs,
      goalkeeping: position === PlayerPosition.Goalkeeper ? attrs + 15 : Math.max(1, attrs - 15),
      cornerRecovery: 50,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeSquad(prefix: string, clubId: string, ca = 65): Player[] {
  return [
    makePlayer(`${prefix}_gk`, PlayerPosition.Goalkeeper, clubId, ca),
    makePlayer(`${prefix}_d1`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_d2`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_d3`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_h1`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_h2`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_h3`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_m1`, PlayerPosition.Midfielder, clubId, ca),
    makePlayer(`${prefix}_m2`, PlayerPosition.Midfielder, clubId, ca),
    makePlayer(`${prefix}_f1`, PlayerPosition.Forward, clubId, ca),
    makePlayer(`${prefix}_f2`, PlayerPosition.Forward, clubId, ca),
  ]
}

function makeSelection(players: Player[]): TeamSelection {
  return {
    startingPlayerIds: players.map(p => p.id),
    benchPlayerIds: [],
    tactic: DEFAULT_TACTIC,
  }
}

function makeFixture(id = 'fixture_parity', overrides: Partial<Fixture> = {}): Fixture {
  return {
    id,
    leagueId: 'league_1',
    season: 2026,
    roundNumber: 5,
    matchday: 5,
    homeClubId: 'club1',
    awayClubId: 'club2',
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  }
}

/**
 * Run the live-engine path (simulateFirstHalf + simulateSecondHalf) in fast mode
 * without any interactive halftime adjustments — pure motor comparison.
 */
function runLiveEngine(
  fixture: Fixture,
  homeLineup: TeamSelection,
  awayLineup: TeamSelection,
  homePlayers: Player[],
  awayPlayers: Player[],
  seed: number,
): { homeScore: number; awayScore: number; cornersHome: number; cornersAway: number } {
  const input = {
    fixture,
    homeLineup,
    awayLineup,
    homePlayers,
    awayPlayers,
    homeAdvantage: 0,
    seed,
    mode: 'fast' as const,
  }

  let lastFirstHalfStep = null as ReturnType<typeof simulateFirstHalf> extends Generator<infer S> ? S | null : never
  for (const step of simulateFirstHalf(input)) {
    lastFirstHalfStep = step
  }

  const fhs = lastFirstHalfStep
  const secondHalfInput = {
    ...input,
    initialHomeScore: fhs?.homeScore ?? 0,
    initialAwayScore: fhs?.awayScore ?? 0,
    initialShotsHome: fhs?.shotsHome ?? 0,
    initialShotsAway: fhs?.shotsAway ?? 0,
    initialOnTargetHome: fhs?.onTargetHome ?? 0,
    initialOnTargetAway: fhs?.onTargetAway ?? 0,
    initialCornersHome: fhs?.cornersHome ?? 0,
    initialCornersAway: fhs?.cornersAway ?? 0,
    initialHomeSuspensions: fhs?.activeSuspensions?.homeCount ?? 0,
    initialAwaySuspensions: fhs?.activeSuspensions?.awayCount ?? 0,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastStep = null as any
  for (const step of simulateSecondHalf(secondHalfInput)) {
    lastStep = step
  }

  const final = lastStep ?? lastFirstHalfStep
  return {
    homeScore: final?.homeScore ?? 0,
    awayScore: final?.awayScore ?? 0,
    cornersHome: final?.cornersHome ?? 0,
    cornersAway: final?.cornersAway ?? 0,
  }
}

function avg(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function pct(a: number, b: number): string {
  if (b === 0) return 'N/A'
  return (Math.abs(a - b) / b * 100).toFixed(1) + '%'
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('matchEngineParity (B10 T1)', () => {

  it('quicksim och live-engine ger statistiskt likvärdig fördelning (N=1000)', () => {
    const N = 1000
    const homePlayers = makeSquad('h', 'club1', 65)
    const awayPlayers = makeSquad('a', 'club2', 65)
    const homeLineup = makeSelection(homePlayers)
    const awayLineup = makeSelection(awayPlayers)
    const fixture = makeFixture()

    const qsHome: number[] = [], qsAway: number[] = []
    const qsCorH: number[] = [], qsCorA: number[] = []
    const qsWins: number[] = []

    const lvHome: number[] = [], lvAway: number[] = []
    const lvCorH: number[] = [], lvCorA: number[] = []
    const lvWins: number[] = []

    for (let i = 0; i < N; i++) {
      const seed = i * 31 + 42

      const qs = simulateMatch({ fixture, homeLineup, awayLineup, homePlayers, awayPlayers, seed, homeAdvantage: 0 })
      qsHome.push(qs.fixture.homeScore)
      qsAway.push(qs.fixture.awayScore)
      qsCorH.push(qs.fixture.report?.cornersHome ?? 0)
      qsCorA.push(qs.fixture.report?.cornersAway ?? 0)
      qsWins.push(qs.fixture.homeScore > qs.fixture.awayScore ? 1 : 0)

      const lv = runLiveEngine(fixture, homeLineup, awayLineup, homePlayers, awayPlayers, seed)
      lvHome.push(lv.homeScore)
      lvAway.push(lv.awayScore)
      lvCorH.push(lv.cornersHome)
      lvCorA.push(lv.cornersAway)
      lvWins.push(lv.homeScore > lv.awayScore ? 1 : 0)
    }

    const qAvgH = avg(qsHome), qAvgA = avg(qsAway)
    const qAvgCH = avg(qsCorH), qAvgCA = avg(qsCorA)
    const qWinRate = avg(qsWins)

    const lAvgH = avg(lvHome), lAvgA = avg(lvAway)
    const lAvgCH = avg(lvCorH), lAvgCA = avg(lvCorA)
    const lWinRate = avg(lvWins)

    console.log('\nB10 T1 — Paritetstabell (N=1000 per väg, homeAdvantage=0, jämn styrka):')
    console.log(`Metric              | Quicksim | Live     | Diff`)
    console.log(`--------------------|----------|----------|---------`)
    console.log(`Mål hemma (snitt)   | ${qAvgH.toFixed(2).padStart(8)} | ${lAvgH.toFixed(2).padStart(8)} | ${pct(lAvgH, qAvgH)}`)
    console.log(`Mål borta (snitt)   | ${qAvgA.toFixed(2).padStart(8)} | ${lAvgA.toFixed(2).padStart(8)} | ${pct(lAvgA, qAvgA)}`)
    console.log(`Hörnor hemma (snitt)| ${qAvgCH.toFixed(2).padStart(8)} | ${lAvgCH.toFixed(2).padStart(8)} | ${pct(lAvgCH, qAvgCH)}`)
    console.log(`Hörnor borta (snitt)| ${qAvgCA.toFixed(2).padStart(8)} | ${lAvgCA.toFixed(2).padStart(8)} | ${pct(lAvgCA, qAvgCA)}`)
    console.log(`Hemmaseger-andel    | ${(qWinRate * 100).toFixed(1).padStart(7)}% | ${(lWinRate * 100).toFixed(1).padStart(7)}% | ${(Math.abs(lWinRate - qWinRate) * 100).toFixed(1)}pp`)

    // Toleranser: ±10% för mål, ±15% för hörnor (mer brus), ±5pp för segerandel
    const GOALS_TOL = 0.10
    const CORNERS_TOL = 0.15
    const WIN_RATE_TOL_PP = 0.05

    expect(Math.abs(lAvgH - qAvgH) / qAvgH, 'mål hemma diff').toBeLessThan(GOALS_TOL)
    expect(Math.abs(lAvgA - qAvgA) / qAvgA, 'mål borta diff').toBeLessThan(GOALS_TOL)
    expect(Math.abs(lAvgCH - qAvgCH) / (qAvgCH || 1), 'hörnor hemma diff').toBeLessThan(CORNERS_TOL)
    expect(Math.abs(lAvgCA - qAvgCA) / (qAvgCA || 1), 'hörnor borta diff').toBeLessThan(CORNERS_TOL)
    expect(Math.abs(lWinRate - qWinRate), 'hemmaseger procentenheter').toBeLessThan(WIN_RATE_TOL_PP)
  })

  it('simulateRound använder managedClubPendingLineup, inte generateAiLineup', () => {
    const homePlayers = makeSquad('managed', 'club1', 65)
    const awayPlayers = makeSquad('opp', 'club2', 60)
    const allPlayers = [...homePlayers, ...awayPlayers]

    const managedLineup: TeamSelection = {
      startingPlayerIds: homePlayers.map(p => p.id),
      benchPlayerIds: [],
      tactic: { ...DEFAULT_TACTIC },
    }

    const fixture = makeFixture('f_managed_001', {
      homeClubId: 'club1',
      awayClubId: 'club2',
      matchday: 5,
    })

    const baseClub = {
      reputation: 50, preferredStyle: ClubStyle.Balanced,
      activeTactic: DEFAULT_TACTIC, arenaName: 'Testarenan', fanGroupName: 'Klacken',
      hasIndoorArena: false, budget: 100000, wageBill: 0, wageBudget: 50000,
      trainingFacilities: 3, youthFacilities: 2, communityStanding: 50,
      boardExpectation: 'midtable', boardPatience: 3,
    }
    const club1 = { ...baseClub, id: 'club1', name: 'Testlaget', squadPlayerIds: homePlayers.map(p => p.id) }
    const club2 = { ...baseClub, id: 'club2', name: 'Motståndarlaget', squadPlayerIds: awayPlayers.map(p => p.id) }

    const standings = [
      { clubId: 'club1', position: 5, played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 8, points: 5 },
      { clubId: 'club2', position: 6, played: 4, won: 1, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 10, points: 4 },
    ]

    const game = {
      managedClubId: 'club1',
      managedClubPendingLineup: managedLineup,
      clubs: [club1, club2],
      players: allPlayers,
      currentSeason: 2026,
      currentDate: '2026-01-15',
      fixtures: [fixture],
      standings,
      referees: [],
      refereeRelations: [],
      fanMood: 50,
      communityStanding: 50,
      matchWeathers: [],
      storylines: [],
    } as unknown as SaveGame

    const baseSeed = 5 * 1000 + 2026 * 7
    const localRand = mulberry32(baseSeed + 9999)

    const result = simulateRound(game, [fixture], 5, baseSeed, localRand, false)

    // Matchen ska ha simulerats (inte hoppats över som pending)
    const simFixture = result.simulatedFixtures.find(f => f.id === 'f_managed_001')
    expect(simFixture, 'fixture ska ha simulerats').toBeDefined()
    expect(simFixture?.status).toBe(FixtureStatus.Completed)

    // homeLineup ska innehålla spelarnas IDs från managedClubPendingLineup
    const usedLineup = simFixture?.homeLineup
    expect(usedLineup, 'homeLineup ska finnas på simulerad fixture').toBeDefined()

    const managedIds = new Set(managedLineup.startingPlayerIds)
    const simulatedIds = usedLineup?.startingPlayerIds ?? []
    const allManagedUsed = simulatedIds.every(id => managedIds.has(id))
    expect(allManagedUsed, 'alla startspelares IDs ska matcha managedClubPendingLineup').toBe(true)
    expect(simulatedIds.length).toBe(managedLineup.startingPlayerIds.length)
  })

})
