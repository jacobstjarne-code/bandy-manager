import { describe, expect, it } from 'vitest'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import { FixtureStatus } from '../../../domain/enums'
import { findRecoverableLiveFixture } from '../matchLiveHelpers'

const lineup = {
  startingPlayerIds: Array.from({ length: 11 }, (_, index) => `p${index}`),
  benchPlayerIds: [],
  tactic: {},
} as TeamSelection

function fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture-1',
    leagueId: 'league-1',
    season: 2026,
    roundNumber: 1,
    matchday: 1,
    homeClubId: 'home',
    awayClubId: 'away',
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  }
}

describe('findRecoverableLiveFixture', () => {
  it('hittar den durabelt startade matchen utan router-state', () => {
    const started = fixture({
      matchStartedAt: 100,
      homeLineup: lineup,
      awayLineup: lineup,
    })

    expect(findRecoverableLiveFixture([started])).toBe(started)
  })

  it('ignorerar avslutade matcher och ofullständiga äldre sparningar', () => {
    expect(findRecoverableLiveFixture([
      fixture({ matchStartedAt: 100 }),
      fixture({ status: FixtureStatus.Completed, matchStartedAt: 50, homeLineup: lineup, awayLineup: lineup }),
    ])).toBeUndefined()
  })

  it('väljer den tidigast startade deterministiskt om en save innehåller flera kandidater', () => {
    const later = fixture({ id: 'later', matchday: 2, matchStartedAt: 200, homeLineup: lineup, awayLineup: lineup })
    const earlier = fixture({ id: 'earlier', matchday: 1, matchStartedAt: 100, homeLineup: lineup, awayLineup: lineup })

    expect(findRecoverableLiveFixture([later, earlier])).toBe(earlier)
  })
})
