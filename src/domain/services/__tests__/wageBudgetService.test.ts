import { describe, expect, it } from 'vitest'
import type { Player } from '../../entities/Player'
import { calculateWageBudget } from '../wageBudgetService'

describe('calculateWageBudget', () => {
  it('ger tio procents utrymme och avrundar uppåt till närmaste tusental', () => {
    const players = [
      { clubId: 'managed', salary: 10_000 },
      { clubId: 'managed', salary: 12_500 },
      { clubId: 'other', salary: 99_000 },
    ] as Player[]

    expect(calculateWageBudget(players, 'managed')).toBe(25_000)
  })
})
