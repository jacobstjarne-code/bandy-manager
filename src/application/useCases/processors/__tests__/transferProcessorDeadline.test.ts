import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { FixtureStatus, InboxItemType } from '../../../../domain/enums'
import { generateDeadlineDayBidInbox } from '../transferProcessor'

function game(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'managed',
    currentSeason: 3,
    currentDate: '2026-12-30',
    inbox: [],
    supporterGroup: { favoritePlayerId: 'favorite' },
    clubs: [
      { id: 'managed', name: 'Brukets BK' },
      { id: 'visitor', name: 'Gästernas IF' },
    ],
    players: [
      { id: 'favorite', firstName: 'Folke', lastName: 'Favorit', clubId: 'managed', currentAbility: 99, isInjured: false },
      { id: 'injured', firstName: 'Isak', lastName: 'Skadad', clubId: 'managed', currentAbility: 95, isInjured: true },
      { id: 'eligible', firstName: 'Erik', lastName: 'Spelbar', clubId: 'managed', currentAbility: 80, isInjured: false },
    ],
    ...overrides,
  } as unknown as SaveGame
}

function deadlineFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'deadline-fixture',
    homeClubId: 'managed',
    awayClubId: 'visitor',
    matchday: 12,
    roundNumber: 12,
    status: FixtureStatus.Scheduled,
    events: [],
    isWindowDeadlineDay: true,
    ...overrides,
  } as Fixture
}

describe('generateDeadlineDayBidInbox', () => {
  it('skapar inget bud utanför deadline-dagen eller när sannolikhetskastet missar', () => {
    expect(generateDeadlineDayBidInbox(game(), deadlineFixture({ isWindowDeadlineDay: false }), 12, () => 0)).toEqual([])
    expect(generateDeadlineDayBidInbox(game(), deadlineFixture(), 12, () => 0.35)).toEqual([])
  })

  it('väljer högst rankade tillgängliga icke-favorit och anknyter motståndarklubben', () => {
    const result = generateDeadlineDayBidInbox(game(), deadlineFixture(), 12, () => 0)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'deadline_window_bid_3_12',
      type: InboxItemType.TransferDeadline,
      relatedPlayerId: 'eligible',
      relatedClubId: 'visitor',
      isRead: false,
    })
    expect(result[0].body).toContain('Erik Spelbar')
    expect(result[0].body).toContain('Gästernas IF')
  })

  it('deduplicerar en redan skickad deadline-notis', () => {
    const existing = { id: 'deadline_window_bid_3_12' } as SaveGame['inbox'][number]
    expect(generateDeadlineDayBidInbox(game({ inbox: [existing] }), deadlineFixture(), 12, () => 0)).toEqual([])
  })
})
