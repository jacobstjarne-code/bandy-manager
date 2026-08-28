import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processEconomy } from '../economyProcessor'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

/**
 * Ruling C (2026-08-28): cup_prize's financeLog emission was fixed in 9d8c0868
 * (prizeMoneyByClub was applied via applyFinanceChange without ever calling
 * appendFinanceLog) but shipped with zero test coverage. This closes that gap —
 * verifies the emission end-to-end, not just by code reading.
 */
function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
}

describe('processEconomy — cup_prize emission', () => {
  it('logs a cup_prize financeLog entry with the correct amount for the managed club', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)

    const result = processEconomy(
      game,
      [],
      managedPlayers,
      50,
      [],
      5,
      { [game.managedClubId]: 30000 },
      () => 0.5,
    )

    const cupPrizeEntries = result.roundFinanceLog.filter(e => e.reason === 'cup_prize')
    expect(cupPrizeEntries).toHaveLength(1)
    expect(cupPrizeEntries[0].amount).toBe(30000)
    expect(cupPrizeEntries[0].round).toBe(5)

    // Isolate the prize's cash effect from the same round's ordinary wages/income
    // (identical rand seed → identical everything else) by diffing against a
    // zero-prize run of the same round.
    const baseline = processEconomy(game, [], managedPlayers, 50, [], 5, {}, () => 0.5)
    const managedClubWithPrize = result.updatedClubs.find(c => c.id === game.managedClubId)!
    const managedClubBaseline = baseline.updatedClubs.find(c => c.id === game.managedClubId)!
    expect(managedClubWithPrize.finances - managedClubBaseline.finances).toBe(30000)
  })

  it('never logs a cup_prize entry for an AI club (managed-club-only, matches the other income categories)', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
    const aiClubId = game.clubs.find(c => c.id !== game.managedClubId)!.id

    const result = processEconomy(
      game,
      [],
      managedPlayers,
      50,
      [],
      5,
      { [aiClubId]: 50000 },
      () => 0.5,
    )

    expect(result.roundFinanceLog.filter(e => e.reason === 'cup_prize')).toHaveLength(0)

    const baseline = processEconomy(game, [], managedPlayers, 50, [], 5, {}, () => 0.5)
    const aiClubWithPrize = result.updatedClubs.find(c => c.id === aiClubId)!
    const aiClubBaseline = baseline.updatedClubs.find(c => c.id === aiClubId)!
    expect(aiClubWithPrize.finances - aiClubBaseline.finances).toBe(50000)
  })

  it('applies zero-amount prize entries as a no-op (no financeLog spam)', () => {
    const game = makeGame()
    const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)

    const result = processEconomy(
      game,
      [],
      managedPlayers,
      50,
      [],
      5,
      { [game.managedClubId]: 0 },
      () => 0.5,
    )

    expect(result.roundFinanceLog.filter(e => e.reason === 'cup_prize')).toHaveLength(0)
  })
})
