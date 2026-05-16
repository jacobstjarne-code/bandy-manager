import { describe, it, expect } from 'vitest'
import { applyPhaseBias } from '../domain/services/portal/seasonPhaseBias'

describe('applyPhaseBias', () => {
  it('playoff secondary dämpas till 40% — 60 × 0.4 = 24.0', () => {
    expect(applyPhaseBias(60, 'secondary', 'playoff')).toBeCloseTo(24.0)
  })

  it('endgame secondary dämpas till 60% — 60 × 0.6 = 36.0', () => {
    expect(applyPhaseBias(60, 'secondary', 'endgame')).toBeCloseTo(36.0)
  })

  it('primary orörd vid playoff — 100 × 1.0 = 100', () => {
    expect(applyPhaseBias(100, 'primary', 'playoff')).toBe(100)
  })

  it('minimal orörd vid playoff — 30 × 1.0 = 30', () => {
    expect(applyPhaseBias(30, 'minimal', 'playoff')).toBe(30)
  })

  it('mid-fas ger bias × 1.0 för secondary', () => {
    expect(applyPhaseBias(87, 'secondary', 'mid')).toBeCloseTo(87)
  })

  it('early-fas ger bias × 1.0 för alla tiers', () => {
    expect(applyPhaseBias(50, 'primary', 'early')).toBe(50)
    expect(applyPhaseBias(50, 'secondary', 'early')).toBe(50)
    expect(applyPhaseBias(50, 'minimal', 'early')).toBe(50)
  })
})
