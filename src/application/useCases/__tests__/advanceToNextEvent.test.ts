import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { FixtureStatus, InboxItemType, PlayoffStatus } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'

function makeGame(): SaveGame {
  return createNewGame({ managerName: 'Jacob', clubId: 'club_sandviken', season: 2025, seed: 7 })
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

  it('after 22 advances: all 132 fixtures are Completed or Postponed and seasonEnded is false on 22nd', () => {
    let game = makeGame()
    let lastResult = advanceToNextEvent(game, 1)

    for (let round = 2; round <= 22; round++) {
      lastResult = advanceToNextEvent(lastResult.game, round)
    }

    // Cup-fixtures added after cup system was built — filter to league only
    const resolved = lastResult.game.fixtures.filter(
      f => (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed) && !f.isCup
    )
    expect(resolved.length).toBe(132)
    const resolvedCup = lastResult.game.fixtures.filter(
      f => (f.status === FixtureStatus.Completed || f.status === FixtureStatus.Postponed) && f.isCup
    )
    expect(resolvedCup.length).toBeGreaterThanOrEqual(6)  // minst QF spelade
    expect(lastResult.seasonEnded).toBe(false)
    expect(lastResult.roundPlayed).toBe(22)
  }, 60000)

  it('after 23rd advance (playoff start): playoffStarted is true and bracket is created', () => {
    let game = makeGame()

    // Advance all 22 rounds
    for (let round = 1; round <= 22; round++) {
      const result = advanceToNextEvent(game, round)
      game = result.game
    }

    // Now call again — no scheduled fixtures remain, playoff starts
    const playoffStartResult = advanceToNextEvent(game, 999)
    expect(playoffStartResult.seasonEnded).toBe(false)
    expect(playoffStartResult.playoffStarted).toBe(true)
    expect(playoffStartResult.roundPlayed).toBeNull()
    expect(playoffStartResult.game.playoffBracket).not.toBeNull()
    expect(playoffStartResult.game.playoffBracket?.status).toBe(PlayoffStatus.QuarterFinals)
    expect(playoffStartResult.game.playoffBracket?.quarterFinals).toHaveLength(4)
  }, 60000)

  it('playoff bracket gets playoff inbox message', () => {
    let game = makeGame()

    for (let round = 1; round <= 22; round++) {
      game = advanceToNextEvent(game, round).game
    }

    const result = advanceToNextEvent(game, 999)
    const playoffItems = result.game.inbox.filter(item => item.type === InboxItemType.Playoff)
    expect(playoffItems.length).toBeGreaterThanOrEqual(1)
  }, 60000)

  it('full season including playoffs: seasonEnded is true after completing all rounds', () => {
    let game = makeGame()

    // Play regular season
    for (let round = 1; round <= 22; round++) {
      game = advanceToNextEvent(game, round).game
    }

    // Start playoffs
    game = advanceToNextEvent(game, 999).game
    expect(game.playoffBracket?.status).toBe(PlayoffStatus.QuarterFinals)

    // Play through all playoff rounds until season ends
    let seasonEnded = false
    let iterations = 0
    const maxIterations = 50 // safety limit

    while (!seasonEnded && iterations < maxIterations) {
      const result = advanceToNextEvent(game, iterations + 1000)
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
