// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeBaseGame } from '../../../screens/dev/gameStateFactory'
import { useGameStore } from '../../../store/gameStore'
import { OpponentAnalysisCard } from '../OpponentAnalysisCard'
import { CLUB_EXTENDED_INFO } from '../../../../domain/data/clubExtendedInfo'
import { FixtureStatus } from '../../../../domain/enums'
import type { Fixture } from '../../../../domain/entities/Fixture'

vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}))

beforeAll(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  useGameStore.setState({ game: null, requestDetailedAnalysis: vi.fn(() => ({ success: true })) })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

function makeFixture(homeClubId: string, awayClubId: string): Fixture {
  return {
    id: 'fx-oac-test', leagueId: 'liga', season: 8, roundNumber: 10, matchday: 10,
    homeClubId, awayClubId, status: FixtureStatus.Scheduled, homeScore: 0, awayScore: 0, events: [],
  }
}

// sluttest-b3-ui-yta (B3, BANDYSPRAK_KALLASNING_2026-08-19.md) — spela/åka-raden
// ska visas varje match, med arenaNote tillagt bara när motståndaren spelar hemma.
describe('OpponentAnalysisCard — spela/åka-raden', () => {
  it('spelande motståndare, opponent BORTA (managerad klubb hemma) — ingen arenaNote', () => {
    const game = makeBaseGame({ clubId: 'club_forsbacka' })
    const opponent = game.clubs.find(c => c.id === 'club_soderfors')!
    const fixture = makeFixture(game.managedClubId!, opponent.id)

    act(() => root.render(
      <OpponentAnalysisCard fixture={fixture} opponent={opponent} game={game} onError={() => {}} />,
    ))

    expect(container.textContent).toContain(
      `${opponent.name} spelar — passningarna kommer först, åkningen sen. Låt dem inte hitta rytmen.`,
    )
    expect(container.textContent).not.toContain(CLUB_EXTENDED_INFO['club_soderfors'].arenaNote)
  })

  it('åkande motståndare, opponent HEMMA (managerad klubb borta) — arenaNote tillagd', () => {
    const game = makeBaseGame({ clubId: 'club_soderfors' })
    const opponent = game.clubs.find(c => c.id === 'club_forsbacka')!
    const fixture = makeFixture(opponent.id, game.managedClubId!)

    act(() => root.render(
      <OpponentAnalysisCard fixture={fixture} opponent={opponent} game={game} onError={() => {}} />,
    ))

    expect(container.textContent).toContain(
      `${opponent.name} åker — de tar bollen framåt med benen. Håll zonen tät och låt dem åka in i den.`,
    )
    expect(container.textContent).toContain(CLUB_EXTENDED_INFO['club_forsbacka'].arenaNote)
  })
})
