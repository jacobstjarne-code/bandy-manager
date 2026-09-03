import { describe, expect, it, vi } from 'vitest'

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}))

import { isFeedbackHiddenOnRoute } from '../FeedbackButton'

describe('FeedbackButton — matchflödets mobila tap-ytor', () => {
  it.each([
    '/game/match',
    '/game/match/live',
    '/game/match/result',
    '/game/review',
  ])('är dold på %s', route => {
    expect(isFeedbackHiddenOnRoute(route)).toBe(true)
  })

  it('finns kvar på en vanlig spelskärm', () => {
    expect(isFeedbackHiddenOnRoute('/game/dashboard')).toBe(false)
  })
})
