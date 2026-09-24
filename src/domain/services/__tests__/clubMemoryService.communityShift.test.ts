import { describe, expect, it } from 'vitest'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { buildMemoryEventFromLedger, buildSeasonCommunityFactEvent, momentFamily, momentKind } from '../clubMemoryService'

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

// BETATEST_ERIK_2026-09-24 A4 — rot: varje tröskelöverskridning (30/50/70-
// zonerna) blev en egen rad med samma efterled ("det märks på läktaren
// först"), så en säsong med mycket pendling gav upp till ett dussin nästan
// identiska meningar. buildSeasonCommunityFactEvent aggregerar en säsongs
// community_shift-poster till EN faktarad — start→slut plus spannets
// ytterlägen, ingen riktning påstådd.
describe('buildSeasonCommunityFactEvent — en faktarad, inte en rad per tröskel', () => {
  it('Eriks exempel: 50 → 69 under säsongen, lägst 46, högst 71', () => {
    const entries = [
      shiftPost({ matchday: 5, communityShift: { from: 50, to: 46, direction: 'down' } }),
      shiftPost({ matchday: 10, communityShift: { from: 46, to: 71, direction: 'up' } }),
      shiftPost({ matchday: 15, communityShift: { from: 71, to: 60, direction: 'down' } }),
      shiftPost({ matchday: 20, communityShift: { from: 60, to: 69, direction: 'up' } }),
    ]
    const event = buildSeasonCommunityFactEvent(entries, 3, CLUB_ID)
    expect(event?.text).toBe('Orten: 50 → 69 under säsongen. Lägst 46, högst 71.')
  })

  it('helt oförändrad säsong (inga community_shift-poster alls): ingen rad, inget påstående', () => {
    expect(buildSeasonCommunityFactEvent([], 3, CLUB_ID)).toBeNull()
  })

  it('en enda tröskelöverskridning: start→slut från den posten, lägst/högst från samma par', () => {
    const entries = [shiftPost({ matchday: 12, communityShift: { from: 48, to: 52, direction: 'up' } })]
    const event = buildSeasonCommunityFactEvent(entries, 3, CLUB_ID)
    expect(event?.text).toBe('Orten: 48 → 52 under säsongen. Lägst 48, högst 52.')
  })

  it('påstår aldrig riktning ("vände"/"drog sig undan") — ren fakta', () => {
    const entries = [
      shiftPost({ matchday: 5, communityShift: { from: 60, to: 40, direction: 'down' } }),
      shiftPost({ matchday: 18, communityShift: { from: 40, to: 60, direction: 'up' } }),
    ]
    const event = buildSeasonCommunityFactEvent(entries, 3, CLUB_ID)
    expect(event?.text).not.toMatch(/vände|drog sig undan|märks på läktaren/)
    expect(event?.text).toBe('Orten: 60 → 60 under säsongen. Lägst 40, högst 60.')
  })
})
