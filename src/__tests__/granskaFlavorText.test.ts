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

  // GRANSKA DEL 4 steg 3 (2026-08-11): neutral plan (finalhelgen, SM-final) har
  // inget "hemma" att vinna — svansen ska bort, inte bara flyttas.
  it('neutral plan (final) — ingen hemma-/bortaseger-svans trots vinst', () => {
    const out = granskaFlavorText({ won: true, lost: false, isHome: true, homeScore: 3, awayScore: 1, isNeutralVenue: true })
    expect(out).toBe('✅ Klar vinst')
    expect(out).not.toContain('seger')
  })

  it('neutral plan, förlust — ingen svans att ta bort (fanns aldrig på förlust)', () => {
    expect(granskaFlavorText({ won: false, lost: true, isHome: false, homeScore: 3, awayScore: 1, isNeutralVenue: true }))
      .toBe('❌ Klar förlust')
  })

  it('isNeutralVenue default false — befintligt beteende oförändrat', () => {
    expect(granskaFlavorText({ won: true, lost: false, isHome: true, homeScore: 2, awayScore: 1 }))
      .toBe('😅 Knapp seger · hemmaseger')
  })
})
