import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CURRENT_SAVE_VERSION, migrateSaveGame } from '../saveGameMigration'

describe('ledgerTold save-schema', () => {
  it('skapar tomt told-register i nya spel utan att ändra liggarens optional-kontrakt', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 17 })
    expect(game.eventLedger).toBeUndefined()
    expect(game.ledgerTold).toEqual({})
    expect(game.version).toBe(CURRENT_SAVE_VERSION)
  })

  it('migrerar saknat register till tomt utan att röra ett befintligt register', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 18 })
    const { ledgerTold: _removed, ...legacy } = game
    expect(migrateSaveGame({ ...legacy, version: '0.3.8' }).ledgerTold).toEqual({})

    const existing = {
      '["decision","choice",1,3]': [{ surface: 'portal' as const, season: 1, matchday: 3 }],
    }
    expect(migrateSaveGame({ ...game, ledgerTold: existing }).ledgerTold).toEqual(existing)
  })

  it('stämplar legacy-poster från klubbperioden och märker en osäker fallback', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2028, seed: 19 })
    const priorClubId = game.clubs.find(club => club.id !== game.managedClubId)!.id
    const migrated = migrateSaveGame({
      ...game,
      seasonSummaries: [],
      managerProfile: {
        ...game.managerProfile!,
        clubSpells: [
          { clubId: priorClubId, clubName: 'Förra klubben', fromSeason: 2026, toSeason: 2027 },
          { clubId: game.managedClubId, clubName: 'Nuvarande klubben', fromSeason: 2028 },
        ],
      },
      eventLedger: [{
        type: 'decision', semanticKey: 'old_choice', season: 2027, matchday: 4, significance: 70,
      }, {
        type: 'decision', semanticKey: 'unknown_choice', season: 2025, matchday: 4, significance: 70,
      }],
    })

    expect(migrated.eventLedger?.[0]).toMatchObject({ clubId: priorClubId, managerId: game.id })
    expect(migrated.eventLedger?.[0].clubIdInferred).toBeUndefined()
    expect(migrated.eventLedger?.[1]).toMatchObject({
      clubId: game.managedClubId,
      clubIdInferred: true,
      managerId: game.id,
    })
  })

  it('backfillar personligt spelarmål med managerId, men inte vanliga milstolpar', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2028, seed: 20 })
    const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
    const migrated = migrateSaveGame({
      ...game,
      seasonSummaries: [{
        season: 2027,
        clubId: game.managedClubId,
        personalGoal: { type: 'playerCarry', referenceId: player.id, outcome: 'met' },
      }],
      eventLedger: [{
        type: 'player_milestone', semanticKey: 'ordinary', clubId: game.managedClubId,
        season: 2027, matchday: 4, subject: { kind: 'player', id: player.id }, significance: 40,
      }],
    })

    expect(migrated.eventLedger?.find(entry => entry.semanticKey === 'ordinary')?.managerId).toBeUndefined()
    expect(migrated.eventLedger?.find(entry => entry.semanticKey.endsWith(':manager_personal_goal')))
      .toMatchObject({ clubId: game.managedClubId, managerId: game.id, subject: { kind: 'player', id: player.id } })
  })
})
