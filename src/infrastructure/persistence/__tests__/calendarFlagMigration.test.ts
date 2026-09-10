import { describe, expect, it } from 'vitest'
import { migrateSaveGame } from '../saveGameMigration'

describe('migrateSaveGame — kalenderflaggor på äldre ligafixtures', () => {
  it('rensar falsk Annandagen när en gammal global matchday kolliderar med dagens slot', () => {
    const migrated = migrateSaveGame({
      currentSeason: 2030,
      players: [],
      fixtures: [{
        id: 'legacy-round-8',
        season: 2030,
        roundNumber: 8,
        matchday: 14,
        date: '2030-10-17',
        isAnnandagen: true,
        isCup: false,
      }],
    })

    expect(migrated.fixtures[0].isAnnandagen).toBeUndefined()
    expect(migrated.fixtures[0].date).toBe('2030-10-17')
  })

  it('backfyller riktig annandag via serieomgång när datum saknas', () => {
    const migrated = migrateSaveGame({
      currentSeason: 2030,
      players: [],
      fixtures: [{
        id: 'legacy-round-10',
        season: 2030,
        roundNumber: 10,
        matchday: 10,
        isCup: false,
      }],
    })

    expect(migrated.fixtures[0].date).toBe('2030-12-26')
    expect(migrated.fixtures[0].isAnnandagen).toBe(true)
  })

  it('bevarar en historisk annandag vars omgångsnummer avviker men datumet är sant', () => {
    const migrated = migrateSaveGame({
      currentSeason: 2030,
      players: [],
      fixtures: [{
        id: 'legacy-real-boxing-day',
        season: 2030,
        roundNumber: 8,
        matchday: 8,
        date: '2030-12-26',
        isCup: false,
      }],
    })

    expect(migrated.fixtures[0].date).toBe('2030-12-26')
    expect(migrated.fixtures[0].isAnnandagen).toBe(true)
  })
})
