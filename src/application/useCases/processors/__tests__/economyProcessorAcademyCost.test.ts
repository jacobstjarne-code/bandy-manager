import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { academyOperatingCostPerRound } from '../../../../domain/services/academyService'
import { processEconomy } from '../economyProcessor'

describe('processEconomy — akademidrift', () => {
  it('använder samma nivåpris i kassaeffekt och finanslogg', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const game = { ...base, academyLevel: 'developing' as const }
    const players = game.players.filter(player => player.clubId === game.managedClubId)
    const result = processEconomy(game, [], players, 50, game.standings, 2, {}, () => 0.5)
    const basic = processEconomy({ ...game, academyLevel: 'basic' }, [], players, 50, game.standings, 2, {}, () => 0.5)
    const resultClub = result.updatedClubs.find(club => club.id === game.managedClubId)!
    const basicClub = basic.updatedClubs.find(club => club.id === game.managedClubId)!

    expect(academyOperatingCostPerRound('developing')).toBe(5_000)
    expect(result.roundFinanceLog).toContainEqual({
      round: 2,
      amount: -5_000,
      reason: 'academy',
      label: 'Akademidrift',
    })
    expect(resultClub.finances - basicClub.finances).toBe(-3_000)
  })
})
