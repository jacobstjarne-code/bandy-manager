/**
 * Fynd 3 — pressrubrik: surface-diskriminator i seeden ger tre formuleringar
 * (portal / inkorg / granska) för samma händelse, så rubriken inte läser identiskt.
 */
import { describe, it, expect } from 'vitest'
import { pickHeadline } from '../domain/data/journalistHeadlineStrings'

describe('Fynd 3 — rubrik-variation per yta', () => {
  it('surface påverkar valet — minst en yta avviker över ett urval matcher', () => {
    let inboxVsPortalDiffer = 0
    let inboxVsGranskaDiffer = 0
    for (let i = 0; i < 30; i++) {
      const fid = `fx_${i}`
      const inbox = pickHeadline('win', 'sensationalist', fid, false, 'Boll', '3–1', i, false, 'inbox')
      const portal = pickHeadline('win', 'sensationalist', fid, false, 'Boll', '3–1', i, false, 'portal')
      const granska = pickHeadline('win', 'sensationalist', fid, false, 'Boll', '3–1', i, false, 'granska')
      if (inbox !== portal) inboxVsPortalDiffer++
      if (inbox !== granska) inboxVsGranskaDiffer++
    }
    // Diskriminatorn ska ge variation (annars är seeden inte surface-känslig).
    expect(inboxVsPortalDiffer).toBeGreaterThan(0)
    expect(inboxVsGranskaDiffer).toBeGreaterThan(0)
  })

  it('är deterministiskt per (yta, match)', () => {
    const a = pickHeadline('big_win', 'supportive', 'fx_1', false, 'Boll', '5–0', 7, false, 'portal')
    const b = pickHeadline('big_win', 'supportive', 'fx_1', false, 'Boll', '5–0', 7, false, 'portal')
    expect(a).toBe(b)
  })
})
