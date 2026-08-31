import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'
import type { SaveGame } from '../../../entities/SaveGame'

/**
 * Regression tests for the Stickiness-audit (2026-08-17, @0b325c10) effect-
 * schema sweep. EventEffect carries two same-shaped optional numeric fields
 * (amount/value) — which one a given effect type's resolver actually reads
 * is type-specific and not enforced anywhere, so a construction site can set
 * the field the resolver ignores and the effect silently becomes a no-op (or
 * falls back to a wrong default). Three confirmed instances, two distinct
 * failure classes:
 *
 * 1. eventProcessor.ts's mecenat-withdrawal effect used `amount` for a
 *    `type: 'finance'` effect — the top-level resolver's 'finance' case
 *    reads `effect.value`. The card promised "1 000 000 kr dras från
 *    kassan" and deducted 0.
 * 2/3. politicianEvents.ts used `multiEffect`/`subEffects` sub-effects of
 *    type 'reputation' and 'kommunBidragChange' — but the multiEffect
 *    resolver maintains its OWN separate, incomplete switch of supported
 *    sub-types (income/communityStanding/fanMood/journalistRelationship/
 *    boardPatience/politicianRelationship/supporterMood/boostMorale/
 *    patronInfluence/mecenatHappiness) that never had branches for those
 *    two — so the subtitle's promised "+5 reputation" / "+6 000 kr
 *    kommunbidrag" silently did nothing, regardless of field name.
 */

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

describe('eventResolver — effect schema (amount vs value, multiEffect sub-type coverage)', () => {
  it("'finance' effect reads effect.value, not effect.amount (mecenat-withdrawal class)", () => {
    let game = baseGame()
    const startFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances

    const event: GameEvent = {
      id: 'test_finance_event',
      type: 'mecenatWithdrawal',
      title: 't', body: 'b',
      choices: [{ id: 'acknowledge', label: 'Noterat', effect: { type: 'finance', value: -1_000_000 } }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_finance_event', 'acknowledge', undefined, true)

    const endFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    expect(endFinances).toBe(startFinances - 1_000_000)
  })

  it("multiEffect sub-type 'reputation' is applied, not silently dropped", () => {
    let game = baseGame()
    const startRep = game.clubs.find(c => c.id === game.managedClubId)!.reputation

    const event: GameEvent = {
      id: 'test_reputation_event',
      type: 'politicianEvent',
      title: 't', body: 'b',
      choices: [{
        id: 'welcome', label: 'Välkomna',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([{ type: 'reputation', amount: 5 }]) },
      }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_reputation_event', 'welcome', undefined, true)

    const endRep = game.clubs.find(c => c.id === game.managedClubId)!.reputation
    expect(endRep).toBe(Math.min(100, startRep + 5))
  })

  it("multiEffect sub-type 'kommunBidragChange' is applied, not silently dropped", () => {
    let game = baseGame()
    game = {
      ...game,
      localPolitician: {
        name: 'Test Politiker', title: 'Kommunalråd', party: 'S', agenda: 'neutral' as never,
        relationship: 50, kommunBidrag: 10_000,
      },
    }

    const event: GameEvent = {
      id: 'test_kommunbidrag_event',
      type: 'politicianEvent',
      title: 't', body: 'b',
      choices: [{
        id: 'start_program', label: 'Starta programmet',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([{ type: 'kommunBidragChange', amount: 6000 }]) },
      }],
      resolved: false,
    }
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, 'test_kommunbidrag_event', 'start_program', undefined, true)

    expect(game.localPolitician!.kommunBidrag).toBe(16_000)
  })
})
