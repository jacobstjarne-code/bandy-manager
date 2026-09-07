import { describe, it, expect } from 'vitest'
import { buildBoardVerdictLedgerEntry } from '../clubHistoryLedgerService'

describe('buildBoardVerdictLedgerEntry — liggare-ny-board-verdict', () => {
  it('bygger en board_verdict-post med stabil semanticKey och payload', () => {
    const entry = buildBoardVerdictLedgerEntry({
      clubId: 'club_x',
      season: 2026,
      matchday: 22,
      verdict: 'met',
      objectiveStatus: 'partial',
      patienceBand: 'stabilt',
      repeatedFailure: false,
    })

    expect(entry).toEqual({
      type: 'board_verdict',
      semanticKey: 'board_verdict_club_x_s2026',
      season: 2026,
      matchday: 22,
      clubId: 'club_x',
      subject: { kind: 'club', id: 'club_x' },
      significance: 45,
      boardVerdict: { verdict: 'met', objectiveStatus: 'partial', patienceBand: 'stabilt' },
    })
  })

  it('höjer significance till 60 vid upprepad misslyckad säsong', () => {
    const entry = buildBoardVerdictLedgerEntry({
      clubId: 'club_x',
      season: 2026,
      matchday: 22,
      verdict: 'failed',
      objectiveStatus: 'failed',
      patienceBand: 'ultimatum',
      repeatedFailure: true,
    })
    expect(entry.significance).toBe(60)
  })
})
