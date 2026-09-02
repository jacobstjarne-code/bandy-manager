/**
 * DOM_BURNOUT_TAK_2026-09-02 — eventResolver.ts:s nya delar för
 * burnoutCeiling: multiEffect-sub-typen 'startBurnoutCeilingRecovery' (C)
 * och den dedikerade ärr-skrivningshooken (D). Samma mönster som
 * burnoutReliefResolver.test.ts (O4) redan etablerade.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'
import type { SaveGame } from '../../../entities/SaveGame'

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

function ceilingEvent(id: string): GameEvent {
  return {
    id, type: 'burnoutCeiling', title: '[Opus]', body: '[Opus]',
    choices: [
      {
        id: 'step_back', label: '[Opus]', subtitle: '[Opus]', irreversible: true,
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'startBurnoutCeilingRecovery', amount: 6 },
          { type: 'startTrainingSlowdown', amount: 6 },
          { type: 'boardPatience', amount: -10 },
        ]) },
      },
      { id: 'push_through', label: '[Opus]', subtitle: '[Opus]', irreversible: true, effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

describe("eventResolver — multiEffect sub-typ 'startBurnoutCeilingRecovery'", () => {
  it('sätter burnoutCeilingRecoveryUntilRound = currentMatchday + amount', () => {
    let game = baseGame({ currentMatchday: 10 })
    const event = multiEffectEvent('test_ceiling_recovery_1', [{ type: 'startBurnoutCeilingRecovery', amount: 6 }])
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_recovery_1', 'choice', undefined, true)

    expect(game.burnoutCeilingRecoveryUntilRound).toBe(16)
  })
})

describe('eventResolver — burnoutCeiling ärr-skrivning (D)', () => {
  it("step_back: burnoutScar='stepped_back', diary-post type burnout_scar, PLUS startBurnoutCeilingRecovery/startTrainingSlowdown/boardPatience alla applicerar", () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3, boardPatience: 70 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_1')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_1', 'step_back', undefined, true)

    expect(game.managerProfile!.burnoutScar).toBe('stepped_back')
    const scarEntry = game.managerProfile!.diary!.find(e => e.type === 'burnout_scar')
    expect(scarEntry).toBeDefined()
    expect(scarEntry!.season).toBe(3)
    expect(scarEntry!.matchday).toBe(20)
    expect(game.burnoutCeilingRecoveryUntilRound).toBe(26)
    expect(game.burnoutTrainingSlowdownUntilRound).toBe(26)
    expect(game.boardPatience).toBe(60)
    expect(game.eventLedger).toContainEqual({
      type: 'decision',
      semanticKey: 'burnoutCeiling:step_back',
      season: 3,
      matchday: 20,
      significance: 100,
      irreversible: true,
      tension: true,
      systemsAffectedCount: 4,
      madeByPlayer: true,
    })
  })

  it("push_through: burnoutScar='hardened', diary-post skriven, INGET mekaniskt pris (ingen recovery, ingen slowdown, boardPatience orörd)", () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3, boardPatience: 70 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_2')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_2', 'push_through', undefined, true)

    expect(game.managerProfile!.burnoutScar).toBe('hardened')
    expect(game.managerProfile!.diary!.some(e => e.type === 'burnout_scar')).toBe(true)
    expect(game.burnoutCeilingRecoveryUntilRound).toBeUndefined()
    expect(game.burnoutTrainingSlowdownUntilRound).toBeUndefined()
    expect(game.boardPatience).toBe(70)
    expect(game.eventLedger).toContainEqual(expect.objectContaining({
      type: 'decision',
      semanticKey: 'burnoutCeiling:push_through',
      season: 3,
      matchday: 20,
      irreversible: true,
      tension: true,
      systemsAffectedCount: 4,
      madeByPlayer: true,
    }))
  })

  it('madeByPlayer=false — inget ärr skrivs (HIGH 6-disciplinen, samma gate som varsel/offer_pro)', () => {
    let game = baseGame({ currentMatchday: 20 })
    game = { ...game, managerProfile: { ...game.managerProfile!, burnoutScore: 100 } }
    const event = ceilingEvent('test_ceiling_3')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_3', 'push_through', undefined, false)

    expect(game.managerProfile!.burnoutScar).toBeUndefined()
    expect((game.managerProfile!.diary ?? []).some(e => e.type === 'burnout_scar')).toBe(false)
    expect((game.eventLedger ?? []).some(e => e.semanticKey.startsWith('burnoutCeiling:'))).toBe(false)
  })

  it('ingen managerProfile → ingen krasch', () => {
    let game = baseGame({ managerProfile: undefined, currentMatchday: 20 })
    const event = ceilingEvent('test_ceiling_4')
    game = { ...game, pendingEvents: [event] }

    expect(() => resolveEvent(game, 'test_ceiling_4', 'step_back', undefined, true)).not.toThrow()
    game = resolveEvent(game, 'test_ceiling_4', 'step_back', undefined, true)
    expect(game.eventLedger).toContainEqual(expect.objectContaining({ semanticKey: 'burnoutCeiling:step_back' }))
  })

  it('dubbel-resolution-skydd: en redan skriven ärr-post för samma säsong+omgång skrivs inte igen', () => {
    let game = baseGame({ currentMatchday: 20, currentSeason: 3 })
    game = {
      ...game,
      managerProfile: {
        ...game.managerProfile!,
        burnoutScore: 100,
        burnoutScar: 'hardened',
        diary: [{ season: 3, matchday: 20, type: 'burnout_scar', text: '[Opus]' }],
      },
    }
    const event = ceilingEvent('test_ceiling_5')
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_ceiling_5', 'step_back', undefined, true)

    // Skulle branchen köras igen hade scar bytts till 'stepped_back' och en andra diary-post lagts till.
    expect(game.managerProfile!.burnoutScar).toBe('hardened')
    expect(game.managerProfile!.diary!.filter(e => e.type === 'burnout_scar')).toHaveLength(1)
  })
})
