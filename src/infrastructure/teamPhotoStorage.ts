// DREAM-013: Lagfotografiet — IndexedDB-lagring för SVG-teamfoton
// Sparar ett SVG per säsong, hämtas i HistoryScreen.

const DB_NAME = 'bandymanager'
const STORE = 'team_photos'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'season' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveTeamPhoto(season: number, svg: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ season, svg })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadTeamPhoto(season: number): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(season)
    req.onsuccess = () => resolve((req.result as { season: number; svg: string } | undefined)?.svg ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function listTeamPhotoSeasons(): Promise<number[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAllKeys()
    req.onsuccess = () => resolve(req.result as number[])
    req.onerror = () => reject(req.error)
  })
}
