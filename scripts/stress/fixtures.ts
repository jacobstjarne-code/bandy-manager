/**
 * Headless game setup helpers — createGame, autoSelectLineup, autoResolvePendingScreen.
 */

import type { SaveGame } from '../../src/domain/entities/SaveGame'
import type { TeamSelection } from '../../src/domain/entities/Fixture'
import type { GameEvent } from '../../src/domain/entities/GameEvent'
import { createNewGame } from '../../src/application/useCases/createNewGame'
import { setLineup } from '../../src/application/useCases/setLineup'
import { CLUB_TEMPLATES } from '../../src/domain/services/worldGenerator'
import { PlayerPosition } from '../../src/domain/enums'
import { canStartBuild, startFacilityBuild, getFacilityNodeViews, createInitialFacilityState } from '../../src/domain/services/facilityService'
import { applyFinanceChange } from '../../src/domain/services/economyService'
import { applyContractDemandResolutions } from '../../src/domain/services/contractDemandService'
import { resolveEvent } from '../../src/domain/services/events/eventResolver'

// ── Game creation ─────────────────────────────────────────────────────────────

export function createHeadlessGame(seed: number): SaveGame {
  const clubTemplate = CLUB_TEMPLATES[seed % CLUB_TEMPLATES.length]
  const game = createNewGame({
    managerName: `Stress-${seed}`,
    clubId: clubTemplate.id,
    seed,
  })
  // Clear the initial BoardMeeting screen — headless, no UI pause needed
  return { ...game, pendingScreen: null }
}

// ── Lineup auto-selection ────────────────────────────────────────────────────

/**
 * Picks best available 11 starters (1 GK + 10 outfield, by currentAbility).
 * Calls setLineup for validation. Falls back to forced direct assignment if
 * fewer than 11 healthy players are available (stress test needs match to proceed).
 *
 * Must be called before every advanceToNextEvent — the advance clears
 * managedClubPendingLineup after each round.
 */
export function autoSelectLineup(game: SaveGame): SaveGame {
  const clubId = game.managedClubId
  const allClubPlayers = game.players
    .filter(p => p.clubId === clubId)
    .sort((a, b) => b.currentAbility - a.currentAbility)

  if (allClubPlayers.length < 11) {
    // Squad too small to field a lineup at all — the round can never advance
    // past this point (advanceToNextEvent needs a confirmed lineup for the
    // managed club's fixture). npm run stress's own reporter.ts catches this
    // via its own invariant check (crashReason 'invariant:squadSize'), but
    // ad-hoc measurement scripts calling autoSelectLineup directly have no
    // such surrounding harness — for them this was a SILENT deadlock (season
    // pinned at one matchday forever, no error, no exit). Found 2026-08-30:
    // autoResolvePendingEvents' fallback policy (fixtures.ts, this file)
    // blindly accepted every transferBidReceived bid it had no noOp choice
    // for, draining a squad from 12 to 10 mid-season. Reporting here — not
    // just relying on the caller's own invariant checks — is what surfaces
    // that class of bug in every script, not just npm run stress.
    console.error(
      `[autoSelectLineup] FEL: ${clubId} har bara ${allClubPlayers.length} spelare (kräver 11+). ` +
      `Matchday ${game.currentMatchday ?? '?'}, säsong ${game.currentSeason ?? '?'}. Laguppställning kan inte byggas — omgången fastnar.`
    )
    return game
  }

  // Normal path: 1 GK + 10 best outfield from available (not injured/suspended)
  const available = allClubPlayers.filter(
    p => !p.isInjured && p.suspensionGamesRemaining === 0
  )

  if (available.length >= 11) {
    const gks     = available.filter(p => p.position === PlayerPosition.Goalkeeper)
    const outfield = available.filter(p => p.position !== PlayerPosition.Goalkeeper)

    const starters: string[] = []
    if (gks.length > 0) starters.push(gks[0].id)
    for (const p of outfield) {
      if (starters.length >= 11) break
      starters.push(p.id)
    }
    // If still short (e.g., no GK among available), pad from available
    for (const p of available) {
      if (starters.length >= 11) break
      if (!starters.includes(p.id)) starters.push(p.id)
    }

    if (starters.length === 11) {
      const usedIds = new Set(starters)
      const bench   = available.filter(p => !usedIds.has(p.id)).slice(0, 5).map(p => p.id)
      const result  = setLineup({ game, clubId, startingPlayerIds: starters, benchPlayerIds: bench })
      if (result.success) return result.game
    }
  }

  // Fallback: bypass setLineup validation — use all players regardless of fitness.
  // Necessary to prevent the managed club's fixtures from being infinitely skipped.
  const starters = allClubPlayers.slice(0, 11).map(p => p.id)
  const bench    = allClubPlayers.slice(11, 16).map(p => p.id)
  const club     = game.clubs.find(c => c.id === clubId)
  if (!club) return game

  const forcedLineup: TeamSelection = {
    startingPlayerIds: starters,
    benchPlayerIds: bench,
    tactic: club.activeTactic,
  }
  return { ...game, managedClubPendingLineup: forcedLineup, lineupConfirmedThisRound: true }
}

// ── Pending screen resolution ────────────────────────────────────────────────

export interface ResolveResult {
  game: SaveGame
  unresolvable: boolean
  screenType: string | null
}

const KNOWN_SCREENS = new Set([
  'season_summary',
  'contract_demands',
  'board_meeting',
  'pre_season',
  'half_time_summary',
  'playoff_intro',
  'qf_summary',
])

/**
 * Auto-resolves any pending screen by clearing it.
 * All known PendingScreen values are "acknowledged" — in headless mode
 * there is no user to dismiss them, so we just clear the flag.
 *
 * Unknown screen types are returned as unresolvable=true (seed gets skipped).
 *
 * A-H2b (DOM_AH2B_RETENTION_2026-08-28): 'contract_demands' gets a real
 * default POLICY instead of a bare clear — "meet every qualifying demand" —
 * so `npm run stress` actually exercises Leg 2 (morale) and, downstream,
 * Leg 3 (bud-targeting/acceptance) instead of leaving pendingContractDemands
 * silently dropped. Calibration scripts that need to COMPARE policies
 * (meet-all vs meet-none) should NOT use this helper — call
 * applyContractDemandResolutions directly with their own policy, same as
 * scripts/anspark1-retention-matning-2026-08-28.ts.
 */
export function autoResolvePendingScreen(game: SaveGame): ResolveResult {
  const ps = game.pendingScreen
  if (!ps) return { game, unresolvable: false, screenType: null }

  if (!KNOWN_SCREENS.has(ps)) {
    return { game, unresolvable: true, screenType: ps }
  }

  if (ps === 'contract_demands') {
    const demands = game.pendingContractDemands ?? []
    const meetAll = Object.fromEntries(demands.map(d => [d.playerId, 'met' as const]))
    const updatedPlayers = applyContractDemandResolutions(game.players, demands, meetAll)
    return {
      game: { ...game, players: updatedPlayers, pendingContractDemands: undefined, pendingScreen: null },
      unresolvable: false,
      screenType: ps,
    }
  }

  return {
    game: { ...game, pendingScreen: null },
    unresolvable: false,
    screenType: ps,
  }
}

// ── Pending EVENT resolution (patron-inbox-gap, found in anspråk 4's own
//    measurement, commit 96deea39, 2026-08-30) ──────────────────────────────

/**
 * autoResolvePendingScreen above only ever touched `game.pendingScreen`
 * (season summary, contract demands, etc.) — it never touched
 * `game.pendingEvents`, the inbox/decision-card queue that carries GameEvents
 * requiring a player choice (patron intro/unhappy/withdraw/style/bonus,
 * transfer bids, sponsor offers, press conferences, ...). Every headless
 * measurement script in this project's history that called
 * autoResolvePendingScreen but never separately drained pendingEvents left
 * those events sitting unanswered — most critically the patron mechanic,
 * which is GATED entirely behind a player choice (welcome/cautious/decline
 * on generatePatronEmergenceEvent, patronEvents.ts:248): with nobody ever
 * answering "welcome", `game.patron` never spawns, no matter how high
 * communityStanding climbs. Confirmed empirically: anspråk 4's own baseline
 * (docs/DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md) measured patron active in
 * 0/20 simulated seasons despite communityStanding averaging 92 — nine
 * points above PATRON_EMERGE_CS (60).
 *
 * POLICY — patron events (type patronEvent / patronWithdrawal /
 * patronInfluence): ALWAYS resolve with the FIRST choice.
 * Chosen deliberately, not just "pick something": every patron-event
 * generator in patronEvents.ts constructs its choices affirmative-first —
 * 'welcome' (intro/emergence), 'promise' (unhappy), 'meet' (withdraw-threat),
 * 'agree' (style complaint), 'thank' (bonus), 'listen' (influence-60),
 * 'apologize' (ignored) are all choices[0], with the declining/costly
 * alternative always choices[1] (or choices[2]'s 'decline'/noOp on the
 * emergence event). A measurement trying to observe the patron mechanic's
 * DOWNSTREAM effects (cash flow, happiness decay, eventual withdrawal —
 * exactly what anspråk 4 needed) needs the patron to actually become and
 * stay active; picking the affirmative choice is what makes that possible.
 * This mirrors the ad-hoc `autoResolvePatronEvents` already written locally
 * in scripts/ansprak4-ortsunderhall-matning-2026-08-30.ts — generalized here
 * so every OTHER measurement script gets it for free instead of
 * reinventing it (or silently running with an inert patron).
 *
 * POLICY — everything else: prefer an explicit `noOp` choice if the event
 * offers one, otherwise fall back to the first choice. `noOp` is the
 * deliberate "hold position" / decline option on nearly every non-patron
 * event this codebase generates (bidWarEvent's 'hold', sponsorEvents'
 * decline branches, communityActivitiesEvents' pass options, hallProcess's
 * wait options, mecenatService's 'ok'/decline branches — all literally
 * `effect: { type: 'noOp' }`) — so defaulting to it is the choice with the
 * smallest, most predictable footprint on a measurement that isn't
 * specifically about that event type. A script measuring something that
 * DOES care about a specific event type (transfer bids, contract demands,
 * sponsor offers) should keep constructing/resolving its own policy
 * directly via resolveEvent — same convention as
 * scripts/anspark1-retention-matning-2026-08-28.ts's incoming-bid policy
 * (accept at ≥130% market value always, or ≥85% + morale<40) — this
 * function is a REASONABLE DEFAULT for events a script does not otherwise
 * care about, not a replacement for a script's own deliberate policy.
 *
 * POLICY — transferBidReceived: explicit reject, not the noOp fallback.
 * This event type has no noOp choice (accept/counter/reject only — see
 * eventFactories.ts:96-115) and 'accept' is choices[0], so the generic
 * fallback used to silently accept every incoming bid. Fixed 2026-08-30
 * after that drained a managed squad below 11 players mid-season and
 * deadlocked the fixture calendar (autoSelectLineup couldn't build a
 * lineup, the round never advanced). Same "smallest footprint" reasoning
 * as the noOp default elsewhere — reject is this event's hold-position.
 *
 * Iterates the pendingEvents snapshot as it was when this was called — an
 * event's own resolution can enqueue a NEW pendingEvent (e.g. patronHappiness
 * dropping to 0 queues `patron_withdrawal_*`); that new event is picked up
 * on the NEXT call (next round), same cadence a human player would see it,
 * not resolved within the same pass.
 */
export function autoResolvePendingEvents(
  game: SaveGame,
  rand: () => number = Math.random,
): SaveGame {
  let g = game
  for (const e of (game.pendingEvents ?? [])) {
    const choiceId = pickEventResolutionPolicy(e)
    g = resolveEvent(g, e.id, choiceId, rand)
  }
  return g
}

function pickEventResolutionPolicy(event: GameEvent): string {
  if (event.type === 'patronEvent' || event.type === 'patronWithdrawal' || event.type === 'patronInfluence') {
    return event.choices[0]?.id ?? ''
  }
  // transferBidReceived has no noOp choice — 'accept' is choices[0]
  // (eventFactories.ts:96-115), so the generic noOp-or-first-choice fallback
  // below silently ACCEPTED every incoming bid. Found 2026-08-30 via HIGH
  // 5/6's re-measurement: this drained the managed squad below 11 players
  // over several seasons (verified at DOMINANT seed=100 season 5, 12→10;
  // also seed=105), at which point autoSelectLineup can't build a lineup and
  // the fixture stays 'scheduled' forever — a silent deadlock, not a crash.
  // Explicit hold-position policy: reject every bid this harness doesn't
  // otherwise have a deliberate policy for, same "smallest footprint"
  // reasoning as the noOp default for every other event type.
  const explicitChoice = event.type === 'transferBidReceived'
    ? event.choices.find(c => c.effect.type === 'rejectTransfer')
    : event.choices.find(c => c.effect.type === 'noOp')
  return (explicitChoice ?? event.choices[0])?.id ?? ''
}

// ── Facility auto-build (E-STRESS1, 2026-08-23) ─────────────────────────────

/**
 * Minsta möjliga byggpolicy för headless stress-körningar: bygg billigaste
 * TILLGÄNGLIGA (icke byggda, icke låsta) nod med egen kassa, om ett
 * säkerhetsmarginal-belopp lämnas kvar. Ingen kommun-/mecenatfinansiering
 * (samma förenkling som gameFlowActions.ts:s Valet-scen — "club"-läget,
 * full kostnad ur egen kassa) — det håller policyn till en funktion utan
 * att dra in politician/mecenat-tillstånd i harnesset.
 *
 * Rotorsak till varför detta behövdes: innan detta fanns INGEN headless-
 * körning (varken npm run stress eller enskilda script) som någonsin
 * byggde en nod — O5 kraft 2 (anläggningsdrift) kunde alltså aldrig
 * verifieras empiriskt, bara analytiskt. Se BACKLOG.md E-STRESS1,
 * O5_ACCEPTANSTEST_8SASONGER_2026-08-23.md.
 */
const FACILITY_BUILD_SAFETY_MARGIN = 300_000

export function autoBuildCheapestAffordableFacility(game: SaveGame): SaveGame {
  const state = game.facilityState ?? createInitialFacilityState()
  if (state.activeProject) return game  // redan ett bygge igång

  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return game

  const views = getFacilityNodeViews(state, game.currentMatchday ?? 0)
  const available = views.filter(v => v.status === 'available')
  if (available.length === 0) return game

  const cheapest = available.reduce((min, v) => v.def.cost < min.def.cost ? v : min)
  if (club.finances - cheapest.def.cost < FACILITY_BUILD_SAFETY_MARGIN) return game

  const can = canStartBuild(cheapest.def.id, state)
  if (!can.ok) return game

  const newState = startFacilityBuild(cheapest.def.id, state, game.currentMatchday ?? 0)
  const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -cheapest.def.cost)
  return { ...game, facilityState: newState, clubs: updatedClubs }
}
