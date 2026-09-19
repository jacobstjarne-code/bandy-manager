import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../src/domain/entities/Fixture'
import { FixtureStatus } from '../../../src/domain/enums'
import { extractPostponedMatchStat, newSeasonStats } from '../stats'

describe('stressloggen — inställda matcher', () => {
  it('loggar en väderinställd fixtur separat utan att skapa ett falskt resultat', () => {
    const fixture = {
      id: 'postponed-1',
      season: 2026,
      matchday: 3,
      roundNumber: 3,
      homeClubId: 'club-a',
      awayClubId: 'club-b',
      status: FixtureStatus.Postponed,
      isCup: false,
      isKnockout: false,
    } as Fixture

    const row = extractPostponedMatchStat(fixture, 8, 1)

    expect(row).toEqual({
      seed: 8,
      season: 1,
      round: 3,
      phase: 'regular',
      homeClubId: 'club-a',
      awayClubId: 'club-b',
      status: 'postponed',
      reason: 'weather',
    })
    expect(row).not.toHaveProperty('homeScore')
    expect(newSeasonStats(8, 1, 'club-a', 50).postponedMatches).toEqual([])
  })
})
