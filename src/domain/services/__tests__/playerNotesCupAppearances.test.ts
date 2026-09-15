import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generatePlayerNotes } from '../playerNotesService'

describe('playerNotesService — cupframträdanden', () => {
  it('kallar inte en ung spelare som redan fått cupminuter för VILL MER', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
    const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
    const cupPlayer = {
      ...player,
      age: 20,
      fitness: 100,
      form: 60,
      morale: 60,
      loyaltyScore: 5,
      seasonStats: { ...player.seasonStats, gamesPlayed: 0, goals: 0, averageRating: 0 },
      seasonCupStats: { ...player.seasonStats, gamesPlayed: 1, goals: 0, averageRating: 6.5 },
    }

    expect(generatePlayerNotes([cupPlayer], game.assistantCoach!, undefined))
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ tag: 'vill-mer' })]))
  })
})
