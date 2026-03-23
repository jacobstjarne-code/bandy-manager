import { describe, it, expect } from 'vitest'
import { developPlayers } from '../playerDevelopmentService'
import type { Player } from '../../entities/Player'
import { PlayerPosition, PlayerArchetype } from '../../enums'

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
    firstName: 'Erik',
    lastName: 'Karlsson',
    age: 22,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 5000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 70,
    form: 70,
    fitness: 80,
    sharpness: 65,
    currentAbility: 50,
    potentialAbility: 80,
    developmentRate: 75,
    injuryProneness: 25,
    discipline: 70,
    attributes: {
      skating: 45,
      acceleration: 48,
      stamina: 44,
      ballControl: 42,
      passing: 38,
      shooting: 55,
      dribbling: 40,
      vision: 36,
      decisions: 44,
      workRate: 42,
      positioning: 46,
      defending: 30,
      cornerSkill: 28,
      goalkeeping: 15,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptySeasonStats(),
    careerStats: emptyCareerStats(),
    ...overrides,
  }
}

const ATTR_KEYS = [
  'skating', 'acceleration', 'stamina', 'ballControl', 'passing', 'shooting',
  'dribbling', 'vision', 'decisions', 'workRate', 'positioning', 'defending',
  'cornerSkill', 'goalkeeping',
] as const

describe('developPlayers', () => {
  it('young players (age 18) improve over time — average CA is higher after 10 weeks', () => {
    const youngPlayer = makePlayer({ id: 'young', age: 18, currentAbility: 40, potentialAbility: 85, developmentRate: 80 })
    const facilities = { club_test: 80 }

    let current = [youngPlayer]
    for (let week = 1; week <= 10; week++) {
      const result = developPlayers({ players: current, clubFacilities: facilities, weekNumber: week, seed: week * 7 })
      current = result.updatedPlayers
    }

    expect(current[0].currentAbility).toBeGreaterThan(youngPlayer.currentAbility)
  })

  it('old players (age 34) decline — average CA is lower after 10 weeks', () => {
    const oldPlayer = makePlayer({ id: 'old', age: 34, currentAbility: 60, potentialAbility: 75, developmentRate: 20 })
    const facilities = { club_test: 60 }

    let current = [oldPlayer]
    for (let week = 1; week <= 10; week++) {
      const result = developPlayers({ players: current, clubFacilities: facilities, weekNumber: week, seed: week * 13 })
      current = result.updatedPlayers
    }

    expect(current[0].currentAbility).toBeLessThan(oldPlayer.currentAbility)
  })

  it('high potential players improve faster than low potential players', () => {
    const highPA = makePlayer({ id: 'high', age: 19, currentAbility: 35, potentialAbility: 90, developmentRate: 80 })
    const lowPA = makePlayer({ id: 'low', age: 19, currentAbility: 35, potentialAbility: 45, developmentRate: 80 })
    const facilities = { club_test: 70 }

    let highCurrent = [highPA]
    let lowCurrent = [lowPA]

    for (let week = 1; week <= 10; week++) {
      const highResult = developPlayers({ players: highCurrent, clubFacilities: facilities, weekNumber: week, seed: week * 3 })
      const lowResult = developPlayers({ players: lowCurrent, clubFacilities: facilities, weekNumber: week, seed: week * 3 })
      highCurrent = highResult.updatedPlayers
      lowCurrent = lowResult.updatedPlayers
    }

    const highGain = highCurrent[0].currentAbility - highPA.currentAbility
    const lowGain = lowCurrent[0].currentAbility - lowPA.currentAbility

    expect(highGain).toBeGreaterThan(lowGain)
  })

  it("a Finisher's shooting attribute improves faster than their passing", () => {
    const finisher = makePlayer({
      id: 'finisher',
      age: 19,
      archetype: PlayerArchetype.Finisher,
      position: PlayerPosition.Forward,
      currentAbility: 40,
      potentialAbility: 85,
      developmentRate: 80,
      attributes: {
        skating: 40, acceleration: 40, stamina: 40, ballControl: 40,
        passing: 40, shooting: 40, dribbling: 40, vision: 40,
        decisions: 40, workRate: 40, positioning: 40, defending: 30,
        cornerSkill: 30, goalkeeping: 10,
      },
    })
    const facilities = { club_test: 80 }

    let current = [finisher]
    for (let week = 1; week <= 20; week++) {
      const result = developPlayers({ players: current, clubFacilities: facilities, weekNumber: week, seed: week * 5 })
      current = result.updatedPlayers
    }

    const shootingGain = current[0].attributes.shooting - finisher.attributes.shooting
    const passingGain = current[0].attributes.passing - finisher.attributes.passing

    expect(shootingGain).toBeGreaterThan(passingGain)
  })

  it('injured players do not develop', () => {
    const injuredPlayer = makePlayer({ id: 'injured', age: 19, isInjured: true, currentAbility: 45 })
    const facilities = { club_test: 80 }

    const result = developPlayers({
      players: [injuredPlayer],
      clubFacilities: facilities,
      weekNumber: 10,
      seed: 42,
    })

    expect(result.updatedPlayers[0].currentAbility).toBe(injuredPlayer.currentAbility)
    expect(result.updatedPlayers[0].attributes.shooting).toBe(injuredPlayer.attributes.shooting)
  })

  it('notable changes are reported for significant attribute shifts', () => {
    // Use a very young player with very high dev rate so we likely get notable changes
    const fastGrower = makePlayer({
      id: 'fast',
      age: 16,
      potentialAbility: 90,
      developmentRate: 99,
      currentAbility: 20,
      attributes: {
        skating: 20, acceleration: 20, stamina: 20, ballControl: 20, passing: 20,
        shooting: 20, dribbling: 20, vision: 20, decisions: 20, workRate: 20,
        positioning: 20, defending: 15, cornerSkill: 15, goalkeeping: 5,
      },
    })

    const facilities = { club_test: 100 }
    let allChanges: import('../playerDevelopmentService').NotableDevelopment[] = []
    let current = [fastGrower]

    for (let week = 1; week <= 20; week++) {
      const result = developPlayers({ players: current, clubFacilities: facilities, weekNumber: week, seed: week })
      allChanges = allChanges.concat(result.notableChanges)
      current = result.updatedPlayers
    }

    expect(allChanges.length).toBeGreaterThan(0)
    for (const change of allChanges) {
      expect(Math.abs(change.newValue - change.oldValue)).toBeGreaterThanOrEqual(1)
    }
  })

  it('attributes stay within 1-99 range after 52 weeks of development', () => {
    const player = makePlayer({ id: 'longrun', age: 18, potentialAbility: 90, developmentRate: 99 })
    const facilities = { club_test: 100 }

    let current = [player]
    for (let week = 1; week <= 52; week++) {
      const result = developPlayers({ players: current, clubFacilities: facilities, weekNumber: week, seed: week * 11 })
      current = result.updatedPlayers
    }

    for (const key of ATTR_KEYS) {
      expect(current[0].attributes[key]).toBeGreaterThanOrEqual(1)
      expect(current[0].attributes[key]).toBeLessThanOrEqual(99)
    }
  })

  it('CA stays within 5-95 range after 52 weeks', () => {
    // Test both young growth and old decline
    const youngPlayer = makePlayer({ id: 'young52', age: 17, currentAbility: 20, potentialAbility: 95, developmentRate: 99 })
    const oldPlayer = makePlayer({ id: 'old52', age: 36, currentAbility: 70, potentialAbility: 80, developmentRate: 10 })
    const facilities = { club_test: 100 }

    let youngCurrent = [youngPlayer]
    let oldCurrent = [oldPlayer]

    for (let week = 1; week <= 52; week++) {
      youngCurrent = developPlayers({ players: youngCurrent, clubFacilities: facilities, weekNumber: week, seed: week * 17 }).updatedPlayers
      oldCurrent = developPlayers({ players: oldCurrent, clubFacilities: facilities, weekNumber: week, seed: week * 17 }).updatedPlayers
    }

    expect(youngCurrent[0].currentAbility).toBeGreaterThanOrEqual(5)
    expect(youngCurrent[0].currentAbility).toBeLessThanOrEqual(95)
    expect(oldCurrent[0].currentAbility).toBeGreaterThanOrEqual(5)
    expect(oldCurrent[0].currentAbility).toBeLessThanOrEqual(95)
  })
})
