import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { handleSeasonEnd } from '../../../../application/useCases/seasonEndProcessor'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { academyActions } from '../academyActions'

function makeStore(initialGame: SaveGame) {
  let game: SaveGame | null = initialGame
  return {
    get: () => ({ game }),
    set: (partial: Partial<{ game: SaveGame | null }>) => { if ('game' in partial) game = partial.game ?? null },
    game: () => game,
  }
}

function upgradeableGame(): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  return {
    ...base,
    currentMatchday: 7,
    academyLevel: 'basic',
    eventLedger: [],
    clubs: base.clubs.map(club => club.id === base.managedClubId
      ? { ...club, finances: 1_000_000, facilities: 70, youthQuality: 70 }
      : club),
  }
}

describe('akademiuppgradering — kanonisk start och färdigställning', () => {
  it('skriver betalningen och den utlovade nivån när uppgraderingen startar', () => {
    const store = makeStore(upgradeableGame())

    expect(academyActions(store.get, store.set).upgradeAcademy()).toEqual({ success: true })

    const game = store.game()!
    expect(game.eventLedger).toContainEqual(expect.objectContaining({
      type: 'academy_upgrade_started',
      semanticKey: `academy_upgrade_started_${game.managedClubId}_s2025_basic_developing`,
      clubId: game.managedClubId,
      subject: { kind: 'club', id: game.managedClubId },
      season: 2025,
      matchday: 7,
      significance: 40,
      academyUpgrade: { fromLevel: 'basic', toLevel: 'developing', costKr: 50_000, readySeason: 2026 },
    }))
  })

  it('skriver färdigställningen samma sommar som nivån faktiskt slår till', () => {
    const store = makeStore(upgradeableGame())
    academyActions(store.get, store.set).upgradeAcademy()

    const beforeRollover = store.game()!
    const afterRollover = handleSeasonEnd(beforeRollover, 1).game
    const entry = afterRollover.eventLedger?.find(item => item.type === 'academy_upgrade_completed')

    expect(afterRollover.academyLevel).toBe('developing')
    expect(afterRollover.academyUpgradeInProgress).toBe(false)
    expect(afterRollover.academyUpgradeSeason).toBeUndefined()
    expect(entry).toEqual(expect.objectContaining({
      semanticKey: `academy_upgrade_completed_${beforeRollover.managedClubId}_s2025_developing`,
      clubId: beforeRollover.managedClubId,
      subject: { kind: 'club', id: beforeRollover.managedClubId },
      season: 2025,
      matchday: beforeRollover.currentMatchday,
      significance: 55,
      academyUpgrade: { level: 'developing' },
    }))
  })
})
