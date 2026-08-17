import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { PlayoffStatus, PendingScreen } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { AdvanceResult } from '../advanceTypes'
import {
  autoSelectLineup,
  autoResolvePendingScreen,
} from '../../../../scripts/stress/fixtures'

/**
 * Integration test for the season-rollover stale-event bug (2026-08-17, Jacobs
 * order): "rensa alla event med avslutad säsong vid rollover, inte bara kvart
 * och semi. Integrationstest genom hela kedjan final → ceremoni → årsbok →
 * premiär."
 *
 * ROOT CAUSE (found via headless simulation, not from the preliminary
 * research that kicked off this task): the actual leak was NOT primarily in
 * `pendingEvents` (that array is already wholesale-replaced at rollover in
 * seasonEndProcessor.ts) or in the single-object `pending*` fields (those are
 * unconditionally recomputed every round in roundProcessor.ts and self-heal).
 * The real leak was `game.deferredDecisions` — the KF3 interrupt-budget FIFO
 * queue (roundProcessor.ts) that events get pushed into when too many
 * actionable decisions are already queued. That array was:
 *   1. never filtered by `staleEventIds` when a playoff phase completed
 *      (only `pendingEvents` was), so a deferred "playoff_sf_<season>"
 *      Fokusera-card could survive past its own phase and resurface in the
 *      portal AFTER the club had already reached (and won) the final; and
 *   2. never cleared at all at season-end rollover, so ANY event type that
 *      happened to be sitting in the deferred queue at the moment the season
 *      ended (sponsor offers, mecenat events, breakthrough-player events,
 *      transfer bids, a lingering playoff card, ...) rode straight through
 *      the ceremony/yearbook and kept resurfacing for 10+ rounds into the
 *      new season, still dated to the finished season.
 * Confirmed empirically: a probe script driving `createHeadlessGame(2)`
 * through a season where the managed club won the SM-final showed
 * `playoff_sf_2026` reappearing in `pendingEvents` at the exact round the
 * champion was crowned (it had been sitting untouched in deferredDecisions
 * since the QF→SF transition), and season-2026-dated deferred events
 * (`patron_emerge_2026`, `event_sponsor_sponsor_5_84735`, etc.) still cycling
 * in `game.deferredDecisions` at matchday 10 of season 2027.
 *
 * The fix (in playoffProcessor.ts, roundProcessor.ts, seasonEndProcessor.ts):
 *   - playoffProcessor.ts: added the missing `wasFinalPhase` branch to
 *     staleEventIds (previously only QF/SF phases cleared their own card —
 *     literally "bara kvart och semi").
 *   - roundProcessor.ts: `staleEventIds` (and the `allNewEvents` dedup) now
 *     also filters `game.deferredDecisions`, not just `game.pendingEvents`.
 *   - seasonEndProcessor.ts: `deferredDecisions: []` added to the rollover's
 *     wholesale state reset, mirroring the existing wholesale replace of
 *     `pendingEvents: seasonEndPendingEvents`.
 *
 * This test drives real seeds through a full season (via the same
 * `advanceToNextEvent` + `autoSelectLineup` + `autoResolvePendingScreen`
 * helpers the headless stress-test uses) until it finds one where the
 * managed club reaches the SM-final, to exercise the exact chain Jacob asked
 * for: final → ceremoni (champion decided, portal visible) → årsbok
 * (SeasonSummary screen) → premiär (round 1 of the new season) — then
 * asserts no stale season-N reference survives into season N+1.
 */

interface FinalRunResult {
  seed: number
  game: SaveGame
  oldSeason: number
  sawChampionAnnounced: boolean
  deferredAtChampionRound: string[]
  pendingAtChampionRound: string[]
}

/** Drives one seed through league play + playoffs, stopping the instant the
 * bracket status flips to `Completed` (the "ceremoni" round: champion just
 * decided, portal visible, season not yet rolled over). Returns null if this
 * seed's managed club never reaches the Final phase. */
function driveToChampionRound(seed: number): FinalRunResult | null {
  const clubTemplate = CLUB_TEMPLATES[seed % CLUB_TEMPLATES.length]
  let game = createNewGame({ managerName: `Test-${seed}`, clubId: clubTemplate.id, seed })
  game = { ...game, pendingScreen: null }

  let stepSeed = seed * 100_000 + 1_000
  let everInFinal = false
  const oldSeason = game.currentSeason

  for (let round = 0; round < 60; round++) {
    game = autoSelectLineup(game)
    const result: AdvanceResult = advanceToNextEvent(game, stepSeed++)
    game = result.game

    if (game.playoffBracket?.status === PlayoffStatus.Final) everInFinal = true

    if (everInFinal && game.playoffBracket?.status === PlayoffStatus.Completed) {
      // Champion just decided — this is the "ceremoni" moment, still inside
      // the old season, portal visible (pendingScreen not yet locked).
      return {
        seed,
        game,
        oldSeason,
        sawChampionAnnounced: true,
        deferredAtChampionRound: (game.deferredDecisions ?? []).map(e => e.id),
        pendingAtChampionRound: (game.pendingEvents ?? []).map(e => e.id),
      }
    }

    const resolved = autoResolvePendingScreen(game)
    if (resolved.unresolvable) return null
    game = resolved.game

    if (result.seasonEnded) return null // rolled over without ever reaching Final
  }
  return null
}

/** Finds the first seed (within a bounded search) whose managed club reaches
 * the SM-final, so the test actually exercises the final→ceremony path
 * rather than silently passing on a season that never had a final. */
function findSeedReachingFinal(maxSeeds: number): FinalRunResult {
  for (let seed = 0; seed < maxSeeds; seed++) {
    const result = driveToChampionRound(seed)
    if (result) return result
  }
  throw new Error(`No seed among 0..${maxSeeds - 1} reached the SM-final — widen the search or check playoff generation`)
}

describe('season rollover — stale event cleanup (final → ceremoni → årsbok → premiär)', () => {
  it('finds a seed where the managed club reaches the SM-final (sanity check that the scenario is exercised)', () => {
    const run = findSeedReachingFinal(40)
    expect(run.sawChampionAnnounced).toBe(true)
    expect(run.game.playoffBracket?.status).toBe(PlayoffStatus.Completed)
  })

  it('does not leave a stale playoff_sf_/playoff_qf_ Fokusera-card sitting in deferredDecisions once the champion is decided', () => {
    const run = findSeedReachingFinal(40)
    const staleIds = [
      `playoff_qf_${run.oldSeason}`,
      `playoff_sf_${run.oldSeason}`,
    ]
    for (const id of staleIds) {
      expect(run.deferredAtChampionRound, `deferredDecisions at champion round: ${JSON.stringify(run.deferredAtChampionRound)}`).not.toContain(id)
      expect(run.pendingAtChampionRound, `pendingEvents at champion round: ${JSON.stringify(run.pendingAtChampionRound)}`).not.toContain(id)
    }
  })

  it('clears the SM-final\'s own Fokusera-card once the final is decided (previously missing — only QF/SF were cleared)', () => {
    const run = findSeedReachingFinal(40)
    const finalId = `playoff_final_${run.oldSeason}`
    expect(run.pendingAtChampionRound).not.toContain(finalId)
    expect(run.deferredAtChampionRound).not.toContain(finalId)
  })

  it('runs the full chain final → ceremoni → årsbok → premiär and carries no stale season-N event/deferred-decision into season N+1', () => {
    const run = findSeedReachingFinal(40)
    let game = run.game
    const oldSeason = run.oldSeason
    let stepSeed = run.seed * 100_000 + 50_000

    // ── One more advance(): the "no scheduled fixtures left" guard should
    // now fire handleSeasonEnd (rollover). ──────────────────────────────
    game = autoSelectLineup(game)
    let result: AdvanceResult = advanceToNextEvent(game, stepSeed++)
    game = result.game

    expect(result.seasonEnded).toBe(true)
    expect(game.currentSeason).toBe(oldSeason + 1)
    // "Årsbok" — the season summary screen is the ceremony's landing screen.
    expect(game.pendingScreen).toBe(PendingScreen.SeasonSummary)

    // Core regression assertion: deferredDecisions is the field that leaked.
    // It must be wholesale-cleared at rollover, exactly like pendingEvents.
    expect(game.deferredDecisions ?? []).toEqual([])

    // No pendingEvents id should reference the OLD season's playoff Fokusera
    // cards — those phases are long over.
    const pendingIdsAtRollover = (game.pendingEvents ?? []).map(e => e.id)
    expect(pendingIdsAtRollover).not.toContain(`playoff_qf_${oldSeason}`)
    expect(pendingIdsAtRollover).not.toContain(`playoff_sf_${oldSeason}`)
    expect(pendingIdsAtRollover).not.toContain(`playoff_final_${oldSeason}`)

    // ── Ack the season summary screen ("årsbok" read), then advance into
    // round 1 of the new season — the "premiär". ────────────────────────
    const resolved = autoResolvePendingScreen(game)
    expect(resolved.unresolvable).toBe(false)
    game = resolved.game
    expect(game.pendingScreen).toBeNull()

    game = autoSelectLineup(game)
    result = advanceToNextEvent(game, stepSeed++)
    game = result.game

    expect(result.seasonEnded).toBe(false)
    expect(result.roundPlayed).toBe(1)
    expect(game.currentSeason).toBe(oldSeason + 1)

    // ── Drive several more rounds into the new season (this is where the
    // bug actually surfaced — deferred old-season events resurfacing well
    // after the premiere, not just on round 1). ─────────────────────────
    for (let i = 0; i < 15; i++) {
      const allIds = [
        ...(game.pendingEvents ?? []).map(e => e.id),
        ...(game.deferredDecisions ?? []).map(e => e.id),
      ]
      for (const id of allIds) {
        expect(id, `stale playoff card from season ${oldSeason} found at round ${i} of season ${game.currentSeason}`)
          .not.toMatch(new RegExp(`^playoff_(qf|sf|final)_${oldSeason}$`))
      }

      game = autoSelectLineup(game)
      result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      const resolvedInner = autoResolvePendingScreen(game)
      expect(resolvedInner.unresolvable).toBe(false)
      game = resolvedInner.game

      if (result.seasonEnded) break // reached season N+2 — stop, test scope is N -> N+1
    }
  })
})
