import { describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

const { useGameStore } = await import('../../gameStore')

function makeFinancedGame() {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  return {
    ...base,
    financeLog: [],
    clubs: base.clubs.map(c => c.id === base.managedClubId ? { ...c, finances: 2_000_000 } : c),
  }
}

describe('gameStore — direkta ekonomiactions loggas', () => {
  it('loggar köp av scoutronder', () => {
    useGameStore.setState({ game: makeFinancedGame() })
    useGameStore.getState().buyScoutRounds()
    expect(useGameStore.getState().game?.financeLog).toContainEqual(expect.objectContaining({
      amount: -15000,
      reason: 'scout',
      label: 'Fem scoutronder',
    }))
  })

  it('loggar klubbens faktiska del av ett anläggningsbygge', () => {
    useGameStore.setState({ game: makeFinancedGame() })
    const result = useGameStore.getState().startFacilityBuildNode('varmestuga', 'club')
    expect(result.success).toBe(true)
    expect(useGameStore.getState().game?.financeLog).toContainEqual(expect.objectContaining({
      amount: -120000,
      label: 'Anläggningsbygge: Värmestuga',
    }))
  })

  it('loggar direkt anläggningsbygge till händelseliggaren utan prosa', () => {
    useGameStore.setState({ game: makeFinancedGame() })

    const result = useGameStore.getState().startFacilityBuildNode('varmestuga', 'club')
    const game = useGameStore.getState().game!

    expect(result.success).toBe(true)
    expect(game.eventLedger).toContainEqual({
      type: 'decision',
      clubId: 'club_forsbacka',
      semanticKey: 'facility_varmestuga_s2025',
      season: 2025,
      matchday: game.currentMatchday,
      subject: undefined,
      significance: 95,
      irreversible: true,
      tension: true,
      systemsAffectedCount: 3,
      moneyAmount: 120000,
      madeByPlayer: true,
    })
    expect(game.eventLedger?.at(-1)).not.toHaveProperty('sentence')
  })

  it('loggar Valet-bygget till händelseliggaren på samma sätt', () => {
    useGameStore.setState({ game: makeFinancedGame() })

    useGameStore.getState().completeScene('valet', 'varmestuga')
    const game = useGameStore.getState().game!

    expect(game.eventLedger).toContainEqual(expect.objectContaining({
      type: 'decision',
      semanticKey: 'facility_varmestuga_s2025',
      season: 2025,
      matchday: game.currentMatchday,
      systemsAffectedCount: 3,
      moneyAmount: 120000,
      madeByPlayer: true,
    }))
    expect(game.eventLedger?.at(-1)).not.toHaveProperty('sentence')
  })

  it('loggar extra kommunbidrag när ansökan beviljas', () => {
    const base = makeFinancedGame()
    useGameStore.setState({ game: {
      ...base,
      localPolitician: base.localPolitician
        ? { ...base.localPolitician, relationship: 80, agenda: 'youth' as const }
        : undefined,
    } })
    const result = useGameStore.getState().interactWithPolitician('apply')
    expect(result.success).toBe(true)
    expect(useGameStore.getState().game?.financeLog).toContainEqual(expect.objectContaining({
      reason: 'kommunstod',
      label: expect.stringContaining('Extra kommunbidrag'),
    }))
  })
})
