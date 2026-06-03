/**
 * A1 — straff-flavor-guard. Straffavgjord match (penResult satt, bara cup/slutspel)
 * får egen "🎯 Straffseger/Förlust"-label. Ligamatch (inget penResult) ska ALDRIG
 * visa straff-text — den faller i margin-/kryss-logiken.
 */
import { describe, it, expect } from 'vitest'
import { granskaFlavorText } from '../presentation/screens/granska/GranskaOversikt'

describe('granskaFlavorText — A1 straff-guard', () => {
  it('penResult + vinst → Straffseger', () => {
    expect(granskaFlavorText({ penResult: { home: 4, away: 3 }, won: true, lost: false, isHome: true, homeScore: 3, awayScore: 3 }))
      .toBe('🎯 Straffseger')
  })

  it('penResult + förlust → Förlust på straffar', () => {
    expect(granskaFlavorText({ penResult: { home: 3, away: 4 }, won: false, lost: true, isHome: true, homeScore: 3, awayScore: 3 }))
      .toBe('🎯 Förlust på straffar')
  })

  it('ligamatch (inget penResult) läcker aldrig straff-text — knapp seger', () => {
    const out = granskaFlavorText({ won: true, lost: false, isHome: true, homeScore: 2, awayScore: 1 })
    expect(out).toBe('😅 Knapp seger · hemmaseger')
    expect(out).not.toContain('Straff')
    expect(out).not.toContain('🎯')
  })

  it('ligamatch oavgjort → kryss, inte straff', () => {
    const out = granskaFlavorText({ won: false, lost: false, isHome: false, homeScore: 2, awayScore: 2 })
    expect(out).toBe('🤝 Rättvis poängdelning')
    expect(out).not.toContain('Straff')
  })

  it('ligamatch storseger → dominant, bortaseger-svans när borta', () => {
    expect(granskaFlavorText({ won: true, lost: false, isHome: false, homeScore: 1, awayScore: 5 }))
      .toBe('💪 Dominant insats · bortaseger')
  })
})
