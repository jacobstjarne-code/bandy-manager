import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { TransferBid } from '../../../../domain/entities/GameEvent'
import type { Player } from '../../../../domain/entities/Player'
import type { Club } from '../../../../domain/entities/Club'
import { executeAcceptedTransfers } from '../transferProcessor'
import { executeTransfer } from '../../../../domain/services/transferService'

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

// BETATEST_ERIK_2026-09-24 A3 — rot: executeTransfer byggde redan ett kvitto-
// inboxobjekt (storyInboxItems/fanInboxItems/receiptInboxItems) och returnerade
// det via result.inbox, men executeAcceptedTransfers (rundprocessorns VANLIGA
// köpväg — ett bud som accepteras efter väntetid, till skillnad från
// acceptTransfer-eventet i eventResolver.ts som sprider hela executeTransfer-
// resultatet) plockade bara ut .players/.clubs. Kvittot kastades tyst för
// VARJE köp som gick den vägen — inte bara de "historiska" (kapten/fanfavorit/
// legend/akademi). Detta var den faktiska rotorsaken till att Erik aldrig såg
// någon bekräftelse efter en genomförd affär.
describe('executeAcceptedTransfers — A3-kvittot når faktiskt inboxen', () => {
  function makeBuyGame(): { game: SaveGame; pending: TransferBid; accepted: TransferBid } {
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
    return { game, pending, accepted }
  }

  it('köp: kvittot finns i inboxItems med spelarnamn, säljande klubb och slutlig kostnad', () => {
    const { game, pending, accepted } = makeBuyGame()
    const result = executeAcceptedTransfers({
      game, preEventGame: game, players: game.players, clubs: game.clubs,
      resolvedBids: [accepted], prevBids: [pending], nemesisTracker: {}, nextMatchday: 4,
    })
    const receipt = result.inboxItems.find(i => i.id === 'inbox_transfer_receipt_bid1')
    expect(receipt).toBeDefined()
    expect(receipt!.title).toContain('Arne Berg')
    expect(receipt!.body).toContain('Arne Berg')
    expect(receipt!.body).toContain('Säljaren')
    expect(receipt!.body).toContain((100_000).toLocaleString('sv-SE'))
  })

  it('samma bud en andra körning (redan accepterat, inte längre pending): inget nytt kvitto — reload/återöppning dubblerar inte', () => {
    const { game, accepted } = makeBuyGame()
    // Andra körningen: prevBids visar redan 'accepted' (som efter en sparning/
    // omladdning), så wasPending är falskt och loopen ska hoppa över budet.
    const result = executeAcceptedTransfers({
      game, preEventGame: game, players: game.players, clubs: game.clubs,
      resolvedBids: [accepted], prevBids: [accepted], nemesisTracker: {}, nextMatchday: 5,
    })
    expect(result.inboxItems).toEqual([])
  })

  it('försäljning (incoming, via acceptTransfer-eventvägen): executeTransfer själv bär kvittot', () => {
    const soldPlayer = {
      id: 'p1', firstName: 'Björn', lastName: 'Ek', clubId: 'managed', salary: 10_000,
      currentAbility: 55, careerStats: { totalGames: 20 }, isHomegrown: false,
    } as unknown as Player
    const bid: TransferBid = {
      id: 'bid2', playerId: 'p1', buyingClubId: 'buyer', sellingClubId: 'managed',
      offerAmount: 50_000, offeredSalary: 10_000, contractYears: 2,
      direction: 'incoming', status: 'accepted', createdRound: 3, expiresRound: 4,
    }
    const game = {
      id: 'g1', managedClubId: 'managed', currentSeason: 2027, currentMatchday: 3,
      currentDate: '2027-01-10', players: [soldPlayer],
      clubs: [
        { id: 'managed', name: 'Managed FK', finances: 0, transferBudget: 0, squadPlayerIds: ['p1'] },
        { id: 'buyer', name: 'Köparklubben', finances: 500_000, transferBudget: 300_000, squadPlayerIds: [] },
      ] as unknown as Club[],
      transferBids: [bid], inbox: [], nemesisTracker: {}, mecenater: [],
      captainPlayerId: undefined, supporterGroup: undefined,
    } as unknown as SaveGame
    const result = executeTransfer(game, bid)
    const receipt = result.inbox.find(i => i.id === 'inbox_transfer_receipt_bid2')
    expect(receipt).toBeDefined()
    expect(receipt!.title).toContain('Björn Ek')
    expect(receipt!.body).toContain('Köparklubben')
    expect(receipt!.body).toContain((50_000).toLocaleString('sv-SE'))
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
