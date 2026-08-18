/**
 * SLUTTEST_KO.md 4.8 (andra halvan, 2026-08-18) — "Assistenten satte laget".
 * TeamSelection.autoSelected sätts av simulateRemainingStep()'s auto-uttagning
 * (gameFlowActions.ts) och ska synas som ManagerChoiceEntry.autoSelected på
 * started_tired-poster i managerChoiceLog — men bara när laget kom från
 * auto-uttagningen, aldrig när spelaren satte laget själv.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { advanceUntilManagedFixture } from '../../../testing/advanceUntilManagedFixture'
import { FixtureStatus } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { TeamSelection } from '../../../domain/entities/Fixture'
import { autoAssignFormation, FORMATIONS } from '../../../domain/entities/Formation'
import type { FormationType } from '../../../domain/entities/Formation'

function makeGame(): SaveGame {
  const fresh = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  // club_forsbacka/seed 42 har bye i cupkvalet, spelar första matchen matchday 5
  // (samma mönster som roundProcessor.test.ts) — drainera dit innan lineup sätts.
  return advanceUntilManagedFixture(fresh, (g, i) => advanceToNextEvent(g, i + 1).game)
}

function makeLineup(game: SaveGame, autoSelected: boolean): TeamSelection {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0)
  const club = game.clubs.find(c => c.id === game.managedClubId)!
  const formation = (club.activeTactic.formation ?? '3-3-4') as FormationType
  const lineupSlots = autoAssignFormation(FORMATIONS[formation], managedPlayers)
  const startingIds = Object.values(lineupSlots).filter(Boolean) as string[]
  const benchIds = managedPlayers.filter(p => !startingIds.includes(p.id)).map(p => p.id).slice(0, 6)
  return {
    startingPlayerIds: startingIds,
    benchPlayerIds: benchIds,
    captainPlayerId: startingIds[0] ?? undefined,
    tactic: { ...club.activeTactic, formation, lineupSlots },
    ...(autoSelected && { autoSelected: true }),
  }
}

function findManagedStartedTiredFixture(game: SaveGame, managedClubId: string) {
  return game.fixtures.find(f =>
    (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
    f.status === FixtureStatus.Completed &&
    f.report?.managerChoiceLog?.some(e => e.type === 'started_tired')
  )
}

describe('4.8 (andra halvan) — autoSelected syns i started_tired-loggen', () => {
  it('markerar started_tired med autoSelected:true när laget kom från auto-uttagningen', () => {
    const base = makeGame()
    const lineup = makeLineup(base, true)
    const tiredId = lineup.startingPlayerIds[0]
    const game: SaveGame = {
      ...base,
      players: base.players.map(p => (p.id === tiredId ? { ...p, fitness: 25 } : p)),
      managedClubPendingLineup: lineup,
    }

    const result = advanceToNextEvent(game, 1)
    const fixture = findManagedStartedTiredFixture(result.game, game.managedClubId)
    expect(fixture).toBeDefined()

    const entry = fixture!.report!.managerChoiceLog!.find(e => e.type === 'started_tired' && e.playerId === tiredId)
    expect(entry).toBeDefined()
    expect(entry?.autoSelected).toBe(true)
  })

  it('lämnar autoSelected osatt när spelaren satte laget själv', () => {
    const base = makeGame()
    const lineup = makeLineup(base, false)
    const tiredId = lineup.startingPlayerIds[0]
    const game: SaveGame = {
      ...base,
      players: base.players.map(p => (p.id === tiredId ? { ...p, fitness: 25 } : p)),
      managedClubPendingLineup: lineup,
    }

    const result = advanceToNextEvent(game, 1)
    const fixture = findManagedStartedTiredFixture(result.game, game.managedClubId)
    expect(fixture).toBeDefined()

    const entry = fixture!.report!.managerChoiceLog!.find(e => e.type === 'started_tired' && e.playerId === tiredId)
    expect(entry).toBeDefined()
    expect(entry?.autoSelected).toBeUndefined()
  })
})
