import { describe, it, expect } from 'vitest'
import { buildYouthAgedOutLedgerEntry } from '../clubHistoryLedgerService'

describe('buildYouthAgedOutLedgerEntry — DOM_AKADEMI_LIGGARE §4', () => {
  it('bygger en youth_aged_out-post med stabil semanticKey och payload', () => {
    const entry = buildYouthAgedOutLedgerEntry({
      playerId: 'youth_1',
      clubId: 'club_x',
      season: 2026,
      matchday: 22,
      outcome: 'released',
      stars: 3,
      caAtExit: 42,
    })

    expect(entry).toEqual({
      type: 'youth_aged_out',
      semanticKey: 'youth_aged_out_youth_1_s2026',
      season: 2026,
      matchday: 22,
      clubId: 'club_x',
      subject: { kind: 'player', id: 'youth_1' },
      significance: 60,
      youthAgedOut: { outcome: 'released', stars: 3, caAtExit: 42 },
    })
  })

  it('ger lägre significance under 3 stjärnor (tystare avsked, samma tröskel som beslutskortet)', () => {
    const entry = buildYouthAgedOutLedgerEntry({
      playerId: 'youth_2',
      clubId: 'club_x',
      season: 2026,
      matchday: 22,
      outcome: 'released',
      stars: 2,
      caAtExit: 25,
    })
    expect(entry.significance).toBe(45)
  })
})
