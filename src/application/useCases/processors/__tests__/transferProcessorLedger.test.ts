import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { TransferBid } from '../../../../domain/entities/GameEvent'
import type { Player } from '../../../../domain/entities/Player'
import type { Club } from '../../../../domain/entities/Club'
import { executeAcceptedTransfers } from '../transferProcessor'

describe('executeAcceptedTransfers — transferminne', () => {
  it('skriver eget genomfört köp som transfer_signed utan att blanda sig i beslutsliggaren', () => {
    const player = {
      id: 'p1', firstName: 'Arne', lastName: 'Berg', clubId: 'seller', salary: 10_000,
      currentAbility: 60, careerStats: { totalGames: 0 }, isHomegrown: false,
    } as unknown as Player
    const buyer = {
      id: 'managed', name: 'Köparen', finances: 500_000, transferBudget: 300_000,
      squadPlayerIds: [],
    } as unknown as Club
    const seller = {
      id: 'seller', name: 'Säljaren', finances: 300_000, transferBudget: 100_000,
      squadPlayerIds: ['p1'],
    } as unknown as Club
    const pending: TransferBid = {
      id: 'bid1', playerId: 'p1', buyingClubId: 'managed', sellingClubId: 'seller',
      offerAmount: 100_000, offeredSalary: 14_000, contractYears: 3,
      direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4,
    }
    const accepted: TransferBid = { ...pending, status: 'accepted', resolvedRound: 4 }
    const game = {
      id: 'g1', managedClubId: 'managed', currentSeason: 2027, currentMatchday: 3,
      currentDate: '2027-01-10', players: [player], clubs: [buyer, seller],
      transferBids: [pending], inbox: [], nemesisTracker: {}, mecenater: [],
    } as unknown as SaveGame

    const result = executeAcceptedTransfers({
      game,
      preEventGame: game,
      players: game.players,
      clubs: game.clubs,
      resolvedBids: [accepted],
      prevBids: [pending],
      nemesisTracker: {},
      nextMatchday: 4,
    })

    expect(result.ledgerEntries).toEqual([expect.objectContaining({
      type: 'transfer_signed',
      semanticKey: 'transfer_signed:bid1',
      season: 2027,
      matchday: 4,
      subject: { kind: 'player', id: 'p1' },
      madeByPlayer: true,
    })])
  })
})
