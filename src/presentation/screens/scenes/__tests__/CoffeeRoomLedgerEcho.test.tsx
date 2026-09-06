import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import type { EventLedgerEntry } from '../../../../domain/entities/Narrative'
import { toldMarksFor } from '../../../../domain/services/ledgerToldService'
import { CoffeeRoomScene } from '../CoffeeRoomScene'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

const { useGameStore } = await import('../../../store/gameStore')

function setup() {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
  const fixture = {
    ...base.fixtures[0],
    status: 'completed' as const,
    homeScore: 1,
    awayScore: 1,
  }
  const entry: EventLedgerEntry = {
    type: 'player_milestone',
    semanticKey: `coffee-room:${player.id}`,
    clubId: base.managedClubId,
    season: base.currentSeason,
    matchday: fixture.matchday,
    significance: 60,
    subject: { kind: 'player', id: player.id },
  }
  const game = {
    ...base,
    currentMatchday: fixture.matchday,
    fixtures: [fixture],
    eventLedger: [entry],
    ledgerTold: {},
    pendingScene: { sceneId: 'coffee_room' as const, triggeredAt: base.currentDate },
  }
  return { game, entry, player }
}

describe('CoffeeRoomScene — Berättaren steg 8 wiring', () => {
  it('renderar den låsta agendaraden sist i innehållet, liten och kursiv', () => {
    const { game, player } = setup()
    const html = renderToStaticMarkup(<CoffeeRoomScene game={game} onComplete={() => {}} />)
    const echoStart = html.indexOf('data-testid="coffee-room-ledger-echo"')
    const ctaStart = html.indexOf('Tillbaka till klubben')

    expect(echoStart).toBeGreaterThan(-1)
    expect(html).toContain(`Det pratas om ${player.firstName} ${player.lastName}.`)
    expect(html.slice(echoStart, ctaStart)).toContain('font-size:12px')
    expect(html.slice(echoStart, ctaStart)).toContain('font-style:italic')
    expect(echoStart).toBeLessThan(ctaStart)
  })

  it('skriver coffee_room-kvittot genom det riktiga scenavslutet', () => {
    const { game, entry } = setup()
    useGameStore.setState({ game })

    useGameStore.getState().completeScene('coffee_room')

    expect(toldMarksFor(useGameStore.getState().game?.ledgerTold, entry)).toEqual([{
      surface: 'coffee_room',
      season: game.currentSeason,
      matchday: game.currentMatchday,
    }])
  })
})
