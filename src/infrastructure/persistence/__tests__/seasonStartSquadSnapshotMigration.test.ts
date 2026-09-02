import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { migrateSaveGame, CURRENT_SAVE_VERSION } from '../saveGameMigration'

function legacyWithoutSnapshot(matchday: number) {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 17 })
  const { seasonStartSquadSnapshot: _snapshot, ...legacy } = game
  return { ...legacy, currentMatchday: matchday, version: '0.3.7' }
}

describe('seasonStartSquadSnapshot-migrering', () => {
  it('backfyller snapshot vid exakt säsongsstart, när medlemskapet är belagt', () => {
    const migrated = migrateSaveGame(legacyWithoutSnapshot(0))
    const expectedPlayers = migrated.players
      .filter(player => player.clubId === migrated.managedClubId)
      .map(player => player.id)
      .sort()

    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated.seasonStartSquadSnapshot?.season).toBe(migrated.currentSeason)
    expect(migrated.seasonStartSquadSnapshot?.clubId).toBe(migrated.managedClubId)
    expect(migrated.seasonStartSquadSnapshot?.players.map(player => player.playerId)).toEqual(expectedPlayers)
  })

  it('gissar inte vilka som startade i klubben mitt i en legacy-säsong', () => {
    const migrated = migrateSaveGame(legacyWithoutSnapshot(8))
    expect(migrated.seasonStartSquadSnapshot).toBeUndefined()
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
  })
})
