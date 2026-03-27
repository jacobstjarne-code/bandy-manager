import { get, set, del } from 'idb-keyval'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { migrateSaveGame } from './saveGameMigration'

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
