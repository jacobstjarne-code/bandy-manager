import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { getFinalIntroScene } from '../../../../domain/data/scenes/finalIntroScene'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../infrastructure/persistence/saveGameStorage', async importOriginal => {
  const actual = await importOriginal<typeof import('../../../../infrastructure/persistence/saveGameStorage')>()
  return {
    ...actual,
    saveSaveGame: vi.fn(async (game: { revision?: number }) => ({
      success: true,
      newRevision: (game.revision ?? 0) + 1,
    })),
  }
})

const { useGameStore } = await import('../../gameStore')

function makeGame() {
  return createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
}

beforeEach(() => {
  useGameStore.setState({ game: null })
})

describe('SM-finalens uppladdningsrotation — A-M9', () => {
  it('loggar exakt de tre ramar som visades när spelaren går till avslag', () => {
    const game = makeGame()
    const fixture = game.fixtures[0]
    const scene = getFinalIntroScene(game, fixture, 'gold')
    useGameStore.setState({ game })

    useGameStore.getState().recordFinalIntroShown(fixture, 'gold')

    const added = useGameStore.getState().game?.narrativeBeatLog ?? []
    expect(added.map(entry => entry.semanticKey)).toEqual(scene.narrativeKeys)
    expect(added.every(entry => entry.season === game.currentSeason)).toBe(true)
  })

  it('roterar igenom fyra unika hero-, ingress- och keyline-ramar före omtag', () => {
    let game = makeGame()
    const fixture = game.fixtures[0]
    const heroes = new Set<string>()
    const ingresses = new Set<string>()
    const keylines = new Set<string>()

    for (let season = 0; season < 4; season++) {
      const scene = getFinalIntroScene(game, fixture, 'gold')
      heroes.add(scene.hero)
      ingresses.add(scene.ingress)
      keylines.add(scene.keyline.quote)

      useGameStore.setState({ game })
      useGameStore.getState().recordFinalIntroShown(fixture, 'gold')
      game = { ...useGameStore.getState().game!, currentSeason: game.currentSeason + 1 }
    }

    expect(heroes.size).toBe(4)
    expect(ingresses.size).toBe(4)
    expect(keylines.size).toBe(4)
  })

  it('är idempotent om startknappen skulle aktiveras två gånger', () => {
    const game = makeGame()
    const fixture = game.fixtures[0]
    useGameStore.setState({ game })

    useGameStore.getState().recordFinalIntroShown(fixture, 'gold')
    useGameStore.getState().recordFinalIntroShown(fixture, 'gold')

    expect(useGameStore.getState().game?.narrativeBeatLog).toHaveLength(3)
  })
})
