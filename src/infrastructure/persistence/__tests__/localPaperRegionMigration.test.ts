import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { migrateSaveGame } from '../saveGameMigration'

describe('lokaltidning — klubbens geografi är sanningskälla', () => {
  it('rättar en nationellt slumpad redaktion i en pågående Karlsborg-save', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_karlsborg', seed: 17 })
    const migrated = migrateSaveGame({
      ...game,
      localPaperName: 'Sörmlands-Posten',
      journalist: game.journalist ? { ...game.journalist, outlet: 'Sörmlands-Posten' } : undefined,
    })

    expect(migrated.localPaperName).toBe('Norra Västerbotten')
    expect(migrated.journalist?.outlet).toBe('Norra Västerbotten')
  })

  it('bevarar en redaktion som redan hör till klubbens region', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_halleforsnas', seed: 18 })
    const migrated = migrateSaveGame({
      ...game,
      localPaperName: 'Sörmlands-Posten',
      journalist: game.journalist ? { ...game.journalist, outlet: 'Sörmlands-Posten' } : undefined,
    })

    expect(migrated.localPaperName).toBe('Sörmlands-Posten')
    expect(migrated.journalist?.outlet).toBe('Sörmlands-Posten')
  })
})
