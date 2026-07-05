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

  it('league_midwinter triggers after Annandagen (isAnnandagen=true) is played', () => {
    const fixtures = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
      ),
      // Annandagen fixture with explicit flag
      makeFixture({ id: 'f-annandagen', roundNumber: 8, matchday: 12, isAnnandagen: true }),
    ]
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
    })
    expect(computeNextAnslag(game)).toBe('league_midwinter')
  })

  it('league_midwinter does not trigger when Annandagen is scheduled (not completed)', () => {
    const fixtures = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
      ),
      // Annandagen scheduled — prevents trigger
      makeFixture({ id: 'f-annandagen', roundNumber: 7, matchday: 12, isAnnandagen: true, status: FixtureStatus.Scheduled }),
    ]
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
    })
    expect(computeNextAnslag(game)).toBeNull()
  })

  it('league_midwinter does not trigger without isAnnandagen flag (matchday 12 alone not enough)', () => {
    const fixtures = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeFixture({ id: `f${i}`, roundNumber: i + 1, matchday: i + 5 })
      ),
      // matchday 12 but no isAnnandagen flag — simulates old save without migration
      makeFixture({ id: 'f-no-flag', roundNumber: 8, matchday: 12 }),
    ]
    const game = makeGame({
      cupBracket: makeMinimalBracket({ completed: true }),
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
    })
    expect(computeNextAnslag(game)).not.toBe('league_midwinter')
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

describe('computeNextAnslag — cup_first_match', () => {
  function makeCupFixture(overrides: Partial<Fixture> = {}): Fixture {
    return makeFixture({
      isCup: true,
      roundNumber: 1,
      season: 1,
      status: FixtureStatus.Scheduled,
      homeClubId: 'managed',
      awayClubId: 'other',
      matchday: 2,
      ...overrides,
    })
  }

  it('triggas när scheduled round-1-cupmatch finns och cup_start sett', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      cupBracket: makeMinimalBracket(),
      fixtures: [makeCupFixture()],
      seenAnslag: ['cup_start'],
    })
    expect(computeNextAnslag(game)).toBe('cup_first_match')
  })

  it('triggas INTE om cup_start inte setts (cup_start ska komma först)', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      cupBracket: makeMinimalBracket(),
      fixtures: [makeCupFixture()],
      seenAnslag: [],
    })
    // cup_start ska triggas istället
    expect(computeNextAnslag(game)).toBe('cup_start')
  })

  it('triggas INTE om cup_first_match redan sett', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      cupBracket: makeMinimalBracket(),
      fixtures: [makeCupFixture()],
      seenAnslag: ['cup_start', 'cup_first_match'],
    })
    expect(computeNextAnslag(game)).not.toBe('cup_first_match')
  })

  it('triggas INTE om ingen scheduled round-1-cupmatch finns', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 2,
      cupBracket: makeMinimalBracket(),
      fixtures: [makeCupFixture({ status: FixtureStatus.Completed })],
      seenAnslag: ['cup_start'],
    })
    expect(computeNextAnslag(game)).not.toBe('cup_first_match')
  })

  // M66e (textaudit 2026-07-05): direktkvalade klubbar (bye till kvarten) hade ingen
  // round-1-fixture, så cup_first_match triggades aldrig för dem — deras faktiska
  // första match är round 2.
  it('triggas på scheduled round-2-cupmatch om klubben är direktkvalad', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      cupBracket: makeMinimalBracket({ byeTeamIds: ['managed'] }),
      fixtures: [makeCupFixture({ roundNumber: 2, matchday: 8 })],
      seenAnslag: ['cup_start'],
    })
    expect(computeNextAnslag(game)).toBe('cup_first_match')
  })

  it('triggas INTE på round-2-cupmatch om klubben INTE är direktkvalad', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      cupBracket: makeMinimalBracket(),
      fixtures: [makeCupFixture({ roundNumber: 2, matchday: 8 })],
      seenAnslag: ['cup_start'],
    })
    expect(computeNextAnslag(game)).not.toBe('cup_first_match')
  })
})

describe('computeNextAnslag — cup_start trigger-guard', () => {
  it('cup_start triggas INTE efter att en cupmatchen är completed', () => {
    const completedCupFixture = makeFixture({
      id: 'cup-r1-m0',
      isCup: true,
      roundNumber: 1,
      season: 1,
      status: FixtureStatus.Completed,
      homeClubId: 'managed',
      awayClubId: 'other',
      matchday: 3,
    })
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 3,
      cupBracket: makeMinimalBracket(),
      fixtures: [completedCupFixture],
      seenAnslag: [],
    })
    expect(computeNextAnslag(game)).not.toBe('cup_start')
  })

  it('cup_start triggas när cupBracket finns men inga cupmatchen spelats', () => {
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      cupBracket: makeMinimalBracket(),
      fixtures: [],
      seenAnslag: [],
    })
    expect(computeNextAnslag(game)).toBe('cup_start')
  })
})

describe('computeNextAnslag — cup_done vs cup_between isolering', () => {
  function makeCupMatch(round: number, winnerId: string): CupMatch {
    return {
      id: `cup-r${round}-m0`,
      round,
      fixtureId: `cup-r${round}-m0`,
      homeClubId: 'managed',
      awayClubId: 'other',
      winnerId,
    }
  }

  it('runda 1-utslag triggar cup_done, inte cup_between', () => {
    // Round 1 complete, managed eliminated in round 1
    const bracket = makeMinimalBracket({
      matches: [makeCupMatch(1, 'other')],
    })
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 3,
      cupBracket: bracket,
      seenAnslag: ['cup_start'],
    })
    const result = computeNextAnslag(game)
    expect(result).toBe('cup_done')
    expect(result).not.toBe('cup_between')
  })

  it('runda 2-utslag triggar cup_done, inte cup_between (TIER 2.1 fix)', () => {
    // Round 1 won, round 2 lost — eliminated in round 2
    // cup_between suppressas när managed är ute — cup_done hanterar det
    const bracket = makeMinimalBracket({
      matches: [
        makeCupMatch(1, 'managed'),
        makeCupMatch(2, 'other'),
      ],
    })
    const game = makeGame({
      currentSeason: 1,
      currentMatchday: 8,
      cupBracket: bracket,
      seenAnslag: ['cup_start'],
    })
    const result = computeNextAnslag(game)
    expect(result).toBe('cup_done')
    expect(result).not.toBe('cup_between')
  })
})
