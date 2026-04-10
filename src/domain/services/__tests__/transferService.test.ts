import { describe, it, expect } from 'vitest'
import { generateIncomingBids, resolveOutgoingBid, executeTransfer, createOutgoingBid } from '../transferService'
import type { SaveGame } from '../../entities/SaveGame'
import type { TransferBid } from '../../entities/GameEvent'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, FixtureStatus, ClubExpectation, ClubStyle, PlayoffStatus } from '../../enums'

const defaultTactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Passive,
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1', firstName: 'Test', lastName: 'Player',
    age: 24, nationality: 'SE', clubId: 'c2', isHomegrown: false,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.Finisher,
    salary: 10000, contractUntilSeason: 2026, marketValue: 200000,
    morale: 70, form: 65, fitness: 80, sharpness: 70,
    currentAbility: 65, potentialAbility: 75, developmentRate: 50,
    injuryProneness: 30, discipline: 60,
    attributes: { skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60, shooting: 60, dribbling: 60, vision: 60, decisions: 60, workRate: 60, positioning: 60, defending: 40, cornerSkill: 40, goalkeeping: 10 },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  }
}

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1', name: 'Managed FK', shortName: 'MFK', region: 'Mälardalen',
    reputation: 60, finances: 1000000, wageBudget: 200000, transferBudget: 500000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50, facilities: 60,
    boardExpectation: ClubExpectation.MidTable, fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced, hasArtificialIce: false,
    activeTactic: defaultTactic, squadPlayerIds: ['own1'],
    ...overrides,
  }
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const managedClub = makeClub({ id: 'c1', squadPlayerIds: ['own1'] })
  const otherClub = makeClub({ id: 'c2', name: 'Other FK', shortName: 'OFK', squadPlayerIds: ['p1'] })
  const ownPlayer = makePlayer({ id: 'own1', clubId: 'c1', currentAbility: 70, contractUntilSeason: 2026 })
  const otherPlayer = makePlayer({ id: 'p1', clubId: 'c2' })

  return {
    id: 'g1', managerName: 'Test', managedClubId: 'c1',
    currentDate: '2025-09-15',  // pre-season window open
    currentSeason: 2025,
    clubs: [managedClub, otherClub],
    players: [ownPlayer, otherPlayer],
    league: { id: 'l1', name: 'Test League', season: 2025 },
    fixtures: [],
    standings: [],
    inbox: [],
    transferState: { freeAgents: [], pendingOffers: [] },
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    seasonSummaries: [],
    showSeasonSummary: false,
    scoutReports: { p1: { playerId: 'p1', clubId: 'c2', scoutedDate: '2025-05-01', scoutedSeason: 2025, accuracy: 70, revealedAttributes: {}, estimatedCA: 64, estimatedPA: 74, notes: 'Bra' } },
    activeScoutAssignment: null,
    scoutBudget: 10,
    pendingEvents: [],
    transferBids: [],
    version: '0.1.0',
    lastSavedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const alwaysRand = () => 1.0  // never triggers 15% chance (> 0.15 → true → skip)
const alwaysBid = () => 0.05  // always triggers bid (0.05 < 0.15)

describe('generateIncomingBids', () => {
  it('returns at most 1 bid per call', () => {
    const game = makeGame()
    const bids = generateIncomingBids(game, 5, alwaysBid)
    expect(bids.length).toBeLessThanOrEqual(1)
  })

  it('returns 0 bids when window is closed', () => {
    const game = makeGame({ currentDate: '2025-03-15' })  // closed
    const bids = generateIncomingBids(game, 5, alwaysBid)
    expect(bids.length).toBe(0)
  })

  it('returns 0 bids when an incoming bid is already active', () => {
    const existingBid: TransferBid = {
      id: 'b1', playerId: 'own1', buyingClubId: 'c2', sellingClubId: 'c1',
      offerAmount: 200000, offeredSalary: 12000, contractYears: 3,
      direction: 'incoming', status: 'pending', createdRound: 3, expiresRound: 6,
    }
    const game = makeGame({ transferBids: [existingBid] })
    const bids = generateIncomingBids(game, 5, alwaysBid)
    expect(bids.length).toBe(0)
  })

  it('bid amount is 80–140% of market value', () => {
    // Run multiple times with different rand seeds to cover range
    const game = makeGame()
    const player = game.players.find(p => p.clubId === 'c1')!
    for (let seed = 0.01; seed < 0.15; seed += 0.02) {
      let calls = 0
      const rand = () => { calls++; return calls === 1 ? seed : 0.5 }
      const bids = generateIncomingBids(game, 5, rand)
      if (bids.length > 0) {
        const ratio = bids[0].offerAmount / player.marketValue
        expect(ratio).toBeGreaterThanOrEqual(0.78)  // small rounding tolerance
        expect(ratio).toBeLessThanOrEqual(1.42)
      }
    }
  })
})

describe('resolveOutgoingBid', () => {
  it('accepts at 120%+ of market value', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: Math.round(200000 * 1.25), offeredSalary: 12000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4,
    }
    expect(resolveOutgoingBid(bid, game, () => 0.5)).toBe('accepted')
  })

  it('counter-offers at 70-90% of market value (first attempt)', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: Math.round(200000 * 0.7), offeredSalary: 12000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4,
    }
    expect(resolveOutgoingBid(bid, game, () => 0.5)).toBe('counter')
  })

  it('rejects below 70% of market value', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: Math.round(200000 * 0.5), offeredSalary: 12000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4,
    }
    expect(resolveOutgoingBid(bid, game, () => 0.5)).toBe('rejected')
  })
})

describe('executeTransfer', () => {
  it('moves player to buying club', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 200000, offeredSalary: 15000, contractYears: 3,
      direction: 'outgoing', status: 'accepted', createdRound: 3, expiresRound: 4,
    }
    const result = executeTransfer(game, bid)
    const movedPlayer = result.players.find(p => p.id === 'p1')!
    expect(movedPlayer.clubId).toBe('c1')
    expect(movedPlayer.salary).toBe(15000)
  })

  it('updates finances correctly', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 200000, offeredSalary: 15000, contractYears: 3,
      direction: 'outgoing', status: 'accepted', createdRound: 3, expiresRound: 4,
    }
    const result = executeTransfer(game, bid)
    const buyer = result.clubs.find(c => c.id === 'c1')!
    const seller = result.clubs.find(c => c.id === 'c2')!
    expect(buyer.finances).toBe(1000000 - 200000)
    expect(seller.finances).toBe(1000000 + 200000)
  })

  it('updates squadPlayerIds', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 200000, offeredSalary: 15000, contractYears: 3,
      direction: 'outgoing', status: 'accepted', createdRound: 3, expiresRound: 4,
    }
    const result = executeTransfer(game, bid)
    const buyer = result.clubs.find(c => c.id === 'c1')!
    const seller = result.clubs.find(c => c.id === 'c2')!
    expect(buyer.squadPlayerIds).toContain('p1')
    expect(seller.squadPlayerIds).not.toContain('p1')
  })
})

describe('createOutgoingBid', () => {
  it('fails when window is closed', () => {
    const game = makeGame({ currentDate: '2025-03-01' })
    const result = createOutgoingBid(game, 'p1', 200000, 12000, 3, 5)
    expect(result.success).toBe(false)
  })

  it('fails when player is not scouted', () => {
    const game = makeGame({ scoutReports: {} })
    const result = createOutgoingBid(game, 'p1', 200000, 12000, 3, 5)
    expect(result.success).toBe(false)
  })

  it('succeeds with valid bid', () => {
    const game = makeGame()
    const result = createOutgoingBid(game, 'p1', 200000, 12000, 3, 5)
    expect(result.success).toBe(true)
    expect(result.bid).toBeDefined()
    expect(result.bid!.playerId).toBe('p1')
  })
})
