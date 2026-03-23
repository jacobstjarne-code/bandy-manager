import { describe, it, expect } from 'vitest'
import { generateYouthIntake } from '../youthIntakeService'
import type { Club } from '../../entities/Club'
import type { Player } from '../../entities/Player'
import {
  ClubExpectation,
  ClubStyle,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
  PlayerPosition,
  PlayerArchetype,
} from '../../enums'

const ATTR_KEYS = [
  'skating', 'acceleration', 'stamina', 'ballControl', 'passing', 'shooting',
  'dribbling', 'vision', 'decisions', 'workRate', 'positioning', 'defending',
  'cornerSkill', 'goalkeeping',
] as const

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club_test',
    name: 'Test BK',
    shortName: 'Test',
    region: 'Testland',
    reputation: 60,
    finances: 300000,
    wageBudget: 60000,
    transferBudget: 20000,
    youthQuality: 60,
    youthRecruitment: 60,
    youthDevelopment: 60,
    facilities: 60,
    boardExpectation: ClubExpectation.MidTable,
    fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced,
    hasArtificialIce: false,
    activeTactic: {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Mixed,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Mixed,
      cornerStrategy: CornerStrategy.Standard,
      penaltyKillStyle: PenaltyKillStyle.Active,
    },
    squadPlayerIds: [],
    ...overrides,
  }
}

function emptySeasonStats() {
  return {
    gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
    yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
  }
}

function emptyCareerStats() {
  return { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Test',
    lastName: 'Spelare',
    age: 22,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 5000,
    contractUntilSeason: 2028,
    marketValue: 50000,
    morale: 70,
    form: 60,
    fitness: 80,
    sharpness: 65,
    currentAbility: 55,
    potentialAbility: 70,
    developmentRate: 65,
    injuryProneness: 30,
    discipline: 70,
    attributes: {
      skating: 50, acceleration: 50, stamina: 50, ballControl: 50, passing: 50,
      shooting: 60, dribbling: 50, vision: 50, decisions: 50, workRate: 50,
      positioning: 55, defending: 35, cornerSkill: 40, goalkeeping: 20,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptySeasonStats(),
    careerStats: emptyCareerStats(),
    ...overrides,
  }
}

describe('generateYouthIntake', () => {
  const club = makeClub()

  it('generates between 2 and 5 players', () => {
    // Run multiple seeds to verify range
    for (let seed = 1; seed <= 20; seed++) {
      const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed })
      expect(result.newPlayers.length).toBeGreaterThanOrEqual(2)
      expect(result.newPlayers.length).toBeLessThanOrEqual(5)
    }
  })

  it('all players have age 15-17', () => {
    const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 42 })
    for (const p of result.newPlayers) {
      expect(p.age).toBeGreaterThanOrEqual(15)
      expect(p.age).toBeLessThanOrEqual(17)
    }
  })

  it('all players have CA 10-35 and PA 30-90', () => {
    const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 42 })
    for (const p of result.newPlayers) {
      expect(p.currentAbility).toBeGreaterThanOrEqual(10)
      expect(p.currentAbility).toBeLessThanOrEqual(35)
      expect(p.potentialAbility).toBeGreaterThanOrEqual(30)
      expect(p.potentialAbility).toBeLessThanOrEqual(90)
    }
  })

  it('PA > CA for all players', () => {
    // Run multiple seeds
    for (let seed = 1; seed <= 10; seed++) {
      const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed })
      for (const p of result.newPlayers) {
        expect(p.potentialAbility).toBeGreaterThan(p.currentAbility)
      }
    }
  })

  it('club with youthQuality=90 produces higher average CA than club with youthQuality=20', () => {
    const richClub = makeClub({ youthQuality: 90 })
    const poorClub = makeClub({ youthQuality: 20 })

    // Average across many seeds
    let richTotal = 0, richCount = 0
    let poorTotal = 0, poorCount = 0

    for (let seed = 1; seed <= 30; seed++) {
      const richResult = generateYouthIntake({ club: richClub, existingPlayers: [], season: 2026, date: '2026-07-01', seed })
      const poorResult = generateYouthIntake({ club: poorClub, existingPlayers: [], season: 2026, date: '2026-07-01', seed })

      for (const p of richResult.newPlayers) { richTotal += p.currentAbility; richCount++ }
      for (const p of poorResult.newPlayers) { poorTotal += p.currentAbility; poorCount++ }
    }

    expect(richTotal / richCount).toBeGreaterThan(poorTotal / poorCount)
  })

  it('position distribution reflects squad needs — no forwards generates more forwards', () => {
    // Build a squad with no forwards but plenty of other positions
    const noForwardSquad: Player[] = []
    const positions = [
      PlayerPosition.Goalkeeper, PlayerPosition.Goalkeeper,
      PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
      PlayerPosition.Defender, PlayerPosition.Defender,
      PlayerPosition.Half, PlayerPosition.Half, PlayerPosition.Half,
      PlayerPosition.Half, PlayerPosition.Half,
      PlayerPosition.Midfielder, PlayerPosition.Midfielder, PlayerPosition.Midfielder,
      PlayerPosition.Midfielder, PlayerPosition.Midfielder,
    ]
    for (let i = 0; i < positions.length; i++) {
      noForwardSquad.push(makePlayer({ id: `p${i}`, position: positions[i] }))
    }

    let forwardCount = 0
    let totalPlayers = 0

    for (let seed = 1; seed <= 20; seed++) {
      const result = generateYouthIntake({ club, existingPlayers: noForwardSquad, season: 2026, date: '2026-07-01', seed })
      for (const p of result.newPlayers) {
        if (p.position === PlayerPosition.Forward) forwardCount++
        totalPlayers++
      }
    }

    // Forwards should make up more than 1/5 (20%) of generated players given the shortfall
    const forwardRatio = forwardCount / totalPlayers
    expect(forwardRatio).toBeGreaterThan(0.2)
  })

  it('all 14 player attributes are present and in range 1-60', () => {
    const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 42 })
    for (const p of result.newPlayers) {
      for (const key of ATTR_KEYS) {
        const val = p.attributes[key]
        expect(val).toBeDefined()
        expect(typeof val).toBe('number')
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(60)
      }
    }
  })

  it('YouthIntakeRecord.playerIds matches returned players', () => {
    const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 42 })
    const playerIds = result.newPlayers.map((p) => p.id)
    expect(result.record.playerIds).toEqual(playerIds)
  })

  it('topProspectId is the player with highest PA', () => {
    // Run with enough seeds to get a promising/elite player
    let found = false
    for (let seed = 1; seed <= 50; seed++) {
      const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed })
      if (result.record.topProspectId) {
        const topPlayer = result.newPlayers.find((p) => p.id === result.record.topProspectId)
        expect(topPlayer).toBeDefined()
        const maxPA = Math.max(...result.newPlayers.map((p) => p.potentialAbility))
        expect(topPlayer!.potentialAbility).toBe(maxPA)
        found = true
        break
      }
    }
    // topProspectId should always be defined (we always set it)
    expect(found).toBe(true)
  })

  it('same seed produces same output', () => {
    const result1 = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 99 })
    const result2 = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 99 })

    expect(result1.newPlayers.length).toBe(result2.newPlayers.length)
    for (let i = 0; i < result1.newPlayers.length; i++) {
      expect(result1.newPlayers[i].id).toBe(result2.newPlayers[i].id)
      expect(result1.newPlayers[i].firstName).toBe(result2.newPlayers[i].firstName)
      expect(result1.newPlayers[i].currentAbility).toBe(result2.newPlayers[i].currentAbility)
      expect(result1.newPlayers[i].potentialAbility).toBe(result2.newPlayers[i].potentialAbility)
    }
  })

  it('scout texts are generated (scoutTexts record is non-empty)', () => {
    const result = generateYouthIntake({ club, existingPlayers: [], season: 2026, date: '2026-07-01', seed: 42 })
    expect(Object.keys(result.scoutTexts).length).toBeGreaterThan(0)
    // Each player should have a scout text
    for (const p of result.newPlayers) {
      expect(result.scoutTexts[p.id]).toBeDefined()
      expect(typeof result.scoutTexts[p.id]).toBe('string')
      expect(result.scoutTexts[p.id].length).toBeGreaterThan(0)
    }
  })
})
