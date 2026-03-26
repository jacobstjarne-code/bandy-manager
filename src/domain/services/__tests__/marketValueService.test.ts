import { describe, it, expect } from 'vitest'
import { calculateMarketValue } from '../marketValueService'
import type { Player } from '../../entities/Player'
import { PlayerPosition, PlayerArchetype } from '../../enums'

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: 'p1',
    firstName: 'Test',
    lastName: 'Player',
    age: 24,
    nationality: 'SE',
    clubId: 'c1',
    isHomegrown: false,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 10000,
    contractUntilSeason: 2028,
    marketValue: 0,
    morale: 70,
    form: 65,
    fitness: 80,
    sharpness: 70,
    currentAbility: 60,
    potentialAbility: 75,
    developmentRate: 50,
    injuryProneness: 30,
    discipline: 60,
    attributes: {
      skating: 60, acceleration: 60, stamina: 60, ballControl: 60,
      passing: 60, shooting: 60, dribbling: 60, vision: 60,
      decisions: 60, workRate: 60, positioning: 60, defending: 40,
      cornerSkill: 40, goalkeeping: 10,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  }
}

const SEASON = 2025

describe('calculateMarketValue', () => {
  it('higher CA gives higher value', () => {
    const low = calculateMarketValue(makePlayer({ currentAbility: 40 }), SEASON)
    const high = calculateMarketValue(makePlayer({ currentAbility: 70 }), SEASON)
    expect(high).toBeGreaterThan(low)
  })

  it('age curve peaks around 24', () => {
    const peak = calculateMarketValue(makePlayer({ age: 24 }), SEASON)
    const teen = calculateMarketValue(makePlayer({ age: 17 }), SEASON)
    const veteran = calculateMarketValue(makePlayer({ age: 34 }), SEASON)
    expect(peak).toBeGreaterThan(teen)
    expect(peak).toBeGreaterThan(veteran)
  })

  it('contract discount: 1 season remaining gives lower value than 3+', () => {
    const longContract = calculateMarketValue(makePlayer({ contractUntilSeason: SEASON + 3 }), SEASON)
    const shortContract = calculateMarketValue(makePlayer({ contractUntilSeason: SEASON + 1 }), SEASON)
    expect(shortContract).toBeLessThan(longContract)
  })

  it('form bonus: high form gives higher value than low form', () => {
    const highForm = calculateMarketValue(makePlayer({ form: 80 }), SEASON)
    const lowForm = calculateMarketValue(makePlayer({ form: 30 }), SEASON)
    expect(highForm).toBeGreaterThan(lowForm)
  })

  it('all values within 5 000 – 500 000', () => {
    const ages = [16, 20, 24, 28, 33, 38]
    const abilities = [20, 40, 60, 80, 95]
    for (const age of ages) {
      for (const ca of abilities) {
        const v = calculateMarketValue(makePlayer({ age, currentAbility: ca }), SEASON)
        expect(v).toBeGreaterThanOrEqual(5000)
        expect(v).toBeLessThanOrEqual(500000)
      }
    }
  })

  it('values are rounded to nearest 5 000', () => {
    const ages = [18, 22, 25, 30]
    const abilities = [35, 55, 70, 85]
    for (const age of ages) {
      for (const ca of abilities) {
        const v = calculateMarketValue(makePlayer({ age, currentAbility: ca }), SEASON)
        expect(v % 5000).toBe(0)
      }
    }
  })
})
