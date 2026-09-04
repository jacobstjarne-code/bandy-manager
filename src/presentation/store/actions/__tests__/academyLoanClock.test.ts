import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { academyActions } from '../academyActions'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

describe('academyActions.loanOutPlayer — kanonisk matchday-klocka', () => {
  it('startar från currentMatchday även när ingen ligafixtur är färdigspelad', () => {
    let game: SaveGame | null = {
      ...createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 }),
      currentMatchday: 9,
    }
    const player = game.players.find(item => item.clubId === game!.managedClubId && item.age <= 23)!
    const get = () => ({ game })
    const set = (partial: Partial<{ game: SaveGame | null }>) => {
      if ('game' in partial) game = partial.game ?? null
    }

    const result = academyActions(get, set).loanOutPlayer(player.id, 'Testklubben', 4)

    expect(result.success).toBe(true)
    expect(game?.loanDeals?.[0]).toMatchObject({ startRound: 9, endRound: 13, totalMatches: 4 })
  })
})
