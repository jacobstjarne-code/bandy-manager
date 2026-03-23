import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSaveGame, loadSaveGame, listSaveGames, deleteSaveGame } from '../saveGameStorage'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { createNewGame } from '../../../application/useCases/createNewGame'

// In-memory localStorage mock that works reliably in all environments
function createLocalStorageMock() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
  }
}

const localStorageMock = createLocalStorageMock()
vi.stubGlobal('localStorage', localStorageMock)

function makeGame(id: string, managedClubId: string, lastSavedAt: string): SaveGame {
  const game = createNewGame({ managerName: 'Test Manager', clubId: managedClubId, season: 2025, seed: 1 })
  return {
    ...game,
    id,
    lastSavedAt,
  }
}

describe('saveGameStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('saveSaveGame stores game and loadSaveGame retrieves identical object', () => {
    const game = makeGame('save_001', 'club_sandviken', '2025-10-01T10:00:00.000Z')
    saveSaveGame(game)

    const loaded = loadSaveGame('save_001')
    expect(loaded).not.toBeNull()
    expect(loaded?.id).toBe('save_001')
    expect(loaded?.managerName).toBe('Test Manager')
    expect(loaded?.managedClubId).toBe('club_sandviken')
  })

  it('listSaveGames returns summaries sorted by lastSavedAt (newest first)', () => {
    const game1 = makeGame('save_001', 'club_sandviken', '2025-10-01T08:00:00.000Z')
    const game2 = makeGame('save_002', 'club_sirius', '2025-10-02T09:00:00.000Z')

    saveSaveGame(game1)
    saveSaveGame(game2)

    const summaries = listSaveGames()
    expect(summaries.length).toBe(2)
    expect(summaries[0].id).toBe('save_002') // newer first
    expect(summaries[1].id).toBe('save_001')
  })

  it('deleteSaveGame removes game and updates index', () => {
    const game = makeGame('save_001', 'club_sandviken', '2025-10-01T10:00:00.000Z')
    saveSaveGame(game)
    deleteSaveGame('save_001')

    const loaded = loadSaveGame('save_001')
    expect(loaded).toBeNull()

    const summaries = listSaveGames()
    expect(summaries.length).toBe(0)
  })

  it('loadSaveGame returns null for non-existent id', () => {
    const result = loadSaveGame('save_nonexistent')
    expect(result).toBeNull()
  })

  it('listSaveGames returns [] when no saves exist', () => {
    const summaries = listSaveGames()
    expect(summaries).toEqual([])
  })

  it('saving two games lists both in index', () => {
    const game1 = makeGame('save_001', 'club_sandviken', '2025-10-01T10:00:00.000Z')
    const game2 = makeGame('save_002', 'club_sirius', '2025-10-03T10:00:00.000Z')

    saveSaveGame(game1)
    saveSaveGame(game2)

    const summaries = listSaveGames()
    expect(summaries.length).toBe(2)
    const ids = summaries.map(s => s.id)
    expect(ids).toContain('save_001')
    expect(ids).toContain('save_002')
  })

  it('deleting one of two games leaves the other intact', () => {
    const game1 = makeGame('save_001', 'club_sandviken', '2025-10-01T10:00:00.000Z')
    const game2 = makeGame('save_002', 'club_sirius', '2025-10-03T10:00:00.000Z')

    saveSaveGame(game1)
    saveSaveGame(game2)
    deleteSaveGame('save_001')

    const summaries = listSaveGames()
    expect(summaries.length).toBe(1)
    expect(summaries[0].id).toBe('save_002')

    const loaded1 = loadSaveGame('save_001')
    expect(loaded1).toBeNull()

    const loaded2 = loadSaveGame('save_002')
    expect(loaded2).not.toBeNull()
    expect(loaded2?.id).toBe('save_002')
  })
})
