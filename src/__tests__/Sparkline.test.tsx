import { describe, it, expect } from 'vitest'
import { normalize, MIN_POINTS } from '../presentation/components/primitives/Sparkline'

describe('Sparkline — MIN_POINTS', () => {
  it('MIN_POINTS is 5', () => {
    expect(MIN_POINTS).toBe(5)
  })
})

describe('Sparkline — normalize()', () => {
  const height = 28

  describe('normalization: different value ranges → identical y-coordinates', () => {
    it('[1,12,1,12,1,12] and [100,1200,100,1200,100,1200] produce identical y-coords', () => {
      const pts1 = normalize([1, 12, 1, 12, 1, 12], height, false)
      const pts2 = normalize([100, 1200, 100, 1200, 100, 1200], height, false)
      expect(pts1.length).toBe(pts2.length)
      pts1.forEach(([, y1], i) => {
        expect(Math.abs(y1 - pts2[i][1])).toBeLessThan(0.001)
      })
    })

    it('[0,100] and [0,1] produce identical y-coords', () => {
      const pts1 = normalize([0, 50, 100, 50, 0], height, false)
      const pts2 = normalize([0, 0.5, 1, 0.5, 0], height, false)
      pts1.forEach(([, y1], i) => {
        expect(Math.abs(y1 - pts2[i][1])).toBeLessThan(0.001)
      })
    })
  })

  describe('yInverted: ascending points', () => {
    // Without yInverted: value 1 is highest on screen (low y), value 5 is lowest (high y)
    // → ascending points produce decreasing y = upward line on screen
    it('without yInverted: ascending [1..5] → y decreases (line goes up)', () => {
      const pts = normalize([1, 2, 3, 4, 5], height, false)
      expect(pts[0][1]).toBeGreaterThan(pts[4][1])
    })

    // With yInverted: value 1 is lowest on screen (high y), value 5 is highest (low y)
    // → ascending points produce increasing y = downward line on screen (rank getting worse)
    it('with yInverted: ascending [1..5] → y increases (line goes down, rank gets worse)', () => {
      const pts = normalize([1, 2, 3, 4, 5], height, true)
      expect(pts[0][1]).toBeLessThan(pts[4][1])
    })
  })

  describe('x-coordinates span full width', () => {
    it('first x = 0, last x = 100 for multi-point series', () => {
      const pts = normalize([1, 2, 3, 4, 5], height, false)
      expect(pts[0][0]).toBeCloseTo(0)
      expect(pts[pts.length - 1][0]).toBeCloseTo(100)
    })
  })

  describe('flat line (all same value)', () => {
    it('flat line centers vertically (ratio=0.5)', () => {
      const pts = normalize([5, 5, 5, 5, 5], height, false)
      // range=0 → ratio=0.5 → y = PADDING + 0.5 * drawH = 2 + 12 = 14
      pts.forEach(([, y]) => {
        expect(y).toBeCloseTo(14)
      })
    })
  })

  describe('padding: y-values stay within [PADDING, height-PADDING]', () => {
    it('y stays within [2, 26] for height=28', () => {
      const pts = normalize([1, 12, 1, 12, 1, 12], height, false)
      pts.forEach(([, y]) => {
        expect(y).toBeGreaterThanOrEqual(2)
        expect(y).toBeLessThanOrEqual(26)
      })
    })
  })
})
