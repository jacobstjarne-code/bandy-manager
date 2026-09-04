import { describe, it, expect } from 'vitest'
import { generateIncomingBids, resolveOutgoingBid, executeTransfer, createOutgoingBid, computeBidChance, computePositionFactor, weightedPickIndex, weightedPickIndexByWeights, computeMoraleBidWeight, computeMoraleAcceptanceBonus, playerAcceptsTransfer, getCounterOfferAmount, getTransferBudgetSummary } from '../transferService'
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
    pendingScreen: null,
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

// DOM_FRAMGANGSKURVAN_2026-08-27 anspråk 2 — "Framgång kostar folk". Jacobs dom:
// budfrekvensen ska skala med föregående säsongs slutplacering + rykte, och
// buden ska rikta sig mot klubbens bästa spelare oftare än slumpmässigt.
describe('computeBidChance — framgångskurvan skalar bud-frekvensen', () => {
  it('en nykrönt mästare (position 1, rykte 60) har högre bud-chans än ett mittenlag (position 8, rykte 60)', () => {
    const champion = makeClub({ id: 'c1', reputation: 60 })
    const midTable = makeClub({ id: 'c1', reputation: 60 })
    const championChance = computeBidChance(champion, { finalPosition: 1 }, 1.0)
    const midTableChance = computeBidChance(midTable, { finalPosition: 8 }, 1.0)
    expect(championChance).toBeGreaterThan(midTableChance)
    // Konkreta värden: positionFactor 2.2 vs 1.0, reputationFactor 1.1 båda →
    // successFactor 2.42 vs 1.1 → bidChance 0.15*2.42=0.363 vs 0.15*1.1=0.165
    expect(championChance).toBeCloseTo(0.363, 3)
    expect(midTableChance).toBeCloseTo(0.165, 3)
  })

  it('positionFactor trappar korrekt över alla placeringsband', () => {
    expect(computePositionFactor(1)).toBe(2.2)
    expect(computePositionFactor(2)).toBe(1.6)
    expect(computePositionFactor(3)).toBe(1.6)
    expect(computePositionFactor(4)).toBe(1.2)
    expect(computePositionFactor(6)).toBe(1.2)
    expect(computePositionFactor(7)).toBe(1.0)
    expect(computePositionFactor(9)).toBe(1.0)
    expect(computePositionFactor(10)).toBe(0.6)
    expect(computePositionFactor(12)).toBe(0.6)
  })

  it('säsong 1 (ingen seasonStartSnapshot) faller tillbaka till neutral positionFactor (1.0)', () => {
    expect(computePositionFactor(undefined)).toBe(1.0)
    const club = makeClub({ id: 'c1', reputation: 60 })
    const chance = computeBidChance(club, undefined, 1.0)
    // positionFactor 1.0 * reputationFactor 1.1 = successFactor 1.1 → 0.15*1.1=0.165
    expect(chance).toBeCloseTo(0.165, 3)
  })

  it('bidChance är alltid begränsad till [0, 0.6] — även en extremt framgångsrik, populär klubb', () => {
    const club = makeClub({ id: 'c1', reputation: 100 })
    const chance = computeBidChance(club, { finalPosition: 1 }, 3.0) // högsta bidMult samtidigt
    expect(chance).toBeLessThanOrEqual(0.6)
  })

  it('bidMult (hot_transfer_market-signaturen) förblir en oberoende multiplikativ faktor', () => {
    const club = makeClub({ id: 'c1', reputation: 60 })
    const normal = computeBidChance(club, { finalPosition: 8 }, 1.0)
    const hot = computeBidChance(club, { finalPosition: 8 }, 1.5)
    expect(hot).toBeCloseTo(normal * 1.5, 5)
  })
})

describe('weightedPickIndex — rank-viktat urval favoriserar de bästa spelarna', () => {
  it('index 0 (bäst) väljs oftare än en jämn fördelning skulle ge, över många försök', () => {
    const poolSize = 5
    const trials = 20_000
    let seed = 1
    // enkel deterministisk pseudo-rand (LCG) för reproducerbarhet
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const counts = new Array(poolSize).fill(0)
    for (let i = 0; i < trials; i++) {
      counts[weightedPickIndex(poolSize, rand)]++
    }
    const uniformShare = 1 / poolSize // 0.20
    const bestShare = counts[0] / trials
    const worstShare = counts[poolSize - 1] / trials
    expect(bestShare).toBeGreaterThan(uniformShare * 1.5) // meningsfullt över jämnt (0.30+)
    expect(bestShare).toBeGreaterThan(worstShare)
  })

  it('poolSize 1 väljer alltid index 0 utan att anropa rand meningsfullt', () => {
    expect(weightedPickIndex(1, () => 0.99)).toBe(0)
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

  it('accepterar sitt eget motbud även när spelaren är säljarklubbens bästa', () => {
    const game = makeGame()
    const initial: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 140000, offeredSalary: 12000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4,
    }
    const revised = { ...initial, offerAmount: getCounterOfferAmount(initial, game).amount, counterCount: 1 }
    expect(resolveOutgoingBid(revised, game, () => 0)).toBe('accepted')
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

  it('tenure-falt-joinedclubseason: sätter joinedClubSeason till innevarande säsong', () => {
    const game = makeGame()
    const bid: TransferBid = {
      id: 'b1', playerId: 'p1', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 200000, offeredSalary: 15000, contractYears: 3,
      direction: 'outgoing', status: 'accepted', createdRound: 3, expiresRound: 4,
    }
    const result = executeTransfer(game, bid)
    const movedPlayer = result.players.find(p => p.id === 'p1')!
    expect(movedPlayer.joinedClubSeason).toBe(game.currentSeason)
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
  it('binder aktiva bud och exponerar total, bunden och tillgänglig budget', () => {
    const pending: TransferBid = {
      id: 'pending', playerId: 'p2', buyingClubId: 'c1', sellingClubId: 'c2',
      offerAmount: 350000, offeredSalary: 12000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 6,
    }
    const game = makeGame({ transferBids: [pending] })

    expect(getTransferBudgetSummary(game)).toEqual({
      total: 500000,
      committed: 350000,
      available: 150000,
    })
    expect(createOutgoingBid(game, 'p1', 200000, 12000, 3, 5)).toMatchObject({
      success: false,
      error: expect.stringContaining('tillgänglig transferbudget'),
    })
  })

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

  // O5 kraft 1 (Jacobs dom 2026-08-17, byggd 2026-08-23): offeredSalary
  // hade tidigare ingen valideringsgräns alls — löneinflationen kräver att
  // ett för lågt bud avvisas, skalat mot KÖPANDE klubbs rykte.
  describe('O5 kraft 1 — löneinflation med rykte (minSalary-golv)', () => {
    it('avvisar ett bud under golvet (rykte 60, currentAbility 65 → golv 11500)', () => {
      const game = makeGame()
      const result = createOutgoingBid(game, 'p1', 200000, 11000, 3, 5)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/kräver minst/)
    })

    it('accepterar exakt golvet', () => {
      const game = makeGame()
      const result = createOutgoingBid(game, 'p1', 200000, 11500, 3, 5)
      expect(result.success).toBe(true)
    })

    it('en klubb med lägre rykte har ett lägre golv för samma spelare', () => {
      const lowRepGame = makeGame({ clubs: [makeClub({ id: 'c1', reputation: 30, squadPlayerIds: ['own1'] }), makeClub({ id: 'c2', name: 'Other FK', shortName: 'OFK', squadPlayerIds: ['p1'] })] })
      // rykte 30 → repFactor 0.8 → golv = round(65*200*0.8*0.8/500)*500 = 8500
      const belowHighRepFloor = createOutgoingBid(lowRepGame, 'p1', 200000, 9000, 3, 5)
      expect(belowHighRepFloor.success).toBe(true)  // hade avvisats vid rykte 60 (golv 11500)
    })
  })
})

// DOM_AH2B_RETENTION_2026-08-28, Leg 3 — moral matar de två befintliga
// budhookarna (generateIncomingBids urval, playerAcceptsTransfer ja-chans).
describe('weightedPickIndexByWeights', () => {
  it('väljer alltid index 0 med en enda vikt', () => {
    expect(weightedPickIndexByWeights([5], () => 0.99)).toBe(0)
  })

  it('respekterar godtyckliga vikter (index 1 dominerar när dess vikt är störst)', () => {
    const trials = 5000
    let seed = 7
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    const counts = [0, 0, 0]
    for (let i = 0; i < trials; i++) counts[weightedPickIndexByWeights([1, 10, 1], rand)]++
    expect(counts[1] / trials).toBeGreaterThan(0.6)
  })
})

describe('computeMoraleBidWeight — A-H2b Leg 3', () => {
  it('är neutral (×1) vid/över tröskeln (60)', () => {
    expect(computeMoraleBidWeight(60)).toBe(1)
    expect(computeMoraleBidWeight(90)).toBe(1)
  })

  it('ökar linjärt under tröskeln', () => {
    expect(computeMoraleBidWeight(40)).toBeCloseTo(1.8, 5)  // (60-40)*0.04=0.8
  })

  it('är capad vid 3.0 för mycket låg moral', () => {
    expect(computeMoraleBidWeight(0)).toBe(3.0)
  })
})

describe('computeMoraleAcceptanceBonus — A-H2b Leg 3', () => {
  it('är 0 vid/över tröskeln (50)', () => {
    expect(computeMoraleAcceptanceBonus(50)).toBe(0)
    expect(computeMoraleAcceptanceBonus(80)).toBe(0)
  })

  it('ökar linjärt under tröskeln, capad vid 0.30', () => {
    expect(computeMoraleAcceptanceBonus(30)).toBeCloseTo(0.12, 5)  // (50-30)*0.006
    expect(computeMoraleAcceptanceBonus(0)).toBe(0.30)
  })
})

describe('playerAcceptsTransfer — moral höjer ja-sannolikheten', () => {
  it('en missnöjd spelare accepterar oftare än en nöjd, allt annat lika', () => {
    const buyer = makeClub({ id: 'c1', region: 'Mälardalen' })
    const seller = makeClub({ id: 'c2', region: 'Mälardalen' })
    const happy = makePlayer({ morale: 80, transferPersonality: 'default' })
    const unhappy = makePlayer({ morale: 10, transferPersonality: 'default' })
    const trials = 4000
    let seed = 3
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    let happyAccepts = 0, unhappyAccepts = 0
    for (let i = 0; i < trials; i++) {
      if (playerAcceptsTransfer(happy, buyer, seller, rand)) happyAccepts++
      if (playerAcceptsTransfer(unhappy, buyer, seller, rand)) unhappyAccepts++
    }
    expect(unhappyAccepts / trials).toBeGreaterThan(happyAccepts / trials)
  })
})
