import { describe, it, expect } from 'vitest'
import { computeSeasonEndContractDemands, applyContractDemandResolutions, UNMET_DEMAND_MORALE_PENALTY } from '../contractDemandService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Player } from '../../entities/Player'
import type { Club } from '../../entities/Club'
import { PlayerPosition, PlayerArchetype, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle, ClubExpectation, ClubStyle } from '../../enums'

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
    age: 24, nationality: 'SE', clubId: 'c1', isHomegrown: false,
    position: PlayerPosition.Forward, archetype: PlayerArchetype.Finisher,
    salary: 5000, contractUntilSeason: 2027, marketValue: 200000,
    morale: 70, form: 65, fitness: 80, sharpness: 70, seasonForm: 60,
    isFullTimePro: true,
    currentAbility: 65, potentialAbility: 75, developmentRate: 50,
    injuryProneness: 30, discipline: 60,
    attributes: { skating: 60, acceleration: 60, stamina: 60, ballControl: 60, passing: 60, shooting: 60, dribbling: 60, vision: 60, decisions: 60, workRate: 60, positioning: 60, defending: 40, cornerSkill: 40, goalkeeping: 10 },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 20, goals: 15, assists: 5, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 8.0, minutesPlayed: 1600 },
    careerStats: { totalGames: 40, totalGoals: 20, totalAssists: 8, seasonsPlayed: 2 },
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

function makeGame(players: Player[], clubs: Club[]): SaveGame {
  return {
    id: 'g1', managerName: 'Test', managedClubId: 'c1',
    currentDate: '2025-05-01', currentSeason: 2025,
    clubs, players,
    league: { id: 'l1', name: 'Test League', season: 2025 },
    fixtures: [], standings: [], inbox: [],
    transferState: { freeAgents: [], pendingOffers: [] },
    youthIntakeHistory: [], matchWeathers: [],
    trainingHistory: [],
    playoffBracket: null, cupBracket: null, seasonSummaries: [],
    pendingScreen: null,
    scoutReports: {}, activeScoutAssignment: null, scoutBudget: 10,
    pendingEvents: [], transferBids: [], handledContractPlayerIds: [],
    version: '0.1.0', lastSavedAt: '2025-01-01T00:00:00Z',
  } as unknown as SaveGame
}

describe('computeSeasonEndContractDemands', () => {
  it('flags a player whose salary is below computeContractMinSalary as a demand', () => {
    // Ability 65, rep 60 → repFactor 0.5+0.6=1.1, isFullTimePro → base = 65*200*0.8=10400
    // performanceFactor: 20 games qualifies (>=5), rating 8.0 vs league default avg 6.0
    // (no other players in league averages pool → falls back to 6.0/0/0) →
    // ratingDelta=2.0, goalsDelta=15, assistsDelta=5 → pf way above cap 1.40 → clamped 1.40
    // minSalary = round(10400*1.1*1.40/500)*500 = round(16016/500)*500 = 16000
    const player = makePlayer({ salary: 5000 })
    const club = makeClub()
    const game = makeGame([player], [club])
    const demands = computeSeasonEndContractDemands(game, club, new Set(['p1']))
    expect(demands.length).toBe(1)
    expect(demands[0].playerId).toBe('p1')
    expect(demands[0].currentSalary).toBe(5000)
    expect(demands[0].minSalary).toBeGreaterThan(5000)
  })

  it('does not flag a player already paid at or above the market floor', () => {
    const player = makePlayer({ salary: 999999 })
    const club = makeClub()
    const game = makeGame([player], [club])
    const demands = computeSeasonEndContractDemands(game, club, new Set(['p1']))
    expect(demands.length).toBe(0)
  })

  it('excludes players not in activePlayerIds (retiring/contract-expired)', () => {
    const player = makePlayer({ salary: 5000 })
    const club = makeClub()
    const game = makeGame([player], [club])
    const demands = computeSeasonEndContractDemands(game, club, new Set())
    expect(demands.length).toBe(0)
  })

  it('excludes players from other clubs', () => {
    const own = makePlayer({ id: 'p1', clubId: 'c1', salary: 5000 })
    const other = makePlayer({ id: 'p2', clubId: 'c2', salary: 5000 })
    const club = makeClub()
    const game = makeGame([own, other], [club, makeClub({ id: 'c2', squadPlayerIds: ['p2'] })])
    const demands = computeSeasonEndContractDemands(game, club, new Set(['p1', 'p2']))
    expect(demands.map(d => d.playerId)).toEqual(['p1'])
  })

  it('does not flag a player under the minimum sample size (performanceFactor stays neutral, low base salary already covers it)', () => {
    const player = makePlayer({ salary: 999999, seasonStats: { gamesPlayed: 2, goals: 3, assists: 1, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 9.0, minutesPlayed: 160 } })
    const club = makeClub()
    const game = makeGame([player], [club])
    const demands = computeSeasonEndContractDemands(game, club, new Set(['p1']))
    expect(demands.length).toBe(0)
  })
})

describe('applyContractDemandResolutions', () => {
  it('raises salary to minSalary and leaves morale untouched when met', () => {
    const player = makePlayer({ id: 'p1', salary: 5000, morale: 70 })
    const demands = [{ playerId: 'p1', currentSalary: 5000, minSalary: 16000 }]
    const updated = applyContractDemandResolutions([player], demands, { p1: 'met' })
    expect(updated[0].salary).toBe(16000)
    expect(updated[0].morale).toBe(70)
  })

  it('erodes morale and leaves salary untouched when skipped', () => {
    const player = makePlayer({ id: 'p1', salary: 5000, morale: 70 })
    const demands = [{ playerId: 'p1', currentSalary: 5000, minSalary: 16000 }]
    const updated = applyContractDemandResolutions([player], demands, { p1: 'skipped' })
    expect(updated[0].salary).toBe(5000)
    expect(updated[0].morale).toBe(70 - UNMET_DEMAND_MORALE_PENALTY)
  })

  it('treats a missing resolution the same as skipped (unresolved = unmet)', () => {
    const player = makePlayer({ id: 'p1', salary: 5000, morale: 70 })
    const demands = [{ playerId: 'p1', currentSalary: 5000, minSalary: 16000 }]
    const updated = applyContractDemandResolutions([player], demands, {})
    expect(updated[0].morale).toBe(70 - UNMET_DEMAND_MORALE_PENALTY)
  })

  it('clamps morale erosion at 0', () => {
    const player = makePlayer({ id: 'p1', salary: 5000, morale: 10 })
    const demands = [{ playerId: 'p1', currentSalary: 5000, minSalary: 16000 }]
    const updated = applyContractDemandResolutions([player], demands, { p1: 'skipped' })
    expect(updated[0].morale).toBe(0)
  })

  it('leaves players without a demand untouched', () => {
    const player = makePlayer({ id: 'p2', salary: 5000, morale: 70 })
    const updated = applyContractDemandResolutions([player], [], {})
    expect(updated[0]).toEqual(player)
  })
})
