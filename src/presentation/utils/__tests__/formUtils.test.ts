import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../domain/entities/Fixture'
import { getFormResults } from '../formUtils'

const clubs = [
  { id: 'a', name: 'A', shortName: 'A' },
  { id: 'b', name: 'B', shortName: 'B' },
] as never

function fixture(id: string, matchday: number, overrides: Partial<Fixture> = {}): Fixture {
  return {
    id, leagueId: 'l', season: 1, roundNumber: matchday, matchday,
    homeClubId: 'a', awayClubId: 'b', status: 'completed',
    homeScore: 3, awayScore: 1, events: [], isCup: false, ...overrides,
  } as Fixture
}

describe('getFormResults — ligans egen tidslinje', () => {
  it('excludes playoff fixtures from league form', () => {
    const league = fixture('league', 22)
    const playoff = fixture('playoff', 30, { isKnockout: true, homeScore: 0, awayScore: 5 })
    expect(getFormResults('a', [league, playoff], clubs)).toEqual([
      expect.objectContaining({ result: 'V', score: '3–1' }),
    ])
  })

  it('sorts by matchday, not competition-local roundNumber', () => {
    const older = fixture('older', 4, { roundNumber: 20, homeScore: 1, awayScore: 4 })
    const newer = fixture('newer', 8, { roundNumber: 2, homeScore: 4, awayScore: 1 })
    expect(getFormResults('a', [older, newer], clubs).map(r => r.result)).toEqual(['V', 'F'])
  })
})
