import type { SaveGame } from '../../domain/entities/SaveGame'

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

export function saveSaveGame(game: SaveGame): void {
  if (!isLocalStorageAvailable()) return

  try {
    const key = `${SAVE_PREFIX}${game.id}`
    localStorage.setItem(key, JSON.stringify(game))

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
    localStorage.setItem(INDEX_KEY, JSON.stringify(filtered))
  } catch (e) {
    console.warn('saveSaveGame: kunde inte spara till localStorage', e)
  }
}

export function loadSaveGame(id: string): SaveGame | null {
  if (!isLocalStorageAvailable()) return null

  try {
    const key = `${SAVE_PREFIX}${id}`
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as SaveGame
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

export function deleteSaveGame(id: string): void {
  if (!isLocalStorageAvailable()) return

  const key = `${SAVE_PREFIX}${id}`
  localStorage.removeItem(key)

  const existing = listSaveGames()
  const filtered = existing.filter(s => s.id !== id)
  localStorage.setItem(INDEX_KEY, JSON.stringify(filtered))
}
