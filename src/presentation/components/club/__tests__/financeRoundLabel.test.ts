import { describe, it, expect } from 'vitest'
import { financeRoundLabel } from '../EkonomiTab'

/**
 * berattaren-en-kronologi (2026-09-07, Opus dom): financeLog-poster bär
 * ingen egen `season` (rolloverFinanceLog rebasar bara `round` vid
 * säsongsskifte, se kommentaren i seasonEndProcessor.ts) — anropsstället
 * skickar alltid `game.currentSeason`. Uppslaget mot kalendern är därför
 * INTE ett riktigt cross-season-fall (samma säsongsnummer varje gång), men
 * `round` kan vara rebasat till < 1 för en post skriven en tidigare säsong
 * — "tidigare säsong"-fallbacken skyddar mot DET, inte mot en okänd
 * kalender, och kan därför INTE tas bort av kronologi-fixen.
 */
describe('financeRoundLabel — finanspost skriven en tidigare säsong', () => {
  it('en post inom innevarande säsongs kalender (round ≥ 1) får rätt omgångsetikett', () => {
    // matchdag 9 = omgång 5 i vilken säsong som helst (verklig kalender).
    expect(financeRoundLabel(9, 4)).toBe('omg 5')
  })

  it('en cupmatchdag (round 1-4) blir "matchdag N", aldrig en gissad omgång', () => {
    expect(financeRoundLabel(2, 4)).toBe('matchdag 2')
  })

  it('en rebasad post skriven FÖRE innevarande säsongs matchdag 1 (round < 1) får "tidigare säsong" — kronologifixen ändrar inte detta', () => {
    expect(financeRoundLabel(-3, 4)).toBe('tidigare säsong')
    expect(financeRoundLabel(0, 4)).toBe('tidigare säsong')
  })
})
