import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { generateBurnoutReliefEvent } from '../../../../domain/services/burnoutReliefService'
import { getDefaultRolloverChoice } from '../../../../domain/services/deferredRolloverService'
import { processGameEvents } from '../eventProcessor'

describe('burnoutRelief — kölivscykel', () => {
  const makeGame = () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    return { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 60 } }
  }

  it.each(['pendingEvents', 'deferredDecisions'] as const)('skapar ingen dubblett när typen redan finns i %s', queue => {
    const game = makeGame()
    const existing = generateBurnoutReliefEvent(9, game.currentSeason, 'hog')
    const withQueued = { ...game, [queue]: [existing] }

    const result = processGameEvents(withQueued, [], undefined, 10, () => 0.99)

    expect(result.gameEvents.filter(event => event.type === 'burnoutRelief')).toEqual([])
  })

  it('har inget rollover-default eftersom alla tre val har verkliga priser', () => {
    expect(getDefaultRolloverChoice(generateBurnoutReliefEvent(10, 2025, 'hog'))).toBeNull()
  })
})
