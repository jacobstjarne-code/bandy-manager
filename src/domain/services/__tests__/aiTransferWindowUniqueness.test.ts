import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { processAITransfers } from '../aiTransferService'

describe('processAITransfers — ett fönster', () => {
  it('låter aldrig samma spelare flytta två gånger under samma sommar', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 1 })
    const [managed, firstBuyer, secondBuyer, seller] = game.clubs.slice(0, 4)
    const target = {
      ...game.players[0],
      id: 'window_target',
      clubId: seller.id,
      age: 25,
      currentAbility: 99,
      marketValue: 1_000,
    }
    const sourcePlayers = game.players.slice(1, 59)
    const makeFillers = (start: number, count: number, clubId: string) =>
      sourcePlayers.slice(start, start + count).map((player, index) => ({
        ...player,
        id: `${clubId}_filler_${index}`,
        clubId,
        age: 40,
      }))
    const firstBuyerPlayers = makeFillers(0, 21, firstBuyer.id)
    const secondBuyerPlayers = makeFillers(21, 16, secondBuyer.id)
    const sellerPlayers = makeFillers(37, 20, seller.id)
    const players = [target, ...firstBuyerPlayers, ...secondBuyerPlayers, ...sellerPlayers]
    const clubs = [
      { ...managed, squadPlayerIds: [] },
      { ...firstBuyer, squadPlayerIds: firstBuyerPlayers.map(player => player.id), transferBudget: 1_000_000 },
      { ...secondBuyer, squadPlayerIds: secondBuyerPlayers.map(player => player.id), transferBudget: 1_000_000 },
      { ...seller, squadPlayerIds: [target.id, ...sellerPlayers.map(player => player.id)], transferBudget: 1_000_000 },
    ]

    let sawTransfer = false
    for (let seed = 1; seed <= 100; seed++) {
      const result = processAITransfers(players, clubs, game.currentSeason, managed.id, seed)
      const ids = result.transfers.map(transfer => transfer.playerId)
      sawTransfer ||= ids.length > 0
      expect(new Set(ids).size, `seed ${seed}: ${ids.join(', ')}`).toBe(ids.length)
    }
    expect(sawTransfer).toBe(true)
  })
})
