import { describe, expect, it } from 'vitest'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { buildMemoryEventFromLedger, momentFamily, momentKind } from '../clubMemoryService'

const CLUB_ID = 'club_a'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save_test', managedClubId: CLUB_ID, currentSeason: 3, currentMatchday: 10,
    currentDate: '2028-12-10', clubs: [], players: [], fixtures: [], standings: [],
    inbox: [], pendingEvents: [], playoffBracket: null, ledgerTold: {}, eventLedger: [],
    ...overrides,
  } as unknown as SaveGame
}

function shiftPost(overrides: Partial<EventLedgerEntry> = {}): EventLedgerEntry {
  return {
    type: 'community_shift',
    semanticKey: 'community_shift_club_a_s3_m10',
    clubId: CLUB_ID,
    season: 3,
    matchday: 10,
    subject: { kind: 'club', id: CLUB_ID },
    significance: 55,
    communityShift: { from: 48, to: 52, direction: 'up' },
    ...overrides,
  }
}

describe('Krönikan — community_shift (liggare-ny-community-shift, text LÅST av Opus)', () => {
  it('upp: "Orten vände. {from}→{to} — det märks på läktaren först."', () => {
    const entry = shiftPost()
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)?.text)
      .toBe('Orten vände. 48→52 — det märks på läktaren först.')
  })

  it('ner: "Orten drog sig undan. {from}→{to}. Det märks på läktaren först."', () => {
    const entry = shiftPost({ communityShift: { from: 52, to: 48, direction: 'down' } })
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)?.text)
      .toBe('Orten drog sig undan. 52→48. Det märks på läktaren först.')
  })

  it('familj 🤝 (relations_money i redaktoren), kind triumph uppåt / scar nedåt', () => {
    expect(momentFamily('community_shift')).toBe('🤝')
    expect(momentKind('community_shift', { communityShift: { from: 48, to: 52, direction: 'up' } })).toBe('triumph')
    expect(momentKind('community_shift', { communityShift: { from: 52, to: 48, direction: 'down' } })).toBe('scar')
  })

  it('null utan communityShift-payload (aldrig gissa)', () => {
    const entry = shiftPost()
    delete (entry as { communityShift?: unknown }).communityShift
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)).toBeNull()
  })
})
