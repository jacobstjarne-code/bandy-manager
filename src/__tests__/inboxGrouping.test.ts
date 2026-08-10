/**
 * inboxGrouping — AUDIT DEL 2 A2 (2026-08-09), regression.
 *
 * Rot: nemesis-gruppering och media-outlet-gruppering byggde på titel-/body-
 * strängmatchning (`title.startsWith('⚠️ Nemesis:')`, en "· Utgivare"-regex
 * mot body) som ingen av de riktiga skapandeplatserna faktiskt producerade —
 * mekanismerna föll alltid igenom till "ogrupperad"/"Media". Detta test
 * reproducerar buggen (skulle FAILA mot den gamla title/body-matchningen)
 * och verifierar den strukturerade `kind`/`outlet`-lösningen.
 */
import { describe, it, expect } from 'vitest'
import { groupNyheter } from '../presentation/screens/InboxScreen'
import { inboxItemToCardCandidate } from '../domain/services/portal/inboxToPortal'
import { InboxItemType } from '../domain/enums'
import type { InboxItem } from '../domain/entities/Inbox'
import type { SaveGame } from '../domain/entities/SaveGame'

function makeNemesisItem(id: string, name: string): InboxItem {
  return {
    id, date: '2026-10-15', type: InboxItemType.BoardFeedback,
    title: `Nemesis: ${name}`, // ÄKTA form — ingen '⚠️'-prefix, se narrativeProcessor.ts
    body: `${name} har gjort mål mot oss igen.`,
    isRead: false, kind: 'nemesis',
  }
}

function makeMediaItem(id: string, outlet: string): InboxItem {
  return {
    id, date: '2026-10-15', type: InboxItemType.MediaEvent,
    title: `Rubrik ${id}`,
    body: `Journalisten, ${outlet}`, // komma-separerad — ÄKTA form, se journalistService.ts
    isRead: false, outlet,
  }
}

describe('groupNyheter — nemesis via kind, inte titel-prefix', () => {
  it('två nemesis-poster med äkta (icke-prefixad) titel grupperas ihop', () => {
    const items = [makeNemesisItem('n1', 'Berg'), makeNemesisItem('n2', 'Berg')]
    const result = groupNyheter(items)
    expect(result).toEqual([
      { kind: 'group', count: 2, label: 'Nemesis-uppdateringar', items },
    ])
  })

  it('en ensam nemesis-post renderas som single, inte grupperad', () => {
    const items = [makeNemesisItem('n1', 'Berg')]
    const result = groupNyheter(items)
    expect(result).toEqual([{ kind: 'single', item: items[0] }])
  })
})

describe('groupNyheter — media grupperas via strukturerat outlet, inte body-regex', () => {
  it('två poster med samma outlet (kommaseparerad body, ingen "·") grupperas ihop', () => {
    const items = [makeMediaItem('m1', 'Gefle Dagblad'), makeMediaItem('m2', 'Gefle Dagblad')]
    const result = groupNyheter(items)
    expect(result).toEqual([
      { kind: 'group', count: 2, label: 'Mediaröster · Gefle Dagblad', items },
    ])
  })

  it('poster utan outlet-fält faller tillbaka till "Media", inte krasch', () => {
    const item: InboxItem = {
      id: 'm3', date: '2026-10-15', type: InboxItemType.Media,
      title: 'Rubrik', body: 'Ingen strukturerad källa', isRead: false,
    }
    const result = groupNyheter([item])
    expect(result).toEqual([{ kind: 'single', item }])
  })
})

describe('inboxItemToCardCandidate — nemesis via kind', () => {
  it('äkta (icke-prefixad) nemesis-titel klassas korrekt som nemesis-kort', () => {
    const item = makeNemesisItem('n1', 'Berg')
    const game = { managedClubId: 'club_home' } as unknown as SaveGame
    const candidate = inboxItemToCardCandidate(item, game)
    expect(candidate?.kind).toBe('nemesis')
  })

  it('retirement-varianten ("Nemesis lägger av") klassas också via kind', () => {
    const item: InboxItem = {
      id: 'n2', date: '2026-10-15', type: InboxItemType.BoardFeedback,
      title: 'Nemesis lägger av', body: 'Han lade av.', isRead: false, kind: 'nemesis',
    }
    const game = { managedClubId: 'club_home' } as unknown as SaveGame
    const candidate = inboxItemToCardCandidate(item, game)
    expect(candidate?.kind).toBe('nemesis')
  })
})
