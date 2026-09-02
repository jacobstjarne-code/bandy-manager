import { get, set, del } from 'idb-keyval'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { migrateSaveGame } from './saveGameMigration'
import { broadcastSaveWritten } from './saveConflictChannel'
import { getNextManagedFixture } from '../../domain/services/portal/triggers/matchTriggers'
import { getBoardPatienceZone } from '../../domain/services/portal/boardPatienceZone'
import { pickTopActiveArcs, getArcHeadline } from '../../domain/data/activeArcStrings'
import { recordRestoreResult, recordSnapshotResult } from './saveRecoveryMetrics'

// U7 (SLUTTEST_KO.md, 2026-08-17) — export/import fanns redan men var inte
// nåbara från UI. Automatisk lokal återställningspunkt: rotation på två
// snapshots (Jacobs beslut), tagen före de två destruktiva/riskabla
// momenten som redan identifierats: newGame():s ovillkorade delete-all
// (gameStore.ts) och migreringssteget i loadSaveGame() nedan. Samma
// idb-keyval-mönster som resten av filen — ingen ny lagringsmekanism.
const SNAPSHOT_KEY_PREFIX = 'bandy_snapshot_'
const SNAPSHOT_ROTATION_SIZE = 2
export const SAVE_RECOVERY_NEEDED_KEY = 'bandy-save-recovery-needed'
export const SAVE_RECOVERY_NEEDED_EVENT = 'bandy-save-recovery-needed'

async function snapshotRotationKeys(): Promise<string[]> {
  const raw = await get<string[]>(`${SNAPSHOT_KEY_PREFIX}index`)
  return raw ?? []
}

// Monotont löpnummer utöver Date.now() — två snapshots i samma millisekund
// (rimligt i snabba testloopar, inte omöjligt i skarpt läge heller) ska
// aldrig kunna kollidera på samma nyckel och tyst skriva över varandra.
let snapshotCounter = 0

/** Skriver en snapshot och roterar bort den äldsta om gränsen (2) nås. */
export async function snapshotSave(reason: string, game: SaveGame): Promise<string | null> {
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
    recordSnapshotResult(reason, true)
    return key
  } catch (e) {
    recordSnapshotResult(reason, false)
    // Snapshot är ett skyddsnät, inte en kritisk operation — ett misslyckat
    // snapshot ska aldrig blockera det faktiska sparflödet/newGame-flödet.
    console.warn('snapshotSave: kunde inte spara', e)
    return null
  }
}

/**
 * U7: ett litet, save-fritt boot-larm. Själva återställningspunkterna ligger
 * fortsatt i IndexedDB; localStorage bär bara att UI:t ska erbjuda dem. Det
 * gör att ett misslyckat Zustand-hydreringsförsök inte behöver mutera store:t
 * (vilket i sin tur hade skrivit över den felande `bandy-game-store`-posten).
 */
export function markSaveRecoveryNeeded(): void {
  try {
    localStorage.setItem(SAVE_RECOVERY_NEEDED_KEY, new Date().toISOString())
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVE_RECOVERY_NEEDED_EVENT))
  } catch { /* localStorage otillgänglig — snapshoten ligger ändå kvar */ }
}

export function isSaveRecoveryNeeded(): boolean {
  try {
    return localStorage.getItem(SAVE_RECOVERY_NEEDED_KEY) !== null
  } catch {
    return false
  }
}

export function clearSaveRecoveryNeeded(): void {
  try {
    localStorage.removeItem(SAVE_RECOVERY_NEEDED_KEY)
  } catch { /* localStorage otillgänglig */ }
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
  try {
    const raw = await get<SaveGame>(key)
    recordRestoreResult(raw === undefined ? 'not_found' : 'succeeded')
    return raw ?? null
  } catch (error) {
    recordRestoreResult('failed')
    throw error
  }
}

export type RestoreLatestSnapshotResult =
  | { success: true; game: SaveGame; snapshot: SaveSnapshotSummary }
  | { success: false }

/**
 * Provar snapshots nyast först och återställer den första som både går att
 * migrera med aktuell kod och skriva till den auktoritativa save-platsen.
 * Den snapshot som just orsakade migreringsfelet kan vara oläsbar; därför
 * måste rotationens äldre punkt också provas i stället för att samma fel
 * körs om i en loop.
 */
export async function restoreLatestSaveSnapshot(): Promise<RestoreLatestSnapshotResult> {
  let snapshots: SaveSnapshotSummary[]
  try {
    snapshots = await listSaveSnapshots()
  } catch {
    return { success: false }
  }

  for (const snapshot of snapshots) {
    try {
      const raw = await loadSaveSnapshot(snapshot.key)
      if (!raw) continue
      // Saves är JSON-data. Klonen gör att en misslyckad migrering aldrig kan
      // mutera själva återställningspunkten i minnesbaserade lagringsadaptrar.
      const migrationInput = JSON.parse(JSON.stringify(raw)) as unknown
      const migrated = migrateSaveGame(migrationInput)
      if (!isValidSaveGameStructure(migrated)) continue
      const write = await saveSaveGame(migrated, { force: true })
      if (!write.success) return { success: false }
      return {
        success: true,
        game: { ...migrated, revision: write.newRevision },
        snapshot,
      }
    } catch {
      // En trasig nyare snapshot får inte skymma en fungerande äldre punkt.
    }
  }
  return { success: false }
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
        // M2: force — GameHeader.tsx:handleImportSave() har redan visat ett
        // window.confirm om att detta ersätter den aktuella karriären. En
        // konflikt-avvisning här vore inkonsekvent med det löftet.
        const result = await saveSaveGame(migrated, { force: true })
        if (!result.success) {
          console.error('[importSaveFromJson] saveSaveGame misslyckades:', result.error)
          resolve(null)
          return
        }
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
    const result = await saveSaveGame(migrated)
    if (!result.success) {
      // C1: rör ALDRIG den gamla nyckeln om den nya skrivningen inte
      // bekräftat lyckades — annars raderas spelarens enda kopia innan
      // en ny finns, exakt den klassen av tyst dataförlust C1 handlar om.
      console.error('[migrateLocalStorageIfNeeded] saveSaveGame misslyckades, legacy-nyckeln behålls:', result.error)
      return null
    }
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
  /**
   * M7 (audit 5c9a7a8, 2026-08-24): "kall återkomst saknar sammanhang —
   * startsidan säger bara Fortsätt, save-väljaren visar bara namn/klubb/
   * säsong/tid." Alla fälten nedan härleds ur game-objektet som ändå redan
   * är i minnet vid varje saveSaveGame()-anrop (se därnere) — noll extra
   * I/O, ingen ny laddning. "Som av senaste sparning", samma färskhets-
   * kontrakt som lastSavedAt redan har.
   */
  nextFixtureOpponent?: string
  nextFixtureIsHome?: boolean
  nextFixtureMatchday?: number
  leaguePosition?: number
  record?: { w: number; d: number; l: number }
  boardZone?: 'stabilt' | 'under_press' | 'ultimatum'
  boardZoneLabel?: string
  storylineHook?: string
}

const SAVE_PREFIX = 'bandy_save_'
const INDEX_KEY = 'bandy_save_index'

function isLocalStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined'
}

export interface SaveWriteResult {
  success: boolean
  error?: string
  /** true = avvisad p.g.a. compare-and-swap, INTE ett lagringsfel. Spelaren måste ladda om, inte försöka spara igen. */
  conflict?: boolean
  newRevision?: number
}

// M3 (SEXSÄSONGSAUDITEN 2026-08-26, "Multislot"): en NYSTARTAD karriär, en
// enda flik, fick "En annan flik har sparat". Rotorsak var aldrig en andra
// flik — newGame() (gameStore.ts) gör ett fire-and-forget saveSaveGame(game)
// för den nya karriären, och navigationen till /intro kan hinna trigga en
// EGEN autosave (t.ex. completeScene → persistAutosave) INNAN den första
// skrivningen hunnit skriva tillbaka sin nya revision in i store:ts `game`.
// Båda anropen läser då samma stale `game.revision` (0) från VARDERA sitt
// eget snapshot av store-state, tagna i olika mikrouppgifter av samma flik.
// Om den första hinner skriva disken (revision 1) innan den andra läser
// disken för sin konflikt-koll, ser den andra onDiskRevision(1) > dess egen
// knownRevision(0) — och avvisas med samma text som en RIKTIG cross-tab-
// konflikt, trots att ingen annan flik någonsin existerat.
//
// Fix, två delar, båda modul-scopade (nollställs korrekt vid en riktig
// flik-omladdning — precis det RIKTIGA cross-tab-scenariot ska fortsätta
// upptäckas via disken, se C1/M2-kommentaren nedan):
// 1. tabLastWrittenRevision — denna FLIKENS senast bekräftade skrivna
//    revision per save-id. Konflikt-kollen tar max(knownRevision, detta)
//    istället för att lita blint på anroparens ev. stale snapshot.
// 2. inFlightWrites — kedjar skrivningar till SAMMA save-id i turordning,
//    så den andra skrivningen i racet ovan läser disken EFTER att den
//    första faktiskt skrivit klart, inte mitt i.
// Ingen av delarna påverkar den RIKTIGA cross-tab-detekteringen: en annan
// flik har sin egen modulinstans (eget JS-realm) med tomma Maps — dess
// skrivning syns bara via disken, exakt det CAS-kollen nedan fortfarande
// jämför mot.
const tabLastWrittenRevision = new Map<string, number>()
const inFlightWrites = new Map<string, Promise<SaveWriteResult>>()

/**
 * C1 (oberoende speltest- och produktaudit, deploy 5c9a7a8, 2026-08-24) —
 * DET VÄRSTA fyndet i hela serien. Funktionen svalde tidigare ALLA undantag
 * och returnerade `Promise<void>` — anroparen (persistGameSnapshot,
 * gameStore.ts) hade en try/catch som förväntade sig att den skulle KASTA
 * vid fel, men den kastade aldrig, så catch-blocket var död kod. Resultat:
 * en spelare i privat läge, med full lagringskvot, eller med ett avbrutet
 * IndexedDB-anrop fick "✓ Sparat" — en bekräftelse på en sparning som
 * aldrig skedde. Kan radera en hel karriär tyst, med ett kvitto.
 *
 * M2 (samma auditsvit, 2026-08-24) — SÅG LIVE: flik A valde Taktik, en
 * stale flik B (öppnad tidigare, aldrig omladdad) valde Hård; B:s
 * skrivning landade EFTER A:s och skrev tyst över A:s val. Ren
 * last-write-wins, ingen av flikarna visste att den andra existerade.
 * Fixen är optimistisk concurrency-kontroll (OCC): `game.revision` på det
 * OBJEKT som skickas in är per definition "vilken version denna skrivning
 * bygger vidare på" — det är exakt samma revision som fanns på disk när
 * flikens kopia av `game` senast lästes eller skrevs (spread:as vidare
 * genom hela store:t, `{...game, ...ändringar}`, aldrig tappat på vägen).
 * Skrivningen jämför den mot vad som FAKTISKT ligger på disk just nu. Är
 * disken längre fram har en annan flik skrivit emellan — skrivningen
 * avvisas (conflict:true) istället för att skriva över. Detta stoppar
 * exakt B:s skrivning i reproduktionen ovan: B:s `game.revision` är den
 * gamla (B laddades/synkade aldrig om), disken är redan ett steg längre
 * fram (A:s skrivning), B:s försök avvisas.
 *
 * OBS: ett flik-lokalt cache-fält (t.ex. en Map i denna modul) hade INTE
 * fungerat här — en flik som laddats om (F5, eller helt enkelt en ny
 * boot) startar med ett tomt modul-scope, men behöver ändå veta vilken
 * revision den redan känner till. Zustand-storet (gameStore.ts) håller
 * KVAR det i `game.revision` genom sin egen persist-återhydrering — det är
 * därför baslinjen måste komma från det inskickade objektet, inte från
 * något denna modul kommer ihåg själv. Anroparen (persistGameSnapshot/
 * persistAutosave) MÅSTE skriva tillbaka `newRevision` in i store:ts
 * `game.revision` efter en lyckad sparning — annars konfliktar samma flik
 * med SIG SJÄLV redan vid sitt andra sparförsök.
 *
 * Tre skrivningar, inte transaktionella (IndexedDB + localStorage-index +
 * BroadcastChannel-notis) — i EXPLICIT ORDNING med olika fel-semantik:
 * 1. Konflikt-kollen (ingen skrivning sker om disken redan är längre fram).
 * 2. Speldatan (IndexedDB, `set()`). Misslyckas den → total fel, indexet
 *    rörs ALDRIG (så indexet aldrig kan peka på ett save som inte finns).
 * 3. Sparlistans index (localStorage). Misslyckas BARA den → speldatan är
 *    fortfarande säker på disk (nåbar via loadSaveGame(id) direkt), men
 *    saven syns inte i SaveManagerScreen. Fortfarande `success:false` —
 *    spelaren ska aldrig se "✓ Sparat" när något faktiskt gick fel, även
 *    om skadan här är mindre än fall 2.
 */
export async function saveSaveGame(game: SaveGame, opts?: { force?: boolean }): Promise<SaveWriteResult> {
  // M3: kedja denna skrivningen EFTER varje annan pågående skrivning till
  // SAMMA save-id i den här fliken — se kommentaren vid tabLastWrittenRevision
  // ovan. Utan detta kan två fire-and-forget-anrop (t.ex. newGame()s egen
  // sparning + intro-scenens completeScene-autosave) båda läsa disken innan
  // någon av dem skrivit, och den ena avvisas som en falsk "annan flik"-
  // konflikt mot sitt eget syskonanrop.
  const key = `${SAVE_PREFIX}${game.id}`
  const prior = inFlightWrites.get(key) ?? Promise.resolve({ success: true } as SaveWriteResult)
  const chained = prior.then(() => doSaveSaveGame(game, opts), () => doSaveSaveGame(game, opts))
  inFlightWrites.set(key, chained)
  try {
    return await chained
  } finally {
    if (inFlightWrites.get(key) === chained) inFlightWrites.delete(key)
  }
}

async function doSaveSaveGame(game: SaveGame, opts?: { force?: boolean }): Promise<SaveWriteResult> {
  const key = `${SAVE_PREFIX}${game.id}`

  let onDiskRevision = 0
  try {
    const onDisk = await get<SaveGame>(key)
    if (onDisk !== undefined) onDiskRevision = onDisk.revision ?? 0
  } catch {
    // Kan inte läsa disken för att jämföra — samma fel dyker upp igen på
    // skrivförsöket nedan, som redan har en egen felhantering. Behandla
    // inte en misslyckad läsning som en konflikt.
  }

  // M3: max mot denna FLIKENS senast bekräftat skrivna revision för detta
  // save-id — inte bara den (möjligen stale) game.revision anroparen råkade
  // ha i sin snapshot. Se kommentaren vid tabLastWrittenRevision ovan.
  const knownRevision = Math.max(game.revision ?? 0, tabLastWrittenRevision.get(game.id) ?? 0)
  // force: explicit, redan spelarbekräftad ersättning (t.ex. importSaveFromJson,
  // som redan kört ett window.confirm — "din aktuella karriär ersätts, går inte
  // att ångra"). Den flödet KÄNNER per definition inte den importerade filens
  // relation till vad som händer stå på disk just nu, och ska inte blockeras
  // av en konflikt-kontroll byggd för att skydda mot en helt annan sak (två
  // flikar som omedvetet racear).
  if (!opts?.force && onDiskRevision > knownRevision) {
    return {
      success: false,
      conflict: true,
      error: 'En annan flik har sparat en nyare version av den här karriären. Ladda om för att fortsätta säkert.',
    }
  }

  const nextRevision = onDiskRevision + 1
  const gameToWrite: SaveGame = { ...game, revision: nextRevision }

  try {
    await set(key, gameToWrite)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('saveSaveGame: IndexedDB-skrivning misslyckades — speldata INTE sparad', e)
    return { success: false, error: `Kunde inte spara: lagringen är full eller otillgänglig (${msg})` }
  }

  tabLastWrittenRevision.set(game.id, nextRevision)
  broadcastSaveWritten(game.id, nextRevision)

  try {
    const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? ''

    // M7: nästa match.
    const nextFixture = getNextManagedFixture(game)
    const nextFixtureOpponentId = nextFixture
      ? (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId)
      : undefined
    const nextFixtureOpponent = nextFixtureOpponentId
      ? game.clubs.find(c => c.id === nextFixtureOpponentId)?.name
      : undefined

    // M7: tabellplacering + facit — ren uppslagning, redan beräknat av roundProcessor.
    const standing = game.standings.find(s => s.clubId === game.managedClubId)

    // M7: styrelsezon — samma delade funktion boardpatience-UI:t redan visar live.
    const boardZoneInfo = getBoardPatienceZone(game)

    // M7: "olöst huvudtråd" — samma urval som portalens ActiveArcsSecondary.
    const topArc = pickTopActiveArcs(game.activeArcs, 1)[0]
    const arcPlayer = topArc?.playerId ? game.players.find(p => p.id === topArc.playerId) : undefined
    const storylineHook = topArc ? getArcHeadline(topArc, arcPlayer) : undefined

    const summary: SaveGameSummary = {
      id: game.id,
      managerName: game.managerName,
      clubName,
      season: game.currentSeason,
      lastSavedAt: game.lastSavedAt,
      ...(nextFixture ? {
        nextFixtureOpponent: nextFixtureOpponent ?? undefined,
        nextFixtureIsHome: nextFixture.homeClubId === game.managedClubId,
        nextFixtureMatchday: nextFixture.matchday,
      } : {}),
      ...(standing ? {
        leaguePosition: standing.position,
        record: { w: standing.wins, d: standing.draws, l: standing.losses },
      } : {}),
      boardZone: boardZoneInfo.zone,
      boardZoneLabel: boardZoneInfo.label,
      ...(storylineHook ? { storylineHook } : {}),
    }
    const existing = listSaveGames()
    const filtered = existing.filter(s => s.id !== game.id)
    filtered.push(summary)
    if (isLocalStorageAvailable()) {
      localStorage.setItem(INDEX_KEY, JSON.stringify(filtered))
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('saveSaveGame: speldata sparad, men sparlistans index kunde INTE uppdateras', e)
    return { success: false, error: `Sparat, men syns inte i sparlistan just nu (${msg})`, newRevision: nextRevision }
  }

  return { success: true, newRevision: nextRevision }
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
