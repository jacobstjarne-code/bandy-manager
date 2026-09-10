import { describe, expect, it } from 'vitest'
import { InboxItemType } from '../../enums'
import type { InboxItem, SaveGame } from '../../entities/SaveGame'
import { finalizeInboxDelivery, MAX_UNREAD_INFORMATIONAL_INBOX } from '../inboxDeliveryService'

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    currentSeason: 2026,
    currentMatchday: 3,
    inbox: [],
    introducedInboxTopics: ['squad', 'transfers', 'club'],
    ...overrides,
  } as SaveGame
}

function item(id: string, type: InboxItemType = InboxItemType.Community): InboxItem {
  return { id, date: '2026-10-01', type, title: `Rubrik ${id}`, body: `Bröd ${id}`, isRead: false }
}

const chronology = { season: 2026, matchday: 4, leagueRound: null, date: '2026-10-08' }

describe('finalizeInboxDelivery', () => {
  it('portionerar informationsnotiser men släpper alltid igenom ärenden som kräver svar', () => {
    const info = Array.from({ length: 8 }, (_, index) => item(`info-${index}`))
    const action = item('offer', InboxItemType.TransferOffer)
    const result = finalizeInboxDelivery(game(), [...info, action], chronology)
    expect(result.inbox.filter(candidate => !candidate.isRead && candidate.type === InboxItemType.Community)).toHaveLength(MAX_UNREAD_INFORMATIONAL_INBOX)
    expect(result.inbox.some(candidate => candidate.id === action.id)).toBe(true)
    expect(result.deferredInbox).toHaveLength(4)
  })

  it('arkiverar dolda matchresultat och rutinträning utan oläst badge', () => {
    const training = { ...item('training', InboxItemType.Training), injuredPlayerCount: 0 }
    const result = finalizeInboxDelivery(game(), [item('result', InboxItemType.MatchResult), training], chronology)
    expect(result.inbox.every(candidate => candidate.isRead)).toBe(true)
  })

  it('stoppar samma händelse två gånger i samma leveranspass', () => {
    const duplicate = item('one')
    const result = finalizeInboxDelivery(game(), [duplicate, { ...duplicate, id: 'two' }], chronology)
    expect(result.inbox).toHaveLength(1)
  })

  it('väntar med en ämnesnotis tills spelaren har introducerats till ytan', () => {
    const result = finalizeInboxDelivery(game({ introducedInboxTopics: ['squad'] }), [item('training', InboxItemType.Training)], chronology)
    expect(result.inbox).toHaveLength(0)
    expect(result.deferredInbox.map(candidate => candidate.id)).toEqual(['training'])
  })
})
