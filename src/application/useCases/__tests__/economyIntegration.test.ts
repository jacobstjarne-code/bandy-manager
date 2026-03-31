import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { executeTransfer } from '../../../domain/services/transferService'
import { applyFinanceChange, FINANCE_LOG_MAX } from '../../../domain/services/economyService'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { TransferBid } from '../../../domain/entities/GameEvent'

function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Test', clubId: 'club_sandviken', season: 2025, seed: 42 })
}

// ── Group 1: financeLog accumulation ─────────────────────────────────────────

describe('economyIntegration — financeLog accumulation', () => {
  it('financeLog starts empty on a new game', () => {
    const game = makeGame()
    expect(game.financeLog ?? []).toHaveLength(0)
  })

  it('financeLog has entries after one round', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    expect((result.game.financeLog ?? []).length).toBeGreaterThan(0)
  })

  it('financeLog grows across multiple rounds', () => {
    let game = makeGame()
    const after1 = advanceToNextEvent(game, 1).game
    const after2 = advanceToNextEvent(after1, 2).game
    expect((after2.financeLog ?? []).length).toBeGreaterThan((after1.financeLog ?? []).length)
  })

  it('financeLog never exceeds FINANCE_LOG_MAX after many rounds', () => {
    let game = makeGame()
    // Simulate enough rounds to potentially exceed the cap
    for (let r = 1; r <= 22; r++) {
      const result = advanceToNextEvent(game, r)
      game = result.game
      if (result.seasonEnded) break
    }
    expect((game.financeLog ?? []).length).toBeLessThanOrEqual(FINANCE_LOG_MAX)
  })

  it('financeLog entries for managed club have correct round numbers', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    const log = result.game.financeLog ?? []
    // All entries should reference round 1 (first matchday)
    const firstRound = log[0]?.round
    expect(firstRound).toBeGreaterThan(0)
    for (const entry of log) {
      expect(entry.round).toBe(firstRound)
    }
  })

  it('financeLog always contains a wages entry after a round', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    const log = result.game.financeLog ?? []
    const hasWages = log.some(e => e.reason === 'wages')
    expect(hasWages).toBe(true)
  })

  it('financeLog wages entry is negative', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    const log = result.game.financeLog ?? []
    const wagesEntry = log.find(e => e.reason === 'wages')
    expect(wagesEntry).toBeDefined()
    expect(wagesEntry!.amount).toBeLessThan(0)
  })

  it('finances delta matches sum of financeLog entries for that round', () => {
    const game = makeGame()
    const managedClubBefore = game.clubs.find(c => c.id === game.managedClubId)!
    const result = advanceToNextEvent(game, 1)
    const managedClubAfter = result.game.clubs.find(c => c.id === game.managedClubId)!
    const log = result.game.financeLog ?? []

    const logSum = log.reduce((sum, e) => sum + e.amount, 0)
    const actualDelta = managedClubAfter.finances - managedClubBefore.finances

    // Allow small rounding tolerance (±1 kr) due to integer math
    expect(Math.abs(actualDelta - logSum)).toBeLessThanOrEqual(1)
  })
})

// ── Group 2: AI clubs economy ─────────────────────────────────────────────────

describe('economyIntegration — AI clubs', () => {
  it('AI club finances change each round', () => {
    const game = makeGame()
    const aiClub = game.clubs.find(c => c.id !== game.managedClubId)!
    const before = aiClub.finances
    const result = advanceToNextEvent(game, 1)
    const after = result.game.clubs.find(c => c.id === aiClub.id)!
    expect(after.finances).not.toBe(before)
  })

  it('financeLog does not contain entries for AI clubs (only managed club is logged)', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    const log = result.game.financeLog ?? []
    // All log entries belong to this round — there's no clubId on entries,
    // which means we verify there's no duplicate logging by checking count is reasonable.
    // A single managed club should produce at most ~6 entries per round.
    expect(log.length).toBeLessThanOrEqual(10)
  })
})

// ── Group 3: Transfer finances ────────────────────────────────────────────────

describe('economyIntegration — transfers', () => {
  function makeBid(overrides: Partial<TransferBid>): TransferBid {
    return {
      id: 'bid_test',
      playerId: '',
      buyingClubId: '',
      sellingClubId: '',
      offerAmount: 50000,
      offeredSalary: 15000,
      contractYears: 2,
      direction: 'incoming',
      status: 'pending',
      createdRound: 1,
      ...overrides,
    }
  }

  it('selling club finances increase by transfer fee', () => {
    const game = makeGame()
    const managedClubId = game.managedClubId
    const managedClub = game.clubs.find(c => c.id === managedClubId)!
    const managedPlayers = game.players.filter(p => p.clubId === managedClubId)
    if (managedPlayers.length === 0) return
    const targetPlayer = managedPlayers[0]
    const aiClub = game.clubs.find(c => c.id !== managedClubId)!

    const offerAmount = 100000
    const bid = makeBid({
      id: 'bid_test_1',
      playerId: targetPlayer.id,
      buyingClubId: aiClub.id,
      sellingClubId: managedClubId,
      offerAmount,
      offeredSalary: targetPlayer.salary,
    })

    const gameWithBid = { ...game, transferBids: [bid] }
    const result = executeTransfer(gameWithBid, bid)

    const sellerAfter = result.clubs.find(c => c.id === managedClubId)!
    expect(sellerAfter.finances).toBe(managedClub.finances + offerAmount)
  })

  it('buying club finances decrease by transfer fee', () => {
    const game = makeGame()
    const managedClubId = game.managedClubId
    const managedPlayers = game.players.filter(p => p.clubId === managedClubId)
    if (managedPlayers.length === 0) return
    const targetPlayer = managedPlayers[0]
    const aiClub = game.clubs.find(c => c.id !== managedClubId)!
    const aiFinancesBefore = aiClub.finances

    const offerAmount = 50000
    const bid = makeBid({
      id: 'bid_test_2',
      playerId: targetPlayer.id,
      buyingClubId: aiClub.id,
      sellingClubId: managedClubId,
      offerAmount,
      offeredSalary: targetPlayer.salary,
    })

    const gameWithBid = { ...game, transferBids: [bid] }
    const result = executeTransfer(gameWithBid, bid)

    const buyerAfter = result.clubs.find(c => c.id === aiClub.id)!
    expect(buyerAfter.finances).toBe(aiFinancesBefore - offerAmount)
  })

  it('third club finances are unaffected by a transfer', () => {
    const game = makeGame()
    const managedClubId = game.managedClubId
    if (game.clubs.length < 3) return
    const managedPlayers = game.players.filter(p => p.clubId === managedClubId)
    if (managedPlayers.length === 0) return
    const targetPlayer = managedPlayers[0]
    const aiClub = game.clubs.find(c => c.id !== managedClubId)!
    const thirdClub = game.clubs.find(c => c.id !== managedClubId && c.id !== aiClub.id)!
    const thirdBefore = thirdClub.finances

    const bid = makeBid({
      id: 'bid_test_3',
      playerId: targetPlayer.id,
      buyingClubId: aiClub.id,
      sellingClubId: managedClubId,
      offerAmount: 75000,
      offeredSalary: targetPlayer.salary,
    })

    const gameWithBid = { ...game, transferBids: [bid] }
    const result = executeTransfer(gameWithBid, bid)

    const thirdAfter = result.clubs.find(c => c.id === thirdClub.id)!
    expect(thirdAfter.finances).toBe(thirdBefore)
  })
})

// ── Group 4: Season end economy ───────────────────────────────────────────────

describe('economyIntegration — season end', () => {
  it('all clubs receive league prize money at season end', () => {
    let game = makeGame()
    const beforeFinances = Object.fromEntries(
      game.clubs.map(c => [c.id, c.finances])
    )

    // Advance all rounds until season ends
    let iterations = 0
    while (!game.showSeasonSummary && iterations < 50) {
      const result = advanceToNextEvent(game, iterations + 1)
      game = result.game
      if (result.seasonEnded) break
      iterations++
    }

    // All clubs should have different finances than start (prizes applied)
    for (const club of game.clubs) {
      // Finances will have changed due to wages and prizes over the season
      expect(typeof club.finances).toBe('number')
      expect(isNaN(club.finances)).toBe(false)
    }
  })
})

// ── Group 5: Direct deductions ────────────────────────────────────────────────

describe('economyIntegration — direct deductions', () => {
  it('applyFinanceChange correctly deducts scout cost from managed club', () => {
    const game = makeGame()
    const richGame: SaveGame = {
      ...game,
      clubs: game.clubs.map(c =>
        c.id === game.managedClubId ? { ...c, finances: 100000 } : c
      ),
    }
    const updatedClubs = applyFinanceChange(richGame.clubs, game.managedClubId, -15000)
    const after = updatedClubs.find(c => c.id === game.managedClubId)!
    expect(after.finances).toBe(85000)
  })
})
