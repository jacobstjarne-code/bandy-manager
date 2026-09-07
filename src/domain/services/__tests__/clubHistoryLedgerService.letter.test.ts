import { describe, it, expect } from 'vitest'
import { buildLetterLedgerEntry } from '../clubHistoryLedgerService'

describe('buildLetterLedgerEntry — liggare-ny-letter', () => {
  it('bygger en letter-post med stabil semanticKey, significance 40, avsändare i subjectSnapshot', () => {
    const entry = buildLetterLedgerEntry({
      clubId: 'club_x', season: 2026, matchday: 12,
      letterId: 'letter_abc', kind: 'fan_mail',
      senderName: 'Birger Karlsson', senderAge: 74,
    })

    expect(entry).toEqual({
      type: 'letter',
      semanticKey: 'letter_club_x_letter_abc',
      season: 2026,
      matchday: 12,
      clubId: 'club_x',
      subject: { kind: 'club', id: 'club_x' },
      subjectSnapshot: { name: 'Birger Karlsson', age: 74 },
      significance: 40,
      letter: { letterId: 'letter_abc', kind: 'fan_mail' },
    })
  })

  it('subjectSnapshot bär inte age-nyckeln alls när senderAge saknas', () => {
    const entry = buildLetterLedgerEntry({
      clubId: 'club_x', season: 2026, matchday: 12,
      letterId: 'letter_abc', kind: 'fan_mail', senderName: 'Okänd',
    })
    expect(entry.subjectSnapshot).toEqual({ name: 'Okänd' })
    expect('age' in (entry.subjectSnapshot ?? {})).toBe(false)
  })
})
