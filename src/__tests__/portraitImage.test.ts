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

  it('är deterministiskt per spelare och väljer bara ur respektive kuraterad filuppsättning', () => {
    const a = getPortraitImagePath('player_42', 35)
    const b = getPortraitImagePath('player_42', 35)
    expect(a).toBe(b)
    expect(a).toMatch(/^\/assets\/portraits\/portrait_vet_(?:[1-5]|[7-9]|1[0-6])\.png\?v=8$/)
    expect(getPortraitImagePath('player_42', 19)).toMatch(/^\/assets\/portraits\/portrait_young_(?:[1-9]|[12]\d|30)\.png\?v=8$/)
    expect(getPortraitImagePath('player_42', 25)).toMatch(/^\/assets\/portraits\/portrait_mid_(?:[1-9]|[12]\d|30)\.png\?v=8$/)
    expect(getPortraitImagePath('player_42', 29)).toMatch(/^\/assets\/portraits\/portrait_exp_(?:[1-9]|[12]\d|30)\.png\?v=8$/)
    expect(CURATED_PORTRAIT_INDICES.young).toEqual(Array.from({ length: 30 }, (_, index) => index + 1))
    expect(CURATED_PORTRAIT_INDICES.mid).toHaveLength(30)
    expect(CURATED_PORTRAIT_INDICES.exp).toHaveLength(30)
    expect(CURATED_PORTRAIT_INDICES.vet).toContain(3)
    expect(CURATED_PORTRAIT_INDICES.vet).not.toContain(6)
  })

  it('alla fyra åldersfack har en kuraterad bildväg', () => {
    expect(getPortraitImagePath('player_7', 19)).toMatch(/portrait_young_(?:[1-9]|[12]\d|30)\.png\?v=8$/)
    expect(getPortraitImagePath('player_7', 25)).toMatch(/portrait_mid_(?:[1-9]|[12]\d|30)\.png\?v=8$/)
    expect(getPortraitImagePath('player_7', 29)).toMatch(/portrait_exp_(?:[1-9]|[12]\d|30)\.png\?v=8$/)
    expect(getPortraitImagePath('player_7', 35)).toMatch(/portrait_vet_(?:[1-5]|[7-9]|1[0-6])\.png\?v=8$/)
  })

  it('klustrar inte när strukturerade spelar-id:n bara skiljer sig sent', () => {
    expect(getPortraitImagePath('p-h1', 19)).not.toBe(getPortraitImagePath('p-f3', 21))
  })
})
