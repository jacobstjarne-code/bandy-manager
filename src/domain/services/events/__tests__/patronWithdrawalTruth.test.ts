import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { processGameEvents } from '../../../../application/useCases/processors/eventProcessor'
import type { GameEvent } from '../../../entities/GameEvent'
import type { SaveGame } from '../../../entities/SaveGame'
import { getDefaultRolloverChoice, resolveDeferredAtRollover } from '../../deferredRolloverService'
import { applyPatronHappinessTransition } from '../../patronWithdrawalService'

function gameWithPatron(overrides: Partial<NonNullable<SaveGame['patron']>> = {}): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  return {
    ...game,
    patron: {
      name: 'Patron Test', business: 'Testbruket', influence: 50,
      happiness: 20, contribution: 200_000, isActive: true, goodwill: 80,
      totalContributed: 0, demands: [],
      ...overrides,
    },
  }
}

describe('patronWithdrawal — en kanonisk nollpunktsövergång', () => {
  it('happiness till noll avaktiverar patronen, startar cooldown och skapar ett enda kvittensbesked', () => {
    const game = gameWithPatron({ happiness: 20 })
    const result = applyPatronHappinessTransition(game, -20)

    expect(result.patron).toMatchObject({ happiness: 0, isActive: false })
    expect(result.patronWithdrawnSeason).toBe(game.currentSeason)
    expect(result.withdrawalEvent).toMatchObject({
      id: `patron_withdrawal_${game.currentSeason}`,
      type: 'patronWithdrawal',
      choices: [{ id: 'acknowledge', effect: { type: 'patronWithdrawn' } }],
    })
  })

  it('ett redan pending/deferred/resolved avhopps-id dupliceras inte', () => {
    const base = gameWithPatron({ happiness: 1 })
    const id = `patron_withdrawal_${base.currentSeason}`
    const marker = { id, type: 'patronWithdrawal', title: 't', body: 'b', choices: [], resolved: false } as GameEvent

    for (const game of [
      { ...base, pendingEvents: [marker] },
      { ...base, deferredDecisions: [marker] },
      { ...base, resolvedEventIds: [id] },
    ]) {
      const result = applyPatronHappinessTransition(game, -1)
      expect(result.patron?.isActive).toBe(false)
      expect(result.withdrawalEvent).toBeUndefined()
    }
  })

  it('kravmotorn använder samma nollpunkt och kan inte lämna en aktiv patron på happiness 0', () => {
    const game = gameWithPatron({
      happiness: 10,
      pendingDemand: {
        category: 'visible_money',
        description: 'pending',
        createdRound: 0,
        deadlineRound: 8,
      },
      demands: ['pending'],
    })
    const result = processGameEvents(game, [], null, 8, () => 0.99)

    expect(result.updatedPatron).toMatchObject({ happiness: 0, isActive: false, pendingDemand: undefined })
    expect(result.patronWithdrawnSeason).toBe(game.currentSeason)
    expect(result.gameEvents.filter(event => event.type === 'patronWithdrawal')).toHaveLength(1)
  })

  it('rollover kvitterar avhoppskortets enda systemutfall och markerar inte ett spelarval', () => {
    const event: GameEvent = {
      id: 'patron_withdrawal_test', type: 'patronWithdrawal', title: 't', body: 'b',
      choices: [{ id: 'acknowledge', label: 'ack', effect: { type: 'patronWithdrawn' } }],
      resolved: false,
    }
    const game = gameWithPatron({ isActive: true })

    expect(getDefaultRolloverChoice(event)?.id).toBe('acknowledge')
    const result = resolveDeferredAtRollover(game, [event], game.currentSeason)
    expect(result.game.patron?.isActive).toBe(false)
    expect(result.game.patronWithdrawnSeason).toBe(game.currentSeason)
    expect(result.game.resolvedChoices?.find(choice => choice.eventId === event.id)?.madeByPlayer).toBe(false)
  })
})
