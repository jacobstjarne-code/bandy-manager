import { describe, it, expect } from 'vitest'

/**
 * Bug 0.6 regression test: Suspension events (utvisningar) must be sided
 * by team — left for home, right for away — not centered.
 */

// This helper mirrors the logic used in MatchLiveScreen to determine
// event alignment. It's extracted here so the rendering code can be tested
// without a full React render environment.
import { getEventAlignment } from '../matchLiveHelpers'

describe('Bug 0.6: Match event alignment by team side', () => {
  const homeClubId = 'club-home'
  const awayClubId = 'club-away'

  it('returns "home" alignment for home team suspension', () => {
    const result = getEventAlignment(homeClubId, homeClubId)
    expect(result).toBe('home')
  })

  it('returns "away" alignment for away team suspension', () => {
    const result = getEventAlignment(awayClubId, homeClubId)
    expect(result).toBe('away')
  })

  it('returns "home" alignment for home team goal', () => {
    const result = getEventAlignment(homeClubId, homeClubId)
    expect(result).toBe('home')
  })

  it('returns "away" alignment for away team goal', () => {
    const result = getEventAlignment(awayClubId, homeClubId)
    expect(result).toBe('away')
  })

  it('returns "home" when clubId matches homeClubId exactly', () => {
    expect(getEventAlignment('abc-123', 'abc-123')).toBe('home')
  })

  it('returns "away" when clubId does not match homeClubId', () => {
    expect(getEventAlignment('xyz-456', 'abc-123')).toBe('away')
  })
})
