import { describe, it, expect } from 'vitest'
import { startCooldown, decrementCooldowns, isInCooldown } from '../domain/services/sourceCooldownService'

describe('sourceCooldownService', () => {
  it('startCooldown sets roundsLeft to configured value', () => {
    const result = startCooldown({}, 'kommunen')
    expect(result.kommunen?.roundsLeft).toBe(8)
    expect(result.kommunen?.totalRounds).toBe(8)
  })

  it('startCooldown sets mecenat to 4 rounds', () => {
    const result = startCooldown({}, 'mecenat')
    expect(result.mecenat?.roundsLeft).toBe(4)
  })

  it('decrementCooldowns reduces by 1', () => {
    const start = startCooldown({}, 'kommunen')
    const after = decrementCooldowns(start)
    expect(after.kommunen?.roundsLeft).toBe(7)
  })

  it('decrementCooldowns removes when roundsLeft reaches 0', () => {
    const oneLeft = { kommunen: { roundsLeft: 1, totalRounds: 8 } }
    const after = decrementCooldowns(oneLeft)
    expect(after.kommunen).toBeUndefined()
  })

  it('isInCooldown returns true when roundsLeft > 0', () => {
    const cooldowns = startCooldown({}, 'mecenat')
    expect(isInCooldown(cooldowns, 'mecenat')).toBe(true)
    expect(isInCooldown(cooldowns, 'kommunen')).toBe(false)
  })

  it('preserves other sources when decrementing', () => {
    const both = { ...startCooldown({}, 'kommunen'), ...startCooldown({}, 'mecenat') }
    const after = decrementCooldowns(both)
    expect(after.kommunen?.roundsLeft).toBe(7)
    expect(after.mecenat?.roundsLeft).toBe(3)
  })
})
