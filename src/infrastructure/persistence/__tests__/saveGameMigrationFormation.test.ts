import { describe, it, expect } from 'vitest'
import { migrateFormationAndPress, migrateSaveGame } from '../saveGameMigration'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

/**
 * DOM_FORMATIONER_V2_2026-09-04.md §Migrering — "Regressionstest per rad i
 * tabellen." En it() per rad, ordagrant samma par som domens tabell.
 */
describe('migrateFormationAndPress — en rad per tabellrad (DOM_FORMATIONER_V2_2026-09-04.md)', () => {
  it('Low press (valfri gammal formation) → 541_hem', () => {
    expect(migrateFormationAndPress('5-3-2', 'low')).toBe('541_hem')
    expect(migrateFormationAndPress('4-3-3', 'low')).toBe('541_hem')
    expect(migrateFormationAndPress(undefined, 'low')).toBe('541_hem')
  })

  it('High press (valfri gammal formation) → 523_hog', () => {
    expect(migrateFormationAndPress('5-3-2', 'high')).toBe('523_hog')
    expect(migrateFormationAndPress('2-3-2-3', 'high')).toBe('523_hog')
    expect(migrateFormationAndPress(undefined, 'high')).toBe('523_hog')
  })

  it('Medium press + 5-3-2/3-3-4/4-2-4 → 532_tvatoppar', () => {
    expect(migrateFormationAndPress('5-3-2', 'medium')).toBe('532_tvatoppar')
    expect(migrateFormationAndPress('3-3-4', 'medium')).toBe('532_tvatoppar')
    expect(migrateFormationAndPress('4-2-4', 'medium')).toBe('532_tvatoppar')
  })

  it('Medium press + 4-3-3/3-4-3 → 532_triangel', () => {
    expect(migrateFormationAndPress('4-3-3', 'medium')).toBe('532_triangel')
    expect(migrateFormationAndPress('3-4-3', 'medium')).toBe('532_triangel')
  })

  it('Medium press + 2-3-2-3 → 532_ytterben', () => {
    expect(migrateFormationAndPress('2-3-2-3', 'medium')).toBe('532_ytterben')
  })

  it('saknad/okänd press behandlas som medium (gamla defaultnivån)', () => {
    expect(migrateFormationAndPress('4-3-3', undefined)).toBe('532_triangel')
    expect(migrateFormationAndPress(undefined, undefined)).toBe('532_tvatoppar')
  })
})

describe('migrateSaveGame — formation+press migreras för klubbar, fixtures och pending lineup', () => {
  function rawGameWithOldTactic(): unknown {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>

    // Klubb 0 (managerad): gammal press+formation.
    const clubs = raw.clubs as Record<string, unknown>[]
    clubs[0].activeTactic = { ...(clubs[0].activeTactic as object), formation: '4-3-3', press: 'medium' }
    // Klubb 1 (AI): High press ska ge 523_hog oavsett formation.
    if (clubs[1]) {
      clubs[1].activeTactic = { ...(clubs[1].activeTactic as object), formation: '2-3-2-3', press: 'high' }
    }

    // En fixture med sparad homeLineup.tactic i gammal form.
    const fixtures = raw.fixtures as Record<string, unknown>[]
    fixtures[0] = {
      ...fixtures[0],
      homeLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: { formation: '2-3-2-3', press: 'medium' } },
    }

    // En pending lineup i gammal form.
    raw.managedClubPendingLineup = { startingPlayerIds: [], benchPlayerIds: [], tactic: { formation: '5-3-2', press: 'low' } }

    return raw
  }

  it('migrerar managerad klubbs activeTactic och tar bort press', () => {
    const migrated = migrateSaveGame(rawGameWithOldTactic())
    const club0 = migrated.clubs[0]
    expect(club0.activeTactic.formation).toBe('532_triangel') // medium + 4-3-3
    expect('press' in club0.activeTactic).toBe(false)
  })

  it('migrerar AI-klubbars activeTactic likadant (samma tabell, ingen särbehandling)', () => {
    const migrated = migrateSaveGame(rawGameWithOldTactic())
    const club1 = migrated.clubs[1]
    expect(club1.activeTactic.formation).toBe('523_hog') // high, oavsett gammal formation
    expect('press' in club1.activeTactic).toBe(false)
  })

  it('migrerar en pågående fixtures homeLineup.tactic', () => {
    const migrated = migrateSaveGame(rawGameWithOldTactic())
    const fixture0 = migrated.fixtures[0]
    expect(fixture0.homeLineup?.tactic.formation).toBe('532_ytterben') // medium + 2-3-2-3
    expect(fixture0.homeLineup?.tactic && 'press' in fixture0.homeLineup.tactic).toBe(false)
  })

  it('migrerar managedClubPendingLineup.tactic', () => {
    const migrated = migrateSaveGame(rawGameWithOldTactic())
    expect(migrated.managedClubPendingLineup?.tactic.formation).toBe('541_hem') // low
    expect(migrated.managedClubPendingLineup?.tactic && 'press' in migrated.managedClubPendingLineup.tactic).toBe(false)
  })

  it('är idempotent — en redan migrerad tactic ändras inte igen vid omkörning', () => {
    const once = migrateSaveGame(rawGameWithOldTactic())
    const raw2 = JSON.parse(JSON.stringify(once))
    // Simulera en medveten formationsändring EFTER migrering.
    raw2.clubs[0].activeTactic.formation = '541_hem'
    const twice = migrateSaveGame(raw2)
    expect(twice.clubs[0].activeTactic.formation).toBe('541_hem') // orört, inte omkonverterat
  })
})
