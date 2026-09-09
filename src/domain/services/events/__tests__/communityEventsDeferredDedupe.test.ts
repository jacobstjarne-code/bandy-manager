import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { generateEvents } from '../communityEvents'

describe('generateEvents — KF3-kön ingår i dublettskyddet', () => {
  it('genererar inte om ett communityevent som redan väntar i deferredDecisions', () => {
    const base = createNewGame({
      managerName: 'Test',
      clubId: CLUB_TEMPLATES[0].id,
      season: 2030,
      seed: 1,
    })
    const game = {
      ...base,
      pendingEvents: [],
      deferredDecisions: [],
      resolvedEventIds: [],
      supporterGroup: {
        ...base.supporterGroup!,
        tifoDone: false,
      },
    }

    const first = generateEvents(game, 5, () => 0)
      .find(event => event.id === `supporter_tifo_${game.currentSeason}`)
    expect(first).toBeDefined()

    const repeated = generateEvents({
      ...game,
      deferredDecisions: [first!],
    }, 5, () => 0)

    expect(repeated.some(event => event.id === first!.id)).toBe(false)
  })
})
