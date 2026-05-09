import { describe, it, expect } from 'vitest'
import { computeNextAnslag } from '../anslagService'
import type { SaveGame } from '../../entities/SaveGame'
import type { CupBracket, CupMatch } from '../../entities/Cup'
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
    clubs: [],
    players: [],
    fixtures: [],
    standings: [],
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

function makeMinimalBracket(overrides: Partial<CupBracket> = {}): CupBracket {
  return {
    season: 1,
    matches: [],
    byeTeamIds: [],
    completed: false,
    ...overrides,
  }
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 1,
    roundNumber: 1,
    matchday: 5,
    homeClubId: 'managed',
    awayClubId: 'other',
    status: FixtureStatus.Completed,
    homeScore: 3,
    awayScore: 1,
    events: [],
    isCup: false,
    isKnockout: false,
    ...overrides,
  } as Fixture
}

describe('computeNextAnslag — prioritet', () => {
  it('returns cup_start before any league anslag in early season', () => {
    const game = makeGame({
      currentMatchday: 1,
      cupBracket: makeMinimalBracket(),
      seenAnslag: [],
    })
    expect(computeNextAnslag(game)).toBe('cup_start')
  })

  it('returns null when cupBracket is null and no league started', () => {
    const game = makeGame({ cupBracket: null, seenAnslag: [], fixtures: [] })
    expect(computeNextAnslag(game)).toBeNull()
  })

  it('league_halfway triggers at exactly round 11', () => {
    const fixtures = Array.from({ length: 11 }, (_, i) =>
      makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
    )
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start', 'league_midwinter'],
    })
    expect(computeNextAnslag(game)).toBe('league_halfway')
  })

  it('league_halfway takes priority over league_midwinter at round 11', () => {
    const fixtures = Array.from({ length: 11 }, (_, i) =>
      makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
    )
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
      // midwinter not seen — but halfway should still win since round === 11
    })
    // At round 11, halfway triggers before midwinter in priority order
    expect(computeNextAnslag(game)).toBe('league_halfway')
  })

  it('returns null when all relevant anslag are seen', () => {
    const fixtures = [
      ...Array.from({ length: 11 }, (_, i) =>
        makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
      ),
      // One scheduled fixture — prevents season_done from triggering
      makeFixture({ id: 'f-scheduled', roundNumber: 12, matchday: 17, status: FixtureStatus.Scheduled }),
    ]
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start', 'league_midwinter', 'league_halfway'],
    })
    expect(computeNextAnslag(game)).toBeNull()
  })

  it('cup_done_winner for bracket winner', () => {
    const match: CupMatch = {
      id: 'cup-r4-m0',
      round: 4,
      fixtureId: 'cup-r4-m0',
      homeClubId: 'managed',
      awayClubId: 'other',
      winnerId: 'managed',
    }
    const game = makeGame({
      currentMatchday: 4,
      seenAnslag: ['cup_start'],
      cupBracket: makeMinimalBracket({ matches: [match], winnerId: 'managed', completed: true }),
    })
    expect(computeNextAnslag(game)).toBe('cup_done_winner')
  })

  it('cup_done for final loser', () => {
    const match: CupMatch = {
      id: 'cup-r4-m0',
      round: 4,
      fixtureId: 'cup-r4-m0',
      homeClubId: 'managed',
      awayClubId: 'other',
      winnerId: 'other',
    }
    const game = makeGame({
      currentMatchday: 4,
      seenAnslag: ['cup_start'],
      cupBracket: makeMinimalBracket({ matches: [match], winnerId: 'other', completed: true }),
    })
    expect(computeNextAnslag(game)).toBe('cup_done')
  })

  it('league_midwinter triggers at round 7', () => {
    const fixtures = Array.from({ length: 7 }, (_, i) =>
      makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
    )
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
    })
    expect(computeNextAnslag(game)).toBe('league_midwinter')
  })

  it('league_midwinter does not trigger at round 6', () => {
    const fixtures = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
      ),
      // scheduled fixture prevents season_done trigger
      makeFixture({ id: 'f-sched', roundNumber: 7, matchday: 12, status: FixtureStatus.Scheduled }),
    ]
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
    })
    expect(computeNextAnslag(game)).toBeNull()
  })

  it('playoff_qualification triggers at round 19', () => {
    const fixtures = Array.from({ length: 19 }, (_, i) =>
      makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
    )
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start', 'league_midwinter', 'league_halfway'],
    })
    expect(computeNextAnslag(game)).toBe('playoff_qualification')
  })
})
