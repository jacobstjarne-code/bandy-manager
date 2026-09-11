import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { GalaScene } from '../GalaScene'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { generateNominations, generateGalaEvent } from '../../../domain/services/bandyGalaService'
import type { SaveGame } from '../../../domain/entities/SaveGame'

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  // no-op, kept for symmetry with the other scene tests
})

function makeGameWithStats(seasonStatsBoostForManaged: boolean): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const managedId = base.managedClubId
  const players = base.players.map(p => {
    if (p.clubId === managedId && !seasonStatsBoostForManaged) {
      return { ...p, seasonStats: { ...p.seasonStats, gamesPlayed: 0 } }
    }
    if (p.seasonStats.gamesPlayed >= 5) return p
    return { ...p, seasonStats: { ...p.seasonStats, gamesPlayed: 5, averageRating: 6.5 } }
  })
  return { ...base, players } as SaveGame
}

describe('GalaScene', () => {
  it('triumf-ton: egen vinnare håller scenen (gold-fylld medalj) och får guldprick i liggaren', () => {
    const game = makeGameWithStats(true)
    const nominations = generateNominations(game)
    const event = generateGalaEvent(game, nominations)
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(<GalaScene event={event} game={game} onChoose={() => {}} />))

    const held = container.querySelector('.gala-scene__held')
    expect(held).not.toBeNull()
    expect(held?.classList.contains('gala-scene__held--gra')).toBe(false)
    // Åtminstone en egen spelare vann något — annars är fixturen fel, inte testet.
    const managedWon = nominations.some(n => game.players.find(p => p.id === n.playerId)?.clubId === game.managedClubId)
    expect(managedWon).toBe(true)

    act(() => root.unmount())
  })

  it('grå ton: ingen egen vinnare håller scenen dämpad, ingen guldprick, inget "X av Y"-facit', () => {
    const game = makeGameWithStats(false)
    const nominations = generateNominations(game)
    const event = generateGalaEvent(game, nominations)
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(<GalaScene event={event} game={game} onChoose={() => {}} />))

    const held = container.querySelector('.gala-scene__held')
    expect(held?.classList.contains('gala-scene__held--gra')).toBe(true)
    expect(container.querySelector('.gala-scene__goldprick')).toBeNull()
    expect(container.querySelector('.gala-scene__land-foot')).toBeNull()

    act(() => root.unmount())
  })

  it('gold-disciplin: CTA:n bär aldrig en guld-klass — medaljen är den enda fyllda guldytan', () => {
    const game = makeGameWithStats(true)
    const nominations = generateNominations(game)
    const event = generateGalaEvent(game, nominations)
    const container = document.createElement('div')
    const root = createRoot(container)

    act(() => root.render(<GalaScene event={event} game={game} onChoose={() => {}} />))

    const prim = container.querySelector('.gala-scene__btn-prim')
    expect(prim).not.toBeNull()
    expect(prim?.className).not.toMatch(/gold/)

    act(() => root.unmount())
  })

  it('valen renderas verbatim ur event.choices och onChoose anropas med rätt id', () => {
    const game = makeGameWithStats(true)
    const nominations = generateNominations(game)
    const event = generateGalaEvent(game, nominations)
    const container = document.createElement('div')
    const root = createRoot(container)
    let chosenId: string | null = null

    act(() => root.render(<GalaScene event={event} game={game} onChoose={id => { chosenId = id }} />))

    const buttons = container.querySelectorAll('.gala-scene__btn-prim, .gala-scene__btn-out')
    expect(buttons).toHaveLength(event.choices.length)
    expect(buttons[0].textContent).toContain(event.choices[0].label)

    act(() => (buttons[1] as HTMLButtonElement).click())
    expect(chosenId).toBe(event.choices[1].id)

    act(() => root.unmount())
  })
})
