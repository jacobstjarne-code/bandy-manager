import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import { processTransferBids } from '../transferProcessor'
import type { TransferBid } from '../../../../domain/entities/GameEvent'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

/**
 * DOM_K12_TRANSFER_TARGET_MISSED_2026-09-08: ett utgående bud som resolvar
 * rejected/expired ska skriva en `transfer_target_missed`-post — subject =
 * den jagade spelaren, subject2 = hans klubb vid budtillfället.
 */
function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  return { ...game, currentDate: '2027-09-01', ...overrides } // september — fönstret öppet
}

describe('processTransferBids — transfer_target_missed', () => {
  it('reparerar ett dubblerat inkommande bud och låter terminal status vinna', () => {
    const game = makeGame()
    const target = game.players.find(player => player.clubId === game.managedClubId)!
    const buyer = game.clubs.find(club => club.id !== game.managedClubId)!
    const pending: TransferBid = {
      id: `bid_2_${target.id}_${buyer.id}`,
      playerId: target.id,
      buyingClubId: buyer.id,
      sellingClubId: game.managedClubId,
      offerAmount: 100_000,
      offeredSalary: target.salary,
      contractYears: 3,
      direction: 'incoming',
      status: 'pending',
      createdRound: 2,
      expiresRound: 5,
    }
    const rejected: TransferBid = { ...pending, status: 'rejected', resolvedRound: 2 }
    const gameWithDuplicate = { ...game, transferBids: [rejected, pending] }

    const result = processTransferBids(gameWithDuplicate, game.players, 2, '2027-09-02', () => 0)

    expect(result.allBids.filter(bid => bid.id === pending.id)).toEqual([rejected])
    expect(result.newBids.some(bid => bid.id === pending.id)).toBe(false)
  })

  it('avslaget utgående bud (club council nej) skriver en transfer_target_missed-post', () => {
    const game = makeGame()
    const target = game.players.find(p => p.clubId !== game.managedClubId)!
    const sellingClubId = target.clubId
    // Lågt bud (ratio << 0.7 av marketValue) → resolveOutgoingBid returnerar 'rejected' deterministiskt.
    const bid: TransferBid = {
      id: 'bid_missed_1', playerId: target.id, buyingClubId: game.managedClubId, sellingClubId,
      offerAmount: 1, offeredSalary: 10_000, contractYears: 2,
      direction: 'outgoing', status: 'pending', createdRound: 4, expiresRound: 5,
    }
    const gameWithBid = { ...game, transferBids: [bid] }

    const result = processTransferBids(gameWithBid, gameWithBid.players, 5, '2027-09-08', () => 0.9)

    const entry = result.ledgerEntries.find(e => e.type === 'transfer_target_missed')
    expect(entry).toBeDefined()
    expect(entry).toMatchObject({
      type: 'transfer_target_missed',
      semanticKey: 'transfer_target_missed_bid_missed_1',
      season: game.currentSeason,
      matchday: 5,
      subject: { kind: 'player', id: target.id },
      subject2: { kind: 'club', id: sellingClubId },
      significance: 30,
      transferTargetMissed: { bidKr: 1, targetClubId: sellingClubId },
    })
    expect(entry?.subjectSnapshot?.name).toBe(`${target.firstName} ${target.lastName}`)
  })

  it('utgående bud som avbryts av att fönstret stänger (expired) skriver också en post', () => {
    const game = makeGame({ currentDate: '2027-09-01' })
    const target = game.players.find(p => p.clubId !== game.managedClubId)!
    const sellingClubId = target.clubId
    const bid: TransferBid = {
      id: 'bid_missed_2', playerId: target.id, buyingClubId: game.managedClubId, sellingClubId,
      offerAmount: 300_000, offeredSalary: 10_000, contractYears: 2,
      direction: 'outgoing', status: 'pending', createdRound: 4, expiresRound: 20,
    }
    const gameWithBid = { ...game, transferBids: [bid] }
    // Fönstret stängt (november) trots att expiresRound inte nåtts — den gren som tvingar expired.
    const result = processTransferBids(gameWithBid, gameWithBid.players, 5, '2027-11-01', () => 0.5)

    const entry = result.ledgerEntries.find(e => e.type === 'transfer_target_missed')
    expect(entry).toMatchObject({
      type: 'transfer_target_missed',
      subject: { kind: 'player', id: target.id },
      subject2: { kind: 'club', id: sellingClubId },
    })
  })

  it('loggar inte om igen nästa omgång — budet är redan terminalt', () => {
    const game = makeGame()
    const target = game.players.find(p => p.clubId !== game.managedClubId)!
    const alreadyRejected: TransferBid = {
      id: 'bid_missed_3', playerId: target.id, buyingClubId: game.managedClubId, sellingClubId: target.clubId,
      offerAmount: 1, offeredSalary: 10_000, contractYears: 2,
      direction: 'outgoing', status: 'rejected', createdRound: 4, expiresRound: 5, resolvedRound: 5,
    }
    const gameWithBid = { ...game, transferBids: [alreadyRejected] }

    const result = processTransferBids(gameWithBid, gameWithBid.players, 6, '2027-09-09', () => 0.9)
    expect(result.ledgerEntries.find(e => e.type === 'transfer_target_missed')).toBeUndefined()
  })

  it('accepterat bud skriver ingen transfer_target_missed-post', () => {
    const game = makeGame()
    const target = game.players.find(p => p.clubId !== game.managedClubId)!
    const bid: TransferBid = {
      id: 'bid_missed_4', playerId: target.id, buyingClubId: game.managedClubId, sellingClubId: target.clubId,
      offerAmount: Math.round((target.marketValue ?? 50000) * 1.3), offeredSalary: target.salary, contractYears: 2,
      direction: 'outgoing', status: 'pending', createdRound: 4, expiresRound: 5,
    }
    const gameWithBid = { ...game, transferBids: [bid] }

    const result = processTransferBids(gameWithBid, gameWithBid.players, 5, '2027-09-08', () => 0.1)
    expect(result.ledgerEntries.find(e => e.type === 'transfer_target_missed')).toBeUndefined()
  })
})
