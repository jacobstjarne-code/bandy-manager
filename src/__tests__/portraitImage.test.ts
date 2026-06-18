/**
 * Genomgång II A — illustrerat hjälteporträtt: ålder → tier → seedat val, deterministiskt.
 */
import { describe, it, expect } from 'vitest'
import { ageToPortraitTier, getPortraitImagePath } from '../domain/services/portraitService'

describe('portrait arketyp-wiring', () => {
  it('ålder mappar till rätt tier', () => {
    expect(ageToPortraitTier(18)).toBe('young')
    expect(ageToPortraitTier(21)).toBe('young')
    expect(ageToPortraitTier(22)).toBe('mid')
    expect(ageToPortraitTier(26)).toBe('mid')
    expect(ageToPortraitTier(27)).toBe('exp')
    expect(ageToPortraitTier(31)).toBe('exp')
    expect(ageToPortraitTier(32)).toBe('vet')
    expect(ageToPortraitTier(38)).toBe('vet')
  })

  it('är deterministiskt per spelare och pekar på en giltig asset (1..8)', () => {
    const a = getPortraitImagePath('player_42', 25)
    const b = getPortraitImagePath('player_42', 25)
    expect(a).toBe(b)
    expect(a).toMatch(/^\/assets\/portraits\/portrait_mid_[1-8]\.png$/)
  })

  it('tier följer åldern även för samma id', () => {
    expect(getPortraitImagePath('player_7', 19)).toMatch(/portrait_young_[1-8]\.png$/)
    expect(getPortraitImagePath('player_7', 35)).toMatch(/portrait_vet_[1-8]\.png$/)
  })
})
