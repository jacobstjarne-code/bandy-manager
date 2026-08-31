import { describe, it, expect } from 'vitest'
import {
  ageScore,
  conditionScore,
  injuryScore,
  getCandidateScore,
  getRetirementCandidate,
  getPositionThreshold,
  RETIREMENT_AGE_MARGIN,
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
  it('returns 0 with no diary', () => {
    const p = makePlayer()
    expect(injuryScore(p)).toBe(0)
  })

  it('returns 0 with non-injury narrative entries', () => {
    const p = makePlayer({
      diary: [
        { season: 2025, matchday: 5, text: 'Hat-trick', type: 'milestone' },
      ],
    })
    expect(injuryScore(p)).toBe(0)
  })

  it('returns 0.5 per injury entry', () => {
    const p = makePlayer({
      diary: [
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
      diary: [
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

// ─── Auditens critical #2 — åldersgolvet (Jacobs körorder 2026-08-31) ─────────
//
// Roten: getCandidateScore hade inget golv. conditionScore ensam når 4
// (fitness 0), injuryScore lägger 0,5/post — en 24-åring med dålig fitness
// och skadehistorik kunde nå score >= 1 trots ageScore(24) = 0. Golvet
// exkluderar varje spelare under (positionens tröskel − RETIREMENT_AGE_MARGIN)
// FÖRE poängen ens räknas — fitness/skador kan bara accelerera en spelare
// som redan är i pensionsåldern, aldrig trigga en ung.
describe('getRetirementCandidate — åldersgolvet (auditens critical #2)', () => {
  it('24-åring med fitness 20 och tre skador är INTE kandidat (golvet stoppar innan poängen räknas)', () => {
    const young = makePlayer({
      id: 'p_young', age: 24, position: PlayerPosition.Forward, fitness: 20,
      diary: [
        { season: 2024, matchday: 1, text: '', type: 'injury' },
        { season: 2025, matchday: 4, text: '', type: 'injury' },
        { season: 2025, matchday: 9, text: '', type: 'injury' },
      ],
    })
    // Utan golvet hade denna spelare fått score = 0 (ålder) + 2 (fitness) + 1.5 (skador) = 3.5 — ruvat gott över 1.
    expect(getCandidateScore(young)).toBeGreaterThanOrEqual(1)
    const game = makeGame({ players: [young] })
    expect(getRetirementCandidate(game)).toBeNull()
  })

  it('33-årig forward med låg fitness ÄR kandidat (på golvet, poängen bär den)', () => {
    // Forward-tröskel 33, golv = 33 − 4 = 29. Ålder 33 är över golvet.
    const veteran = makePlayer({ id: 'p_vet', age: 33, position: PlayerPosition.Forward, fitness: 15 })
    const game = makeGame({ players: [veteran] })
    expect(getRetirementCandidate(game)?.id).toBe('p_vet')
  })

  it('30-åring med tung skadehistorik ÄR kandidat (över golvet, skadorna bär poängen)', () => {
    // Forward-golv 29 — 30 är över. Fitness normal, ageScore(30, tröskel 33) = 0,
    // men fyra skadeposter (2.0) räcker gott över score-tröskeln 1.
    const injuryProne = makePlayer({
      id: 'p_injured', age: 30, position: PlayerPosition.Forward, fitness: 75,
      diary: [
        { season: 2023, matchday: 2, text: '', type: 'injury' },
        { season: 2024, matchday: 5, text: '', type: 'injury' },
        { season: 2024, matchday: 15, text: '', type: 'injury' },
        { season: 2025, matchday: 3, text: '', type: 'injury' },
      ],
    })
    const game = makeGame({ players: [injuryProne] })
    expect(getRetirementCandidate(game)?.id).toBe('p_injured')
  })

  it('golvet är exakt tröskel − RETIREMENT_AGE_MARGIN för positionen', () => {
    expect(RETIREMENT_AGE_MARGIN).toBe(4)
    expect(getPositionThreshold(PlayerPosition.Forward) - RETIREMENT_AGE_MARGIN).toBe(29)
    expect(getPositionThreshold(PlayerPosition.Goalkeeper) - RETIREMENT_AGE_MARGIN).toBe(32)
  })
})
