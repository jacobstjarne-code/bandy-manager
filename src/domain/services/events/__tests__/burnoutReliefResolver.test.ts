/**
 * O4 (DOM_BURNOUT_2026-08-17.md, Jacobs dom 2026-08-23) — eventResolver.ts:s
 * nya multiEffect-sub-typer, reduceBurnout och startTrainingSlowdown. Samma
 * felklass eventResolverEffectSchema.test.ts dokumenterar (2026-08-17):
 * multiEffect har sin EGEN switch, en ny sub-typ måste ha en egen gren eller
 * blir en tyst noll-effekt.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'
import type { SaveGame } from '../../../entities/SaveGame'
import { generateBurnoutReliefEvent } from '../../burnoutReliefService'

function baseGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, ...overrides }
}

function multiEffectEvent(id: string, subEffects: Array<{ type: string; amount?: number }>): GameEvent {
  return {
    id, type: 'burnoutRelief', title: 't', body: 'b',
    choices: [{ id: 'choice', label: 'l', effect: { type: 'multiEffect', subEffects: JSON.stringify(subEffects) } }],
    resolved: false,
  }
}

describe("eventResolver — multiEffect sub-typ 'reduceBurnout'", () => {
  it('sänker managerProfile.burnoutScore, clampat vid 0', () => {
    let game = baseGame()
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 40 } }
    const event = multiEffectEvent('test_burnout_1', [{ type: 'reduceBurnout', amount: -15 }])
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_burnout_1', 'choice', undefined, true)

    expect(game.managerProfile!.burnoutScore).toBe(25)
  })

  it('clampar vid 0, sänker aldrig under', () => {
    let game = baseGame()
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 5 } }
    const event = multiEffectEvent('test_burnout_2', [{ type: 'reduceBurnout', amount: -25 }])
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_burnout_2', 'choice', undefined, true)

    expect(game.managerProfile!.burnoutScore).toBe(0)
  })

  it('ingen managerProfile → ingen krasch, spelet oförändrat', () => {
    let game = baseGame({ managerProfile: undefined })
    const event = multiEffectEvent('test_burnout_3', [{ type: 'reduceBurnout', amount: -15 }])
    game = { ...game, pendingEvents: [event] }

    expect(() => resolveEvent(game, 'test_burnout_3', 'choice', undefined, true)).not.toThrow()
  })
})

describe("eventResolver — multiEffect sub-typ 'startTrainingSlowdown'", () => {
  it('sätter burnoutTrainingSlowdownUntilRound = currentMatchday + amount', () => {
    let game = baseGame({ currentMatchday: 10 })
    const event = multiEffectEvent('test_slowdown_1', [{ type: 'startTrainingSlowdown', amount: 4 }])
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_slowdown_1', 'choice', undefined, true)

    expect(game.burnoutTrainingSlowdownUntilRound).toBe(14)
  })
})

describe('eventResolver — burnoutRelief multiEffect, kombinerad (delegera-valets faktiska form)', () => {
  it('reduceBurnout OCH journalistRelationship applicerar båda, ingen tyst noll-effekt', () => {
    let game = baseGame()
    game = {
      ...game,
      managerProfile: { ...game.managerProfile!, burnoutScore: 60 },
      journalistRelationship: 50,
    }
    const event = multiEffectEvent('test_combined_1', [
      { type: 'reduceBurnout', amount: -12 },
      { type: 'journalistRelationship', amount: -10 },
    ])
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_combined_1', 'choice', undefined, true)

    expect(game.managerProfile!.burnoutScore).toBe(48)
    expect(game.journalistRelationship).toBe(40)
    expect(game.journalist!.relationship).toBe(40)
    expect(game.journalist!.lastInteractionMatchday).toBe(game.currentMatchday)
  })
})

describe('eventResolver — genererade burnoutRelief-val hela vägen', () => {
  it('train sänker burnout, startar fyra omgångars broms och källcooldown', () => {
    let game = baseGame({ currentMatchday: 10 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 60 } }
    const event = generateBurnoutReliefEvent(10, game.currentSeason, 'hog')

    game = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'train', undefined, true)

    expect(game.managerProfile!.burnoutScore).toBe(45)
    expect(game.burnoutTrainingSlowdownUntilRound).toBe(14)
    expect(game.sourceCooldowns?.burnout).toEqual({ roundsLeft: 6, totalRounds: 6 })
  })

  it('board sänker burnout mest och tar verkligt styrelsetålamod', () => {
    let game = baseGame({ currentMatchday: 10, boardPatience: 70 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 60 } }
    const event = generateBurnoutReliefEvent(10, game.currentSeason, 'hog')

    game = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'board', undefined, true)

    expect(game.managerProfile!.burnoutScore).toBe(35)
    expect(game.boardPatience).toBe(60)
  })
})
