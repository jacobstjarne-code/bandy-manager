import { describe, expect, it } from 'vitest'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { currentChronology } from '../currentChronology'
import { buildMemoryEventFromLedger } from '../clubMemoryService'
import { markLedgerPostTold } from '../ledgerToldService'
import { selectPortalMemory } from '../portal/portalMemoryService'

const CLUB_ID = 'club_a'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save_test',
    managedClubId: CLUB_ID,
    currentSeason: 3,
    currentMatchday: 10,
    currentDate: '2028-12-10',
    clubs: [],
    players: [],
    fixtures: [],
    standings: [],
    inbox: [],
    pendingEvents: [],
    playoffBracket: null,
    ledgerTold: {},
    eventLedger: [],
    ...overrides,
  } as unknown as SaveGame
}

function patronPost(overrides: Partial<EventLedgerEntry> = {}): EventLedgerEntry {
  return {
    type: 'patron_emerge',
    semanticKey: 'patron_emerge:patron_1:s3:m10',
    clubId: CLUB_ID,
    season: 3,
    matchday: 10,
    subject: { kind: 'patron', id: 'patron_1' },
    significance: 60,
    ...overrides,
  }
}

describe('Portal memory_card — Berättaren steg 3', () => {
  it('kallar skandalens globala tidsaxel matchdag, aldrig ligaomgång', () => {
    const entry = patronPost({ type: 'scandal', semanticKey: 'scandal:s3:m8', matchday: 8 })
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)?.text)
      .toBe('Skandal drabbade klubben (matchdag 8).')
  })

  it('väljer högst ett färskt, otalt ämne och använder k1:s text', () => {
    const entry = patronPost()
    const game = makeGame({
      patron: { id: 'patron_1', name: 'Bengt Karlsson' } as never,
      eventLedger: [
        patronPost({ semanticKey: 'weaker', significance: 45 }),
        entry,
      ],
    })

    expect(selectPortalMemory(game)).toMatchObject({
      postKey: '["patron_emerge","patron_emerge:patron_1:s3:m10",3,10]',
      kicker: 'SEDAN SIST',
      editorialWeight: 84,
    })
    expect(selectPortalMemory(game)?.text).toBe(
      buildMemoryEventFromLedger(game, entry, CLUB_ID)?.text,
    )
  })

  it('använder årsdagskön och den låsta kickern', () => {
    const game = makeGame({
      patron: { id: 'patron_1', name: 'Bengt Karlsson' } as never,
      eventLedger: [patronPost({ season: 2, matchday: 10, significance: 95 })],
    })
    expect(selectPortalMemory(game)?.kicker).toBe('FÖR ETT ÅR SEDAN')
  })

  it('visas aldrig före ett väntande beslut', () => {
    const game = makeGame({
      patron: { id: 'patron_1', name: 'Bengt Karlsson' } as never,
      eventLedger: [patronPost()],
      pendingWeeklyDecision: {} as never,
    })
    expect(selectPortalMemory(game)).toBeNull()
  })

  it('håller samma kort stabilt resten av visningsdagen men inte nästa dag', () => {
    const entry = patronPost()
    const base = makeGame({
      patron: { id: 'patron_1', name: 'Bengt Karlsson' } as never,
      eventLedger: [entry],
    })
    const ledgerTold = markLedgerPostTold(base.ledgerTold, entry, 'portal', currentChronology(base))
    expect(selectPortalMemory({ ...base, ledgerTold })?.postKey).toBeDefined()
    expect(selectPortalMemory({ ...base, currentMatchday: 11, ledgerTold })).toBeNull()
  })

  it('tar aldrig en annan klubbs minne', () => {
    const game = makeGame({
      patron: { id: 'patron_1', name: 'Bengt Karlsson' } as never,
      eventLedger: [patronPost({ clubId: 'club_b' })],
    })
    expect(selectPortalMemory(game)).toBeNull()
  })
})
