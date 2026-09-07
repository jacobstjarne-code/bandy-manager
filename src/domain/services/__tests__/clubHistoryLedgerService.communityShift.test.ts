import { describe, it, expect } from 'vitest'
import { buildCommunityShiftLedgerEntry, detectCommunityShiftDirection } from '../clubHistoryLedgerService'

describe('detectCommunityShiftDirection — liggare-ny-community-shift, trösklarna 30/50/70', () => {
  it('upptäcker uppåtkorsning av varje tröskel', () => {
    expect(detectCommunityShiftDirection(28, 31)).toBe('up')
    expect(detectCommunityShiftDirection(49, 51)).toBe('up')
    expect(detectCommunityShiftDirection(69, 71)).toBe('up')
  })

  it('upptäcker nedåtkorsning av varje tröskel', () => {
    expect(detectCommunityShiftDirection(31, 28)).toBe('down')
    expect(detectCommunityShiftDirection(51, 49)).toBe('down')
    expect(detectCommunityShiftDirection(71, 69)).toBe('down')
  })

  it('null när ingen tröskel korsas (rörelse inom samma band)', () => {
    expect(detectCommunityShiftDirection(52, 58)).toBeNull()
    expect(detectCommunityShiftDirection(58, 52)).toBeNull()
    expect(detectCommunityShiftDirection(50, 50)).toBeNull()
  })

  it('exakt på tröskeln räknas som "vid eller över" (from=tröskel-1 → to=tröskel)', () => {
    expect(detectCommunityShiftDirection(49, 50)).toBe('up')
    expect(detectCommunityShiftDirection(50, 49)).toBe('down')
  })
})

describe('buildCommunityShiftLedgerEntry', () => {
  it('bygger en community_shift-post med stabil semanticKey, significance 55', () => {
    const entry = buildCommunityShiftLedgerEntry({
      clubId: 'club_x', season: 2026, matchday: 8, from: 48, to: 52, direction: 'up',
    })
    expect(entry).toEqual({
      type: 'community_shift',
      semanticKey: 'community_shift_club_x_s2026_m8',
      season: 2026,
      matchday: 8,
      clubId: 'club_x',
      subject: { kind: 'club', id: 'club_x' },
      significance: 55,
      communityShift: { from: 48, to: 52, direction: 'up' },
    })
  })
})
