import { describe, it, expect } from 'vitest'
import { getSeasonalTone } from '../domain/services/portal/seasonalTone'

function isValidHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s)
}

describe('getSeasonalTone', () => {
  it('returnerar giltiga hex-strängar vid höst (1 sep)', () => {
    const tone = getSeasonalTone('2026-09-01')
    expect(isValidHex(tone.bgPrimary)).toBe(true)
    expect(isValidHex(tone.bgSurface)).toBe(true)
    expect(isValidHex(tone.bgElevated)).toBe(true)
    expect(isValidHex(tone.accentTone)).toBe(true)
  })

  it('returnerar giltiga hex-strängar vid övergång (1 nov)', () => {
    const tone = getSeasonalTone('2026-11-01')
    expect(isValidHex(tone.bgPrimary)).toBe(true)
    expect(isValidHex(tone.bgSurface)).toBe(true)
    expect(isValidHex(tone.bgElevated)).toBe(true)
    expect(isValidHex(tone.accentTone)).toBe(true)
  })

  it('returnerar giltiga hex-strängar vid djup vinter (1 jan)', () => {
    const tone = getSeasonalTone('2027-01-01')
    expect(isValidHex(tone.bgPrimary)).toBe(true)
    expect(isValidHex(tone.bgSurface)).toBe(true)
    expect(isValidHex(tone.bgElevated)).toBe(true)
    expect(isValidHex(tone.accentTone)).toBe(true)
  })

  it('returnerar giltiga hex-strängar vid slutspelsskärpa (1 mars)', () => {
    const tone = getSeasonalTone('2027-03-01')
    expect(isValidHex(tone.bgPrimary)).toBe(true)
    expect(isValidHex(tone.bgSurface)).toBe(true)
    expect(isValidHex(tone.bgElevated)).toBe(true)
    expect(isValidHex(tone.accentTone)).toBe(true)
  })

  it('returnerar giltiga hex-strängar vid säsongsslut (1 maj)', () => {
    const tone = getSeasonalTone('2027-05-01')
    expect(isValidHex(tone.bgPrimary)).toBe(true)
    expect(isValidHex(tone.bgSurface)).toBe(true)
    expect(isValidHex(tone.bgElevated)).toBe(true)
    expect(isValidHex(tone.accentTone)).toBe(true)
  })

  it('är deterministisk — samma datum ger samma tone', () => {
    const t1 = getSeasonalTone('2026-12-15')
    const t2 = getSeasonalTone('2026-12-15')
    expect(t1).toEqual(t2)
  })

  it('vinter är kallare (mörkare bgPrimary) än höst', () => {
    const autumn = getSeasonalTone('2026-09-01')
    const winter = getSeasonalTone('2027-01-01')
    // Vinter bgPrimary ska ha lägre summa RGB = mörkare
    const sumHex = (h: string) => {
      const c = h.replace('#', '')
      return parseInt(c.slice(0,2), 16) + parseInt(c.slice(2,4), 16) + parseInt(c.slice(4,6), 16)
    }
    expect(sumHex(winter.bgPrimary)).toBeLessThanOrEqual(sumHex(autumn.bgPrimary))
  })

  it('interpolerar — november är mellan höst och vinter', () => {
    const autumn = getSeasonalTone('2026-09-01')
    const november = getSeasonalTone('2026-11-01')
    const winter = getSeasonalTone('2027-01-01')

    // Extrahera R-kanal som proxy
    const r = (h: string) => parseInt(h.replace('#', '').slice(0,2), 16)
    const rAutumn = r(autumn.bgPrimary)
    const rNov = r(november.bgPrimary)
    const rWinter = r(winter.bgPrimary)

    const minR = Math.min(rAutumn, rWinter)
    const maxR = Math.max(rAutumn, rWinter)
    expect(rNov).toBeGreaterThanOrEqual(minR - 1)
    expect(rNov).toBeLessThanOrEqual(maxR + 1)
  })
})
