import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { AdvanceResult } from '../advanceTypes'
import {
  autoSelectLineup,
  autoResolvePendingScreen,
} from '../../../../scripts/stress/fixtures'

/**
 * Regression test for the Stickiness-audit (2026-08-17, @0b325c10) career-
 * stats doubling bug: statsProcessor.ts increments careerStats.totalGames/
 * totalGoals/totalAssists once per match, all season — so by season end
 * careerStats already equals the correct running total. seasonEndProcessor.ts
 * then ADDED seasonStats.gamesPlayed/goals/assists on top at rollover,
 * double-counting every season's contribution (48 matches became 96) and
 * compounding at every subsequent rollover, since the next season's
 * per-match accumulation started from the already-inflated base.
 *
 * Drives a real season through real rollover (same harness as
 * seasonRolloverStaleEvents.test.ts) and asserts a player's careerStats.
 * totalGames is IDENTICAL immediately before and after the season-end
 * advance — it must not grow by that season's gamesPlayed a second time.
 */

function driveOneFullSeason(seed: number): { beforeRollover: SaveGame; afterRollover: SaveGame } | null {
  const clubTemplate = CLUB_TEMPLATES[seed % CLUB_TEMPLATES.length]
  let game = createNewGame({ managerName: `Test-${seed}`, clubId: clubTemplate.id, seed })
  game = { ...game, pendingScreen: null }

  let stepSeed = seed * 100_000 + 1_000

  for (let round = 0; round < 60; round++) {
    game = autoSelectLineup(game)
    const beforeRollover = game
    const result: AdvanceResult = advanceToNextEvent(game, stepSeed++)
    game = result.game

    if (result.seasonEnded) {
      return { beforeRollover, afterRollover: game }
    }

    const resolved = autoResolvePendingScreen(game)
    if (resolved.unresolvable) return null
    game = resolved.game
  }
  return null
}

function findSeasonRollover(maxSeeds: number) {
  for (let seed = 0; seed < maxSeeds; seed++) {
    const run = driveOneFullSeason(seed)
    if (run) return run
  }
  throw new Error(`No seed among 0..${maxSeeds - 1} reached a season rollover`)
}

describe('careerStats rollover — no double-counting (Stickiness-audit)', () => {
  it('does not re-add the season\'s games/goals/assists to careerStats at rollover', () => {
    const { beforeRollover, afterRollover } = findSeasonRollover(10)

    // Pick a player who actually played this season — otherwise the
    // assertion is vacuous (0 + 0 === 0 proves nothing).
    const candidate = beforeRollover.players.find(p => (p.seasonStats?.gamesPlayed ?? 0) > 10)
    expect(candidate, 'expected at least one player with >10 games played this season').toBeDefined()

    const before = candidate!.careerStats
    const gamesPlayedThisSeason = candidate!.seasonStats!.gamesPlayed
    expect(gamesPlayedThisSeason).toBeGreaterThan(10)

    const after = afterRollover.players.find(p => p.id === candidate!.id)!.careerStats

    // The season-ending advanceToNextEvent() call can itself still process a
    // handful of trailing fixtures (e.g. the SM-final) before rollover fires
    // — statsProcessor.ts legitimately grows careerStats.totalGames by that
    // small amount within the same call, so exact equality isn't the right
    // signal. The BUG's signature is specific: seasonEndProcessor.ts re-added
    // the player's *entire* seasonStats.gamesPlayed (≈ gamesPlayedThisSeason)
    // on top — so a buggy run would show a delta close to gamesPlayedThisSeason.
    // A fixed run shows only the small trailing-fixture delta.
    const totalGamesDelta = after.totalGames - before.totalGames
    expect(
      totalGamesDelta,
      `totalGames grew by ${totalGamesDelta} at rollover (before=${before.totalGames}, after=${after.totalGames}, gamesPlayedThisSeason=${gamesPlayedThisSeason}) — a delta this close to the season's game count means the season was re-added on top of the already-accumulated career total`,
    ).toBeLessThan(gamesPlayedThisSeason / 2)
    expect(after.seasonsPlayed).toBe(before.seasonsPlayed + 1)
  })
})
