import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { processGameEvents } from '../processors/eventProcessor'
import { BURNOUT_CEILING_TRIGGER_ROUNDS } from '../../../domain/services/managerProfileService'

describe('eventProcessor — burnout-taket dominerar lättnaden', () => {
  it('köar exakt takkortet när båda villkoren är uppfyllda samma omgång', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 1 })
    game.managerProfile = {
      ...game.managerProfile!,
      burnoutScore: 100,
      roundsAtBurnoutCeiling: BURNOUT_CEILING_TRIGGER_ROUNDS,
      burnoutCeilingChoiceOffered: false,
    }

    const result = processGameEvents(game, [], null, 12, () => 0.99)
    const burnoutEvents = result.gameEvents.filter(event =>
      event.type === 'burnoutRelief' || event.type === 'burnoutCeiling',
    )

    expect(burnoutEvents).toHaveLength(1)
    expect(burnoutEvents[0].type).toBe('burnoutCeiling')
  })
})
