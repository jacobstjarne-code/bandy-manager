import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { migrateSaveGame } from '../saveGameMigration'

// tenure-falt-joinedclubseason (DOM 2026-09-03, Jacob): äldre saves saknar
// joinedClubSeason. Backfyllningen är en APPROXIMATION (currentSeason -
// careerStats.seasonsPlayed), inte en rekonstruktion av faktiska klubbyten.
describe('migrateSaveGame — joinedClubSeason', () => {
  it('backfyller en approximation ur careerStats.seasonsPlayed när fältet saknas', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.currentSeason = 2025
    raw.players = (raw.players as Array<Record<string, unknown>>).map(p => {
      delete p.joinedClubSeason
      p.careerStats = { ...(p.careerStats as Record<string, unknown>), seasonsPlayed: 3 }
      return p
    })

    const migrated = migrateSaveGame(raw)
    for (const p of migrated.players) {
      expect(p.joinedClubSeason).toBe(2025 - 3)
    }
  })

  it('rör inte ett redan satt joinedClubSeason', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.currentSeason = 2025
    const players = raw.players as Array<Record<string, unknown>>
    players[0].joinedClubSeason = 2019
    players[0].careerStats = { ...(players[0].careerStats as Record<string, unknown>), seasonsPlayed: 3 }

    const migrated = migrateSaveGame(raw)
    expect(migrated.players[0].joinedClubSeason).toBe(2019)
  })

  it('saknad careerStats.seasonsPlayed faller tillbaka på 0 (helt ny spelare-antagande), inte en krasch', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.currentSeason = 2025
    const players = raw.players as Array<Record<string, unknown>>
    delete players[0].joinedClubSeason
    delete players[0].careerStats

    expect(() => migrateSaveGame(raw)).not.toThrow()
    const migrated = migrateSaveGame(raw)
    expect(migrated.players[0].joinedClubSeason).toBe(2025)
  })
})
