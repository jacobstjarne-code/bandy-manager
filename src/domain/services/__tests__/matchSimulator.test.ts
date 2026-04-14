import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchSimulator'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  MatchEventType,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

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
}

function makePlayer(overrides: Partial<Player> & { id: string; position: PlayerPosition; ca?: number; disc?: number }): Player {
  const ca = overrides.ca ?? 65
  const disc = overrides.disc ?? 70
  const attrs = ca

  return {
    id: overrides.id,
    firstName: 'Test',
    lastName: 'Player',
    age: 25,
    nationality: 'SE',
    clubId: overrides.clubId ?? 'club1',
    isHomegrown: true,
    position: overrides.position,
    archetype: overrides.position === PlayerPosition.Goalkeeper
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
    discipline: disc,
    attributes: {
      skating: attrs,
      acceleration: attrs,
      stamina: attrs,
      ballControl: attrs,
      passing: attrs,
      shooting: attrs,
      dribbling: attrs,
      vision: attrs,
      decisions: attrs,
      workRate: attrs,
      positioning: attrs,
      defending: attrs,
      cornerSkill: attrs,
      goalkeeping: overrides.position === PlayerPosition.Goalkeeper ? attrs + 15 : Math.max(1, attrs - 15),
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cornerGoals: 0,
      penaltyGoals: 0,
      yellowCards: 0,
      redCards: 0,
      suspensions: 0,
      averageRating: 6.5,
      minutesPlayed: 0,
    },
    careerStats: {
      totalGames: 0,
      totalGoals: 0,
      totalAssists: 0,
      seasonsPlayed: 1,
    },
    ...overrides,
  }
}

// Build a squad of 11 starters: 1 GK, 3 DEF, 3 HALF, 2 MID, 2 FWD
function makeSquad(prefix: string, clubId: string, ca = 65, disc = 70): Player[] {
  return [
    makePlayer({ id: `${prefix}_gk`, position: PlayerPosition.Goalkeeper, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_d1`, position: PlayerPosition.Defender, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_d2`, position: PlayerPosition.Defender, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_d3`, position: PlayerPosition.Defender, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_h1`, position: PlayerPosition.Half, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_h2`, position: PlayerPosition.Half, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_h3`, position: PlayerPosition.Half, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_m1`, position: PlayerPosition.Midfielder, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_m2`, position: PlayerPosition.Midfielder, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_f1`, position: PlayerPosition.Forward, clubId, ca, disc }),
    makePlayer({ id: `${prefix}_f2`, position: PlayerPosition.Forward, clubId, ca, disc }),
  ]
}

function makeTeamSelection(players: Player[]): TeamSelection {
  return {
    startingPlayerIds: players.map(p => p.id),
    benchPlayerIds: [],
    tactic: DEFAULT_TACTIC,
  }
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture_test',
    leagueId: 'league_1',
    season: 2026,
    roundNumber: 1,
    homeClubId: 'club1',
    awayClubId: 'club2',
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('simulateMatch', () => {

  it('1. returns a completed fixture', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    const result = simulateMatch({
      fixture: makeFixture(),
      homeLineup: makeTeamSelection(homePlayers),
      awayLineup: makeTeamSelection(awayPlayers),
      homePlayers,
      awayPlayers,
      seed: 1,
    })

    expect(result.fixture.status).toBe(FixtureStatus.Completed)
    expect(result.fixture.homeScore).toBeGreaterThanOrEqual(0)
    expect(result.fixture.awayScore).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(result.fixture.homeScore)).toBe(true)
    expect(Number.isInteger(result.fixture.awayScore)).toBe(true)
    expect(result.fixture.events.length).toBeGreaterThan(0)
  })

  it('2. goals are within sane range', () => {
    const totals: number[] = []
    for (let i = 0; i < 50; i++) {
      const homePlayers = makeSquad('h', 'club1', 65)
      const awayPlayers = makeSquad('a', 'club2', 65)
      const result = simulateMatch({
        fixture: makeFixture(),
        homeLineup: makeTeamSelection(homePlayers),
        awayLineup: makeTeamSelection(awayPlayers),
        homePlayers,
        awayPlayers,
        seed: i * 17 + 100,
      })
      totals.push(result.fixture.homeScore + result.fixture.awayScore)
    }

    const avg = totals.reduce((a, b) => a + b, 0) / totals.length
    const inSaneRange = totals.filter(t => t >= 4 && t <= 20).length

    expect(avg).toBeGreaterThanOrEqual(2)
    expect(avg).toBeLessThanOrEqual(12)
    expect(inSaneRange / totals.length).toBeGreaterThanOrEqual(0.80)
  })

  it('3. better team wins more often', () => {
    let strongWins = 0
    for (let i = 0; i < 100; i++) {
      const strongPlayers = makeSquad('s', 'club1', 80)
      const weakPlayers = makeSquad('w', 'club2', 35)
      const result = simulateMatch({
        fixture: makeFixture(),
        homeLineup: makeTeamSelection(strongPlayers),
        awayLineup: makeTeamSelection(weakPlayers),
        homePlayers: strongPlayers,
        awayPlayers: weakPlayers,
        homeAdvantage: 0.0,
        seed: i * 31 + 200,
      })
      if (result.fixture.homeScore > result.fixture.awayScore) strongWins++
    }

    expect(strongWins).toBeGreaterThanOrEqual(60)
  })

  it('4. suspensions/cards occur', () => {
    let matchesWithCard = 0
    for (let i = 0; i < 50; i++) {
      const homePlayers = makeSquad('h', 'club1', 65, 20)
      const awayPlayers = makeSquad('a', 'club2', 65, 20)
      const result = simulateMatch({
        fixture: makeFixture(),
        homeLineup: makeTeamSelection(homePlayers),
        awayLineup: makeTeamSelection(awayPlayers),
        homePlayers,
        awayPlayers,
        seed: i * 13 + 300,
      })
      const hasCard = result.fixture.events.some(
        e => e.type === MatchEventType.RedCard || e.type === MatchEventType.YellowCard
      )
      if (hasCard) matchesWithCard++
    }

    expect(matchesWithCard / 50).toBeGreaterThanOrEqual(0.30)
  })

  it('5. corner goals occur', () => {
    let matchesWithCornerGoal = 0
    for (let i = 0; i < 50; i++) {
      const homePlayers = makeSquad('h', 'club1', 65)
      const awayPlayers = makeSquad('a', 'club2', 65)
      const result = simulateMatch({
        fixture: makeFixture(),
        homeLineup: makeTeamSelection(homePlayers),
        awayLineup: makeTeamSelection(awayPlayers),
        homePlayers,
        awayPlayers,
        seed: i * 7 + 400,
      })

      // Corner goal: there's a Corner event at the same minute as a Goal event
      const cornerMinutes = new Set(
        result.fixture.events
          .filter(e => e.type === MatchEventType.Corner)
          .map(e => e.minute)
      )
      const goalMinutes = result.fixture.events
        .filter(e => e.type === MatchEventType.Goal)
        .map(e => e.minute)

      const hasCornerGoal = goalMinutes.some(m => cornerMinutes.has(m))
      if (hasCornerGoal) matchesWithCornerGoal++
    }

    expect(matchesWithCornerGoal / 50).toBeGreaterThanOrEqual(0.10)
  })

  it('6. same seed produces identical result', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')

    const run1 = simulateMatch({
      fixture: makeFixture(),
      homeLineup: makeTeamSelection(homePlayers),
      awayLineup: makeTeamSelection(awayPlayers),
      homePlayers,
      awayPlayers,
      seed: 12345,
    })

    const run2 = simulateMatch({
      fixture: makeFixture(),
      homeLineup: makeTeamSelection(homePlayers),
      awayLineup: makeTeamSelection(awayPlayers),
      homePlayers,
      awayPlayers,
      seed: 12345,
    })

    expect(run1.fixture.homeScore).toBe(run2.fixture.homeScore)
    expect(run1.fixture.awayScore).toBe(run2.fixture.awayScore)
    expect(run1.fixture.events.length).toBe(run2.fixture.events.length)
  })

  it('7. home advantage increases home wins', () => {
    // Run 200 matches total: 100 with high advantage, 100 with no advantage
    // Use separate non-overlapping seed spaces so the two batches differ
    let highAdvantageHomeWins = 0
    let noAdvantageHomeWins = 0

    for (let i = 0; i < 100; i++) {
      const highHomePlayers = makeSquad('h', 'club1', 65)
      const highAwayPlayers = makeSquad('a', 'club2', 65)

      const highAdv = simulateMatch({
        fixture: makeFixture(),
        homeLineup: makeTeamSelection(highHomePlayers),
        awayLineup: makeTeamSelection(highAwayPlayers),
        homePlayers: highHomePlayers,
        awayPlayers: highAwayPlayers,
        homeAdvantage: 0.12,
        seed: i * 23 + 5000,
      })
      if (highAdv.fixture.homeScore > highAdv.fixture.awayScore) highAdvantageHomeWins++
    }

    for (let i = 0; i < 100; i++) {
      const noHomePlayers = makeSquad('h', 'club1', 65)
      const noAwayPlayers = makeSquad('a', 'club2', 65)

      const noAdv = simulateMatch({
        fixture: makeFixture(),
        homeLineup: makeTeamSelection(noHomePlayers),
        awayLineup: makeTeamSelection(noAwayPlayers),
        homePlayers: noHomePlayers,
        awayPlayers: noAwayPlayers,
        homeAdvantage: 0.0,
        seed: i * 23 + 5000,
      })
      if (noAdv.fixture.homeScore > noAdv.fixture.awayScore) noAdvantageHomeWins++
    }

    // High advantage should yield more home wins over 100 matches
    expect(highAdvantageHomeWins).toBeGreaterThan(noAdvantageHomeWins)
  })

  it('8. player ratings generated for all starters', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    const homeLineup = makeTeamSelection(homePlayers)
    const awayLineup = makeTeamSelection(awayPlayers)

    const result = simulateMatch({
      fixture: makeFixture(),
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      seed: 999,
    })

    const ratings = result.fixture.report!.playerRatings

    for (const id of homeLineup.startingPlayerIds) {
      expect(ratings[id]).toBeDefined()
      expect(typeof ratings[id]).toBe('number')
    }
    for (const id of awayLineup.startingPlayerIds) {
      expect(ratings[id]).toBeDefined()
      expect(typeof ratings[id]).toBe('number')
    }
  })

  it('9. possession sums to 100', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')

    const result = simulateMatch({
      fixture: makeFixture(),
      homeLineup: makeTeamSelection(homePlayers),
      awayLineup: makeTeamSelection(awayPlayers),
      homePlayers,
      awayPlayers,
      seed: 42,
    })

    const report = result.fixture.report!
    expect(report.possessionHome + report.possessionAway).toBe(100)
  })

  it('10. all match events have valid minutes (0-90)', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')

    const result = simulateMatch({
      fixture: makeFixture(),
      homeLineup: makeTeamSelection(homePlayers),
      awayLineup: makeTeamSelection(awayPlayers),
      homePlayers,
      awayPlayers,
      seed: 77,
    })

    for (const event of result.fixture.events) {
      expect(event.minute).toBeGreaterThanOrEqual(0)
      expect(event.minute).toBeLessThanOrEqual(90)
    }
  })

})
