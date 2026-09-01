import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
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

function financedGame(): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  return {
    ...base,
    financeLog: [],
    clubs: base.clubs.map(c => c.id === base.managedClubId
      ? { ...c, finances: 1_000_000, facilities: 70, youthQuality: 70 }
      : c),
  }
}

describe('spelardrivna ekonomiactions lämnar transaktionsspår', () => {
  it('loggar föreningsaktivitetens startkostnad', () => {
    const store = makeStore(financedGame())
    const result = academyActions(store.get, store.set).activateCommunity('lottery', 'basic')
    expect(result.success).toBe(true)
    expect(store.game()?.financeLog).toContainEqual(expect.objectContaining({
      amount: -1000,
      label: 'Föreningsaktivitet: Föreningslotteriet',
    }))
  })

  it('loggar akademiuppgraderingen', () => {
    const store = makeStore(financedGame())
    const result = academyActions(store.get, store.set).upgradeAcademy()
    expect(result.success).toBe(true)
    expect(store.game()?.financeLog).toContainEqual(expect.objectContaining({
      amount: -50000,
      reason: 'academy',
    }))
  })

  it('loggar den äldre anläggningsuppgraderingen', () => {
    const store = makeStore(financedGame())
    const result = academyActions(store.get, store.set).upgradeFacilities()
    expect(result.success).toBe(true)
    expect(store.game()?.financeLog).toContainEqual(expect.objectContaining({
      amount: -200000,
      label: 'Anläggningsuppgradering',
    }))
  })
})
