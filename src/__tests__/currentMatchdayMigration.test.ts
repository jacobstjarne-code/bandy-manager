/**
 * Tests för A1 — currentMatchday-migration och att fältet sätts korrekt.
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../infrastructure/persistence/saveGameMigration'

describe('migrateSaveGame — currentMatchday', () => {
  it('sätter currentMatchday = 1 om inga fixtures finns', () => {
    const raw = {
      id: 'test',
      version: '0.1.0',
      fixtures: [],
      pendingEvents: [],
      // currentMatchday saknas
    }
    const migrated = migrateSaveGame(raw)
    expect(migrated.currentMatchday).toBe(1)
  })

  it('deriverar currentMatchday från senaste avklarade fixture', () => {
    const raw = {
      id: 'test',
      version: '0.1.0',
      fixtures: [
        { id: 'f1', matchday: 3, status: 'completed' },
        { id: 'f2', matchday: 5, status: 'completed' },
        { id: 'f3', matchday: 7, status: 'scheduled' },
      ],
      pendingEvents: [],
    }
    const migrated = migrateSaveGame(raw)
    expect(migrated.currentMatchday).toBe(5)
  })

  it('behåller befintligt currentMatchday om det redan är satt', () => {
    const raw = {
      id: 'test',
      version: '0.1.0',
      currentMatchday: 12,
      fixtures: [
        { id: 'f1', matchday: 5, status: 'completed' },
      ],
      pendingEvents: [],
    }
    const migrated = migrateSaveGame(raw)
    expect(migrated.currentMatchday).toBe(12)
  })
})
