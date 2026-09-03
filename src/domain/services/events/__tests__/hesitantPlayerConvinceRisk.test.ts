/**
 * DOM_O20_K3K5_KLASS_2026-09-02, Jacobs beslut — hesitantPlayer/convince
 * dominerade tidigare accept (garanterad +15 moral mot en riskfri noOp).
 * convince fick en riktig, liten nedsida: 65% ger den lovade moralen,
 * 35% slår tillbaka. accept ska förbli en äkta noOp.
 */
import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { hesitantPlayerEvent } from '../eventFactories'
import { resolveEvent } from '../eventResolver'
import type { TransferBid } from '../../../entities/GameEvent'

function makeGameWithEvent() {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const target = base.players.find(p => p.clubId !== base.managedClubId)!

  const bid: TransferBid = {
    id: 'bid_hesitant_1',
    playerId: target.id,
    buyingClubId: base.managedClubId,
    sellingClubId: target.clubId,
    offerAmount: 400_000,
    offeredSalary: 18_000,
    contractYears: 3,
    direction: 'outgoing',
    status: 'accepted',
    createdRound: 4,
    expiresRound: 5,
  }

  const event = hesitantPlayerEvent(bid, { ...base, players: base.players.map(p => p.id === target.id ? { ...p, morale: 50 } : p) })
  const game = {
    ...base,
    players: base.players.map(p => p.id === target.id ? { ...p, morale: 50 } : p),
    pendingEvents: [event],
  }
  return { game, event, targetId: target.id }
}

describe('hesitantPlayer/convince — probabilistisk nedsida', () => {
  it('lyckas (rand < 0.65) ger +15 moral', () => {
    const { game, event, targetId } = makeGameWithEvent()
    const updated = resolveEvent(game, event.id, 'convince', () => 0.1, true)
    const player = updated.players.find(p => p.id === targetId)!
    expect(player.morale).toBe(65)
  })

  it('slår tillbaka (rand >= 0.65) ger -8 moral', () => {
    const { game, event, targetId } = makeGameWithEvent()
    const updated = resolveEvent(game, event.id, 'convince', () => 0.9, true)
    const player = updated.players.find(p => p.id === targetId)!
    expect(player.morale).toBe(42)
  })

  it('gränsvärdet 0.65 räknas som backfire (>=), inte lyckat', () => {
    const { game, event, targetId } = makeGameWithEvent()
    const updated = resolveEvent(game, event.id, 'convince', () => 0.65, true)
    const player = updated.players.find(p => p.id === targetId)!
    expect(player.morale).toBe(42)
  })

  it('accept är fortfarande en äkta noOp — moral orörd', () => {
    const { game, event, targetId } = makeGameWithEvent()
    const updated = resolveEvent(game, event.id, 'accept', () => 0.1, true)
    const player = updated.players.find(p => p.id === targetId)!
    expect(player.morale).toBe(50)
  })

  it('över många rullningar landar utfallsandelen nära 65/35, inte 50/50 eller garanterat', () => {
    let successes = 0
    const total = 400
    for (let i = 0; i < total; i++) {
      const { game, event, targetId } = makeGameWithEvent()
      const roll = i / total
      const updated = resolveEvent(game, event.id, 'convince', () => roll, true)
      const player = updated.players.find(p => p.id === targetId)!
      if (player.morale === 65) successes++
    }
    const ratio = successes / total
    expect(ratio).toBeCloseTo(0.65, 1)
  })
})
