import { describe, expect, it } from 'vitest'
import { calculateWageBudget } from '../../../domain/services/wageBudgetService'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'

describe('seasonEndProcessor — lönebudgeten följer nästa säsongs trupp', () => {
  it('räknar om efter hela sommarens truppförändringar', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const game = {
      ...base,
      clubs: base.clubs.map(club =>
        club.id === base.managedClubId ? { ...club, wageBudget: 1 } : club
      ),
      players: base.players.map(player =>
        player.clubId === base.managedClubId
          ? { ...player, salary: player.salary + 7_777 }
          : player
      ),
    }

    const result = handleSeasonEnd(game, 1)
    const managedClub = result.game.clubs.find(club => club.id === result.game.managedClubId)

    expect(managedClub?.wageBudget).toBe(
      calculateWageBudget(result.game.players, result.game.managedClubId),
    )
    expect(managedClub?.wageBudget).not.toBe(1)
  })
})
