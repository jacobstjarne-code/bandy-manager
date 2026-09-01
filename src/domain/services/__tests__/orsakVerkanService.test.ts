import { describe, it, expect } from 'vitest'
import { captureDecisionRipple, getLatestDecisionConsequence } from '../orsakVerkanService'
import { resolveEvent } from '../events/eventResolver'
import { bidReceivedEvent } from '../events/eventFactories'
import type { SaveGame } from '../../entities/SaveGame'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { TransferBid } from '../../entities/GameEvent'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../enums'

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 1. Samma bevisade
 * scenario som transferBidRipplePilot.test.ts (accept→Kassan, avslag→
 * Moralen, kräv mer→tom) — här verifieras att SAMMA resolution också
 * skriver (eller medvetet INTE skriver) en EventLedgerEntry, sida vid
 * sida med den orörda pilotTransferBidRippleChain.
 */

const defaultTactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Passive,
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'berg', firstName: 'Anders', lastName: 'Berg',
    age: 27, nationality: 'SE', clubId: 'c1', isHomegrown: false,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.Finisher,
    salary: 15000, contractUntilSeason: 2027, marketValue: 300000,
    morale: 70, form: 65, fitness: 80, sharpness: 70,
    currentAbility: 72, potentialAbility: 75, developmentRate: 50,
    injuryProneness: 30, discipline: 60,
    attributes: { skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60, shooting: 65, dribbling: 60, vision: 60, decisions: 60, workRate: 60, positioning: 60, defending: 40, cornerSkill: 40, goalkeeping: 10 },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  } as Player
}

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1', name: 'Managed FK', shortName: 'MFK', region: 'Mälardalen',
    reputation: 60, finances: 500000, wageBudget: 200000, transferBudget: 500000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50, facilities: 60,
    boardExpectation: ClubExpectation.MidTable, fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced, hasArtificialIce: false,
    activeTactic: defaultTactic, squadPlayerIds: ['berg'],
    ...overrides,
  } as Club
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const managedClub = makeClub({ id: 'c1', squadPlayerIds: ['berg'] })
  const buyingClub = makeClub({ id: 'c2', name: 'Köparklubben', shortName: 'KÖP', squadPlayerIds: [] })
  const berg = makePlayer({ id: 'berg', clubId: 'c1' })

  return {
    id: 'g1', managerName: 'Test', managedClubId: 'c1',
    currentDate: '2025-09-15', currentSeason: 2025, currentMatchday: 14,
    clubs: [managedClub, buyingClub],
    players: [berg],
    league: { id: 'l1', name: 'Test League', season: 2025 },
    fixtures: [], standings: [], inbox: [],
    transferState: { freeAgents: [], pendingOffers: [] },
    youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
    trainingHistory: [], playoffBracket: null, cupBracket: null, seasonSummaries: [],
    pendingScreen: null, scoutReports: {}, activeScoutAssignment: null, scoutBudget: 10,
    pendingEvents: [], transferBids: [], version: '0.1.0', lastSavedAt: '2025-01-01T00:00:00Z',
    fanMood: 50, communityStanding: 50, boardPatience: 70, sponsorNetworkMood: 50,
    supporterGroup: { mood: 50 } as SaveGame['supporterGroup'],
    ...overrides,
  } as unknown as SaveGame
}

function makeBid(overrides: Partial<TransferBid> = {}): TransferBid {
  return {
    id: 'bid1', playerId: 'berg', buyingClubId: 'c2', sellingClubId: 'c1',
    offerAmount: 250000, offeredSalary: 20000, contractYears: 3,
    direction: 'incoming', status: 'pending', createdRound: 14, expiresRound: 16,
    ...overrides,
  } as TransferBid
}

describe('captureDecisionRipple', () => {
  it('returnerar null när beslutet inte rörde något ripple-bärande fält (trivial-brus-golvet)', () => {
    const game = makeGame()
    const result = captureDecisionRipple(game, game, 'noop_choice', 2025, 14)
    expect(result).toBeNull()
  })

  it('bygger en EventLedgerEntry med consequences när kedjan har minst ett steg', () => {
    const before = makeGame()
    const after = { ...before, fanMood: 60, boardPatience: 75 }
    const entry = captureDecisionRipple(before, after, 'sell_academy_product', 2025, 14, 'berg', 'c1')
    expect(entry).not.toBeNull()
    expect(entry?.type).toBe('decision')
    expect(entry?.semanticKey).toBe('sell_academy_product')
    expect(entry?.season).toBe(2025)
    expect(entry?.matchday).toBe(14)
    // subjectPlayerId prioriteras framför subjectClubId när bägge finns (samma
    // konvention som pilotTransferBidTrigger — spelaren är beslutets kärna).
    expect(entry?.subject).toEqual({ kind: 'player', id: 'berg' })
    expect(entry?.madeByPlayer).toBe(true)
    expect(entry?.consequences).toEqual([
      { field: 'fanMood', dir: 'up', magnitude: 'kraftigt' }, // delta 10 >= humorMagnitude-tröskeln för kraftigt
      { field: 'boardPatience', dir: 'up', magnitude: 'tydligt' },
    ])
  })

  it('subject: kind club när ingen spelare finns', () => {
    const before = makeGame()
    const after = { ...before, fanMood: 60 }
    const entry = captureDecisionRipple(before, after, 'k', 2025, 14, undefined, 'c1')
    expect(entry?.subject).toEqual({ kind: 'club', id: 'c1' })
  })

  it('subject: undefined när varken spelare eller klubb anges', () => {
    const before = makeGame()
    const after = { ...before, fanMood: 60 }
    const entry = captureDecisionRipple(before, after, 'k', 2025, 14)
    expect(entry?.subject).toBeUndefined()
  })

  it('significance: Styrelse-inblandning ger bonus ovanpå den högsta stegmagnituden', () => {
    const before = makeGame()
    const withoutBoard = captureDecisionRipple(before, { ...before, fanMood: 65 }, 'k', 2025, 14) // kraftigt, ingen styrelse
    const withBoard = captureDecisionRipple(before, { ...before, fanMood: 65, boardPatience: 72 }, 'k', 2025, 14) // kraftigt + knappt styrelse
    expect(withoutBoard?.significance).toBe(75) // MAGNITUDE_SIGNIFICANCE.kraftigt
    expect(withBoard?.significance).toBe(90) // + BOARD_INVOLVED_BONUS — under 100-taket, klampen tar aldrig i med dagens konstanter (75 max + 15 bonus = 90)
  })
})

describe('getLatestDecisionConsequence', () => {
  const a: EventLedgerEntry = { type: 'decision', semanticKey: 'a', season: 2025, matchday: 10, significance: 40 }
  const b: EventLedgerEntry = { type: 'decision', semanticKey: 'b', season: 2025, matchday: 14, significance: 50 }
  const c: EventLedgerEntry = { type: 'decision', semanticKey: 'c', season: 2025, matchday: 14, significance: 60 }
  const otherType: EventLedgerEntry = { type: 'big_win', semanticKey: 'd', season: 2025, matchday: 14, significance: 70 }

  it('returnerar den SENASTE decision-posten för innevarande säsong+omgång', () => {
    const game = { ...makeGame(), eventLedger: [a, b, c, otherType] }
    expect(getLatestDecisionConsequence(game, 2025, 14)).toEqual(c)
  })

  it('undefined när ingen post matchar säsong+omgång', () => {
    const game = { ...makeGame(), eventLedger: [a] }
    expect(getLatestDecisionConsequence(game, 2025, 14)).toBeUndefined()
  })

  it('undefined när game.eventLedger saknas helt', () => {
    const game = makeGame()
    expect(getLatestDecisionConsequence(game, 2025, 14)).toBeUndefined()
  })
})

describe('eventResolver — Fas 1 write-hook (samma tre transferbudsutfall som transferBidRipplePilot.test.ts)', () => {
  it('accept: skriver en liggarpost med Kassan-konsekvensen', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'accept', undefined, true)

    // TVÅ poster nu: transferBidReceived/accept kvalificerar SAMTIDIGT som
    // A-H9-kandidat (Fas 2-dual-write, skriven först i eventResolver.ts) OCH
    // producerar en ripple (Fas 1:s generiska infångare, skriven senare) —
    // olika frågor (var det säsongens beslut? / vad skalvade?), samma resolution.
    expect(after.eventLedger).toHaveLength(2)
    const [decisionEntry, rippleEntry] = after.eventLedger ?? []
    expect(decisionEntry.type).toBe('decision')
    expect(decisionEntry.semanticKey).toBe('transferBidReceived')
    expect(decisionEntry.subject).toEqual({ kind: 'player', id: 'berg' })
    expect(decisionEntry.irreversible).toBe(true) // Fas 2:s A-H9-fält — bara på decision-kandidatens post
    expect(decisionEntry).not.toHaveProperty('consequences')

    expect(rippleEntry.type).toBe('decision')
    expect(rippleEntry.semanticKey).toBe('transferBidReceived')
    expect(rippleEntry.subject).toEqual({ kind: 'player', id: 'berg' }) // relatedPlayerId prioriterat framför relatedClubId
    expect(rippleEntry.madeByPlayer).toBe(true)
    expect(rippleEntry.consequences).toEqual([{ field: 'finances', dir: 'up', magnitude: 'kraftigt' }])
    expect(rippleEntry.irreversible).toBeUndefined() // Fas 1:s generiska post sätter aldrig A-H9-fälten
  })

  it('avslag: skriver en liggarpost med Moralen-konsekvensen', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'reject', undefined, true)

    expect(after.eventLedger).toHaveLength(1)
    expect(after.eventLedger?.[0].consequences).toEqual([{ field: 'playerMorale', dir: 'down', magnitude: 'knappt' }])
  })

  it('kräv mer: skriver INGEN liggarpost (tom kedja, trivial-brus-golvet)', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'counter', undefined, true)

    expect(after.eventLedger ?? []).toHaveLength(0)
  })

  it('madeByPlayer=false: skriver INGEN liggarpost även om kedjan skulle ha innehåll (HIGH 6-grinden)', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'accept', undefined, false)

    expect(after.eventLedger ?? []).toHaveLength(0)
  })

  it('pilotTransferBidRippleChain rörs inte av det nya skrivblocket — bägge lever parallellt', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    const gameWithEvent = { ...game, pendingEvents: [event] }

    const after = resolveEvent(gameWithEvent, event.id, 'accept', undefined, true)

    expect(after.pilotTransferBidRippleChain?.steps).toEqual([{ label: 'Kassan', dir: 'up', scope: 'club', magnitude: 'kraftigt' }])
    expect(after.eventLedger).toHaveLength(2) // Fas 2 (decision-kandidat) + Fas 1 (ripple) — se testet ovan
  })
})
