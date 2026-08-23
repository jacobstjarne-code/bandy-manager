import { describe, it, expect } from 'vitest'
import {
  getRefereeMeetingQuotePool,
  REFEREE_MEETING_QUOTES,
  REFEREE_MEETING_QUOTES_INCONSISTENT,
} from '../refereeService'
import type { RefereeStyle } from '../../entities/Referee'

/**
 * Medium 6 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * "Idag föll de åt er" (en vinst-fras) visades efter en 3-4-förlust. Poolen
 * var en enda outcome-blind array. Kontexttabelltest: för varje domarstil ×
 * utfall, poolen får aldrig hävda fel riktning och är aldrig tom.
 */

const STYLES: RefereeStyle[] = ['strict', 'lenient', 'inconsistent']
const OUTCOMES = ['win', 'loss', 'draw'] as const

describe('getRefereeMeetingQuotePool — kontexttabelltest', () => {
  for (const style of STYLES) {
    for (const outcome of OUTCOMES) {
      it(`${style} × ${outcome}: poolen är aldrig tom`, () => {
        expect(getRefereeMeetingQuotePool(style, outcome).length).toBeGreaterThan(0)
      })
    }
  }

  it('inconsistent × loss innehåller aldrig vinst-frasen "föll de åt er"', () => {
    const pool = getRefereeMeetingQuotePool('inconsistent', 'loss')
    expect(pool.some(q => q.includes('föll de åt er'))).toBe(false)
  })

  it('inconsistent × draw innehåller aldrig vinst-frasen "föll de åt er"', () => {
    const pool = getRefereeMeetingQuotePool('inconsistent', 'draw')
    expect(pool.some(q => q.includes('föll de åt er'))).toBe(false)
  })

  it('inconsistent × win KAN fortfarande innehålla vinst-frasen (det stämmer nu)', () => {
    const pool = getRefereeMeetingQuotePool('inconsistent', 'win')
    expect(pool.some(q => q.includes('föll de åt er'))).toBe(true)
  })

  it('inconsistent × draw är exakt neutral-poolen — ingen riktning hävdad', () => {
    expect(getRefereeMeetingQuotePool('inconsistent', 'draw')).toEqual(REFEREE_MEETING_QUOTES_INCONSISTENT.neutral)
  })

  it('inconsistent × win/loss innehåller alltid neutral-raderna också (aldrig bara den riktade)', () => {
    for (const outcome of ['win', 'loss'] as const) {
      const pool = getRefereeMeetingQuotePool('inconsistent', outcome)
      for (const neutralLine of REFEREE_MEETING_QUOTES_INCONSISTENT.neutral) {
        expect(pool).toContain(neutralLine)
      }
    }
  })

  it('strict och lenient är outcome-invarianta — hela poolen, alla tre utfall', () => {
    for (const style of ['strict', 'lenient'] as const) {
      const win = getRefereeMeetingQuotePool(style, 'win')
      const loss = getRefereeMeetingQuotePool(style, 'loss')
      const draw = getRefereeMeetingQuotePool(style, 'draw')
      expect(win).toEqual(REFEREE_MEETING_QUOTES[style])
      expect(loss).toEqual(REFEREE_MEETING_QUOTES[style])
      expect(draw).toEqual(REFEREE_MEETING_QUOTES[style])
    }
  })

  it('regression: den gamla REFEREE_MEETING_QUOTES.inconsistent-arrayen är tom (flyttad, inte dubblerad)', () => {
    expect(REFEREE_MEETING_QUOTES.inconsistent).toEqual([])
  })

  it('inconsistent × loss: fyra riktiga rader, ingen [Opus]-platshållare kvar (fylld 2026-08-23)', () => {
    expect(REFEREE_MEETING_QUOTES_INCONSISTENT.loss).toHaveLength(4)
    expect(REFEREE_MEETING_QUOTES_INCONSISTENT.loss).not.toContain('[Opus]')
  })
})
