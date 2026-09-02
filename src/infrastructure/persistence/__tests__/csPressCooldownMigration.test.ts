import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { migrateSaveGame } from '../saveGameMigration'

describe('migrateSaveGame — csPress-cooldown', () => {
  it('tolkar saknat ankare som ingen tidigare CS-press, inte matchday 0', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    delete raw.lastCSPressMatchday

    expect(migrateSaveGame(raw).lastCSPressMatchday).toBeUndefined()
  })
})
