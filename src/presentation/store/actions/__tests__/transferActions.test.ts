// ÖVERLÄMNING 2 (2026-08-12): verifierar sammanslagningen — respondToIncomingBid
// (Marknad) ska nu erbjuda samma tre utfall som resolveEvent (HÄNDELSE-kortet)
// och sätta samma pilotTransferBidRippleChain. Se transferBidRipplePilot.test.ts
// för den domän-nivå-verifieringen av själva kedjan (steg 1-3).
import { describe, it, expect } from 'vitest'
import { transferActions } from '../transferActions'
import { bidReceivedEvent } from '../../../../domain/services/events/eventFactories'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { TransferBid } from '../../../../domain/entities/GameEvent'
import type { Player } from '../../../../domain/entities/Player'
import type { Club } from '../../../../domain/entities/Club'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../../../domain/enums'

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
    clubs: [managedClub, buyingClub], players: [berg],
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

// Minimal get/set-mock, samma kontrakt actionsen förväntar sig.
function makeStore(initialGame: SaveGame) {
  let game: SaveGame | null = initialGame
  const get = () => ({ game })
  const set = (partial: Partial<{ game: SaveGame | null }>) => {
    if ('game' in partial) game = partial.game ?? null
  }
  return { get, set, getGame: () => game }
}

describe('ÖVERLÄMNING 2: respondToIncomingBid sammanslagen med resolveEvent', () => {
  it('erbjuder alla tre choice-id:n som bidReceivedEvent ger — inklusive counter', () => {
    const bid = makeBid()
    const game = makeGame({ transferBids: [bid] })
    const event = bidReceivedEvent(bid, game)
    expect(event.choices.map(c => c.id).sort()).toEqual(['accept', 'counter', 'reject'])
  })

  it('accept: sätter pilotTransferBidRippleChain, samma som resolveEvent-vägen', () => {
    const bid = makeBid()
    const store = makeStore(makeGame({ transferBids: [bid] }))
    const actions = transferActions(store.get, store.set)

    const result = actions.respondToIncomingBid('bid1', 'accept')
    expect(result.success).toBe(true)

    const after = store.getGame()
    expect(after?.pilotTransferBidRippleChain).toEqual({
      trigger: 'transfer_bid_accepted', subjectName: 'Anders Berg', round: 14, season: 2025,
      steps: [{ label: 'Kassan', dir: 'up', scope: 'club', magnitude: 'kraftigt' }],
    })
    expect(after?.players.find(p => p.id === 'berg')?.clubId).toBe('c2')
  })

  it('avslag: sätter Moralen-steget (scope player)', () => {
    const bid = makeBid()
    const store = makeStore(makeGame({ transferBids: [bid] }))
    const actions = transferActions(store.get, store.set)

    const result = actions.respondToIncomingBid('bid1', 'reject')
    expect(result.success).toBe(true)

    const after = store.getGame()
    expect(after?.pilotTransferBidRippleChain?.steps).toEqual([{ label: 'Moralen', dir: 'down', scope: 'player', magnitude: 'knappt' }])
  })

  it('kräv mer: NU tillgängligt från Marknad-vägen (tidigare bara resolveEvent) — kedjan tom', () => {
    const bid = makeBid()
    const store = makeStore(makeGame({ transferBids: [bid] }))
    const actions = transferActions(store.get, store.set)

    const result = actions.respondToIncomingBid('bid1', 'counter')
    expect(result.success).toBe(true)

    const after = store.getGame()
    expect(after?.pilotTransferBidRippleChain?.steps).toEqual([])
    expect(after?.transferBids?.find(b => b.id === 'bid1')?.offerAmount).toBeGreaterThan(250000)
  })

  it('sopar bort syskon-event-varianterna (aiaccept/aireject) i samma steg', () => {
    const bid = makeBid()
    const game = makeGame({
      transferBids: [bid],
      pendingEvents: [
        { id: 'event_bid_aiaccept_bid1', type: 'transferBidReceived', title: 't', body: 'b', choices: [], resolved: false },
      ],
    } as unknown as Partial<SaveGame>)
    const store = makeStore(game)
    const actions = transferActions(store.get, store.set)

    actions.respondToIncomingBid('bid1', 'accept')

    const after = store.getGame()
    expect(after?.pendingEvents?.some(e => e.id === 'event_bid_aiaccept_bid1')).toBe(false)
  })

  it('okänt choiceId (t.ex. counter när canCounter är false) ger ett fel, ändrar inget', () => {
    // counterCount redan 2 → canCounter blir false i bidReceivedEvent
    const bid = makeBid({ counterCount: 2 })
    const store = makeStore(makeGame({ transferBids: [bid] }))
    const actions = transferActions(store.get, store.set)

    const result = actions.respondToIncomingBid('bid1', 'counter')
    expect(result.success).toBe(false)
    expect(store.getGame()?.transferBids?.[0]).toEqual(bid)
  })
})

// O5 kraft 1 (Jacobs dom 2026-08-17, byggd 2026-08-23): renewContract-
// golvet skalar nu med klubbens rykte istf. vara en ren currentAbility-
// funktion. berg: currentAbility 72, isFullTimePro (inget dayJob).
describe('renewContract — O5 kraft 1, löneinflation med rykte', () => {
  it('avvisar en förlängning under golvet (rykte 60 → golv 12500)', () => {
    const store = makeStore(makeGame())
    const actions = transferActions(store.get, store.set)
    const result = actions.renewContract('berg', 12000, 2)
    expect(result.success).toBe(false)
    expect((result as { error?: string }).error).toMatch(/kräver minst/)
  })

  it('accepterar exakt golvet', () => {
    const store = makeStore(makeGame())
    const actions = transferActions(store.get, store.set)
    const result = actions.renewContract('berg', 12500, 2)
    expect(result.success).toBe(true)
  })

  it('en klubb med högre rykte har ett högre golv för samma spelare', () => {
    const highRepGame = makeGame({
      clubs: [makeClub({ id: 'c1', reputation: 90, squadPlayerIds: ['berg'] }), makeClub({ id: 'c2', name: 'Köparklubben', shortName: 'KÖP', squadPlayerIds: [] })],
    })
    const store = makeStore(highRepGame)
    const actions = transferActions(store.get, store.set)
    // rykte 90 → repFactor 1.4 → golv = round(72*200*0.8*1.4/500)*500 = 16000
    const belowHighRepFloor = actions.renewContract('berg', 13000, 2)
    expect(belowHighRepFloor.success).toBe(false)  // hade accepterats vid rykte 60 (golv 12500)
  })
})
