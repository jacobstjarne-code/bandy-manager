import { describe, it, expect } from 'vitest'
import {
  ageScore,
  conditionScore,
  injuryScore,
  getCandidateScore,
  getRetirementCandidate,
} from '../retirementDecisionService'
import type { Player } from '../../entities/Player'
import type { SaveGame } from '../../entities/SaveGame'
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
    firstName: 'Lars',
    lastName: 'Svensson',
    age: 30,
    nationality: 'svenska',
    clubId: 'club_managed',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 5000,
    contractUntilSeason: 2028,
    marketValue: 50000,
    morale: 70,
    form: 70,
    fitness: 80,
    sharpness: 65,
    isFullTimePro: false,
    currentAbility: 50,
    potentialAbility: 70,
    developmentRate: 40,
    injuryProneness: 25,
    discipline: 65,
    attributes: {
      skating: 45, acceleration: 45, stamina: 45, ballControl: 45,
      passing: 45, shooting: 50, dribbling: 40, vision: 40,
      decisions: 45, workRate: 45, positioning: 45, defending: 30,
      cornerSkill: 30, goalkeeping: 10, cornerRecovery: 50,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptySeasonStats(),
    careerStats: emptyCareerStats(),
    ...overrides,
  }
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'club_managed',
    currentSeason: 2026,
    players: [],
    ...overrides,
  } as unknown as SaveGame
}

// ─── ageScore ──────────────────────────────────────────────────────────────────

describe('ageScore', () => {
  it('returns 0 for Forward age 30 (below threshold 33)', () => {
    const p = makePlayer({ age: 30, position: PlayerPosition.Forward })
    expect(ageScore(p)).toBe(0)
  })

  it('returns 0 for Forward exactly at threshold (33)', () => {
    const p = makePlayer({ age: 33, position: PlayerPosition.Forward })
    expect(ageScore(p)).toBe(0)
  })

  it('returns 1 for Forward age 34', () => {
    const p = makePlayer({ age: 34, position: PlayerPosition.Forward })
    expect(ageScore(p)).toBe(1)
  })

  it('returns 0 for Goalkeeper age 34 (threshold is 36)', () => {
    const p = makePlayer({ age: 34, position: PlayerPosition.Goalkeeper })
    expect(ageScore(p)).toBe(0)
  })

  it('returns 1 for Goalkeeper age 37', () => {
    const p = makePlayer({ age: 37, position: PlayerPosition.Goalkeeper })
    expect(ageScore(p)).toBe(1)
  })

  it('uses threshold 34 for Defenders', () => {
    const belowThreshold = makePlayer({ age: 34, position: PlayerPosition.Defender })
    const aboveThreshold = makePlayer({ age: 35, position: PlayerPosition.Defender })
    expect(ageScore(belowThreshold)).toBe(0)
    expect(ageScore(aboveThreshold)).toBe(1)
  })

  it('uses threshold 33 for Half (midfielder)', () => {
    const p = makePlayer({ age: 35, position: PlayerPosition.Half })
    expect(ageScore(p)).toBe(2)
  })
})

// ─── conditionScore ────────────────────────────────────────────────────────────

describe('conditionScore', () => {
  it('returns 0 for fitness >= 40', () => {
    const p = makePlayer({ fitness: 80 })
    expect(conditionScore(p)).toBe(0)
  })

  it('returns 0 for fitness exactly 40', () => {
    const p = makePlayer({ fitness: 40 })
    expect(conditionScore(p)).toBe(0)
  })

  it('returns positive value for very low fitness', () => {
    const p = makePlayer({ fitness: 10 })
    // (40 - 10) / 10 = 3.0
    expect(conditionScore(p)).toBeCloseTo(3.0)
  })

  it('returns 0 for default fitness (80)', () => {
    const p = makePlayer()
    expect(conditionScore(p)).toBe(0)
  })
})

// ─── injuryScore ───────────────────────────────────────────────────────────────

describe('injuryScore', () => {
  it('returns 0 with no narrativeLog', () => {
    const p = makePlayer()
    expect(injuryScore(p)).toBe(0)
  })

  it('returns 0 with non-injury narrative entries', () => {
    const p = makePlayer({
      narrativeLog: [
        { season: 2025, matchday: 5, text: 'Hat-trick', type: 'milestone' },
      ],
    })
    expect(injuryScore(p)).toBe(0)
  })

  it('returns 0.5 per injury entry', () => {
    const p = makePlayer({
      narrativeLog: [
        { season: 2024, matchday: 3, text: 'Knäskada', type: 'injury' },
        { season: 2025, matchday: 7, text: 'Vadskada', type: 'injury' },
      ],
    })
    expect(injuryScore(p)).toBeCloseTo(1.0)
  })
})

// ─── getCandidateScore ────────────────────────────────────────────────────────

describe('getCandidateScore', () => {
  it('returns 0 for young player with good fitness', () => {
    const p = makePlayer({ age: 25, fitness: 85 })
    expect(getCandidateScore(p)).toBe(0)
  })

  it('combines ageScore + conditionScore + injuryScore', () => {
    const p = makePlayer({
      age: 35,                       // ageScore = 2 (Forward threshold 33)
      fitness: 20,                   // conditionScore = (40-20)/10 = 2.0
      narrativeLog: [
        { season: 2024, matchday: 1, text: '', type: 'injury' },  // injuryScore = 0.5
      ],
    })
    expect(getCandidateScore(p)).toBeCloseTo(4.5)
  })
})

// ─── getRetirementCandidate ───────────────────────────────────────────────────

describe('getRetirementCandidate', () => {
  it('returns null when lastRetirementSeason equals currentSeason', () => {
    const player = makePlayer({ age: 38 })
    const game = makeGame({
      players: [player],
      lastRetirementSeason: 2026,
      currentSeason: 2026,
    })
    expect(getRetirementCandidate(game)).toBeNull()
  })

  it('returns null when no candidates have score >= 1', () => {
    const youngPlayer = makePlayer({ age: 25, fitness: 90 })
    const game = makeGame({ players: [youngPlayer] })
    expect(getRetirementCandidate(game)).toBeNull()
  })

  it('returns the highest-scored candidate', () => {
    const olderPlayer = makePlayer({ id: 'p_old', age: 37, fitness: 80 })   // ageScore=4
    const youngerPlayer = makePlayer({ id: 'p_mid', age: 34, fitness: 80 }) // ageScore=1
    const game = makeGame({ players: [youngerPlayer, olderPlayer] })
    const result = getRetirementCandidate(game)
    expect(result?.id).toBe('p_old')
  })

  it('ignores players from other clubs', () => {
    const otherClubPlayer = makePlayer({ id: 'p_other', age: 40, clubId: 'other_club' })
    const game = makeGame({ players: [otherClubPlayer] })
    expect(getRetirementCandidate(game)).toBeNull()
  })

  it('returns null when all eligible players are below threshold', () => {
    // Forward age 32, exactly below threshold of 33 — score = 0
    const p = makePlayer({ age: 32, position: PlayerPosition.Forward, fitness: 90 })
    const game = makeGame({ players: [p] })
    expect(getRetirementCandidate(game)).toBeNull()
  })
})
