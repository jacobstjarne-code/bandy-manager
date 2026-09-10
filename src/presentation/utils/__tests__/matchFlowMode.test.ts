import { describe, expect, it } from 'vitest'
import { shouldPauseAtHalftime } from '../matchFlowMode'

describe('shouldPauseAtHalftime', () => {
  it('keeps commentary mode uninterrupted', () => {
    expect(shouldPauseAtHalftime('commentary')).toBe(false)
  })

  it.each(['full', 'quicksim', 'silent'] as const)('keeps the halftime stop in %s mode', mode => {
    expect(shouldPauseAtHalftime(mode)).toBe(true)
  })
})
