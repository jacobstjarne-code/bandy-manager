/**
 * deriveKassaHistory (C-SY2 Våg 4 — Ekonomi kassa-trend) — tester.
 *
 * Verifierar att kassasaldo rekonstrueras bakåt ur transaktionsloggen och att
 * trend-riktningen (för success/danger-stroke) blir rätt åt båda håll.
 */

import { describe, it, expect } from 'vitest'
import { deriveKassaHistory } from '../domain/services/economyService'
import type { FinanceEntry } from '../domain/services/economyService'

function log(nets: number[]): FinanceEntry[] {
  return nets.map((amount, i) => ({ round: i + 1, amount, reason: 'match_income', label: `Omg ${i + 1}` }))
}

describe('deriveKassaHistory', () => {
  it('tom logg → tom array', () => {
    expect(deriveKassaHistory([], 50000)).toEqual([])
  })

  it('rekonstruerar saldo bakåt: sista = nuvarande saldo', () => {
    const h = deriveKassaHistory(log([1000, 2000, 3000]), 10000)
    expect(h[h.length - 1]).toBe(10000)
    expect(h).toHaveLength(3)
  })

  it('positiva netton → stigande trend (sista ≥ första, success)', () => {
    const h = deriveKassaHistory(log([4000, 6000, 3000, 7000, 5000]), 96000)
    expect(h[h.length - 1]).toBeGreaterThanOrEqual(h[0])
  })

  it('negativa netton → fallande trend (sista < första, danger)', () => {
    const h = deriveKassaHistory(log([-3000, -5000, -7000, -4000, -8000]), 7000)
    expect(h[h.length - 1]).toBeLessThan(h[0])
  })

  it('saldo-deltan stämmer mot netton mellan omgångar', () => {
    const h = deriveKassaHistory(log([1000, 2000, 3000]), 10000)
    // saldo[1] - saldo[0] = netto omg2 = 2000; saldo[2]-saldo[1] = netto omg3 = 3000
    expect(h[1] - h[0]).toBe(2000)
    expect(h[2] - h[1]).toBe(3000)
  })

  it('aggregerar flera entries i samma omgång', () => {
    const entries: FinanceEntry[] = [
      { round: 1, amount: 5000, reason: 'match_income', label: 'a' },
      { round: 2, amount: 2000, reason: 'match_income', label: 'b' },
      { round: 2, amount: -1000, reason: 'wages', label: 'c' },
    ]
    const h = deriveKassaHistory(entries, 20000)
    // omg2 netto = 2000 - 1000 = 1000 → saldo[1]-saldo[0] = 1000
    expect(h[1] - h[0]).toBe(1000)
  })
})
