import { describe, it, expect } from 'vitest'
import { hasOpenBids, transferDeadlineWithin3Rounds } from '../../domain/services/portal/triggers/transferTriggers'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Fixture } from '../../domain/entities/Fixture'
import type { TransferBid } from '../../domain/entities/GameEvent'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: 'club_a',
    currentDate: '2026-12-01',
    currentSeason: 2026,
    clubs: [],
    players: [],
    league: {} as never,
    fixtures: [],
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-12-01T00:00:00',
    ...overrides,
  } as SaveGame
}

function makeBid(overrides: Partial<TransferBid> = {}): TransferBid {
  return {
    id: 'bid1',
    playerId: 'p1',
    buyingClubId: 'club_b',
    sellingClubId: 'club_a',
    offerAmount: 200000,
    offeredSalary: 10000,
    contractYears: 2,
    direction: 'incoming',
    status: 'pending',
    createdRound: 10,
    expiresRound: 12,
    ...overrides,
  }
}

function makeCompletedFixture(roundNumber: number): Fixture {
  return {
    id: `f${roundNumber}`,
    homeClubId: 'club_a',
    awayClubId: 'club_b',
    matchday: roundNumber,
    roundNumber,
    date: '2026-12-01',
    status: 'completed',
    isCup: false,
  } as Fixture
}

describe('hasOpenBids', () => {
  it('returnerar false om inga bud', () => {
    const game = makeGame()
    expect(hasOpenBids(game)).toBe(false)
  })

  it('returnerar true om pending incoming bud finns', () => {
    const game = makeGame({ transferBids: [makeBid()] })
    expect(hasOpenBids(game)).toBe(true)
  })

  it('returnerar false om bud är accepted (inte pending)', () => {
    const game = makeGame({ transferBids: [makeBid({ status: 'accepted' })] })
    expect(hasOpenBids(game)).toBe(false)
  })

  it('returnerar false om bud är outgoing (inte incoming)', () => {
    const game = makeGame({
      transferBids: [makeBid({ direction: 'outgoing', buyingClubId: 'club_a', sellingClubId: 'club_b' })],
    })
    expect(hasOpenBids(game)).toBe(false)
  })
})

describe('transferDeadlineWithin3Rounds', () => {
  it('returnerar false tidigt i säsongen (runda 1)', () => {
    const game = makeGame({
      fixtures: [makeCompletedFixture(1)],
    })
    expect(transferDeadlineWithin3Rounds(game)).toBe(false)
  })

  it('returnerar false vid runda 10 (5 omgångar kvar)', () => {
    const fixtures = Array.from({ length: 10 }, (_, i) => makeCompletedFixture(i + 1))
    const game = makeGame({ fixtures })
    expect(transferDeadlineWithin3Rounds(game)).toBe(false)
  })

  it('returnerar true vid runda 12 (3 omgångar kvar)', () => {
    const fixtures = Array.from({ length: 12 }, (_, i) => makeCompletedFixture(i + 1))
    const game = makeGame({ fixtures })
    expect(transferDeadlineWithin3Rounds(game)).toBe(true)
  })

  it('returnerar true vid runda 13 (2 omgångar kvar)', () => {
    const fixtures = Array.from({ length: 13 }, (_, i) => makeCompletedFixture(i + 1))
    const game = makeGame({ fixtures })
    expect(transferDeadlineWithin3Rounds(game)).toBe(true)
  })

  it('returnerar false vid runda 15 (deadline passerad)', () => {
    const fixtures = Array.from({ length: 15 }, (_, i) => makeCompletedFixture(i + 1))
    const game = makeGame({ fixtures })
    expect(transferDeadlineWithin3Rounds(game)).toBe(false)
  })
})
