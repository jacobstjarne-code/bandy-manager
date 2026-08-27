/**
 * M7 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24):
 * "Långsave öppnade med 2 aktiva och 32 inboxnotiser." Kräver svar/
 * Rapporter fick tidigare ingen klustring alls — varje post renderades
 * individuellt oavsett ålder eller läst-status. splitOldInboxItems delar
 * en lista i "recent" (visas alltid) och "old" (läst + tillräckligt gammal
 * — vikbar i UI:t).
 */
import { describe, it, expect } from 'vitest'
import { splitOldInboxItems, OLD_INBOX_ROUND_THRESHOLD } from '../presentation/screens/InboxScreen'
import { InboxItemType } from '../domain/enums'
import type { InboxItem } from '../domain/entities/Inbox'

function makeItem(overrides: Partial<InboxItem>): InboxItem {
  return {
    id: 'i1', date: '2026-10-15', type: InboxItemType.BoardFeedback,
    title: 'Test', body: 'Test', isRead: false,
    ...overrides,
  }
}

describe('splitOldInboxItems — M7: klustring av gammal, läst inkorg', () => {
  it('en oläst post är ALDRIG "old", oavsett hur gammal den är', () => {
    const item = makeItem({ isRead: false, createdRound: 1 })
    const { recent, old } = splitOldInboxItems([item], 50)
    expect(recent).toEqual([item])
    expect(old).toEqual([])
  })

  it('en läst post NYLIGEN skapad (inom tröskeln) räknas som recent, inte old', () => {
    const item = makeItem({ isRead: true, createdRound: 10 })
    const { recent, old } = splitOldInboxItems([item], 10 + OLD_INBOX_ROUND_THRESHOLD - 1)
    expect(recent).toEqual([item])
    expect(old).toEqual([])
  })

  it('en läst post ÄLDRE än tröskeln räknas som old', () => {
    const item = makeItem({ isRead: true, createdRound: 10 })
    const { recent, old } = splitOldInboxItems([item], 10 + OLD_INBOX_ROUND_THRESHOLD + 1)
    expect(recent).toEqual([])
    expect(old).toEqual([item])
  })

  it('en läst post utan känd omgång (createdRound/createdMatchday saknas) räknas som recent — ingen gissning', () => {
    const item = makeItem({ isRead: true })
    const { recent, old } = splitOldInboxItems([item], 999)
    expect(recent).toEqual([item])
    expect(old).toEqual([])
  })

  it('createdMatchday används som fallback när createdRound saknas', () => {
    const item = makeItem({ isRead: true, createdRound: undefined, createdMatchday: 5 })
    const { old } = splitOldInboxItems([item], 5 + OLD_INBOX_ROUND_THRESHOLD + 1)
    expect(old).toEqual([item])
  })

  it('en blandad lista delas korrekt — bara läst+gammalt hamnar i old', () => {
    const unread = makeItem({ id: 'unread', isRead: false, createdRound: 1 })
    const readRecent = makeItem({ id: 'read-recent', isRead: true, createdRound: 48 })
    const readOld = makeItem({ id: 'read-old', isRead: true, createdRound: 1 })
    const currentMatchday = 50
    const { recent, old } = splitOldInboxItems([unread, readRecent, readOld], currentMatchday)
    expect(recent.map(i => i.id).sort()).toEqual(['read-recent', 'unread'])
    expect(old.map(i => i.id)).toEqual(['read-old'])
  })
})
