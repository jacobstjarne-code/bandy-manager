import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSaveGame, loadSaveGame, listSaveGames, deleteSaveGame, snapshotSave, listSaveSnapshots, loadSaveSnapshot } from '../saveGameStorage'
import { migrateSaveGame, CURRENT_SAVE_VERSION } from '../saveGameMigration'
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

// Global, inte bara inuti describe('saveGameStorage') — annars läcker
// idbStore (och därmed snapshot-index:et) mellan alla describe-block i
// filen, eftersom beforeEach i Vitest är scopeat till sin egen describe.
beforeEach(() => {
  localStorageMock.clear()
  for (const k of Object.keys(idbStore)) delete idbStore[k]
})

describe('saveGameStorage', () => {

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

describe('snapshotSave / listSaveSnapshots / loadSaveSnapshot — U7 (SLUTTEST_KO.md, 2026-08-17)', () => {
  it('en snapshot går att lista och läsa tillbaka', async () => {
    const game = makeGame('save_snap1', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    await snapshotSave('pre_newgame', game)

    const snapshots = await listSaveSnapshots()
    expect(snapshots.length).toBe(1)
    expect(snapshots[0].reason).toBe('pre_newgame')

    const restored = await loadSaveSnapshot(snapshots[0].key)
    expect(restored?.id).toBe('save_snap1')
  })

  it('rotation: fler än 2 snapshots behåller bara de 2 senaste', async () => {
    const g1 = makeGame('s1', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    const g2 = makeGame('s2', 'club_forsbacka', '2025-10-02T10:00:00.000Z')
    const g3 = makeGame('s3', 'club_forsbacka', '2025-10-03T10:00:00.000Z')

    await snapshotSave('pre_newgame', g1)
    await snapshotSave('pre_newgame', g2)
    await snapshotSave('pre_newgame', g3)

    const snapshots = await listSaveSnapshots()
    expect(snapshots.length).toBe(2)
    // Den äldsta (g1) ska vara borta — varken listad eller läsbar.
    const restoredIds = await Promise.all(snapshots.map(s => loadSaveSnapshot(s.key).then(g => g?.id)))
    expect(restoredIds).not.toContain('s1')
    expect(restoredIds).toContain('s2')
    expect(restoredIds).toContain('s3')
  })

  it('loadSaveSnapshot returnerar null för en okänd nyckel', async () => {
    expect(await loadSaveSnapshot('bandy_snapshot_okand_123_0')).toBeNull()
  })
})

describe('loadSaveGame — snapshot före migrering (U7)', () => {
  it('tar en pre_migration-snapshot av rådatan innan migreringen appliceras', async () => {
    const game = makeGame('save_migtest', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    await saveSaveGame(game)

    await loadSaveGame('save_migtest')

    const snapshots = await listSaveSnapshots()
    expect(snapshots.some(s => s.reason === 'pre_migration')).toBe(true)
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
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
  })

  // SeasonSummary.id (2026-08-22): förutsättning för delbarhet — gamla saves
  // saknar fältet, migrationen backfyller det med samma formel som
  // seasonSummaryService.ts använder vid genereringstillfället.
  it('backfills SeasonSummary.id for old saves that predate the field', () => {
    const oldSave = {
      version: '0.3.3',
      id: 'save-abc',
      players: [],
      communityActivities: {},
      seasonSummaries: [
        { season: 1, clubId: 'club-x', clubName: 'X' },
        { id: 'already-has-one', season: 2, clubId: 'club-x', clubName: 'X' },
      ],
    }
    const migrated = migrateSaveGame(oldSave)
    expect(migrated.seasonSummaries?.[0].id).toBe('save-abc_s1_club-x')
    expect(migrated.seasonSummaries?.[1].id).toBe('already-has-one')
  })

  // SLUTTEST RUNDA 3 (2026-08-08, punkt 3): startValue är nytt på BoardObjective.
  // Äldre saves saknar det — backfyll med currentValue, annars kraschar
  // computeProgressPct:s avståndsformel (startValue undefined) inte, men ger
  // fallback-binär progress istf den riktiga graderade — vilket är avsikten,
  // inte en bugg. Detta testar bara att backfillen faktiskt skriver fältet.
  it('backfyller boardObjectives.startValue från currentValue på äldre saves', () => {
    const oldSave = {
      players: [],
      communityActivities: {},
      boardObjectives: [{ id: 'obj1', measureFn: 'topHalf', targetValue: 6, currentValue: 9 }],
    }
    const migrated = migrateSaveGame(oldSave)
    expect((migrated.boardObjectives[0] as any).startValue).toBe(9)
  })

  it('rör inte startValue om det redan finns på saven', () => {
    const oldSave = {
      players: [],
      communityActivities: {},
      boardObjectives: [{ id: 'obj1', measureFn: 'topHalf', targetValue: 6, currentValue: 7, startValue: 11 }],
    }
    const migrated = migrateSaveGame(oldSave)
    expect((migrated.boardObjectives[0] as any).startValue).toBe(11)
  })
})
