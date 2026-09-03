import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { migrateSaveGame } from '../saveGameMigration'

// LIGGARE-PRIO 4 (2026-09-03): SaveGame.pastSeasonSignatures retirerat — aldrig
// läst i produktion, synlig historik bärs av seasonSummaries[].signatureRubric.
// Äldre saves kan fortfarande ha fältet kvar i sin sparade JSON (ingen aktiv
// strippning); testet bevakar att migreringen tolererar det utan krasch och
// utan att det spökar tillbaka in i det nya SaveGame-formatet.
describe('migrateSaveGame — pastSeasonSignatures retirerat', () => {
  it('en gammal save med fältet fyllt migreras utan krasch', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const raw = JSON.parse(JSON.stringify(game)) as Record<string, unknown>
    raw.pastSeasonSignatures = [game.currentSeasonSignature, game.currentSeasonSignature]

    expect(() => migrateSaveGame(raw)).not.toThrow()
    const migrated = migrateSaveGame(raw) as unknown as Record<string, unknown>
    // Fältet är dött bagage, inte aktivt strippat — men currentSeasonSignature,
    // den enda faktiskt lästa vägen, ska stå kvar oskadad.
    expect(migrated.currentSeasonSignature).toBeDefined()
  })

  it('ny save saknar fältet helt', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    expect(game).not.toHaveProperty('pastSeasonSignatures')
  })
})
