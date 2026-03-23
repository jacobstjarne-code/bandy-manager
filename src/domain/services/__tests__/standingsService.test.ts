import { describe, it, expect } from 'vitest'
import { calculateStandings } from '../standingsService'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

const teamIds = ['club_a', 'club_b', 'club_c', 'club_d']

function makeFixture(overrides: Partial<Fixture> & Pick<Fixture, 'id' | 'homeClubId' | 'awayClubId' | 'homeScore' | 'awayScore' | 'status'>): Fixture {
  return {
    leagueId: 'league_1',
    season: 2026,
    roundNumber: 1,
    events: [],
    ...overrides,
  }
}

describe('calculateStandings', () => {
  it('empty fixtures: all teams have 0 points, sorted by clubId', () => {
    const standings = calculateStandings(teamIds, [])
    expect(standings).toHaveLength(4)
    for (const row of standings) {
      expect(row.points).toBe(0)
      expect(row.played).toBe(0)
    }
    // Sorted by clubId ascending as tiebreak
    const ids = standings.map((r) => r.clubId)
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)))
  })

  it('one completed match: winner gets 3 points, loser 0', () => {
    const fixtures: Fixture[] = [
      makeFixture({ id: 'f1', homeClubId: 'club_a', awayClubId: 'club_b', homeScore: 3, awayScore: 1, status: FixtureStatus.Completed }),
    ]
    const standings = calculateStandings(teamIds, fixtures)
    const a = standings.find((r) => r.clubId === 'club_a')!
    const b = standings.find((r) => r.clubId === 'club_b')!
    expect(a.points).toBe(3)
    expect(a.wins).toBe(1)
    expect(b.points).toBe(0)
    expect(b.losses).toBe(1)
  })

  it('one draw: both teams get 1 point', () => {
    const fixtures: Fixture[] = [
      makeFixture({ id: 'f1', homeClubId: 'club_a', awayClubId: 'club_b', homeScore: 2, awayScore: 2, status: FixtureStatus.Completed }),
    ]
    const standings = calculateStandings(teamIds, fixtures)
    const a = standings.find((r) => r.clubId === 'club_a')!
    const b = standings.find((r) => r.clubId === 'club_b')!
    expect(a.points).toBe(1)
    expect(a.draws).toBe(1)
    expect(b.points).toBe(1)
    expect(b.draws).toBe(1)
  })

  it('pending and scheduled fixtures are ignored', () => {
    const fixtures: Fixture[] = [
      makeFixture({ id: 'f1', homeClubId: 'club_a', awayClubId: 'club_b', homeScore: 5, awayScore: 0, status: FixtureStatus.Scheduled }),
      makeFixture({ id: 'f2', homeClubId: 'club_c', awayClubId: 'club_d', homeScore: 3, awayScore: 1, status: FixtureStatus.Ready }),
    ]
    const standings = calculateStandings(teamIds, fixtures)
    for (const row of standings) {
      expect(row.points).toBe(0)
      expect(row.played).toBe(0)
    }
  })

  it('correct goal difference calculation', () => {
    const fixtures: Fixture[] = [
      makeFixture({ id: 'f1', homeClubId: 'club_a', awayClubId: 'club_b', homeScore: 4, awayScore: 1, status: FixtureStatus.Completed }),
    ]
    const standings = calculateStandings(teamIds, fixtures)
    const a = standings.find((r) => r.clubId === 'club_a')!
    const b = standings.find((r) => r.clubId === 'club_b')!
    expect(a.goalDifference).toBe(3)
    expect(a.goalsFor).toBe(4)
    expect(a.goalsAgainst).toBe(1)
    expect(b.goalDifference).toBe(-3)
    expect(b.goalsFor).toBe(1)
    expect(b.goalsAgainst).toBe(4)
  })

  it('correct sort order: points → goalDifference → goalsFor', () => {
    const fixtures: Fixture[] = [
      // club_a wins: 3pts, GD+2
      makeFixture({ id: 'f1', homeClubId: 'club_a', awayClubId: 'club_b', homeScore: 3, awayScore: 1, status: FixtureStatus.Completed }),
      // club_c wins: 3pts, GD+4
      makeFixture({ id: 'f2', homeClubId: 'club_c', awayClubId: 'club_d', homeScore: 5, awayScore: 1, status: FixtureStatus.Completed }),
    ]
    const standings = calculateStandings(teamIds, fixtures)
    // club_c: 3pts, GD+4 → 1st
    // club_a: 3pts, GD+2 → 2nd
    expect(standings[0].clubId).toBe('club_c')
    expect(standings[1].clubId).toBe('club_a')
  })

  it('positions assigned correctly 1..N', () => {
    const standings = calculateStandings(teamIds, [])
    const positions = standings.map((r) => r.position)
    expect(positions).toEqual([1, 2, 3, 4])
  })
})
