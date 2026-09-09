/**
 * Genomgång II A — illustrerat hjälteporträtt: ålder → tier → seedat val, deterministiskt.
 */
import { describe, it, expect } from 'vitest'
import { CURATED_PORTRAIT_INDICES, ageToPortraitTier, getPortraitImagePath } from '../domain/services/portraitService'

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

  it('är deterministiskt per veteran och väljer bara ur den faktiska filuppsättningen', () => {
    const a = getPortraitImagePath('player_42', 35)
    const b = getPortraitImagePath('player_42', 35)
    expect(a).toBe(b)
    expect(a).toMatch(/^\/assets\/portraits\/portrait_vet_(?:1|2|[4-9]|1[0-6])\.png$/)
    expect(CURATED_PORTRAIT_INDICES.vet).not.toContain(3)
  })

  it('tomma tierer ger SVG-fallback i UI i stället för en bruten bildlänk', () => {
    expect(getPortraitImagePath('player_7', 19)).toBeNull()
    expect(getPortraitImagePath('player_7', 25)).toBeNull()
    expect(getPortraitImagePath('player_7', 29)).toBeNull()
    expect(getPortraitImagePath('player_7', 35)).toMatch(/portrait_vet_(?:1|2|[4-9]|1[0-6])\.png$/)
  })
})
