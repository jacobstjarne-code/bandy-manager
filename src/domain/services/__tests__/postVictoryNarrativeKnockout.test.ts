import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../entities/Fixture'
import { classifyVictory } from '../postVictoryNarrativeService'

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f', leagueId: 'l', season: 1, roundNumber: 4, matchday: 30,
    homeClubId: 'managed', awayClubId: 'opp', status: 'completed',
    homeScore: 2, awayScore: 2, events: [], ...overrides,
  } as Fixture
}

describe('classifyVictory — avgjorda utslagsmatcher', () => {
  it('recognizes a penalty win as a victory', () => {
    const f = makeFixture({ isCup: false, isKnockout: true, penaltyResult: { home: 4, away: 3 } })
    expect(classifyVictory(f, 'managed')).toBe('playoff_win')
  })

  it('does not call a late regular-season match a playoff win', () => {
    const f = makeFixture({ homeScore: 4, awayScore: 3, isCup: false, isKnockout: false, matchday: 25 })
    expect(classifyVictory(f, 'managed')).toBeNull()
  })
})
