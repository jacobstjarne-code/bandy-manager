/**
 * 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18) — de två store-skrivvägarna som
 * inte täcks av seasonEndProcessor.ts:s egna tester: academyActions.ts:s
 * promotedFromAcademy-append (kan hända när som helst under säsongen, inte
 * bara vid övergången) och passSeasonTransition (återinträdesguarden).
 */
import { describe, it, expect, vi } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}))

const { useGameStore } = await import('../../gameStore')

function makeGame() {
  return createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
}

describe('promoteYouthPlayer — pendingSeasonTransitionEvents (academyActions.ts)', () => {
  it('lägger till ett promoted-event när en akademispelare flyttas upp', () => {
    const game = makeGame()
    const youthPlayer = game.youthTeam?.players[0]
    expect(youthPlayer).toBeDefined()

    useGameStore.setState({ game })
    const result = useGameStore.getState().promoteYouthPlayer(youthPlayer!.id)
    expect(result.success).toBe(true)

    const events = useGameStore.getState().game?.pendingSeasonTransitionEvents ?? []
    const promotedEvent = events.find(e => e.type === 'promoted')
    expect(promotedEvent).toBeDefined()
    expect(promotedEvent?.playerLastName).toBe(youthPlayer!.lastName)

    const promotedPlayerId = `player_promoted_${youthPlayer!.id}_${game.currentSeason}`
    expect(useGameStore.getState().game?.eventLedger).toContainEqual(expect.objectContaining({
      type: 'academy_promotion',
      season: game.currentSeason,
      subject: { kind: 'player', id: promotedPlayerId },
      significance: 55,
    }))
  })

  it('flera uppflyttningar under samma säsong ackumuleras, skriver inte över varandra', () => {
    const game = makeGame()
    const [p1, p2] = game.youthTeam?.players ?? []
    expect(p1).toBeDefined()
    expect(p2).toBeDefined()

    useGameStore.setState({ game })
    useGameStore.getState().promoteYouthPlayer(p1.id)
    useGameStore.getState().promoteYouthPlayer(p2.id)

    const events = (useGameStore.getState().game?.pendingSeasonTransitionEvents ?? []).filter(e => e.type === 'promoted')
    expect(events).toHaveLength(2)
  })
})

describe('passSeasonTransition (5.1 Sommaren — återinträdesguard)', () => {
  it('sätter seasonGoalChosenForSeason till currentSeason och tömmer eventlistan', () => {
    const game = {
      ...makeGame(),
      pendingSeasonTransitionEvents: [{ type: 'retired' as const, playerId: 'p1', playerLastName: 'Berglund' }],
    }
    useGameStore.setState({ game })

    useGameStore.getState().passSeasonTransition()

    const after = useGameStore.getState().game
    expect(after?.seasonGoalChosenForSeason).toBe(game.currentSeason)
    expect(after?.pendingSeasonTransitionEvents).toEqual([])
  })

  it('utan game laddat — no-op, kastar inte', () => {
    useGameStore.setState({ game: null })
    expect(() => useGameStore.getState().passSeasonTransition()).not.toThrow()
  })

  // O3 (DOM_EGET_SASONGSMAL_2026-08-17.md, 2026-08-19)
  it('med ett valt mål — skriver activeSeasonGoal med chosenSeason', () => {
    const game = makeGame()
    useGameStore.setState({ game })

    useGameStore.getState().passSeasonTransition({ type: 'playoff' })

    const after = useGameStore.getState().game
    expect(after?.activeSeasonGoal).toEqual({ type: 'playoff', chosenSeason: game.currentSeason })
  })

  it('utan mål ("Inget särskilt i år") — activeSeasonGoal förblir odefinierat', () => {
    const game = makeGame()
    useGameStore.setState({ game })

    useGameStore.getState().passSeasonTransition()

    expect(useGameStore.getState().game?.activeSeasonGoal).toBeUndefined()
  })

  it('personligt spelarmål stämplas som managerägd liggarpost, idempotent', () => {
    const game = makeGame()
    const player = game.players.find(candidate => candidate.clubId === game.managedClubId)!
    useGameStore.setState({ game })

    useGameStore.getState().passSeasonTransition({ type: 'playerCarry', referenceId: player.id })
    useGameStore.getState().passSeasonTransition({ type: 'playerCarry', referenceId: player.id })

    const entries = useGameStore.getState().game?.eventLedger?.filter(entry =>
      entry.semanticKey.endsWith(':manager_personal_goal'),
    )
    expect(entries).toEqual([expect.objectContaining({
      type: 'player_milestone',
      clubId: game.managedClubId,
      managerId: game.id,
      subject: { kind: 'player', id: player.id },
      madeByPlayer: true,
    })])
  })
})
