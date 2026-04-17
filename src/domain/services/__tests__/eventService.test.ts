import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents, resolveEvent } from '../eventService'
import type { SaveGame } from '../../entities/SaveGame'
import type { TransferBid } from '../../entities/GameEvent'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../enums'

const defaultTactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Passive,
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1', firstName: 'Test', lastName: 'Player', age: 26, nationality: 'SE',
    clubId: 'c1', isHomegrown: false, position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher, salary: 10000, contractUntilSeason: 2026,
    marketValue: 200000, morale: 70, form: 65, fitness: 80, sharpness: 70,
    currentAbility: 65, potentialAbility: 75, developmentRate: 50, injuryProneness: 30, discipline: 60,
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
    activeTactic: defaultTactic, squadPlayerIds: ['p1'],
    ...overrides,
  }
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1', managerName: 'Test', managedClubId: 'c1',
    currentDate: '2025-06-15', currentSeason: 2025,
    clubs: [makeClub(), makeClub({ id: 'c2', name: 'Other FK', shortName: 'OFK' })],
    players: [makePlayer()],
    league: { id: 'l1', name: 'Test League', season: 2025 },
    fixtures: [], standings: [], inbox: [],
    transferState: { freeAgents: [], pendingOffers: [] },
    youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [], playoffBracket: null, cupBracket: null, seasonSummaries: [],
    pendingScreen: null, scoutReports: {}, activeScoutAssignment: null, scoutBudget: 10,
    pendingEvents: [], transferBids: [],
    version: '0.1.0', lastSavedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

const noRand = () => 0.99  // suppress star performance

describe('generatePostAdvanceEvents', () => {
  it('returns at most 2 events', () => {
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c2', sellingClubId: 'c1',
      offerAmount: 200000, offeredSalary: 12000, contractYears: 3,
      direction: 'incoming', status: 'pending', createdRound: 5, expiresRound: 8,
    }
    const game = makeGame()
    const events = generatePostAdvanceEvents(game, [bid], 5, noRand)
    expect(events.length).toBeLessThanOrEqual(2)
  })

  it('transfer bid event has 3 choices', () => {
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c2', sellingClubId: 'c1',
      offerAmount: 200000, offeredSalary: 12000, contractYears: 3,
      direction: 'incoming', status: 'pending', createdRound: 5, expiresRound: 8,
    }
    const game = makeGame()
    const events = generatePostAdvanceEvents(game, [bid], 5, noRand)
    const bidEvent = events.find(e => e.type === 'transferBidReceived')
    expect(bidEvent).toBeDefined()
    expect(bidEvent!.choices.length).toBe(3)
  })

  it('contract request generated when player has < 1 season left and CA > 50', () => {
    const player = makePlayer({ currentAbility: 60, contractUntilSeason: 2025 })
    const game = makeGame({ players: [player] })
    const events = generatePostAdvanceEvents(game, [], 5, noRand)
    expect(events.some(e => e.type === 'contractRequest')).toBe(true)
  })

  it('no contract request when CA <= 50', () => {
    const player = makePlayer({ currentAbility: 45, contractUntilSeason: 2025 })
    const game = makeGame({ players: [player] })
    const events = generatePostAdvanceEvents(game, [], 5, noRand)
    expect(events.some(e => e.type === 'contractRequest')).toBe(false)
  })
})

describe('resolveEvent with acceptTransfer', () => {
  it('moves player to buying club', () => {
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c2', sellingClubId: 'c1',
      offerAmount: 200000, offeredSalary: 15000, contractYears: 3,
      direction: 'incoming', status: 'pending', createdRound: 5, expiresRound: 8,
    }
    const event = {
      id: 'e1', type: 'transferBidReceived' as const, title: 'T', body: 'B',
      choices: [{ id: 'accept', label: 'Acceptera', effect: { type: 'acceptTransfer' as const, bidId: 'b1', targetPlayerId: 'p1', targetClubId: 'c2' } }],
      relatedPlayerId: 'p1', relatedClubId: 'c2', relatedBidId: 'b1', resolved: false,
    }
    const game = makeGame({ transferBids: [bid], pendingEvents: [event] })
    const result = resolveEvent(game, 'e1', 'accept')
    const movedPlayer = result.players.find(p => p.id === 'p1')!
    expect(movedPlayer.clubId).toBe('c2')
    expect(result.pendingEvents.length).toBe(0)
  })
})

describe('resolveEvent with extendContract', () => {
  it('extends contract by 3 years', () => {
    const player = makePlayer({ contractUntilSeason: 2025 })
    const event = {
      id: 'e1', type: 'contractRequest' as const, title: 'T', body: 'B',
      choices: [{ id: 'extend3', label: 'Förläng 3 år', effect: { type: 'extendContract' as const, targetPlayerId: 'p1', value: 12000 } }],
      relatedPlayerId: 'p1', resolved: false,
    }
    const game = makeGame({ players: [player], pendingEvents: [event] })
    const result = resolveEvent(game, 'e1', 'extend3')
    const updatedPlayer = result.players.find(p => p.id === 'p1')!
    expect(updatedPlayer.contractUntilSeason).toBe(2028)
    expect(updatedPlayer.salary).toBe(12000)
  })
})
