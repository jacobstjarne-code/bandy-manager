/**
 * PÅSTÅENDEKARTAN (2026-08-24), Jacobs prioritet 1 — CeremonySmFinal viste
 * tidigare fel medalj vid ett straffavgörande SM-final. Se finalResult.ts.
 */
import { describe, it, expect } from 'vitest'
import { didManagedWinFinal } from '../finalResult'
import type { MatchStep } from '../../../domain/services/matchUtils'

function makeStep(overrides: Partial<MatchStep> = {}): MatchStep {
  return {
    step: 77, minute: 110, events: [], homeScore: 2, awayScore: 2,
    commentary: '', intensity: 'high',
    activeSuspensions: { homeCount: 0, awayCount: 0 },
    shotsHome: 10, shotsAway: 10, onTargetHome: 5, onTargetAway: 5,
    cornersHome: 3, cornersAway: 3,
    ...overrides,
  }
}

describe('didManagedWinFinal', () => {
  it('reglertid/förlängning: läser homeScore/awayScore direkt när ingen straffläggning skedde', () => {
    const steps = [makeStep({ homeScore: 3, awayScore: 2 })]
    expect(didManagedWinFinal(true, 3, 2, steps)).toBe(true)
    expect(didManagedWinFinal(false, 3, 2, steps)).toBe(false)
  })

  it('straffavgörande: homeScore===awayScore men managed VANN på straffar — måste läsa penaltyFinalResult, inte reglertiden', () => {
    const steps = [
      makeStep({ homeScore: 2, awayScore: 2 }),
      makeStep({ homeScore: 2, awayScore: 2, penaltyDone: true, penaltyFinalResult: { home: 5, away: 4 } }),
    ]
    // Managed = home, vann på straffar (5-4) trots lika reglertidsställning.
    expect(didManagedWinFinal(true, 2, 2, steps)).toBe(true)
    // Managed = away, förlorade på straffar.
    expect(didManagedWinFinal(false, 2, 2, steps)).toBe(false)
  })

  it('straffavgörande: managed FÖRLORADE på straffar — regression för den faktiska buggen (visade tidigare "SILVER" fel väg, eller "SVENSKA MÄSTARE" för fel lag)', () => {
    const steps = [
      makeStep({ homeScore: 1, awayScore: 1, penaltyDone: true, penaltyFinalResult: { home: 3, away: 5 } }),
    ]
    expect(didManagedWinFinal(true, 1, 1, steps)).toBe(false)
    expect(didManagedWinFinal(false, 1, 1, steps)).toBe(true)
  })
})
