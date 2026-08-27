/**
 * PÅSTÅENDEKARTAN (2026-08-24) — narrativeLog döpt om på tre register
 * (namnkollision, se SLUTTEST_KO.md post 58): SaveGame.narrativeLog →
 * narrativeBeatLog, Player.narrativeLog → diary, ManagerProfile.narrativeLog
 * → diary. Ett naivt fältbyte utan migration hade tyst amputerat all
 * befintlig data för spelare som redan har en save — en managers
 * burnout/era-shift-historik eller en veterans hela karriärdagbok försvinner
 * annars ljudlöst vid nästa laddning. Detta testet simulerar en GAMMAL save
 * (legacy-fältnamnen, byggda om från en riktig createNewGame-save så formen
 * är verklighetstrogen) och verifierar att migrateSaveGame flyttar datan,
 * inte bara defaultar tomt.
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../saveGameMigration'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

function makeLegacySave() {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const playerId = game.players[0].id

  // Bygg om till legacy-formen: samma tre fält, gamla namnet, riktig data.
  const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
  raw.narrativeLog = [{ semanticKey: 'communityEvent', season: 1, round: 3 }]
  delete raw.narrativeBeatLog

  const mp = raw.managerProfile as Record<string, unknown>
  mp.narrativeLog = [{ season: 1, matchday: 0, type: 'arrival', text: 'Du tog över klubben.' }]
  delete mp.diary

  raw.players = (raw.players as Record<string, unknown>[]).map(p =>
    p.id === playerId
      ? { ...p, narrativeLog: [{ season: 1, matchday: 5, type: 'milestone', text: 'Första målet.' }], diary: undefined }
      : p
  )

  return { raw, playerId }
}

describe('migrateSaveGame — narrativeLog-omdöpningen (PÅSTÅENDEKARTAN)', () => {
  it('SaveGame.narrativeLog flyttas till narrativeBeatLog, gammalt fält borta', () => {
    const { raw } = makeLegacySave()
    const migrated = migrateSaveGame(raw)
    expect(migrated.narrativeBeatLog).toEqual([{ semanticKey: 'communityEvent', season: 1, round: 3 }])
    expect((migrated as unknown as Record<string, unknown>).narrativeLog).toBeUndefined()
  })

  it('ManagerProfile.narrativeLog flyttas till diary med datan intakt', () => {
    const { raw } = makeLegacySave()
    const migrated = migrateSaveGame(raw)
    expect(migrated.managerProfile?.diary).toEqual([
      { season: 1, matchday: 0, type: 'arrival', text: 'Du tog över klubben.' },
    ])
  })

  it('Player.narrativeLog flyttas till diary för den specifika spelaren', () => {
    const { raw, playerId } = makeLegacySave()
    const migrated = migrateSaveGame(raw)
    const player = migrated.players.find(p => p.id === playerId)!
    expect(player.diary).toEqual([{ season: 1, matchday: 5, type: 'milestone', text: 'Första målet.' }])
    expect((player as unknown as Record<string, unknown>).narrativeLog).toBeUndefined()
  })

  it('en save som redan har de NYA fältnamnen (aktuell save) rörs inte', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 2 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.narrativeBeatLog = [{ semanticKey: 'x', season: 1, round: 1 }]
    const migrated = migrateSaveGame(raw)
    expect(migrated.narrativeBeatLog).toEqual([{ semanticKey: 'x', season: 1, round: 1 }])
  })
})
