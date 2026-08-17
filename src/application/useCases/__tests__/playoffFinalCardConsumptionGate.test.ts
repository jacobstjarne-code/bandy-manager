import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { advanceToNextEvent } from '../advanceToNextEvent'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { PlayoffStatus, FixtureStatus } from '../../../domain/enums'
import { updateSeriesAfterMatch } from '../../../domain/services/playoffService'
import { generateSemiFinalEvent } from '../../../domain/services/playoffNarrativeService'
import { matchActions } from '../../../presentation/store/actions/matchActions'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { MatchReport, TeamSelection } from '../../../domain/entities/Fixture'
import type { AdvanceResult } from '../advanceTypes'
import {
  autoSelectLineup,
  autoResolvePendingScreen,
} from '../../../../scripts/stress/fixtures'

/**
 * Regression test for A3 (2026-08-17, LÅNGSPEL-audit — "samma familj som H-02").
 *
 * OBSERVED BUG (10-season live playtest): after the managed club was knocked
 * out in the playoffs, the game still fired a stale playoff Fokusera-card
 * for a phase the club was no longer part of — "Finalen. Birger…" — even
 * though the club was already eliminated.
 *
 * ROOT CAUSE (found by tracing the actual code, not by assumption):
 *
 * playoffProcessor.ts (invoked from roundProcessor.ts's advanceToNextEvent)
 * already gates card GENERATION correctly (`managedInNewBracket`), and H-02
 * (same session) already gates most stale-queue cases via `staleEventIds`,
 * applied to both `pendingEvents` and `deferredDecisions` — but only when
 * `processPlayoffRound` itself DETECTS a phase transition that round.
 *
 * There is a second, real code path that transitions `game.playoffBracket`
 * WITHOUT ever going through `processPlayoffRound`: `matchActions.ts`'s
 * `saveLiveMatchResult` (invoked when the player watches THEIR OWN match
 * live — including a playoff-deciding game) updates `game.playoffBracket`
 * directly via the same domain functions (`updateSeriesAfterMatch` +
 * `advancePlayoffRound`), but — verified by reading matchActions.ts before
 * this fix — never touched `pendingEvents`/`deferredDecisions` at all.
 *
 * Concretely: if the managed club's SF-deciding match is played LIVE and
 * that match ALSO happens to be the last of the two SF series to decide,
 * `saveLiveMatchResult` advances `bracket.status` straight from
 * `SemiFinals` to `Final` in that one store call — bypassing
 * playoffProcessor.ts entirely. Immediately afterwards — before the player
 * has even clicked "advance" again — the Portal reads `game.pendingEvents`/
 * `deferredDecisions` to decide what to show. If the "Semifinalen" (or,
 * symmetrically, "Finalen") card was sitting there deferred (KF3's budget
 * queue can hold a card for many rounds), it is now stale — the phase it
 * belonged to is already over — but nothing has purged it yet: staleEventIds
 * (H-02) never ran, because that mechanism only fires inside
 * processPlayoffRound, which this path never calls.
 *
 * THE FIX: playoffNarrativeService.ts's new `isPlayoffNarrativeCardStillValid`
 * re-derives validity from the LIVE bracket, reusing the existing
 * `getManagedClubPlayoffStatus` bracket query (playoffService.ts). It is
 * wired into TWO places:
 *   1. roundProcessor.ts's pendingEvents/deferredDecisions filters, next to
 *      staleEventIds (same spot H-02 extended) — covers the normal
 *      round-by-round path.
 *   2. matchActions.ts's saveLiveMatchResult AND concedeWalkover, right
 *      where they mutate playoffBracket directly — this is the fix this
 *      test exercises, since it's the actual gap: the moment of consumption
 *      (the Portal render right after the live match) happens BEFORE any
 *      advanceToNextEvent() call could otherwise catch it.
 *
 * TEST STRATEGY: drives a REAL season (advanceToNextEvent + autoSelectLineup
 * + autoResolvePendingScreen, same helpers as seasonRolloverStaleEvents.test.ts)
 * until the managed club legitimately reaches the semifinal with its own
 * series still undecided (genuine driven state, not hand-built). The real
 * generateSemiFinalEvent() production function places the "Semifinalen"
 * card in deferredDecisions if it isn't already queued (the KF3 budget
 * queue's unrelated churn over a season doesn't reliably leave it queued by
 * kickoff — a separate, out-of-scope finding). The OTHER (non-managed) SF
 * series is then driven to a decided state using the real
 * updateSeriesAfterMatch domain function. Finally, `matchActions(get, set)
 * .saveLiveMatchResult(...)` — the REAL, unmodified production store action
 * — is called directly for the managed club's SF-deciding fixture, losing
 * it, which is ALSO now the last series to decide (the exact condition that
 * makes staleEventIds blind). The test asserts the stale card is gone
 * immediately after that single call — no advanceToNextEvent() involved —
 * matching what the Portal would actually render to the player next.
 */

function driveToSemiFinalReached(seed: number): { game: SaveGame; season: number } | null {
  const clubTemplate = CLUB_TEMPLATES[seed % CLUB_TEMPLATES.length]
  let game: SaveGame = createNewGame({ managerName: `Test-${seed}`, clubId: clubTemplate.id, seed })
  game = { ...game, pendingScreen: null }
  let stepSeed = seed * 100_000 + 1_000

  for (let round = 0; round < 60; round++) {
    game = autoSelectLineup(game)
    const result: AdvanceResult = advanceToNextEvent(game, stepSeed++)
    game = result.game

    if (game.playoffBracket?.status === PlayoffStatus.SemiFinals) {
      const mySeries = game.playoffBracket.semiFinals.find(
        s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId,
      )
      if (mySeries && mySeries.winnerId === null) {
        return { game, season: game.currentSeason }
      }
    }

    const resolved = autoResolvePendingScreen(game)
    if (resolved.unresolvable) return null
    game = resolved.game

    if (result.seasonEnded) return null
  }
  return null
}

function findSeedReachingSemiFinal(maxSeeds: number): { game: SaveGame; season: number; seed: number } {
  for (let seed = 0; seed < maxSeeds; seed++) {
    const run = driveToSemiFinalReached(seed)
    if (run) return { ...run, seed }
  }
  throw new Error(`No seed among 0..${maxSeeds - 1} reached the semifinal with an undecided own series`)
}

/** Ensures the "Semifinalen" card is present in deferredDecisions, using the
 * real production generateSemiFinalEvent() — mirroring what roundProcessor.ts
 * puts there at the QF→SF transition, without depending on it having
 * survived the KF3 budget queue's unrelated churn over a full season. */
function ensureSfCardQueued(game: SaveGame, season: number): SaveGame {
  const sfId = `playoff_sf_${season}`
  const alreadyThere =
    (game.pendingEvents ?? []).some(e => e.id === sfId) ||
    (game.deferredDecisions ?? []).some(e => e.id === sfId)
  if (alreadyThere) return game
  return {
    ...game,
    deferredDecisions: [...(game.deferredDecisions ?? []), generateSemiFinalEvent(game)],
  }
}

type PlayoffSeries = NonNullable<SaveGame['playoffBracket']>['semiFinals'][number]

/** Plays out fixtures for a series (via the real updateSeriesAfterMatch
 * domain function), always awarding the win to `winnerClubId`, until either
 * the series is fully decided (stopAtOneWinShort=false) or it is exactly one
 * win away from being decided (stopAtOneWinShort=true — leaves the final,
 * decisive fixture scheduled so the caller can play it separately, e.g. LIVE
 * via matchActions.ts). Returns the updated game plus the resulting series. */
function advanceSeries(
  game: SaveGame,
  seriesId: string,
  winnerClubId: string,
  stopAtOneWinShort: boolean,
): { game: SaveGame; series: PlayoffSeries } {
  const bracket = game.playoffBracket!
  let series = [...bracket.quarterFinals, ...bracket.semiFinals, ...(bracket.final ? [bracket.final] : [])]
    .find(s => s.id === seriesId)!
  const winsNeeded = 3
  let fixtures = game.fixtures
  for (const fixtureId of series.fixtures) {
    if (series.winnerId !== null) break
    if (stopAtOneWinShort) {
      const winsSoFar = series.homeClubId === winnerClubId ? series.homeWins : series.awayWins
      if (winsSoFar === winsNeeded - 1) break // one win away — leave this fixture scheduled
    }
    const fixture = fixtures.find(f => f.id === fixtureId)!
    if (fixture.status === FixtureStatus.Completed) continue
    const winnerIsHome = fixture.homeClubId === winnerClubId
    const completed = {
      ...fixture,
      homeScore: winnerIsHome ? 5 : 1,
      awayScore: winnerIsHome ? 1 : 5,
      status: FixtureStatus.Completed,
      events: [],
    }
    fixtures = fixtures.map(f => f.id === fixtureId ? completed : f)
    series = updateSeriesAfterMatch(series, completed)
  }
  return {
    game: {
      ...game,
      fixtures,
      playoffBracket: {
        ...bracket,
        quarterFinals: bracket.quarterFinals.map(s => s.id === series.id ? series : s),
        semiFinals: bracket.semiFinals.map(s => s.id === series.id ? series : s),
        final: bracket.final?.id === series.id ? series : bracket.final,
      },
    },
    series,
  }
}

function makeTeamSelection(game: SaveGame, clubId: string): TeamSelection {
  const club = game.clubs.find(c => c.id === clubId)!
  const squad = game.players.filter(p => p.clubId === clubId).slice(0, 16)
  return {
    startingPlayerIds: squad.slice(0, 11).map(p => p.id),
    benchPlayerIds: squad.slice(11, 16).map(p => p.id),
    tactic: club.activeTactic,
  }
}

function makeEmptyReport(): MatchReport {
  return {
    playerRatings: {},
    shotsHome: 10, shotsAway: 10,
    onTargetHome: 5, onTargetAway: 5,
    savesHome: 3, savesAway: 3,
    cornersHome: 4, cornersAway: 4,
    penaltiesHome: 0, penaltiesAway: 0,
    possessionHome: 50, possessionAway: 50,
  }
}

describe('A3 — playoff Fokusera-card consumption-time gate (matchActions.ts live-match bypass)', () => {
  it('sanity check: a driven seed legitimately reaches the semifinal with its own series still undecided', () => {
    const { game } = findSeedReachingSemiFinal(60)
    expect(game.playoffBracket?.status).toBe(PlayoffStatus.SemiFinals)
    const mySeries = game.playoffBracket!.semiFinals.find(
      s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId,
    )
    expect(mySeries).toBeDefined()
    expect(mySeries!.winnerId).toBeNull()
  })

  it('purges the stale "Semifinalen"-card the moment saveLiveMatchResult eliminates the managed club and completes the SF phase in the same call — before any advanceToNextEvent()', () => {
    const { game: gameAtSfRaw, season } = findSeedReachingSemiFinal(60)
    const sfId = `playoff_sf_${season}`
    let game = ensureSfCardQueued(gameAtSfRaw, season)

    const bracketAtStart = game.playoffBracket!
    const mySeriesStart = bracketAtStart.semiFinals.find(
      s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId,
    )!
    const otherSeriesStart = bracketAtStart.semiFinals.find(s => s.id !== mySeriesStart.id)!
    const opponentClubId = mySeriesStart.homeClubId === game.managedClubId
      ? mySeriesStart.awayClubId
      : mySeriesStart.homeClubId
    const otherWinnerClubId = otherSeriesStart.homeClubId

    // Fully decide the OTHER series (any winner) — real domain function.
    game = advanceSeries(game, otherSeriesStart.id, otherWinnerClubId, false).game
    // Decide MY series down to one win short for the opponent, leaving the
    // final, decisive fixture scheduled — that one gets played LIVE below.
    const myAdvanced = advanceSeries(game, mySeriesStart.id, opponentClubId, true)
    game = myAdvanced.game
    expect(myAdvanced.series.winnerId).toBeNull() // not decided yet — live match decides it

    expect(
      (game.pendingEvents ?? []).some(e => e.id === sfId) ||
      (game.deferredDecisions ?? []).some(e => e.id === sfId),
    ).toBe(true)
    expect(game.playoffBracket?.status).toBe(PlayoffStatus.SemiFinals) // final not yet created

    const mySeries = game.playoffBracket!.semiFinals.find(s => s.id === mySeriesStart.id)!
    const fixtureId = mySeries.fixtures.find(fid => {
      const f = game.fixtures.find(x => x.id === fid)!
      return f.status === FixtureStatus.Scheduled
    })!
    const fixture = game.fixtures.find(f => f.id === fixtureId)!
    // Opponent wins this decisive game too — managed club eliminated 3-x.
    const managedIsHome = fixture.homeClubId === game.managedClubId
    const homeScore = managedIsHome ? 1 : 5
    const awayScore = managedIsHome ? 5 : 1

    // Drive the REAL production store action — matchActions(get,set)
    // .saveLiveMatchResult — exactly as the app does when the player watches
    // their own match live. This is the unmodified function under test, not
    // a hand-rolled mirror of it.
    let storeState: { game: SaveGame | null } = { game }
    const get = () => storeState
    const set = (partial: Partial<{ game: SaveGame | null }>) => {
      storeState = { ...storeState, ...partial }
    }
    const actions = matchActions(get, set)
    actions.saveLiveMatchResult(
      fixtureId,
      homeScore,
      awayScore,
      [],
      makeEmptyReport(),
      makeTeamSelection(game, fixture.homeClubId),
      makeTeamSelection(game, fixture.awayClubId),
    )

    game = storeState.game!
    expect(game.playoffBracket?.status).toBe(PlayoffStatus.Final)
    const final = game.playoffBracket!.final!
    expect([final.homeClubId, final.awayClubId]).not.toContain(game.managedClubId)

    // The consumption-time gate inside saveLiveMatchResult must have already
    // purged the stale card, in this SAME call — matching what the Portal
    // renders to the player immediately afterwards, before any advance().
    const pendingIds = (game.pendingEvents ?? []).map(e => e.id)
    const deferredIds = (game.deferredDecisions ?? []).map(e => e.id)
    expect(pendingIds, `pendingEvents right after the live match: ${JSON.stringify(pendingIds)}`).not.toContain(sfId)
    expect(deferredIds, `deferredDecisions right after the live match: ${JSON.stringify(deferredIds)}`).not.toContain(sfId)
  })
})
