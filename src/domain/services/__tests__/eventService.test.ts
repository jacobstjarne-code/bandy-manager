import { describe, it, expect } from 'vitest'
import { generateDayJobConflictEvent, generatePostAdvanceEvents, resolveEvent } from '../eventService'
import { bidWarEvent, generatePromotionOfferEvent, generateShiftConflictEvent } from '../events/eventFactories'
import type { SaveGame } from '../../entities/SaveGame'
import type { TransferBid } from '../../entities/GameEvent'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import type { Fixture } from '../../entities/Fixture'
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

  it('starPerformance grundas i senaste matchens 8,5+-betyg och ger exakt +5 moral', () => {
    const fixture = {
      id: 'f-star', leagueId: 'l1', season: 2025, roundNumber: 6, matchday: 6,
      homeClubId: 'c1', awayClubId: 'c2', homeScore: 4, awayScore: 1,
      status: 'completed', events: [], report: { playerRatings: { p1: 8.7 } },
    } as unknown as Fixture
    const game = makeGame({ fixtures: [fixture], currentMatchday: 6 })
    const events = generatePostAdvanceEvents(game, [], 6, () => 0.75)
    const event = events.find(e => e.type === 'starPerformance')

    expect(event).toMatchObject({
      id: 'event_star_p1_6',
      relatedPlayerId: 'p1',
      rotationKey: 'star_performance_p1',
      choices: [{ id: 'ok', effect: { type: 'boostMorale', targetPlayerId: 'p1', value: 5 } }],
    })
    expect(event?.body).toContain('8,7')

    const resolved = resolveEvent({ ...game, pendingEvents: [event!] }, event!.id, 'ok', undefined, true)
    expect(resolved.players.find(p => p.id === 'p1')?.morale).toBe(75)
    expect(resolved.narrativeBeatLog?.at(-1)?.semanticKey).toBe('starPerformance')
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
    const result = resolveEvent(game, 'e1', 'accept', undefined, true)
    const movedPlayer = result.players.find(p => p.id === 'p1')!
    expect(movedPlayer.clubId).toBe('c2')
    expect(result.pendingEvents.length).toBe(0)
  })
})

describe('bidWar — höjning är ett bud, inte en omedelbar betalning eller garanti', () => {
  it('höjer 30 %, förlänger fristen en omgång och lämnar ekonomin orörd tills affären accepteras', () => {
    const bid: TransferBid = {
      id: 'out-1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 100000, offeredSalary: 15000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 5, expiresRound: 6,
    }
    const game = makeGame({ transferBids: [bid] })
    const event = bidWarEvent(bid, game)
    const raise = event.choices.find(choice => choice.id === 'raise')!
    const financesBefore = game.clubs.find(club => club.id === 'c1')!.finances
    const budgetBefore = game.clubs.find(club => club.id === 'c1')!.transferBudget

    const result = resolveEvent({ ...game, pendingEvents: [event] }, event.id, raise.id, undefined, true)
    const updatedBid = result.transferBids!.find(candidate => candidate.id === bid.id)!

    expect(updatedBid).toMatchObject({ offerAmount: 130000, expiresRound: 7, status: 'pending' })
    expect(result.clubs.find(club => club.id === 'c1')?.finances).toBe(financesBefore)
    expect(result.clubs.find(club => club.id === 'c1')?.transferBudget).toBe(budgetBefore)
    expect(raise.subtitle).toBeUndefined()
    expect(event.body).not.toContain('säkra affären')
  })
})

describe('resolveEvent with extendContract', () => {
  it('extends contract by 3 years', () => {
    const player = makePlayer({ contractUntilSeason: 2025 })
    const event = {
      id: 'e1', type: 'contractRequest' as const, title: 'T', body: 'B',
      choices: [{ id: 'extend3', label: 'Förläng 3 år', effect: { type: 'extendContract' as const, targetPlayerId: 'p1', value: 12000, contractYears: 3 } }],
      relatedPlayerId: 'p1', resolved: false,
    }
    const game = makeGame({ players: [player], pendingEvents: [event] })
    const result = resolveEvent(game, 'e1', 'extend3', undefined, true)
    const updatedPlayer = result.players.find(p => p.id === 'p1')!
    expect(updatedPlayer.contractUntilSeason).toBe(2028)
    expect(updatedPlayer.salary).toBe(12000)
  })
})

describe('dayJobConflict — deklarerad text har verklig state-effekt', () => {
  const dayJob = { title: 'Lärare', flexibility: 55, weeklyIncome: 2000 }

  it('"Ge honom vila" ger moral och spärrar spelaren i exakt nästa match', () => {
    const player = makePlayer({ morale: 70, dayJob, isFullTimePro: false })
    const event = generateDayJobConflictEvent(player, 6)
    const game = makeGame({ players: [player], pendingEvents: [event], currentMatchday: 6 })

    const result = resolveEvent(game, event.id, 'vila', undefined, true)
    const updated = result.players[0]

    expect(updated.morale).toBe(80)
    expect(updated.restGamesRemaining).toBe(1)
  })

  it('press-valets negativa moral klampas vid noll och lovar ingen okodad skaderisk', () => {
    const player = makePlayer({ morale: 1, dayJob, isFullTimePro: false })
    const event = generateDayJobConflictEvent(player, 6)
    const choice = event.choices.find(c => c.id === 'press')!
    const game = makeGame({ players: [player], pendingEvents: [event] })

    const result = resolveEvent(game, event.id, choice.id, undefined, true)

    expect(choice.subtitle).toBe('-3 moral')
    expect(result.players[0].morale).toBe(0)
    expect(result.players[0].isInjured).toBe(false)
  })

  it('heltidskontraktet tar bort dagjobbet, höjer lönen 1,5× och skapar spelarens storyline', () => {
    const player = makePlayer({ morale: 70, salary: 10000, dayJob, isFullTimePro: false })
    const event = generateDayJobConflictEvent(player, 6)
    const game = makeGame({ players: [player], pendingEvents: [event], currentMatchday: 6 })

    const result = resolveEvent(game, event.id, 'goPro', undefined, true)
    const updated = result.players[0]

    expect(updated).toMatchObject({ isFullTimePro: true, salary: 15000, morale: 85 })
    expect(updated.dayJob).toBeUndefined()
    expect(result.storylines?.at(-1)).toMatchObject({ type: 'went_fulltime_pro', playerId: player.id })
  })

  it('schemakrockens bänkval använder samma enmatchsvila och promotionen ändrar bara utlovad moral', () => {
    const player = makePlayer({ morale: 70, dayJob, isFullTimePro: false })
    const shift = generateShiftConflictEvent(player, 7)
    const shifted = resolveEvent(makeGame({ players: [player], pendingEvents: [shift] }), shift.id, 'bench', undefined, true)
    expect(shifted.players[0]).toMatchObject({ morale: 65, restGamesRemaining: 1 })

    const promotion = generatePromotionOfferEvent(player, 2025)
    const promoted = resolveEvent(makeGame({ players: [player], pendingEvents: [promotion] }), promotion.id, 'encourage', undefined, true)
    expect(promotion.id).toBe('event_promotion_p1_s2025')
    expect(promoted.players[0].morale).toBe(78)
    expect(promoted.players[0].dayJob).toEqual(dayJob)
  })

  it('samma spelares redan lösta befordran genereras inte igen samma säsong', () => {
    const player = makePlayer({ morale: 70, dayJob: { ...dayJob, flexibility: 75 }, isFullTimePro: false })
    const fresh = generatePostAdvanceEvents(makeGame({ players: [player] }), [], 6, () => 0)
    expect(fresh.some(event => event.id === 'event_promotion_p1_s2025')).toBe(true)

    const game = makeGame({ players: [player], resolvedEventIds: ['event_promotion_p1_s2025'] })
    const events = generatePostAdvanceEvents(game, [], 6, () => 0)

    expect(events.some(event => event.id === 'event_promotion_p1_s2025')).toBe(false)
  })
})
