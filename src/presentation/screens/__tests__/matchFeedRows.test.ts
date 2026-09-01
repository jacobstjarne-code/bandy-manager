import { describe, expect, it } from 'vitest'
import { MatchEventType } from '../../../domain/enums'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { getSubstitutionFeedRow, shouldIncludeMatchStepInFeed } from '../matchLiveHelpers'

function makeStep(overrides: Partial<MatchStep> = {}): MatchStep {
  return {
    step: 31,
    minute: 47,
    events: [],
    homeScore: 0,
    awayScore: 0,
    commentary: '',
    intensity: 'low',
    activeSuspensions: { homeCount: 0, awayCount: 0 },
    shotsHome: 0,
    shotsAway: 0,
    onTargetHome: 0,
    onTargetAway: 0,
    cornersHome: 0,
    cornersAway: 0,
    ...overrides,
  }
}

describe('Stålvallen-feedens bytesrad (A1.5++)', () => {
  it('visar substitutionens eventtext även när MatchStep.commentary är tom', () => {
    const step = makeStep({
      events: [{
        type: MatchEventType.Substitution,
        clubId: 'away',
        playerId: 'in',
        secondaryPlayerId: 'out',
        minute: 45,
        description: '🔄 Anna In in för Britta Ut',
        manpowerState: 'EVEN',
        tacticalFactors: [],
        contributingFactors: [],
      }],
    })

    expect(shouldIncludeMatchStepInFeed(step)).toBe(true)
    expect(getSubstitutionFeedRow(step, 'home')).toEqual({
      kind: 'event',
      tag: 'sub',
      minute: 45,
      team: 'away',
      text: '🔄 Anna In in för Britta Ut',
    })
  })

  it('filtrerar fortfarande bort ett verkligt tomt steg utan event', () => {
    const step = makeStep()
    expect(shouldIncludeMatchStepInFeed(step)).toBe(false)
    expect(getSubstitutionFeedRow(step, 'home')).toBeNull()
  })
})
