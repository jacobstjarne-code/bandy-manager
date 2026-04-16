import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSaveGame, loadSaveGame, listSaveGames, deleteSaveGame } from '../saveGameStorage'
import { migrateSaveGame } from '../saveGameMigration'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { createNewGame } from '../../../application/useCases/createNewGame'

// ── idb-keyval mock ───────────────────────────────────────────────────────────

const idbStore: Record<string, unknown> = {}

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => idbStore[key]),
  set: vi.fn(async (key: string, value: unknown) => { idbStore[key] = value }),
  del: vi.fn(async (key: string) => { delete idbStore[key] }),
}))

// ── localStorage mock ─────────────────────────────────────────────────────────

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
  return { ...game, id, lastSavedAt }
}

describe('saveGameStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    for (const k of Object.keys(idbStore)) delete idbStore[k]
  })

  it('saveSaveGame stores game and loadSaveGame retrieves identical object', async () => {
    const game = makeGame('save_001', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    await saveSaveGame(game)

    const loaded = await loadSaveGame('save_001')
    expect(loaded).not.toBeNull()
    expect(loaded?.id).toBe('save_001')
    expect(loaded?.managerName).toBe('Test Manager')
    expect(loaded?.managedClubId).toBe('club_forsbacka')
  })

  it('listSaveGames returns summaries sorted by lastSavedAt (newest first)', async () => {
    const game1 = makeGame('save_001', 'club_forsbacka', '2025-10-01T08:00:00.000Z')
    const game2 = makeGame('save_002', 'club_soderfors', '2025-10-02T09:00:00.000Z')

    await saveSaveGame(game1)
    await saveSaveGame(game2)

    const summaries = listSaveGames()
    expect(summaries.length).toBe(2)
    expect(summaries[0].id).toBe('save_002') // newer first
    expect(summaries[1].id).toBe('save_001')
  })

  it('deleteSaveGame removes game and updates index', async () => {
    const game = makeGame('save_001', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    await saveSaveGame(game)
    await deleteSaveGame('save_001')

    const loaded = await loadSaveGame('save_001')
    expect(loaded).toBeNull()

    const summaries = listSaveGames()
    expect(summaries.length).toBe(0)
  })

  it('loadSaveGame returns null for non-existent id', async () => {
    const result = await loadSaveGame('save_nonexistent')
    expect(result).toBeNull()
  })

  it('listSaveGames returns [] when no saves exist', () => {
    const summaries = listSaveGames()
    expect(summaries).toEqual([])
  })

  it('saving two games lists both in index', async () => {
    const game1 = makeGame('save_001', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    const game2 = makeGame('save_002', 'club_soderfors', '2025-10-03T10:00:00.000Z')

    await saveSaveGame(game1)
    await saveSaveGame(game2)

    const summaries = listSaveGames()
    expect(summaries.length).toBe(2)
    const ids = summaries.map(s => s.id)
    expect(ids).toContain('save_001')
    expect(ids).toContain('save_002')
  })

  it('deleting one of two games leaves the other intact', async () => {
    const game1 = makeGame('save_001', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    const game2 = makeGame('save_002', 'club_soderfors', '2025-10-03T10:00:00.000Z')

    await saveSaveGame(game1)
    await saveSaveGame(game2)
    await deleteSaveGame('save_001')

    const summaries = listSaveGames()
    expect(summaries.length).toBe(1)
    expect(summaries[0].id).toBe('save_002')

    const loaded1 = await loadSaveGame('save_001')
    expect(loaded1).toBeNull()

    const loaded2 = await loadSaveGame('save_002')
    expect(loaded2).not.toBeNull()
    expect(loaded2?.id).toBe('save_002')
  })
})

describe('migrateSaveGame', () => {
  it('adds missing communityActivities flags to old save', () => {
    const oldSave = {
      communityActivities: { kiosk: 'basic', lottery: 'none', bandyplay: false, functionaries: true, julmarknad: false },
      players: [],
    }
    const migrated = migrateSaveGame(oldSave)
    expect((migrated.communityActivities as any).socialMedia).toBe(false)
    expect((migrated.communityActivities as any).vipTent).toBe(false)
  })

  it('adds missing top-level fields', () => {
    const oldSave = { players: [], communityActivities: {} }
    const migrated = migrateSaveGame(oldSave)
    expect(migrated.fanMood).toBe(50)
    expect(migrated.boardPatience).toBe(70)
    expect(migrated.pendingEvents).toEqual([])
    expect(migrated.communityStanding).toBe(50)
  })

  it('does not overwrite existing fields', () => {
    const oldSave = { fanMood: 75, boardPatience: 30, players: [], communityActivities: {} }
    const migrated = migrateSaveGame(oldSave)
    expect(migrated.fanMood).toBe(75)
    expect(migrated.boardPatience).toBe(30)
  })

  it('adds missing player seasonStats fields', () => {
    const oldSave = {
      players: [{ id: 'p1', seasonStats: { gamesPlayed: 5, goals: 2, assists: 1, cornerGoals: 0, yellowCards: 0, redCards: 0, averageRating: 6.5 } }],
      communityActivities: {},
    }
    const migrated = migrateSaveGame(oldSave)
    const player = migrated.players[0] as any
    expect(player.seasonStats.minutesPlayed).toBe(0)
    expect(player.seasonStats.penaltyGoals).toBe(0)
    expect(player.seasonStats.suspensions).toBe(0)
  })

  it('sets version to current version', () => {
    const oldSave = { version: '0.1.0', players: [], communityActivities: {} }
    const migrated = migrateSaveGame(oldSave)
    expect(migrated.version).toBe('0.2.0')
  })
})
