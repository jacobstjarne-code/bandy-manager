import { pickCommentary, pickVariant, substitute } from '../domain/services/specialDateService'

describe('substitute', () => {
  it('ersätter kända nycklar', () => {
    expect(substitute('Hej {name}', { name: 'Uppsala' })).toBe('Hej Uppsala')
  })
  it('lämnar okända nycklar orörda', () => {
    expect(substitute('Hej {name}', {})).toBe('Hej {name}')
  })
})

describe('pickVariant', () => {
  it('är deterministiskt för samma season+matchday', () => {
    const pool = ['a', 'b', 'c', 'd', 'e']
    expect(pickVariant(pool, 2026, 14)).toBe(pickVariant(pool, 2026, 14))
  })
  it('ger olika resultat för olika säsonger', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    const results = new Set(Array.from({ length: 50 }, (_, i) => pickVariant(pool, i, 14)))
    expect(results.size).toBeGreaterThan(3)
  })
})

describe('pickCommentary lore-frekvens', () => {
  it('triggar lore ~15% av säsonger (± 5pp)', () => {
    let loreCount = 0
    for (let s = 0; s < 1000; s++) {
      const result = pickCommentary(['standard'], ['lore'], s, 14)
      if (result === 'lore') loreCount++
    }
    expect(loreCount).toBeGreaterThan(100)   // > 10%
    expect(loreCount).toBeLessThan(200)      // < 20%
  })
  it('returnerar standard om ingen lore', () => {
    expect(pickCommentary(['standard'], undefined, 2026, 14)).toBe('standard')
  })
})
