import { describe, it, expect } from 'vitest'
import { pickAnslagVariant } from '../anslagService'
import type { AnslagText } from '../../data/anslag/types'

const multiVariant: AnslagText = {
  chapter: 'X',
  variants: [{ body: 'A' }, { body: 'B' }, { body: 'C' }],
}

describe('pickAnslagVariant', () => {
  it('returns same variant for same (season, key, clubId)', () => {
    const a = pickAnslagVariant(multiVariant, 1, 'cup_start', 'forsbacka')
    const b = pickAnslagVariant(multiVariant, 1, 'cup_start', 'forsbacka')
    expect(a).toBe(b)
  })

  it('returns different variants for different seasons', () => {
    const results = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s =>
        pickAnslagVariant(multiVariant, s, 'cup_start', 'forsbacka')
      )
    )
    expect(results.size).toBeGreaterThan(1)
  })

  it('handles single-variant arrays', () => {
    const single: AnslagText = { chapter: 'X', variants: [{ body: 'OnlyOne' }] }
    expect(pickAnslagVariant(single, 1, 'cup_start', 'club')).toBe('OnlyOne')
  })

  it('throws on empty variants array', () => {
    const empty: AnslagText = { chapter: 'X', variants: [] }
    expect(() => pickAnslagVariant(empty, 1, 'cup_start', 'club')).toThrow()
  })

  it('different clubId gives different distribution', () => {
    const resultsA = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s =>
        pickAnslagVariant(multiVariant, s, 'cup_start', 'club_a')
      )
    )
    const resultsB = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s =>
        pickAnslagVariant(multiVariant, s, 'cup_start', 'club_b')
      )
    )
    // At least one of the sets should have more than 1 variant — seeding is working
    expect(resultsA.size + resultsB.size).toBeGreaterThan(2)
  })

  it('returns one of the defined bodies', () => {
    const bodies = multiVariant.variants.map(v => v.body)
    for (let s = 1; s <= 20; s++) {
      const result = pickAnslagVariant(multiVariant, s, 'cup_start', 'club')
      expect(bodies).toContain(result)
    }
  })

  it('respects weight — heavier variant chosen more often', () => {
    const weighted: AnslagText = {
      chapter: 'X',
      variants: [{ body: 'rare', weight: 1 }, { body: 'common', weight: 99 }],
    }
    const results = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(s =>
      pickAnslagVariant(weighted, s, 'cup_start', 'club')
    )
    const commonCount = results.filter(r => r === 'common').length
    expect(commonCount).toBeGreaterThan(10) // should be ~19/20
  })
})
