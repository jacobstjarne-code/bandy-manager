import { get, set, del } from 'idb-keyval'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { migrateSaveGame } from './saveGameMigration'

// U7 (SLUTTEST_KO.md, 2026-08-17) — export/import fanns redan men var inte
// nåbara från UI. Automatisk lokal återställningspunkt: rotation på två
// snapshots (Jacobs beslut), tagen före de två destruktiva/riskabla
// momenten som redan identifierats: newGame():s ovillkorade delete-all
// (gameStore.ts) och migreringssteget i loadSaveGame() nedan. Samma
// idb-keyval-mönster som resten av filen — ingen ny lagringsmekanism.
const SNAPSHOT_KEY_PREFIX = 'bandy_snapshot_'
const SNAPSHOT_ROTATION_SIZE = 2

async function snapshotRotationKeys(): Promise<string[]> {
  const raw = await get<string[]>(`${SNAPSHOT_KEY_PREFIX}index`)
  return raw ?? []
}

// Monotont löpnummer utöver Date.now() — två snapshots i samma millisekund
// (rimligt i snabba testloopar, inte omöjligt i skarpt läge heller) ska
// aldrig kunna kollidera på samma nyckel och tyst skriva över varandra.
let snapshotCounter = 0

/** Skriver en snapshot och roterar bort den äldsta om gränsen (2) nås. */
export async function snapshotSave(reason: string, game: SaveGame): Promise<void> {
  try {
    const keys = await snapshotRotationKeys()
    const key = `${SNAPSHOT_KEY_PREFIX}${reason}_${Date.now()}_${snapshotCounter++}`
    await set(key, game)
    const updated = [...keys, key]
    while (updated.length > SNAPSHOT_ROTATION_SIZE) {
      const oldest = updated.shift()
      if (oldest) await del(oldest).catch(() => {})
    }
    await set(`${SNAPSHOT_KEY_PREFIX}index`, updated)
  } catch (e) {
    // Snapshot är ett skyddsnät, inte en kritisk operation — ett misslyckat
    // snapshot ska aldrig blockera det faktiska sparflödet/newGame-flödet.
    console.warn('snapshotSave: kunde inte spara', e)
  }
}

export interface SaveSnapshotSummary {
  key: string
  reason: string
  takenAt: number
}

export async function listSaveSnapshots(): Promise<SaveSnapshotSummary[]> {
  const keys = await snapshotRotationKeys()
  return keys.map(key => {
    // Format: bandy_snapshot_{reason}_{takenAt}_{counter} — reason kan i
    // teorin innehålla understreck, så parsa från HÖGER (counter, sen
    // takenAt) istället för att gissa var reason slutar.
    const withoutPrefix = key.slice(SNAPSHOT_KEY_PREFIX.length)
    const parts = withoutPrefix.split('_')
    const takenAt = Number(parts[parts.length - 2])
    const reason = parts.slice(0, parts.length - 2).join('_')
    return { key, reason, takenAt }
  }).sort((a, b) => b.takenAt - a.takenAt)
}

export async function loadSaveSnapshot(key: string): Promise<SaveGame | null> {
  const raw = await get<SaveGame>(key)
  return raw ?? null
}

export function exportSaveAsJson(game: SaveGame): void {
  const json = JSON.stringify(game)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = game.managerName.replace(/[^a-zA-ZåäöÅÄÖ0-9]/g, '_')
  a.download = `bandy-${safeName}-s${game.currentSeason}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function isValidSaveGameStructure(obj: unknown): obj is SaveGame {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.id === 'string' && o.id.length > 0 &&
    typeof o.managerName === 'string' &&
    typeof o.managedClubId === 'string' &&
    typeof o.currentSeason === 'number' &&
    Array.isArray(o.clubs) &&
    Array.isArray(o.players) &&
    typeof o.league === 'object' && o.league !== null &&
    Array.isArray(o.fixtures)
  )
}

export async function importSaveFromJson(): Promise<SaveGame | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) { resolve(null); return }
      try {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (!isValidSaveGameStructure(parsed)) {
          console.warn('[importSaveFromJson] Ogiltig save-struktur — import avbruten')
          resolve(null)
          return
        }
        const migrated = migrateSaveGame(parsed)
        await saveSaveGame(migrated)
        resolve(migrated)
      } catch {
        resolve(null)
      }
    }
    input.click()
  })
}

/** One-time migration: if old Zustand localStorage key exists and no IndexedDB saves, migrate it. */
export async function migrateLocalStorageIfNeeded(): Promise<SaveGame | null> {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem('bandy-game-store')
  if (!raw) return null
  const existing = listSaveGames()
  if (existing.length > 0) {
    localStorage.removeItem('bandy-game-store')
    return null
  }
  try {
    const parsed = JSON.parse(raw) as { state?: { game?: SaveGame } }
    const game = parsed?.state?.game
    if (!game || !game.id) return null
    const migrated = migrateSaveGame(game)
    await saveSaveGame(migrated)
    localStorage.removeItem('bandy-game-store')
    return migrated
  } catch {
    return null
  }
}

export interface SaveGameSummary {
  id: string
  managerName: string
  clubName: string
  season: number
  lastSavedAt: string
}

const SAVE_PREFIX = 'bandy_save_'
const INDEX_KEY = 'bandy_save_index'

function isLocalStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined'
}

export async function saveSaveGame(game: SaveGame): Promise<void> {
  try {
    const key = `${SAVE_PREFIX}${game.id}`
    await set(key, game)

    const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? ''

    const summary: SaveGameSummary = {
      id: game.id,
      managerName: game.managerName,
      clubName,
      season: game.currentSeason,
      lastSavedAt: game.lastSavedAt,
    }

    const existing = listSaveGames()
    const filtered = existing.filter(s => s.id !== game.id)
    filtered.push(summary)
    if (isLocalStorageAvailable()) {
      localStorage.setItem(INDEX_KEY, JSON.stringify(filtered))
    }
  } catch (e) {
    console.warn('saveSaveGame: kunde inte spara', e)
  }
}

export async function loadSaveGame(id: string): Promise<SaveGame | null> {
  try {
    const key = `${SAVE_PREFIX}${id}`
    const raw = await get<SaveGame>(key)
    if (raw === undefined) return null
    // U7: snapshot av RÅDATAN före migreringssteget — om migrateSaveGame
    // kastar (nedan) finns rådatan kvar att återställa från, den förloras
    // inte tyst med resten av catch-blocket.
    await snapshotSave('pre_migration', raw)
    return migrateSaveGame(raw)
  } catch {
    return null
  }
}

export function listSaveGames(): SaveGameSummary[] {
  if (!isLocalStorageAvailable()) return []

  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (raw === null) return []
    const summaries = JSON.parse(raw) as SaveGameSummary[]
    return summaries.sort((a, b) =>
      new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()
    )
  } catch {
    return []
  }
}

export async function deleteSaveGame(id: string): Promise<void> {
  const key = `${SAVE_PREFIX}${id}`
  await del(key)

  if (isLocalStorageAvailable()) {
    const existing = listSaveGames()
    const filtered = existing.filter(s => s.id !== id)
    localStorage.setItem(INDEX_KEY, JSON.stringify(filtered))
  }
}
