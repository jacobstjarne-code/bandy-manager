import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { FixtureStatus } from '../../../domain/enums'

describe('createNewGame', () => {
  it('returns SaveGame with 12 clubs', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(game.clubs.length).toBe(12)
  })

  it('returns SaveGame with exactly 192 players (16 per club × 12 clubs)', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(game.players.length).toBe(192)
  })

  it('returns SaveGame with 132 league fixtures plus cup fixtures', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const leagueFixtures = game.fixtures.filter(f => !f.isCup)
    const cupFixtures = game.fixtures.filter(f => f.isCup)
    expect(leagueFixtures.length).toBe(132)
    expect(cupFixtures.length).toBeGreaterThan(0)
  })

  it('all fixtures have status Scheduled', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const allScheduled = game.fixtures.every(f => f.status === FixtureStatus.Scheduled)
    expect(allScheduled).toBe(true)
  })

  it('currentDate starts with the season year and "10-"', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(game.currentDate).toMatch(/^2025-10-/)
  })

  it('managerName and managedClubId are set correctly', () => {
    const game = createNewGame({ managerName: 'Jacob Stjärne', clubId: 'club_soderfors', season: 2025, seed: 42 })
    expect(game.managerName).toBe('Jacob Stjärne')
    expect(game.managedClubId).toBe('club_soderfors')
  })

  it('standings has 12 entries, all with 0 points', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(game.standings.length).toBe(12)
    const allZero = game.standings.every(s => s.points === 0)
    expect(allZero).toBe(true)
  })

  it('league.teamIds has 12 entries', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(game.league.teamIds.length).toBe(12)
  })

  it('inbox is empty array', () => {
    const game = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    expect(game.inbox).toEqual([])
  })

  it('same seed produces same fixture schedule (deterministic)', () => {
    const game1 = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 99 })
    const game2 = createNewGame({ managerName: 'Jacob', clubId: 'club_forsbacka', season: 2025, seed: 99 })

    const fixtureIds1 = game1.fixtures.map(f => f.id).sort()
    const fixtureIds2 = game2.fixtures.map(f => f.id).sort()
    expect(fixtureIds1).toEqual(fixtureIds2)
  })
})
