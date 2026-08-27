import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'
import type { TransferBid } from '../../../entities/GameEvent'

/**
 * PÅSTÅENDEKARTAN omsvep (2026-08-24), VAR-fel-fält: hesitantPlayerEvent
 * triggades tidigare på target.currentAbility > truppens CA-snitt —
 * contentContract.ts:222 dokumenterar triggern som "buyingClubId har lägre
 * reputation än spelarens nuvarande klubb" (sellingClubId), aldrig läst.
 */
function makeGameWithBid(overrides: { buyingReputation: number; sellingReputation: number }): { game: SaveGame; bid: TransferBid } {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const sellingClubId = game.clubs.find(c => c.id !== game.managedClubId)!.id
  const targetPlayer = game.players.find(p => p.clubId !== game.managedClubId)!

  const bid: TransferBid = {
    id: 'bid_test_1',
    playerId: targetPlayer.id,
    buyingClubId: game.managedClubId,
    sellingClubId,
    offerAmount: 500_000,
    offeredSalary: 20_000,
    contractYears: 3,
    direction: 'outgoing',
    status: 'accepted',
    createdRound: 4,
    expiresRound: 5,
  }

  const updatedGame: SaveGame = {
    ...game,
    transferBids: [bid],
    clubs: game.clubs.map(c => {
      if (c.id === game.managedClubId) return { ...c, reputation: overrides.buyingReputation }
      if (c.id === sellingClubId) return { ...c, reputation: overrides.sellingReputation }
      return c
    }),
  }
  return { game: updatedGame, bid }
}

describe('hesitantPlayerEvent-gaten — reputation, inte currentAbility (VAR-fel-fält-fix)', () => {
  it('triggar när köpande klubb (vi) har LÄGRE reputation än säljande klubb', () => {
    const { game, bid } = makeGameWithBid({ buyingReputation: 30, sellingReputation: 70 })
    const events = generatePostAdvanceEvents(game, [], 5, () => 0.5)
    expect(events.some(e => e.id === `event_hesitant_${bid.id}`)).toBe(true)
  })

  it('triggar INTE när köpande klubb (vi) har lika hög eller högre reputation', () => {
    const { game, bid } = makeGameWithBid({ buyingReputation: 70, sellingReputation: 30 })
    const events = generatePostAdvanceEvents(game, [], 5, () => 0.5)
    expect(events.some(e => e.id === `event_hesitant_${bid.id}`)).toBe(false)
  })
})
