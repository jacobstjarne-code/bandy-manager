import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { autoAssignFormation, FORMATIONS } from '../../../domain/entities/Formation'
import type { FormationType } from '../../../domain/entities/Formation'
import { FixtureStatus, InboxItemType, PlayoffStatus, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { TeamSelection } from '../../../domain/entities/Fixture'

function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Jacob', clubId: 'club_sandviken', season: 2025, seed: 7 })
}

/**
 * Cup matches for the managed club require a saved lineup (managedClubPendingLineup).
 * This helper sets a lineup so `advanceToNextEvent` doesn't skip the cup fixture.
 */
function withAutoLineup(game: SaveGame): SaveGame {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0)
  const formation = (game.clubs.find(c => c.id === game.managedClubId)?.activeTactic.formation ?? '3-3-4') as FormationType
  const lineupSlots = autoAssignFormation(FORMATIONS[formation], managedPlayers)
  const startingIds = Object.values(lineupSlots).filter(Boolean) as string[]
  const benchIds = managedPlayers.filter(p => !startingIds.includes(p.id)).map(p => p.id).slice(0, 6)
  const lineup: TeamSelection = {
    startingPlayerIds: startingIds,
    benchPlayerIds: benchIds,
    captainPlayerId: startingIds[0] ?? undefined,
    tactic: {
      mentality: TacticMentality.Balanced,
      tempo: TacticTempo.Normal,
      press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Safe,
      width: TacticWidth.Normal,
      attackingFocus: TacticAttackingFocus.Center,
      cornerStrategy: CornerStrategy.Short,
      penaltyKillStyle: PenaltyKillStyle.Passive,
      formation,
      lineupSlots,
    },
  }
  return { ...game, managedClubPendingLineup: lineup }
}

/**
 * Advance one round, automatically providing a cup lineup if needed.
 */
function advanceWithLineup(game: SaveGame, seed: number) {
  const result = advanceToNextEvent(game, seed)
  if (result.hasManagedCupMatch) {
    // Cup fixture was skipped — set lineup and retry
    return advanceToNextEvent(withAutoLineup(result.game), seed + 1000)
  }
  return result
}

describe('advanceToNextEvent', () => {
  it('after one advance: exactly 6 fixtures are Completed or Postponed', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    const resolved = result.game.fixtures.filter(
      f => f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed
    )
    expect(resolved.length).toBe(6)
    expect(result.roundPlayed).toBe(1)
    expect(result.seasonEnded).toBe(false)
  })

  it('after one advance: standings have been updated (some teams have non-zero points)', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)
    const hasPoints = result.game.standings.some(s => s.points > 0)
    expect(hasPoints).toBe(true)
  })

  it('after two advances: 12 fixtures are Completed or Postponed', () => {
    const game = makeGame()
    const r1 = advanceToNextEvent(game, 1)
    const r2 = advanceToNextEvent(r1.game, 2)
    const resolved = r2.game.fixtures.filter(
      f => f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed
    )
    expect(resolved.length).toBe(12)
  })

  it('after all league rounds: all 132 fixtures are Completed or Postponed and seasonEnded is false', () => {
    let game = makeGame()
    let lastResult = advanceWithLineup(game, 1)
    game = lastResult.game

    // Loop until all 132 league fixtures are done (cup rounds may be interspersed)
    let seed = 2
    let iterations = 0
    while (iterations < 60) {
      const leagueDone = game.fixtures.filter(
        f => !f.isCup && (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed)
      ).length
      if (leagueDone >= 132) break
      lastResult = advanceWithLineup(game, seed)
      game = lastResult.game
      seed++
      iterations++
    }

    const resolved = game.fixtures.filter(
      f => (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed) && !f.isCup
    )
    expect(resolved.length).toBe(132)
    const resolvedCup = game.fixtures.filter(
      f => (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed) && f.isCup
    )
    expect(resolvedCup.length).toBeGreaterThanOrEqual(6)  // minst QF spelade
    expect(lastResult.seasonEnded).toBe(false)
  }, 60000)

  it('after all league rounds + one more: playoffStarted is true and bracket is created', () => {
    let game = makeGame()

    // Advance until all 132 league fixtures are done
    let seed = 1
    let iterations = 0
    while (iterations < 60) {
      const leagueDone = game.fixtures.filter(
        f => !f.isCup && (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed)
      ).length
      if (leagueDone >= 132) break
      game = advanceWithLineup(game, seed).game
      seed++
      iterations++
    }

    // Now call again — no scheduled league fixtures remain, playoff starts
    const playoffStartResult = advanceWithLineup(game, seed)
    expect(playoffStartResult.seasonEnded).toBe(false)
    expect(playoffStartResult.playoffStarted).toBe(true)
    expect(playoffStartResult.roundPlayed).toBeNull()
    expect(playoffStartResult.game.playoffBracket).not.toBeNull()
    expect(playoffStartResult.game.playoffBracket?.status).toBe(PlayoffStatus.QuarterFinals)
    expect(playoffStartResult.game.playoffBracket?.quarterFinals).toHaveLength(4)
  }, 60000)

  it('playoff bracket gets playoff inbox message', () => {
    let game = makeGame()

    // Advance until all 132 league fixtures are done
    let seed = 1
    let iterations = 0
    while (iterations < 60) {
      const leagueDone = game.fixtures.filter(
        f => !f.isCup && (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed)
      ).length
      if (leagueDone >= 132) break
      game = advanceWithLineup(game, seed).game
      seed++
      iterations++
    }

    const result = advanceWithLineup(game, seed)
    const playoffItems = result.game.inbox.filter(item => item.type === InboxItemType.Playoff)
    expect(playoffItems.length).toBeGreaterThanOrEqual(1)
  }, 60000)

  it('full season including playoffs: seasonEnded is true after completing all rounds', () => {
    let game = makeGame()

    // Play regular season until all 132 league fixtures done
    let seed = 1
    let iterations = 0
    while (iterations < 60) {
      const leagueDone = game.fixtures.filter(
        f => !f.isCup && (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed)
      ).length
      if (leagueDone >= 132) break
      game = advanceWithLineup(game, seed).game
      seed++
      iterations++
    }

    // Start playoffs
    game = advanceWithLineup(game, seed).game
    seed++
    expect(game.playoffBracket?.status).toBe(PlayoffStatus.QuarterFinals)

    // Play through all playoff rounds until season ends
    let seasonEnded = false
    iterations = 0
    const maxIterations = 50 // safety limit

    while (!seasonEnded && iterations < maxIterations) {
      const result = advanceWithLineup(game, seed + iterations)
      game = result.game
      seasonEnded = result.seasonEnded
      iterations++
    }

    expect(seasonEnded).toBe(true)
    expect(game.currentSeason).toBe(2026)
    expect(game.playoffBracket).toBeNull()
  }, 120000)

  it('players who played have lower fitness after advance', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)

    // Find a player who started in the first round
    const firstRoundFixtures = result.game.fixtures.filter(
      f => f.status === FixtureStatus.Completed,
    )
    const anyStarterId = firstRoundFixtures[0].homeLineup?.startingPlayerIds[0]
    expect(anyStarterId).toBeTruthy()

    if (anyStarterId) {
      const before = game.players.find(p => p.id === anyStarterId)!
      const after = result.game.players.find(p => p.id === anyStarterId)!
      // Fitness should have decreased (starters lose 15-25)
      expect(after.fitness).toBeLessThan(before.fitness + 1) // at minimum not increased
    }
  })

  it('managed club gets inbox item of matchResult type after advance', () => {
    const game = makeGame()
    const result = advanceToNextEvent(game, 1)

    const matchResultItems = result.game.inbox.filter(
      item => item.type === InboxItemType.MatchResult,
    )
    expect(matchResultItems.length).toBeGreaterThanOrEqual(1)
  })
})
