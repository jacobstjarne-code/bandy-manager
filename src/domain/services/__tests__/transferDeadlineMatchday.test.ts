import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateDeadlineBids, generateDiscountOffer } from '../transferDeadlineService'

describe('transferDeadlineService — global matchday clock', () => {
  it('deduplicates a panic bid using the latest completed matchday, not roundNumber', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const fixtures = game.fixtures.map((f, i) => i === 0
      ? { ...f, status: 'completed' as const, matchday: 14, roundNumber: 3 }
      : f)
    const resolvedEventIds = [`deadline_bid_${game.currentSeason}_r14`]
    expect(generateDeadlineBids({ ...game, fixtures, resolvedEventIds }, () => 0)).toEqual([])
  })

  it('deduplicates a discount offer on the same matchday clock', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const fixtures = game.fixtures.map((f, i) => i === 0
      ? { ...f, status: 'completed' as const, matchday: 14, roundNumber: 3 }
      : f)
    const resolvedEventIds = [`deadline_offer_${game.currentSeason}_r14`]
    expect(generateDiscountOffer({ ...game, fixtures, resolvedEventIds }, () => 0)).toBeNull()
  })
})
