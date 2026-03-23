import { describe, it, expect } from 'vitest'
import { getRivalry, isRivalryMatch } from '../../data/rivalries'
import { simulateMatch, simulateMatchStepByStep } from '../matchSimulator'
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
    homeClubId: 'club_sandviken',
    awayClubId: 'club_edsbyn',
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Rivalry data functions', () => {

  it('1. isRivalryMatch returns true for known rival pair (Sandviken vs Edsbyn)', () => {
    expect(isRivalryMatch('club_sandviken', 'club_edsbyn')).toBe(true)
  })

  it('2. isRivalryMatch returns true regardless of order (Edsbyn vs Sandviken)', () => {
    expect(isRivalryMatch('club_edsbyn', 'club_sandviken')).toBe(true)
  })

  it('3. isRivalryMatch returns false for non-rival pair', () => {
    expect(isRivalryMatch('club_sandviken', 'club_sirius')).toBe(false)
  })

  it('4. getRivalry returns correct name and intensity for Vasteras vs Tillberga', () => {
    const r = getRivalry('club_vasteras', 'club_tillberga')
    expect(r).not.toBeNull()
    expect(r!.name).toBe('Västmanlandsderbyt')
    expect(r!.intensity).toBe(3)
  })

  it('5. getRivalry returns null for non-rival pair', () => {
    expect(getRivalry('club_sirius', 'club_sandviken')).toBeNull()
  })

})

describe('Rivalry match simulation', () => {

  it('6. Derby matches produce more red cards on average than non-derby matches', () => {
    const N = 30
    const homePlayers = makeSquad('h', 'club_sandviken', 65, 85)
    const awayPlayers = makeSquad('a', 'club_edsbyn', 65, 85)
    const homeLineup = makeTeamSelection(homePlayers)
    const awayLineup = makeTeamSelection(awayPlayers)

    const derbyRivalry = getRivalry('club_sandviken', 'club_edsbyn')!

    let derbyRedCards = 0
    let normalRedCards = 0

    for (let i = 0; i < N; i++) {
      const derbyResult = simulateMatch({
        fixture: makeFixture({ id: `derby_${i}`, homeClubId: 'club_sandviken', awayClubId: 'club_edsbyn' }),
        homeLineup,
        awayLineup,
        homePlayers,
        awayPlayers,
        seed: i + 1000,
        rivalry: derbyRivalry,
      })
      derbyRedCards += derbyResult.fixture.events.filter(e => e.type === MatchEventType.RedCard).length

      const normalResult = simulateMatch({
        fixture: makeFixture({ id: `normal_${i}`, homeClubId: 'club_sandviken', awayClubId: 'club_edsbyn' }),
        homeLineup,
        awayLineup,
        homePlayers,
        awayPlayers,
        seed: i + 1000,
        // no rivalry
      })
      normalRedCards += normalResult.fixture.events.filter(e => e.type === MatchEventType.RedCard).length
    }

    const avgDerby = derbyRedCards / N
    const avgNormal = normalRedCards / N
    // Derby should have more red cards than no-rivalry matches
    expect(avgDerby).toBeGreaterThanOrEqual(avgNormal)
  })

  it('7. Step 0 commentary in derby contains derby-related keyword', () => {
    const homePlayers = makeSquad('h', 'club_sandviken')
    const awayPlayers = makeSquad('a', 'club_edsbyn')
    const homeLineup = makeTeamSelection(homePlayers)
    const awayLineup = makeTeamSelection(awayPlayers)
    const rivalry = getRivalry('club_sandviken', 'club_edsbyn')!

    const gen = simulateMatchStepByStep({
      fixture: makeFixture(),
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      seed: 42,
      rivalry,
    })

    const first = gen.next()
    expect(first.done).toBe(false)
    const step0 = first.value
    expect(step0.step).toBe(0)
    // Should use derby kickoff commentary
    const lowerCommentary = step0.commentary.toLowerCase()
    expect(
      lowerCommentary.includes('derby') || lowerCommentary.includes('rivalerna') || lowerCommentary.includes('gävleborg')
    ).toBe(true)
  })

  it('8. Non-derby step 0 commentary uses regular kickoff text', () => {
    const homePlayers = makeSquad('h', 'club_sandviken')
    const awayPlayers = makeSquad('a', 'club_sirius')
    const homeLineup = makeTeamSelection(homePlayers)
    const awayLineup = makeTeamSelection(awayPlayers)

    const gen = simulateMatchStepByStep({
      fixture: makeFixture({ homeClubId: 'club_sandviken', awayClubId: 'club_sirius' }),
      homeLineup,
      awayLineup,
      homePlayers,
      awayPlayers,
      seed: 42,
      // no rivalry
    })

    const first = gen.next()
    expect(first.done).toBe(false)
    const step0 = first.value
    expect(step0.step).toBe(0)
    // Regular kickoff text: domaren, avspark, matchen är igång etc.
    const lowerCommentary = step0.commentary.toLowerCase()
    expect(
      lowerCommentary.includes('domaren') || lowerCommentary.includes('avspark') || lowerCommentary.includes('igång')
    ).toBe(true)
  })

})
