/**
 * klackEcho cause-prefix (C-SY1 #2 Pilot 1) — tester.
 *
 * Verifierar:
 * 1. causeIsRelevant: delta 0→false, 1→true, 4→true, 5→false, undefined→false
 * 2. cause-prefix-dosering ligger 32–38% (target 35%) över 1000 körningar med färsk cause
 * 3. irrelevant cause → 0% cause-prefix
 * 4. cause-prefixad text kommer faktiskt ur cause-poolen
 */

import { describe, it, expect } from 'vitest'
import {
  klackEchoCauseIsRelevant,
  pickKlackEchoText,
  KLACK_ECHO,
  KLACK_ECHO_CAUSE_PREFIXED,
} from '../domain/data/klackEchoText'

describe('klackEchoCauseIsRelevant', () => {
  it('delta 0 → false (samma omgång)', () => {
    expect(klackEchoCauseIsRelevant(10, 10)).toBe(false)
  })
  it('delta 1 → true', () => {
    expect(klackEchoCauseIsRelevant(11, 10)).toBe(true)
  })
  it('delta 4 → true', () => {
    expect(klackEchoCauseIsRelevant(14, 10)).toBe(true)
  })
  it('delta 5 → false (för gammalt)', () => {
    expect(klackEchoCauseIsRelevant(15, 10)).toBe(false)
  })
  it('undefined resultMatchday → false', () => {
    expect(klackEchoCauseIsRelevant(10, undefined)).toBe(false)
  })
})

describe('pickKlackEchoText — dosering', () => {
  // Deterministisk pseudo-rand-sekvens (mulberry32-likt) för stabil mätning
  function makeRand(seed: number): () => number {
    let s = seed >>> 0
    return () => {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  const causePool = new Set([
    ...KLACK_ECHO_CAUSE_PREFIXED.derby_win.klack,
    ...KLACK_ECHO_CAUSE_PREFIXED.derby_win.kafferum,
  ])
  const basePool = new Set([
    ...KLACK_ECHO.derby_win.klack,
    ...KLACK_ECHO.derby_win.kafferum,
  ])

  it('färsk cause → 32–38% cause-prefix över 1000 körningar', () => {
    const echo = { type: 'derby_win' as const, resultMatchday: 10 }
    let causeCount = 0
    const N = 1000
    for (let i = 0; i < N; i++) {
      const t = pickKlackEchoText(echo, 12, 'klack', makeRand(i * 2654435761))
      if (t && causePool.has(t)) causeCount++
    }
    const pct = causeCount / N
    expect(pct).toBeGreaterThanOrEqual(0.32)
    expect(pct).toBeLessThanOrEqual(0.38)
  })

  it('irrelevant cause (delta 0) → 0% cause-prefix', () => {
    const echo = { type: 'derby_win' as const, resultMatchday: 12 }
    let causeCount = 0
    for (let i = 0; i < 500; i++) {
      const t = pickKlackEchoText(echo, 12, 'klack', makeRand(i * 99991))
      if (t && causePool.has(t)) causeCount++
    }
    expect(causeCount).toBe(0)
  })

  it('returnerar alltid en sträng ur antingen cause- eller bas-poolen', () => {
    const echo = { type: 'derby_win' as const, resultMatchday: 10 }
    for (let i = 0; i < 100; i++) {
      const t = pickKlackEchoText(echo, 12, 'kafferum', makeRand(i * 7))
      expect(t).not.toBeNull()
      expect(causePool.has(t!) || basePool.has(t!)).toBe(true)
    }
  })
})
