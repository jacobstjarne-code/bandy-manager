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

describe('liggare-k9-doda-typer — transfer_signed/transfer_sold significance-formeln + ny transfer_sold-producent', () => {
  function makeSquad(salaries: number[]): Player[] {
    return salaries.map((salary, i) => ({
      id: `squad_${i}`, firstName: 'X', lastName: `${i}`, clubId: 'managed', salary,
      currentAbility: 50, careerStats: { totalGames: 0 }, isHomegrown: false,
    } as unknown as Player))
  }

  it('transfer_signed: significance 35 när avgiften är under truppens medianlön×12', () => {
    const boughtPlayer = { id: 'p1', firstName: 'Arne', lastName: 'Berg', clubId: 'seller', salary: 10_000, currentAbility: 60, careerStats: { totalGames: 0 }, isHomegrown: false } as unknown as Player
    const squad = makeSquad([10_000, 12_000, 15_000]) // median 12_000 × 12 = 144_000
    const pending: TransferBid = { id: 'bid1', playerId: 'p1', buyingClubId: 'managed', sellingClubId: 'seller', offerAmount: 100_000, offeredSalary: 14_000, contractYears: 3, direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4 }
    const accepted: TransferBid = { ...pending, status: 'accepted', resolvedRound: 4 }
    const game = { id: 'g1', managedClubId: 'managed', currentSeason: 2027, currentMatchday: 3, currentDate: '2027-01-10', players: [boughtPlayer, ...squad], clubs: [], transferBids: [pending], inbox: [], nemesisTracker: {}, mecenater: [] } as unknown as SaveGame

    const result = executeAcceptedTransfers({ game, preEventGame: game, players: game.players, clubs: [], resolvedBids: [accepted], prevBids: [pending], nemesisTracker: {}, nextMatchday: 4 })
    expect(result.ledgerEntries.find(e => e.type === 'transfer_signed')?.significance).toBe(35)
  })

  it('transfer_signed: significance 50 när avgiften överstiger truppens medianlön×12', () => {
    const boughtPlayer = { id: 'p1', firstName: 'Arne', lastName: 'Berg', clubId: 'seller', salary: 10_000, currentAbility: 60, careerStats: { totalGames: 0 }, isHomegrown: false } as unknown as Player
    const squad = makeSquad([10_000, 12_000, 15_000]) // median 12_000 × 12 = 144_000
    const pending: TransferBid = { id: 'bid1', playerId: 'p1', buyingClubId: 'managed', sellingClubId: 'seller', offerAmount: 200_000, offeredSalary: 14_000, contractYears: 3, direction: 'outgoing', status: 'pending', createdRound: 3, expiresRound: 4 }
    const accepted: TransferBid = { ...pending, status: 'accepted', resolvedRound: 4 }
    const game = { id: 'g1', managedClubId: 'managed', currentSeason: 2027, currentMatchday: 3, currentDate: '2027-01-10', players: [boughtPlayer, ...squad], clubs: [], transferBids: [pending], inbox: [], nemesisTracker: {}, mecenater: [] } as unknown as SaveGame

    const result = executeAcceptedTransfers({ game, preEventGame: game, players: game.players, clubs: [], resolvedBids: [accepted], prevBids: [pending], nemesisTracker: {}, nextMatchday: 4 })
    expect(result.ledgerEntries.find(e => e.type === 'transfer_signed')?.significance).toBe(50)
  })

  it('transfer_sold: skriver en post för utgående försäljning (tidigare helt utan producent)', () => {
    const soldPlayer = { id: 'p1', firstName: 'Björn', lastName: 'Ek', clubId: 'managed', salary: 10_000, currentAbility: 55, careerStats: { totalGames: 20 }, isHomegrown: false } as unknown as Player
    const pending: TransferBid = { id: 'bid2', playerId: 'p1', buyingClubId: 'buyer', sellingClubId: 'managed', offerAmount: 50_000, offeredSalary: 10_000, contractYears: 2, direction: 'incoming', status: 'pending', createdRound: 3, expiresRound: 4 }
    const accepted: TransferBid = { ...pending, status: 'accepted', resolvedRound: 4 }
    const game = { id: 'g1', managedClubId: 'managed', currentSeason: 2027, currentMatchday: 3, currentDate: '2027-01-10', players: [soldPlayer], clubs: [{ id: 'buyer', name: 'Köparklubben' } as unknown as Club], captainPlayerId: undefined, supporterGroup: undefined, transferBids: [pending], inbox: [], nemesisTracker: {}, mecenater: [] } as unknown as SaveGame

    const result = executeAcceptedTransfers({ game, preEventGame: game, players: game.players, clubs: game.clubs, resolvedBids: [accepted], prevBids: [pending], nemesisTracker: {}, nextMatchday: 4 })
    const entry = result.ledgerEntries.find(e => e.type === 'transfer_sold')
    expect(entry).toEqual(expect.objectContaining({
      type: 'transfer_sold', semanticKey: 'transfer_sold:bid2', season: 2027, matchday: 4,
      subject: { kind: 'player', id: 'p1' }, subject2: { kind: 'club', id: 'buyer' }, madeByPlayer: true,
    }))
  })
})
