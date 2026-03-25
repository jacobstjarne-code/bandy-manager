import { describe, it, expect } from 'vitest'
import {
  startScoutAssignment,
  processScoutAssignment,
  generateScoutNotes,
  getScoutReportAge,
} from '../scoutingService'
import { PlayerArchetype, PlayerPosition } from '../../enums'
import type { Player } from '../../entities/Player'
import type { ScoutAssignment } from '../../entities/Scouting'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player_scout_1',
    firstName: 'Lars',
    lastName: 'Eriksson',
    age: 22,
    nationality: 'svenska',
    clubId: 'club_away',
    isHomegrown: false,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 8000,
    contractUntilSeason: 2027,
    marketValue: 100000,
    morale: 70,
    form: 65,
    fitness: 80,
    sharpness: 70,
    currentAbility: 65,
    potentialAbility: 80,
    developmentRate: 60,
    injuryProneness: 30,
    discipline: 70,
    attributes: {
      skating: 65, acceleration: 70, stamina: 60, ballControl: 58,
      passing: 52, shooting: 74, dribbling: 60, vision: 50,
      decisions: 62, workRate: 55, positioning: 68, defending: 35,
      cornerSkill: 40, goalkeeping: 5,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0,
      penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0,
      averageRating: 0, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    ...overrides,
  }
}

describe('startScoutAssignment', () => {
  it('sets roundsRemaining=1 for same region', () => {
    const a = startScoutAssignment('p1', 'club_a', '2025-11-01', true)
    expect(a.roundsRemaining).toBe(1)
    expect(a.targetPlayerId).toBe('p1')
    expect(a.targetClubId).toBe('club_a')
    expect(a.startedDate).toBe('2025-11-01')
  })

  it('sets roundsRemaining=2 for different region', () => {
    const a = startScoutAssignment('p2', 'club_b', '2025-11-01', false)
    expect(a.roundsRemaining).toBe(2)
  })
})

describe('processScoutAssignment', () => {
  const player = makePlayer()
  const assignment: ScoutAssignment = {
    targetPlayerId: player.id,
    targetClubId: player.clubId,
    startedDate: '2025-11-01',
    roundsRemaining: 0,
  }

  it('generates revealedAttributes for all 14 attributes', () => {
    const report = processScoutAssignment(assignment, player, 70, 42, 2025)
    expect(Object.keys(report.revealedAttributes)).toHaveLength(14)
  })

  it('clamps all revealedAttributes to 1–99', () => {
    // Run many seeds to verify clamping
    for (let seed = 0; seed < 50; seed++) {
      const report = processScoutAssignment(assignment, player, 30, seed, 2025)
      for (const val of Object.values(report.revealedAttributes)) {
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(99)
      }
    }
  })

  it('estimatedCA is within ±5 of real CA (with some tolerance for rounding)', () => {
    // Over many seeds the average should be close — but individual can drift ±5+rounding
    const report = processScoutAssignment(assignment, player, 70, 123, 2025)
    expect(Math.abs(report.estimatedCA - player.currentAbility)).toBeLessThanOrEqual(6)
  })

  it('estimatedPA is within ±10 of real PA', () => {
    const report = processScoutAssignment(assignment, player, 70, 456, 2025)
    expect(Math.abs(report.estimatedPA - player.potentialAbility)).toBeLessThanOrEqual(11)
  })

  it('uses higher error margin for low accuracy', () => {
    // accuracy 30 → errorMargin 7, accuracy 90 → errorMargin 1
    // Run 20 seeds and check that low-accuracy reports have higher avg deviation
    let totalDevLow = 0
    let totalDevHigh = 0
    const N = 20
    for (let s = 0; s < N; s++) {
      const low = processScoutAssignment(assignment, player, 30, s * 101, 2025)
      const high = processScoutAssignment(assignment, player, 90, s * 101, 2025)
      const attrKey = 'shooting' as const
      totalDevLow += Math.abs((low.revealedAttributes[attrKey] ?? 0) - player.attributes[attrKey])
      totalDevHigh += Math.abs((high.revealedAttributes[attrKey] ?? 0) - player.attributes[attrKey])
    }
    expect(totalDevLow).toBeGreaterThanOrEqual(totalDevHigh)
  })

  it('report contains non-empty notes', () => {
    const report = processScoutAssignment(assignment, player, 70, 1, 2025)
    expect(report.notes.length).toBeGreaterThan(0)
  })

  it('playerId and clubId match assignment', () => {
    const report = processScoutAssignment(assignment, player, 70, 1, 2025)
    expect(report.playerId).toBe(player.id)
    expect(report.clubId).toBe(assignment.targetClubId)
  })
})

describe('generateScoutNotes', () => {
  it('returns a non-empty Swedish string', () => {
    const player = makePlayer()
    const notes = generateScoutNotes(player)
    expect(typeof notes).toBe('string')
    expect(notes.length).toBeGreaterThan(10)
  })

  it('works for all archetypes', () => {
    for (const arch of Object.values(PlayerArchetype)) {
      const p = makePlayer({ archetype: arch })
      const notes = generateScoutNotes(p)
      expect(notes.length).toBeGreaterThan(0)
    }
  })
})

describe('getScoutReportAge', () => {
  const dummyReport = {} as import('../../entities/Scouting').ScoutReport

  it('returns fresh when same season', () => {
    expect(getScoutReportAge(dummyReport, 2025, 2025)).toBe('fresh')
  })

  it('returns fresh when scoutedSeason is in the future (edge case)', () => {
    expect(getScoutReportAge(dummyReport, 2025, 2026)).toBe('fresh')
  })

  it('returns aging after 1 season', () => {
    expect(getScoutReportAge(dummyReport, 2026, 2025)).toBe('aging')
  })

  it('returns stale after 2 seasons', () => {
    expect(getScoutReportAge(dummyReport, 2027, 2025)).toBe('stale')
  })

  it('returns stale after 3+ seasons', () => {
    expect(getScoutReportAge(dummyReport, 2030, 2025)).toBe('stale')
  })
})
