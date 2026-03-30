# Spec: IndexedDB-migration + Schemalängdsfix

## 1. IndexedDB-migration (save/load)

### Bakgrund
Spelet använder localStorage för saves. localStorage har 5-10 MB gräns. Efter 5+ säsonger (Eriks save) börjar det bli tight — fixtures, players, och events ackumuleras. ZenGM (vår närmaste konkurrent) använder IndexedDB som har obegränsad lagring.

### Mål
Migrera save/load från localStorage till IndexedDB. Behåll localStorage som fallback. Lägg till export/import-funktion.

### Implementation

**Fil:** `src/infrastructure/persistence/saveGameStorage.ts`

Nuvarande API (behåll samma interface):
```typescript
export function saveGame(game: SaveGame): void
export function loadGame(): SaveGame | null
export function deleteSave(): void
export function listSaves(): SaveInfo[]
```

Ny implementation med IndexedDB:
```typescript
import { openDB, type IDBPDatabase } from 'idb'  // npm install idb

const DB_NAME = 'bandy-manager'
const DB_VERSION = 1
const STORE_NAME = 'saves'

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    },
  })
}

export async function saveGame(game: SaveGame): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, game)
  // Också spara till localStorage som backup (trunkera om för stort)
  try {
    localStorage.setItem('bandy_manager_save', JSON.stringify(game))
  } catch {
    // localStorage full — ignorera, IndexedDB har datan
  }
}

export async function loadGame(): Promise<SaveGame | null> {
  const db = await getDB()
  const saves = await db.getAll(STORE_NAME)
  if (saves.length > 0) {
    // Returnera senaste
    return saves.sort((a, b) => 
      (b.lastSavedAt ?? '').localeCompare(a.lastSavedAt ?? '')
    )[0]
  }
  // Fallback: migrera från localStorage
  const lsData = localStorage.getItem('bandy_manager_save')
  if (lsData) {
    const game = JSON.parse(lsData) as SaveGame
    await saveGame(game)  // migrera till IndexedDB
    return game
  }
  return null
}
```

**Viktigt:** `idb`-paketet är en tunn wrapper runt browser IndexedDB API. Alternativ: använd rå IndexedDB utan dependency — det är mer kod men noll extra paket.

**Asynkron API:** Nuvarande `saveGame`/`loadGame` är synkrona. IndexedDB är asynkront (Promises). Alla anrop i gameStore behöver bli `async/await`. Ändra:
- `gameStore.ts`: `loadSavedGame()` → `async loadSavedGame()`
- `gameStore.ts`: `saveCurrentGame()` → `async saveCurrentGame()`
- Auto-save i roundProcessor → wrap i async

### Export/Import (enkel version)
```typescript
export function exportSave(game: SaveGame): string {
  return JSON.stringify(game)
}

export function importSave(json: string): SaveGame {
  return JSON.parse(json) as SaveGame
}
```

UI: lägg till i Settings/Förening-skärmen:
- "Exportera save" → laddar ner .json-fil
- "Importera save" → filväljare, läser .json, laddar spelet

### Migration vid uppstart
I `App.tsx` eller `gameStore.ts` init:
```typescript
// Vid app-start: kolla om det finns en localStorage-save men ingen IndexedDB-save
// Om så: migrera automatiskt
const idbGame = await loadGameFromIDB()
if (!idbGame) {
  const lsGame = loadGameFromLocalStorage()
  if (lsGame) {
    await saveGameToIDB(lsGame)
  }
}
```

### Steg
1. `npm install idb` (eller skriv rå IndexedDB-wrapper, ~30 rader)
2. Skriv om `saveGameStorage.ts` med async IndexedDB + localStorage fallback
3. Uppdatera `gameStore.ts` — alla save/load → async
4. Lägg till export/import i UI (ClubScreen/Settings)
5. Auto-migration vid uppstart
6. Testa: starta nytt spel, spela 3 omgångar, ladda om, verifiera att data finns i IndexedDB

---

## 2. Schemalängdsfix — SM-finalen i mars, inte juni

### Bakgrund
Erik: "Grundserien pågår till 2 april, kvartsfinal i maj, SM-final 11 juni."

Verklig bandykalender:
- Grundserie: andra veckan i oktober → sista veckan i februari (22 omgångar)
- Slutspel: mars
- SM-final: tredje söndagen i mars

Problemet: `roundProcessor.ts` avancerar datum med flat `advanceDate(currentDate, 7)` — 7 dagar per omgång. Med round 8 fixerad till 26 december hamnar round 22 i april och slutspelet i maj/juni.

### Beräkning
Med round 8 = Dec 26 och 7 dagar/omgång:
- Round 9: Jan 2, Round 15: Feb 13, Round 22: **Apr 3** ❌

Med korrekt kalender:
- Round 1: okt 8, Round 8: dec 26, Round 22: **feb 26** ✅
- Slutspel: mars 1-20, Final: ~mars 15 ✅

### Lösning: Datumtabell istället för flat +7

**Fil:** `src/domain/services/scheduleGenerator.ts` — lägg till:

```typescript
/**
 * Beräknar matchdatum baserat på omgångsnummer och säsong.
 * Grundserie: okt-feb, tätare schema jan-feb.
 * Slutspel: mars, 3-4 dagar mellan matcher.
 */
export function getRoundDate(season: number, roundNumber: number): string {
  // Grundserie: 22 omgångar, okt → feb
  const ROUND_DATES: Record<number, string> = {
    1:  `${season}-10-08`,
    2:  `${season}-10-15`,
    3:  `${season}-10-22`,
    4:  `${season}-10-29`,
    5:  `${season}-11-05`,
    6:  `${season}-11-12`,
    7:  `${season}-11-26`,
    8:  `${season}-12-26`,   // Annandagen
    9:  `${season}-12-30`,
    10: `${season + 1}-01-04`,
    11: `${season + 1}-01-09`,
    12: `${season + 1}-01-14`,
    13: `${season + 1}-01-18`,
    14: `${season + 1}-01-23`,
    15: `${season + 1}-01-28`,
    16: `${season + 1}-02-01`,
    17: `${season + 1}-02-05`,
    18: `${season + 1}-02-09`,
    19: `${season + 1}-02-13`,
    20: `${season + 1}-02-17`,
    21: `${season + 1}-02-21`,
    22: `${season + 1}-02-25`,
    // Slutspel (kvartsfinal)
    23: `${season + 1}-02-28`,
    24: `${season + 1}-03-02`,
    25: `${season + 1}-03-04`,
    26: `${season + 1}-03-06`,
    27: `${season + 1}-03-08`,
    // Semifinal
    28: `${season + 1}-03-09`,
    29: `${season + 1}-03-11`,
    30: `${season + 1}-03-13`,
    31: `${season + 1}-03-15`,
    // Final
    32: `${season + 1}-03-16`,  // tredje söndagen i mars (ungefär)
  }
  
  if (roundNumber in ROUND_DATES) return ROUND_DATES[roundNumber]
  
  // Fallback för extra omgångar
  const lastKnownRound = Math.max(...Object.keys(ROUND_DATES).map(Number))
  const lastDate = new Date(ROUND_DATES[lastKnownRound])
  lastDate.setDate(lastDate.getDate() + (roundNumber - lastKnownRound) * 3)
  return lastDate.toISOString().slice(0, 10)
}
```

### Ändring i roundProcessor.ts

Ersätt:
```typescript
let newDate = advanceDate(game.currentDate, 7)
if (nextRound === 8) newDate = `${game.currentSeason}-12-26`
```

Med:
```typescript
import { getRoundDate } from '../../domain/services/scheduleGenerator'
let newDate = getRoundDate(game.currentSeason, nextRound + 1) // nästa omgångs datum
// Fallback om vi inte vet nästa omgång
if (!newDate) newDate = advanceDate(game.currentDate, 5)
```

Notera: `nextRound + 1` för att datumet ska vara "nästa matchdag", inte den omgång som just spelades.

### Ändring i weatherService.ts

`roundToMonth` behöver uppdateras:
```typescript
function roundToMonth(roundNumber: number): number {
  if (roundNumber <= 4) return 10    // oktober
  if (roundNumber <= 7) return 11    // november
  if (roundNumber <= 9) return 12    // december
  if (roundNumber <= 15) return 1    // januari
  if (roundNumber <= 22) return 2    // februari
  return 3                           // mars (slutspel)
}
```

### Cup-fixture-timing
Cup-matcher interfolias redan med ligamatcher via `roundNumber - 100`. De kommer automatiskt hamna i rätt tidsperiod om grundseriens datum ändras.

### Steg
1. Lägg till `getRoundDate()` i scheduleGenerator.ts
2. Uppdatera roundProcessor.ts — använd datumtabellen
3. Uppdatera weatherService.ts `roundToMonth`
4. Testa: starta nytt spel, spela 22 omgångar, verifiera att round 22 = ~25 feb
5. Spela slutspel, verifiera att finalen hamnar i mars

---

## Prioritetsordning

1. **Schemalängdsfix** — ren logikändring, ingen arkitekturpåverkan, kan commitas direkt
2. **IndexedDB-migration** — kräver async-refaktor av gameStore, mer invasivt men kritiskt före beta

Ge Code schemalängdsfixen först:
```
Läs docs/INDEXEDDB_SCHEDULE_SPEC.md, sektion 2. Implementera getRoundDate() i scheduleGenerator.ts. Uppdatera roundProcessor.ts att använda datumtabellen istället för flat +7 dagar. Uppdatera roundToMonth i weatherService.ts. npm run build. Testa att round 22 hamnar i februari.
```

Sedan IndexedDB:
```
Läs docs/INDEXEDDB_SCHEDULE_SPEC.md, sektion 1. Installera idb-paketet. Skriv om saveGameStorage.ts med async IndexedDB + localStorage-fallback. Uppdatera gameStore.ts save/load till async. Lägg till export/import-knappar i ClubScreen. npm run build.
```
