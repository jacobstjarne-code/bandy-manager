/**
 * Headless game setup helpers — createGame, autoSelectLineup, autoResolvePendingScreen.
 */

import type { SaveGame } from '../../src/domain/entities/SaveGame'
import type { TeamSelection } from '../../src/domain/entities/Fixture'
import { createNewGame } from '../../src/application/useCases/createNewGame'
import { setLineup } from '../../src/application/useCases/setLineup'
import { CLUB_TEMPLATES } from '../../src/domain/services/worldGenerator'
import { PlayerPosition } from '../../src/domain/enums'
import { canStartBuild, startFacilityBuild, getFacilityNodeViews, createInitialFacilityState } from '../../src/domain/services/facilityService'
import { applyFinanceChange } from '../../src/domain/services/economyService'
import { applyContractDemandResolutions } from '../../src/domain/services/contractDemandService'

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
    // Squad too small — invariant 4.4 will catch this; can't build lineup
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
