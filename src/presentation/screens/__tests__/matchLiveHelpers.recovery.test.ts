import { describe, expect, it } from 'vitest'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import { FixtureStatus } from '../../../domain/enums'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { findRecoverableLiveFixture, getLiveMatchResumePoint } from '../matchLiveHelpers'

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

function step(index: number, minute: number): MatchStep {
  return {
    step: index,
    minute,
    events: [],
    homeScore: index,
    awayScore: 0,
    commentary: '',
    intensity: 'low',
    activeSuspensions: { homeCount: 0, awayCount: 0, homeTimers: [], awayTimers: [] },
    shotsHome: index,
    shotsAway: 0,
    onTargetHome: index,
    onTargetAway: 0,
    cornersHome: 0,
    cornersAway: 0,
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

describe('getLiveMatchResumePoint', () => {
  it('bevarar exakt stegserie och visningsminut mellan två händelsesteg', () => {
    const steps = [step(0, 0), step(1, 15), step(2, 20)]
    const resume = getLiveMatchResumePoint({ currentStep: 1, displayedMinute: 17, steps })

    expect(resume).toEqual({ currentStep: 1, displayedMinute: 17, steps })
    expect(resume?.steps).toBe(steps)
  })

  it('klampar korrupt steg och minut till den sparade seriens giltiga slutpunkt', () => {
    const steps = [step(0, 0), step(1, 15)]
    expect(getLiveMatchResumePoint({ currentStep: 99, displayedMinute: 99, steps })).toEqual({
      currentStep: 1,
      displayedMinute: 15,
      steps,
    })
  })

  it('returnerar null när ingen verklig stegserie finns', () => {
    expect(getLiveMatchResumePoint(undefined)).toBeNull()
    expect(getLiveMatchResumePoint({ currentStep: 0, displayedMinute: 0, steps: [] })).toBeNull()
  })
})
