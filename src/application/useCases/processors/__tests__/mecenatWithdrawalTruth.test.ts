import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processGameEvents } from '../eventProcessor'
import type { Mecenat } from '../../../../domain/entities/Mecenat'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import { getDefaultRolloverChoice, resolveDeferredAtRollover } from '../../../../domain/services/deferredRolloverService'

function baseGame(): SaveGame {
  return createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
}

function mecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec_1', name: 'Test Mecenat', gender: 'female', business: 'Test AB',
    businessType: 'brukspatron', wealth: 5, personality: 'filantropen',
    influence: 20, happiness: 30, goodwill: 50, contribution: 75_000,
    totalContributed: 0, demands: [], socialExpectations: [], isActive: true,
    arrivedSeason: 2025, silentShout: 0, lastInteractionRound: 8,
    ...overrides,
  }
}

const oldDemand = { type: 'visible_money' as const, description: 'old' }

describe('mecenatWithdrawal — färsk kravstate och obligatorisk konsekvens', () => {
  it('ett uppfyllt tredje krav räddar relationen samma omgång', () => {
    const game = {
      ...baseGame(),
      academyLevel: 'developing' as const,
      mecenater: [mecenat({
        happiness: 10,
        demands: [oldDemand, oldDemand, oldDemand],
        pendingDemand: {
          category: 'youth_focus' as const,
          description: 'pending',
          createdRound: 0,
          deadlineRound: 8,
        },
      })],
    }

    const result = processGameEvents(game, [], null, 8, () => 0.99)
    expect(result.updatedMecenater[0]).toMatchObject({
      happiness: 25,
      demands: [],
      pendingDemand: undefined,
      isActive: true,
    })
    expect(result.gameEvents.some(event => event.type === 'mecenatWithdrawal')).toBe(false)
  })

  it('det tredje misslyckade kravet utlöser avhopp direkt och använder faktisk wealth', () => {
    const game = {
      ...baseGame(),
      academyLevel: 'basic' as const,
      communityActivities: {},
      mecenater: [mecenat({
        wealth: 5,
        happiness: 30,
        demands: [oldDemand, oldDemand],
        pendingDemand: {
          category: 'youth_focus' as const,
          description: 'third',
          createdRound: 0,
          deadlineRound: 8,
        },
      })],
    }

    const result = processGameEvents(game, [], null, 8, () => 0.99)
    const event = result.gameEvents.find(candidate => candidate.type === 'mecenatWithdrawal')

    expect(result.updatedMecenater[0]).toMatchObject({
      happiness: 0,
      isActive: false,
      permanentlyWithdrawn: true,
    })
    expect(result.mecenatWithdrawnSeason).toBe(game.currentSeason)
    expect(event?.choices).toHaveLength(1)
    expect(event?.choices[0]).toMatchObject({
      id: 'acknowledge',
      effect: { type: 'finance', value: -1_000_000 },
    })
  })

  it('deferred enknappsbesked tillämpar kassaeffekten som systemutfall vid rollover', () => {
    const event: GameEvent = {
      id: 'mecenat_withdrawal_test',
      type: 'mecenatWithdrawal',
      title: 'test', body: 'test',
      choices: [{ id: 'acknowledge', label: 'ack', effect: { type: 'finance', value: -600_000 } }],
      resolved: false,
    }
    const game = baseGame()
    const before = game.clubs.find(c => c.id === game.managedClubId)!.finances

    expect(getDefaultRolloverChoice(event)?.id).toBe('acknowledge')
    const result = resolveDeferredAtRollover(game, [event], game.currentSeason)
    const after = result.game.clubs.find(c => c.id === game.managedClubId)!.finances

    expect(after).toBe(before - 600_000)
    expect(result.outcomes).toEqual([{
      eventId: event.id,
      type: event.type,
      kind: 'resolved',
      choiceId: 'acknowledge',
      chosenLabel: 'ack',
    }])
    expect(result.game.resolvedChoices?.find(choice => choice.eventId === event.id)?.madeByPlayer).toBe(false)
  })
})
