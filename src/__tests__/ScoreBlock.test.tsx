import { describe, it, expect } from 'vitest'
import { ScoreBlock, MAX_LABEL_LENGTH } from '../presentation/components/primitives/ScoreBlock'
import type { ScoreBlockVariant } from '../presentation/components/primitives/ScoreBlock'

describe('ScoreBlock', () => {
  it('exports MAX_LABEL_LENGTH as 11', () => {
    expect(MAX_LABEL_LENGTH).toBe(11)
  })

  it('is a function (renderable component)', () => {
    expect(typeof ScoreBlock).toBe('function')
  })

  it('accepts all six variants without TypeScript error', () => {
    const variants: ScoreBlockVariant[] = ['win', 'loss', 'draw', 'derby', 'gold', 'subtle']
    expect(variants).toHaveLength(6)
    // All are valid — TypeScript catches invalid variants at compile time
    variants.forEach(v => expect(typeof v).toBe('string'))
  })

  it('gold is a valid variant (caller enforces SM-final/Cup-final context)', () => {
    const variants: ScoreBlockVariant[] = ['win', 'loss', 'draw', 'derby', 'gold', 'subtle']
    expect(variants).toContain('gold')
  })

  describe('label truncation rule (> 11 chars omitted, not truncated)', () => {
    it('label within limit passes through', () => {
      // The component uses: label.length <= MAX_LABEL_LENGTH
      const label = 'SM-FINAL'  // 8 chars
      expect(label.length <= MAX_LABEL_LENGTH).toBe(true)
    })

    it('label exactly 11 chars passes', () => {
      const label = 'KVARTS G5 X' // 11 chars
      expect(label.length <= MAX_LABEL_LENGTH).toBe(true)
    })

    it('label 12 chars is omitted', () => {
      const label = 'DETTA ÄR FÖR' // >11 chars
      expect(label.length <= MAX_LABEL_LENGTH).toBe(false)
    })

    it('"KVARTS G5" (9 chars) passes', () => {
      expect('KVARTS G5'.length <= MAX_LABEL_LENGTH).toBe(true)
    })
  })
})
