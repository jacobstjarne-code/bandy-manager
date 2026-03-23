import { describe, it, expect } from 'vitest'
import {
  createMatchResultItem,
  createInjuryItem,
  createSuspensionItem,
  createYouthIntakeItem,
  createPlayerDevelopmentItem,
  createContractExpiringItem,
  createBoardFeedbackItem,
} from '../inboxService'
import type { Fixture } from '../../entities/Fixture'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import type { StandingRow } from '../../entities/SaveGame'
import type { YouthIntakeResult } from '../youthIntakeService'
import type { NotableDevelopment } from '../playerDevelopmentService'
import {
  InboxItemType,
  FixtureStatus,
  PlayerPosition,
  PlayerArchetype,
  ClubExpectation,
  ClubStyle,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../enums'

const TEST_DATE = '2026-03-15'

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club_test',
    name: 'Test BK',
    shortName: 'Test',
    region: 'Testland',
    reputation: 60,
    finances: 300000,
    wageBudget: 60000,
    transferBudget: 20000,
    youthQuality: 60,
    youthRecruitment: 60,
    youthDevelopment: 60,
    facilities: 60,
    boardExpectation: ClubExpectation.MidTable,
    fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced,
    hasArtificialIce: false,
    activeTactic: {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Mixed,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Mixed,
      cornerStrategy: CornerStrategy.Standard,
      penaltyKillStyle: PenaltyKillStyle.Active,
    },
    squadPlayerIds: [],
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player_test_1',
    firstName: 'Erik',
    lastName: 'Karlsson',
    age: 24,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 8000,
    contractUntilSeason: 2028,
    marketValue: 150000,
    morale: 70,
    form: 65,
    fitness: 80,
    sharpness: 70,
    currentAbility: 62,
    potentialAbility: 75,
    developmentRate: 55,
    injuryProneness: 25,
    discipline: 72,
    attributes: {
      skating: 60, acceleration: 65, stamina: 58, ballControl: 56,
      passing: 50, shooting: 72, dribbling: 55, vision: 48,
      decisions: 60, workRate: 55, positioning: 64, defending: 35,
      cornerSkill: 40, goalkeeping: 18,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 10, goals: 5, assists: 3, cornerGoals: 1, penaltyGoals: 0,
      yellowCards: 1, redCards: 0, suspensions: 0, averageRating: 6.8, minutesPlayed: 900,
    },
    careerStats: { totalGames: 50, totalGoals: 20, totalAssists: 15, seasonsPlayed: 3 },
    ...overrides,
  }
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture_1',
    leagueId: 'league_1',
    season: 2026,
    roundNumber: 5,
    homeClubId: 'club_test',
    awayClubId: 'club_opponent',
    status: FixtureStatus.Completed,
    homeScore: 3,
    awayScore: 1,
    events: [],
    ...overrides,
  }
}

function makeStanding(overrides: Partial<StandingRow> = {}): StandingRow {
  return {
    clubId: 'club_test',
    played: 8,
    wins: 5,
    draws: 1,
    losses: 2,
    goalsFor: 14,
    goalsAgainst: 8,
    goalDifference: 6,
    points: 16,
    position: 2,
    ...overrides,
  }
}

describe('createMatchResultItem', () => {
  it('returns correct type and contains score in title/body', () => {
    const fixture = makeFixture({ homeScore: 3, awayScore: 1 })
    const item = createMatchResultItem(fixture, 'club_test', TEST_DATE)

    expect(item.type).toBe(InboxItemType.MatchResult)
    expect(item.title).toContain('3')
    expect(item.title).toContain('1')
    expect(item.body).toBeTruthy()
    expect(item.body.length).toBeGreaterThan(0)
  })

  it('describes a win correctly for home team', () => {
    const fixture = makeFixture({ homeClubId: 'club_test', homeScore: 3, awayScore: 0 })
    const item = createMatchResultItem(fixture, 'club_test', TEST_DATE)
    expect(item.body.toLowerCase()).toContain('vann')
  })

  it('describes a loss correctly', () => {
    const fixture = makeFixture({ homeClubId: 'club_opponent', awayClubId: 'club_test', homeScore: 2, awayScore: 0 })
    const item = createMatchResultItem(fixture, 'club_test', TEST_DATE)
    expect(item.body.toLowerCase()).toContain('förlorade')
  })

  it('describes a draw correctly', () => {
    const fixture = makeFixture({ homeScore: 2, awayScore: 2 })
    const item = createMatchResultItem(fixture, 'club_test', TEST_DATE)
    expect(item.body.toLowerCase()).toContain('oavgjort')
  })
})

describe('createInjuryItem', () => {
  it('mentions player name and days out', () => {
    const player = makePlayer()
    const item = createInjuryItem(player, 14, TEST_DATE)

    expect(item.type).toBe(InboxItemType.Injury)
    expect(item.title).toContain(player.firstName)
    expect(item.title).toContain(player.lastName)
    expect(item.body).toContain(player.firstName)
    expect(item.body).toContain('14')
    expect(item.relatedPlayerId).toBe(player.id)
    expect(item.isRead).toBe(false)
  })
})

describe('createSuspensionItem', () => {
  it('mentions player name and games out', () => {
    const player = makePlayer()
    const item = createSuspensionItem(player, 2, TEST_DATE)

    expect(item.type).toBe(InboxItemType.Suspension)
    expect(item.title).toContain(player.firstName)
    expect(item.title).toContain(player.lastName)
    expect(item.body).toContain(player.firstName)
    expect(item.body).toContain('2')
    expect(item.relatedPlayerId).toBe(player.id)
    expect(item.isRead).toBe(false)
  })
})

describe('createYouthIntakeItem', () => {
  it('mentions player count and returns type YouthIntake', () => {
    const player1 = makePlayer({ id: 'p1', firstName: 'Anton', lastName: 'Berg', age: 16, potentialAbility: 65 })
    const player2 = makePlayer({ id: 'p2', firstName: 'Simon', lastName: 'Holm', age: 17, potentialAbility: 42 })
    const club = makeClub()

    const intakeResult: YouthIntakeResult = {
      record: {
        season: 2026,
        clubId: 'club_test',
        date: TEST_DATE,
        playerIds: ['p1', 'p2'],
        topProspectId: 'p1',
      },
      newPlayers: [player1, player2],
      scoutTexts: {
        p1: 'Lovande talang med bra potential.',
        p2: 'Ordinär spelare men arbetar hårt.',
      },
    }

    const item = createYouthIntakeItem(intakeResult, club, TEST_DATE, intakeResult.scoutTexts)

    expect(item.type).toBe(InboxItemType.YouthIntake)
    expect(item.body).toContain('2')
    expect(item.isRead).toBe(false)
  })
})

describe('createPlayerDevelopmentItem', () => {
  it('returns null for empty changes', () => {
    const result = createPlayerDevelopmentItem([], [], TEST_DATE)
    expect(result).toBeNull()
  })

  it('returns item for significant changes', () => {
    const player = makePlayer()
    const changes: NotableDevelopment[] = [
      { playerId: player.id, attribute: 'shooting', oldValue: 55, newValue: 58, type: 'improvement' },
      { playerId: player.id, attribute: 'passing', oldValue: 50, newValue: 53, type: 'improvement' },
    ]

    const item = createPlayerDevelopmentItem(changes, [player], TEST_DATE)

    expect(item).not.toBeNull()
    expect(item!.type).toBe(InboxItemType.PlayerDevelopment)
    expect(item!.body).toContain(player.firstName)
    expect(item!.isRead).toBe(false)
  })
})

describe('createContractExpiringItem', () => {
  it('mentions player name and season expiry', () => {
    const player = makePlayer()
    const item = createContractExpiringItem(player, 2027, TEST_DATE)

    expect(item.type).toBe(InboxItemType.ContractExpiring)
    expect(item.title).toContain(player.firstName)
    expect(item.title).toContain(player.lastName)
    expect(item.body).toContain('2027')
    expect(item.relatedPlayerId).toBe(player.id)
    expect(item.isRead).toBe(false)
  })
})

describe('createBoardFeedbackItem', () => {
  it('returns positive feedback when team overperforms (position 1, expected mid-table)', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.MidTable })
    const standing = makeStanding({ position: 1, points: 20 })
    const item = createBoardFeedbackItem(club, standing, 12, TEST_DATE)

    expect(item.type).toBe(InboxItemType.BoardFeedback)
    expect(item.title).toBe('Styrelsens syn på läget')
    // Should be positive — contains words like nöjd, imponerad, or överträffat
    const bodyLower = item.body.toLowerCase()
    const isPositive = bodyLower.includes('nöjd') || bodyLower.includes('imponerad') || bodyLower.includes('överträffat') || bodyLower.includes('bra')
    expect(isPositive).toBe(true)
    expect(item.isRead).toBe(false)
  })

  it('returns negative feedback when team underperforms (position 10, expected top 3)', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.ChallengeTop })
    const standing = makeStanding({ position: 10, points: 8 })
    const item = createBoardFeedbackItem(club, standing, 12, TEST_DATE)

    expect(item.type).toBe(InboxItemType.BoardFeedback)
    const bodyLower = item.body.toLowerCase()
    const isNegative = bodyLower.includes('orolig') || bodyLower.includes('inte nöjda') || bodyLower.includes('acceptabla') || bodyLower.includes('allvar')
    expect(isNegative).toBe(true)
  })

  it('returns valid date on all items', () => {
    const club = makeClub()
    const standing = makeStanding({ position: 6, points: 12 })
    const item = createBoardFeedbackItem(club, standing, 12, TEST_DATE)
    expect(item.date).toBe(TEST_DATE)
  })
})

describe('general inbox item properties', () => {
  it('all items have isRead: false and valid date', () => {
    const player = makePlayer()
    const club = makeClub()
    const fixture = makeFixture()
    const standing = makeStanding()

    const items = [
      createMatchResultItem(fixture, 'club_test', TEST_DATE),
      createInjuryItem(player, 7, TEST_DATE),
      createSuspensionItem(player, 1, TEST_DATE),
      createContractExpiringItem(player, 2027, TEST_DATE),
      createBoardFeedbackItem(club, standing, 12, TEST_DATE),
    ]

    for (const item of items) {
      expect(item.isRead).toBe(false)
      expect(item.date).toBe(TEST_DATE)
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.body).toBeTruthy()
    }
  })
})
