import { describe, it, expect } from 'vitest'
import { getOpponentStandingFragment } from '../situationFragments'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2026-10-04',
    currentSeason: 1,
    currentMatchday: 1,
    clubs: [
      { id: 'managed', name: 'Managed BK', shortName: 'MBK' } as never,
      { id: 'opp', name: 'Opponent BK', shortName: 'OBK' } as never,
    ],
    players: [],
    fixtures: [],
    standings: [
      { clubId: 'managed', position: 5, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
      { clubId: 'opp', position: 3, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
    ],
    inbox: [],
    league: { teamIds: [] } as never,
    transferState: { listedPlayerIds: [] } as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    seasonSummaries: [],
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    academyLevel: 1 as never,
    mentorships: [],
    loanDeals: [],
    version: '1.0.0',
    lastSavedAt: '2026-10-04T00:00:00Z',
    seenAnslag: [],
    ...overrides,
  } as SaveGame
}

function makeLeagueFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 1,
    roundNumber: 1,
    matchday: 5,
    homeClubId: 'managed',
    awayClubId: 'opp',
    status: FixtureStatus.Completed,
    homeScore: 3,
    awayScore: 1,
    events: [],
    isCup: false,
    isKnockout: false,
    ...overrides,
  } as Fixture
}

function makeScheduledFixture(): Fixture {
  return makeLeagueFixture({
    id: 'next',
    status: FixtureStatus.Scheduled,
    matchday: 99,
    homeScore: undefined,
    awayScore: undefined,
  })
}

describe('getOpponentStandingFragment — early-season guard', () => {
  it('returnerar null vid completedLeague < 5 (omg 1–4)', () => {
    const completed = Array.from({ length: 4 }, (_, i) =>
      makeLeagueFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 1 })
    )
    const game = makeGame({ fixtures: [...completed, makeScheduledFixture()] })
    expect(getOpponentStandingFragment(game)).toBeNull()
  })

  it('returnerar null vid 0 completedLeague', () => {
    const game = makeGame({ fixtures: [makeScheduledFixture()] })
    expect(getOpponentStandingFragment(game)).toBeNull()
  })

  it('returnerar sträng vid completedLeague >= 5', () => {
    const completed = Array.from({ length: 5 }, (_, i) =>
      makeLeagueFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 1 })
    )
    const game = makeGame({ fixtures: [...completed, makeScheduledFixture()] })
    const result = getOpponentStandingFragment(game)
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
  })

  it('cup-fixtures räknas inte mot completedLeague', () => {
    const cupFixtures = Array.from({ length: 5 }, (_, i) =>
      makeLeagueFixture({ id: `cup${i}`, isCup: true, roundNumber: i + 1, matchday: i + 1 })
    )
    const game = makeGame({ fixtures: [...cupFixtures, makeScheduledFixture()] })
    // 5 completed but all are cup — should still be null
    expect(getOpponentStandingFragment(game)).toBeNull()
  })
})
