import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processPendingFollowUps } from '../eventProcessor'

describe('eventProcessor — delayed follow-ups', () => {
  it('surfaces elapsed follow-ups and keeps future ones pending', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const result = processPendingFollowUps({
      ...game,
      pendingFollowUps: [{
        id: 'due',
        triggerEventId: 'source_due',
        matchdaysDelay: 2,
        createdMatchday: 5,
        type: 'test',
        data: { text: 'Det tidigare beslutet fick en följd.' },
      }, {
        id: 'future',
        triggerEventId: 'source_future',
        matchdaysDelay: 4,
        createdMatchday: 5,
        type: 'test',
      }],
    }, 7)

    expect(result.pendingFollowUps?.map(item => item.id)).toEqual(['future'])
    expect(result.inbox).toContainEqual(expect.objectContaining({
      id: 'inbox_fu_due',
      body: 'Det tidigare beslutet fick en följd.',
    }))
  })

  it('uses the established fallback and returns the same game when the queue is absent', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    expect(processPendingFollowUps(game, 7)).toBe(game)

    const result = processPendingFollowUps({
      ...game,
      pendingFollowUps: [{
        id: 'fallback',
        triggerEventId: 'source_fallback',
        matchdaysDelay: 1,
        createdMatchday: 6,
        type: 'test',
      }],
    }, 7)

    expect(result.inbox).toContainEqual(expect.objectContaining({
      id: 'inbox_fu_fallback',
      body: 'Uppföljning från tidigare händelse.',
    }))
  })
})
