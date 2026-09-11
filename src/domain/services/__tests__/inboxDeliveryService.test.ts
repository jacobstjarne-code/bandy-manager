import { describe, expect, it } from 'vitest'
import { InboxItemType } from '../../enums'
import type { InboxItem, SaveGame } from '../../entities/SaveGame'
import { finalizeInboxDelivery, MAX_UNREAD_INFORMATIONAL_INBOX } from '../inboxDeliveryService'

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    currentSeason: 2026,
    currentMatchday: 3,
    inbox: [],
    transferBids: [{ playerId: 'offer-player', direction: 'incoming', status: 'pending' }],
    introducedInboxTopics: ['squad', 'transfers', 'club'],
    ...overrides,
  } as SaveGame
}

function item(id: string, type: InboxItemType = InboxItemType.Community): InboxItem {
  return { id, date: '2026-10-01', type, title: `Rubrik ${id}`, body: `Bröd ${id}`, isRead: false,
    relatedPlayerId: type === InboxItemType.TransferOffer ? 'offer-player' : undefined }
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

  it('återför en redan överfull direktinkorg till samma oläst-budget', () => {
    const existing = Array.from({ length: 9 }, (_, index) => item(`existing-${index}`))
    const result = finalizeInboxDelivery(game({ inbox: existing }), [], chronology)
    expect(result.inbox.filter(candidate => !candidate.isRead)).toHaveLength(MAX_UNREAD_INFORMATIONAL_INBOX)
    expect(result.inbox.every(candidate => candidate.createdMatchday === chronology.matchday)).toBe(true)
    expect(result.inbox.every(candidate => candidate.createdSeason === chronology.season)).toBe(true)
  })

  it('arkiverar aldrig ett riktigt svarsärende när informationsbudgeten är full', () => {
    const existing = [
      ...Array.from({ length: 8 }, (_, index) => item(`existing-${index}`)),
      item('deadline', InboxItemType.TransferOffer),
    ]
    const result = finalizeInboxDelivery(game({ inbox: existing }), [], chronology)
    expect(result.inbox.find(candidate => candidate.id === 'deadline')?.isRead).toBe(false)
  })

  it('låter en ny viktig informationsnotis ersätta den äldsta olästa raden', () => {
    const existing = Array.from({ length: MAX_UNREAD_INFORMATIONAL_INBOX }, (_, index) => ({
      ...item(`existing-${index}`),
      date: `2026-09-${String(index + 1).padStart(2, '0')}`,
      createdMatchday: index,
    }))
    const verdict = { ...item('inbox_board_verdict_2026', InboxItemType.BoardFeedback), title: 'Styrelsens besked' }
    const result = finalizeInboxDelivery(game({ inbox: existing }), [verdict], chronology)

    expect(result.inbox.find(candidate => candidate.id === verdict.id)?.isRead).toBe(false)
    expect(result.inbox.some(candidate => candidate.id === 'existing-0' && !candidate.isRead)).toBe(false)
    expect(result.inbox.filter(candidate => !candidate.isRead && candidate.type !== InboxItemType.TransferOffer)).toHaveLength(MAX_UNREAD_INFORMATIONAL_INBOX)
  })

  it('väntar med en ämnesnotis tills spelaren har introducerats till ytan', () => {
    const result = finalizeInboxDelivery(game({ introducedInboxTopics: ['squad'] }), [item('training', InboxItemType.Training)], chronology)
    expect(result.inbox).toHaveLength(0)
    expect(result.deferredInbox.map(candidate => candidate.id)).toEqual(['training'])
  })
})
