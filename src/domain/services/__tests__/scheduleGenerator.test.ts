import { describe, it, expect } from 'vitest'
import { generateSchedule } from '../scheduleGenerator'

const TEAM_COUNT = 12
const teamIds = Array.from({ length: TEAM_COUNT }, (_, i) => `team_${i + 1}`)

describe('generateSchedule', () => {
  const fixtures = generateSchedule(teamIds, 2026)

  it('generates correct total number of fixtures for 12 teams (132)', () => {
    expect(fixtures.length).toBe(132)
  })

  it('each team plays exactly 22 matches', () => {
    const matchCounts = new Map<string, number>()
    for (const id of teamIds) matchCounts.set(id, 0)

    for (const f of fixtures) {
      matchCounts.set(f.homeClubId, (matchCounts.get(f.homeClubId) ?? 0) + 1)
      matchCounts.set(f.awayClubId, (matchCounts.get(f.awayClubId) ?? 0) + 1)
    }

    for (const id of teamIds) {
      expect(matchCounts.get(id)).toBe(22)
    }
  })

  it('each team plays 11 home and 11 away matches', () => {
    const homeCounts = new Map<string, number>()
    const awayCounts = new Map<string, number>()
    for (const id of teamIds) {
      homeCounts.set(id, 0)
      awayCounts.set(id, 0)
    }

    for (const f of fixtures) {
      homeCounts.set(f.homeClubId, (homeCounts.get(f.homeClubId) ?? 0) + 1)
      awayCounts.set(f.awayClubId, (awayCounts.get(f.awayClubId) ?? 0) + 1)
    }

    for (const id of teamIds) {
      expect(homeCounts.get(id)).toBe(11)
      expect(awayCounts.get(id)).toBe(11)
    }
  })

  it('no team plays itself', () => {
    for (const f of fixtures) {
      expect(f.homeClubId).not.toBe(f.awayClubId)
    }
  })

  it('no duplicate fixture (same home+away pair in same round)', () => {
    const seen = new Set<string>()
    for (const f of fixtures) {
      const key = `${f.roundNumber}:${f.homeClubId}:${f.awayClubId}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('all round numbers are between 1 and 22', () => {
    for (const f of fixtures) {
      expect(f.roundNumber).toBeGreaterThanOrEqual(1)
      expect(f.roundNumber).toBeLessThanOrEqual(22)
    }
  })
})
