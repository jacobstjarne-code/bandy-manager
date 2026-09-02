import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSaveGame, loadSaveGame, listSaveGames, deleteSaveGame, snapshotSave, listSaveSnapshots, loadSaveSnapshot } from '../saveGameStorage'
import { migrateSaveGame, CURRENT_SAVE_VERSION } from '../saveGameMigration'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { advanceToNextEvent } from '../../../application/useCases/advanceToNextEvent'
import { get as idbGetMock, set as idbSetMock } from 'idb-keyval'
import { getSaveRecoveryReport } from '../saveRecoveryMetrics'

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

  it('createNewGame → tre advances → save/load/migrate bevarar hela spelvärlden (D-RC-B)', async () => {
    const created = createNewGame({
      managerName: 'Roundtrip Manager',
      clubId: 'club_forsbacka',
      season: 2025,
      seed: 777,
    })
    let advanced = created
    for (let i = 0; i < 3; i++) {
      advanced = advanceToNextEvent(advanced, 10_000 + i).game
    }
    expect(advanced.currentMatchday).toBeGreaterThan(created.currentMatchday)
    expect(advanced.fixtures.some(fixture => fixture.status === 'completed')).toBe(true)

    const write = await saveSaveGame(advanced)
    expect(write.success).toBe(true)

    // Den explicita migreringsdelen av kedjan: en ny värld kan fortfarande
    // bära createNewGame:s äldre versionsstämpel och får de aktuella
    // backfill-fälten först här.
    const expectedMigrated = migrateSaveGame(structuredClone(advanced))
    expect(expectedMigrated.version).toBe(CURRENT_SAVE_VERSION)

    // loadSaveGame är produktionsvägen och kör migrateSaveGame på rådatan.
    const loaded = await loadSaveGame(advanced.id)
    expect(loaded).not.toBeNull()
    expect(loaded?.version).toBe(CURRENT_SAVE_VERSION)

    // Revisionen ägs av lagringslagret och ökas vid skrivning. Resten av den
    // avancerade världen ska vara strukturellt identisk efter save/load/migrate.
    const withoutRevision = (game: SaveGame) => {
      const { revision: _revision, ...world } = game
      return world
    }
    expect(withoutRevision(loaded!)).toEqual(withoutRevision(expectedMigrated))

    // En redan aktuell save ska dessutom tåla en ny migreringspassage utan
    // semantisk drift — viktigt när load/import-kedjor möts.
    const migratedAgain = migrateSaveGame(structuredClone(loaded!))
    expect(migratedAgain).toEqual(loaded)
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

  // C1 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24) — VÄRSTA
  // fyndet i serien. saveSaveGame() svalde tidigare ALLA undantag och
  // returnerade Promise<void>, så persistGameSnapshot (gameStore.ts) fick
  // aldrig sitt catch-block att köra och returnerade alltid success:true.
  // En spelare i privat läge/full kvot fick "✓ Sparat" på en sparning som
  // aldrig skedde. Dessa tester reproducerar exakt de tre fallen ordern
  // efterfrågade: quota-fel, indexfel, avbruten skrivning.
  describe('saveSaveGame — C1: felet ska rapporteras, aldrig sväljas', () => {
    it('quota-fel (IndexedDB set() kastar) ger success:false, inte en tyst success:true', async () => {
      const game = makeGame('save_quota', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      vi.mocked(idbSetMock).mockRejectedValueOnce(new DOMException('Quota exceeded', 'QuotaExceededError'))

      const result = await saveSaveGame(game)
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()

      // Indexet ska ALDRIG peka på ett save som inte faktiskt skrevs.
      const summaries = listSaveGames()
      expect(summaries.find(s => s.id === 'save_quota')).toBeUndefined()
      const loaded = await loadSaveGame('save_quota')
      expect(loaded).toBeNull()
    })

    it('avbruten IndexedDB-skrivning (t.ex. privat läge) ger success:false', async () => {
      const game = makeGame('save_aborted', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      vi.mocked(idbSetMock).mockRejectedValueOnce(new Error('The operation was aborted'))

      const result = await saveSaveGame(game)
      expect(result.success).toBe(false)

      const loaded = await loadSaveGame('save_aborted')
      expect(loaded).toBeNull()
    })

    it('indexfel (localStorage.setItem kastar) ger success:false även om speldatan skrevs', async () => {
      const game = makeGame('save_indexfail', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const originalSetItem = localStorageMock.setItem
      vi.spyOn(localStorageMock, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      })

      const result = await saveSaveGame(game)
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()

      // Not i god tro: speldatan ÄR faktiskt säker (IndexedDB-skrivningen
      // lyckades) — bara indexet missade. success ska ändå vara false,
      // spelaren ska aldrig se "✓ Sparat" när något gick fel, även om
      // skadan här är mindre allvarlig än ett totalt misslyckande.
      vi.mocked(localStorageMock.setItem).mockImplementation(originalSetItem)
      const loaded = await loadSaveGame('save_indexfail')
      expect(loaded).not.toBeNull()
      expect(loaded?.id).toBe('save_indexfail')
    })

    it('en lyckad sparning ger fortfarande success:true (kontrollfall)', async () => {
      const game = makeGame('save_ok', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const result = await saveSaveGame(game)
      expect(result).toEqual({ success: true, newRevision: 1 })
    })
  })

  // M2 (audit 5c9a7a8, 2026-08-24) — SÅG LIVE: flik A valde Taktik, en
  // stale flik B (öppnad tidigare, aldrig omladdad) valde Hård, B:s
  // skrivning landade EFTER A:s och skrev tyst över A:s val. Testerna
  // nedan reproducerar den situationen genom att skriva en "annan fliks"
  // revision DIREKT till den mockade idb-butiken (utan att gå via
  // saveSaveGame/loadSaveGame i den här processen) — det motsvarar exakt
  // vad en verkligt annan flik gör: den delar disken, inte denna moduls
  // interna lastKnownRevision-cache.
  describe('saveSaveGame — M2: compare-and-swap mot flik-race', () => {
    it('en flik som aldrig sett saven kan skriva den FÖRSTA gången utan konflikt', async () => {
      const game = makeGame('save_cas_first', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const result = await saveSaveGame(game)
      expect(result).toEqual({ success: true, newRevision: 1 })
    })

    it('avvisar en skrivning när disken redan ligger steget före (annan flik hann skriva emellan)', async () => {
      const id = 'save_cas_conflict'
      const key = `bandy_save_${id}`
      const aheadGame = makeGame(id, 'club_soderfors', '2025-10-02T09:00:00.000Z')
      // Simulerar att en ANNAN flik redan skrivit revision 3 — direkt i den
      // delade "disken" (idbStore), aldrig via denna processens saveSaveGame,
      // så lastKnownRevision för id:t är fortfarande sin startpunkt (0) här.
      idbStore[key] = { ...aheadGame, revision: 3 }

      const staleGame = makeGame(id, 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const result = await saveSaveGame(staleGame)

      expect(result.success).toBe(false)
      expect(result.conflict).toBe(true)
      expect(result.error).toBeTruthy()

      // Den viktigaste assertionen: den nyare kopian på disk är ORÖRD.
      // Ingen dataförlust skedde — skrivningen avvisades, skrev inte över.
      expect((idbStore[key] as SaveGame).managedClubId).toBe('club_soderfors')
      expect((idbStore[key] as SaveGame).revision).toBe(3)
    })

    it('loadSaveGame synkar flikens kända revision — en efterföljande sparning konfliktar INTE falskt', async () => {
      const id = 'save_cas_resync'
      const game = makeGame(id, 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const first = await saveSaveGame(game)
      expect(first).toEqual({ success: true, newRevision: 1 })

      const loaded = await loadSaveGame(id)
      expect(loaded?.revision).toBe(1)

      const second = await saveSaveGame({ ...loaded! })
      expect(second).toEqual({ success: true, newRevision: 2 })
    })

    it('samma flik kan skriva flera gånger i följd utan att konfliktera med sig själv, SÅ LÄNGE anroparen matar tillbaka newRevision', async () => {
      // Kontraktet: game.revision är baslinjen skrivningen jämför mot — det
      // är anroparens (gameStore.ts:persistGameSnapshot / gameFlowActions.ts:
      // persistAutosave) ansvar att skriva tillbaka result.newRevision in i
      // sitt state innan nästa sparning, exakt som denna test gör manuellt.
      const id = 'save_cas_self_sequence'
      let game = makeGame(id, 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const r1 = await saveSaveGame(game)
      game = { ...game, revision: r1.newRevision }
      const r2 = await saveSaveGame(game)
      game = { ...game, revision: r2.newRevision }
      const r3 = await saveSaveGame(game)
      expect([r1.newRevision, r2.newRevision, r3.newRevision]).toEqual([1, 2, 3])
      expect([r1.conflict, r2.conflict, r3.conflict]).toEqual([undefined, undefined, undefined])
    })

    it('samma flik som INTE matar tillbaka newRevision konfliktar INTE längre med sig själv (M3, revideration av tidigare kontrakt)', async () => {
      // M3 (SEXSÄSONGSAUDITEN 2026-08-26, "Multislot"): detta testet
      // dokumenterade tidigare motsatsen — att en anropare som glömde mata
      // tillbaka newRevision skulle straffas med en falsk självkonflikt vid
      // nästa sparning. I praktiken visade det sig att FLERA legitima,
      // samtidiga fire-and-forget-anrop i SAMMA flik (newGame()s egen
      // sparning + intro-scenens completeScene-autosave, båda via
      // gameFlowActions.ts/gameStore.ts `void persistAutosave(...)`) kan
      // råka läsa samma stale `game.revision`-snapshot innan endera hunnit
      // skriva tillbaka — och den andra fick texten "En annan flik har
      // sparat" i en helt nystartad, enda-flik-karriär. Se
      // tabLastWrittenRevision i saveGameStorage.ts: modulen minns nu SJÄLV
      // den här flikens senast skrivna revision per save-id, så en andra
      // sparning i samma flik alltid lyckas (skriver nästa revision) även
      // om anroparens egen kopia av `game.revision` var stale. En RIKTIG
      // annan flik har sin egen modulinstans/tomma Map — dess konflikt
      // upptäcks fortfarande, se testet ovan.
      const id = 'save_cas_stale_self'
      const game = makeGame(id, 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const r1 = await saveSaveGame(game)
      expect(r1.newRevision).toBe(1)
      const r2 = await saveSaveGame(game) // samma objekt, revision fortfarande 0
      expect(r2.success).toBe(true)
      expect(r2.conflict).toBeUndefined()
      expect(r2.newRevision).toBe(2)
    })

    it('två SAMTIDIGA sparningar i samma flik (t.ex. newGame() + en omedelbar autosave för samma nya karriär) konfliktar aldrig falskt (M3)', async () => {
      // Reproducerar racet rakt av: två saveSaveGame-anrop för samma
      // nyskapade save-id, avfyrade parallellt (ingen await emellan) —
      // exakt formen på newGame()s eget fire-and-forget-anrop och
      // completeScene→persistAutosave som kan hinna köra innan det första
      // löst ut. Båda ska lyckas, i turordning, ingen dataförlust.
      const id = 'save_cas_concurrent_same_tab'
      const game = makeGame(id, 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const [r1, r2] = await Promise.all([saveSaveGame(game), saveSaveGame(game)])
      expect([r1.success, r2.success]).toEqual([true, true])
      expect([r1.conflict, r2.conflict]).toEqual([undefined, undefined])
      expect([r1.newRevision, r2.newRevision].sort()).toEqual([1, 2])
    })

    it('force:true (importSaveFromJson-flödet) skriver över trots att disken ligger före', async () => {
      const id = 'save_cas_force'
      const key = `bandy_save_${id}`
      const existing = makeGame(id, 'club_soderfors', '2025-10-02T09:00:00.000Z')
      idbStore[key] = { ...existing, revision: 5 }

      const importedGame = makeGame(id, 'club_forsbacka', '2025-10-01T10:00:00.000Z')
      const result = await saveSaveGame(importedGame, { force: true })

      expect(result.success).toBe(true)
      expect((idbStore[key] as SaveGame).managedClubId).toBe('club_forsbacka')
    })
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
    expect(getSaveRecoveryReport()).toMatchObject({
      snapshots: { attempts: 1, succeeded: 1, failed: 0 },
      restores: { attempts: 1, succeeded: 1, notFound: 0, failed: 0 },
    })
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
    expect(getSaveRecoveryReport().restores).toMatchObject({
      attempts: 1, succeeded: 0, notFound: 1, failed: 0,
    })
  })

  it('mäter snapshotfel och återläsningsfel på de verkliga kodvägarna', async () => {
    const game = makeGame('save_snap_fail', 'club_forsbacka', '2025-10-01T10:00:00.000Z')
    vi.mocked(idbSetMock).mockRejectedValueOnce(new Error('quota'))
    await snapshotSave('pre_migration', game)

    vi.mocked(idbGetMock).mockRejectedValueOnce(new Error('idb unavailable'))
    await expect(loadSaveSnapshot('bandy_snapshot_x_1_0')).rejects.toThrow('idb unavailable')

    expect(getSaveRecoveryReport()).toMatchObject({
      snapshots: { attempts: 1, succeeded: 0, failed: 1 },
      restores: { attempts: 1, succeeded: 0, notFound: 0, failed: 1 },
    })
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
