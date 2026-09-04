import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { migrateSaveGame } from '../saveGameMigration'

// DOM_PATRON_MECENAT_LAST_2026-09-02.md (Jacobs dom) — patron.id är nytt;
// äldre saves saknar det och behöver ett stabilt, deterministiskt id
// backfyllt vid inläsning (namnbaserat, ingen säsong sparad för en
// befintlig patron).
describe('migrateSaveGame — patron.id', () => {
  it('backfyller ett namnbaserat id när patronen saknar det', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.patron = { name: 'Karl Hedin', business: 'AB Test', influence: 50, happiness: 60, contribution: 100000, isActive: true }

    const migrated = migrateSaveGame(raw)
    expect(migrated.patron?.id).toBe('patron_karl_hedin')
  })

  it('rör inte ett redan satt id', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.patron = { id: 'patron_original', name: 'Karl Hedin', business: 'AB Test', influence: 50, happiness: 60, contribution: 100000, isActive: true }

    const migrated = migrateSaveGame(raw)
    expect(migrated.patron?.id).toBe('patron_original')
  })

  it('ingen patron: tyst no-op, ingen krasch', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    delete raw.patron

    expect(() => migrateSaveGame(raw)).not.toThrow()
    expect(migrateSaveGame(raw).patron).toBeUndefined()
  })

  it('backfyller introduktionen från durabel eventhistorik men inte från enbart isActive', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const unresolved = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    unresolved.patron = { id: 'p', name: 'P', business: 'B', influence: 50, happiness: 60, contribution: 1, isActive: true }
    unresolved.resolvedEventIds = []
    expect(migrateSaveGame(unresolved).patron?.introducedSeason).toBeUndefined()

    const resolved = JSON.parse(JSON.stringify(unresolved)) as Record<string, unknown>
    resolved.resolvedEventIds = [`patron_intro_${game.currentSeason}`]
    expect(migrateSaveGame(resolved).patron?.introducedSeason).toBe(game.currentSeason)
  })
})
