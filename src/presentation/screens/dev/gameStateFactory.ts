/**
 * gameStateFactory.ts — seedad spelläges-fabrik för /dev/scenes.
 *
 * SLUTTEST/PORTAL-fabriksrapporten (2026-08-09): ersätter det handskrivna
 * `makeGame({...} as unknown as SaveGame)`-mönstret i DevScenesScreen.tsx för
 * NYA dev-tillstånd. Bas: createNewGame (samma väg scripts/stress/fixtures.ts:s
 * createHeadlessGame redan använder för stresstestet) — riktig, typad,
 * validerad domänkod, inte en hand-typad literal som TypeScript aldrig
 * kontrollerar mot de riktiga entiteterna (se contractEnd/contractUntilSeason-
 * mismatchen i devPlayers, som slank igenom exakt så).
 *
 * Ett tillstånd = en kedja av komponerbara `(game) => game`-overrides:
 *   withInjuries(atRound(makeBaseGame(), 14), 1)
 * Samma uppsättning overrides för alla konsumenter (Uppställning, Trupp-kris,
 * Portal) — ingen duplicerad uppsättning per konsument.
 */
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { Tactic } from '../../../domain/entities/Club'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { calculateStandings } from '../../../domain/services/standingsService'
import { checkInvariants } from '../../../domain/services/gameInvariants'
import { FixtureStatus } from '../../../domain/enums'
import { FORMATIONS, type FormationType } from '../../../domain/entities/Formation'
import { mulberry32 } from '../../../domain/utils/random'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

// ── Bas ──────────────────────────────────────────────────────────────────────

export function makeBaseGame(opts?: { seed?: number; clubId?: string }): SaveGame {
  const seed = opts?.seed ?? 1
  const clubId = opts?.clubId ?? CLUB_TEMPLATES[seed % CLUB_TEMPLATES.length].id
  const game = createNewGame({ managerName: 'Dev', clubId, seed })
  return { ...game, pendingScreen: null }
}

// ── atRound — fejkar historik, validerar hårt ───────────────────────────────

/**
 * Markerar alla fixtures (liga OCH cup) med matchday < targetMatchday som
 * completed med seedade deterministiska resultat, härleder standings därifrån
 * (calculateStandings — samma funktion resten av appen använder, ingen egen
 * tabellberäkning), sätter currentMatchday. Cup-vinnare skrivs in i
 * cupBracket.matches så bracketen inte blir inkonsekvent.
 *
 * targetMatchday är den GLOBALA sekvensen (fixture.matchday), inte
 * ligaomgångsnumret — cup-insticken (CUP_AFTER_LEAGUE_ROUND) gör att de två
 * divergerar efter de första omgångarna. matchdayMonotonic-invarianten
 * kollar mot matchday, inte roundNumber — det upptäcktes av invariant-
 * kraschen under verifiering av denna funktion (se commit).
 *
 * Kastar Error med alla severity:'crash'-fynd (checkInvariants) om resultatet
 * inte är ett tillstånd spelet faktiskt kan nå — en trasig fejkad historik
 * (t.ex. standings som inte stämmer med resultaten, eller en cup-bracket med
 * olösta matcher och inga schemalagda fixtures) ska aldrig lämna funktionen
 * tyst.
 */
export function atRound(game: SaveGame, targetMatchday: number): SaveGame {
  const rand = mulberry32(game.currentSeason * 9301 + targetMatchday * 49297)
  const clubIds = game.clubs.map(c => c.id)
  const cupWinners = new Map<string, string>() // fixtureId → winnerClubId

  const fixtures: Fixture[] = game.fixtures.map(f => {
    if (f.season !== game.currentSeason || f.matchday >= targetMatchday) return f
    if (f.status === FixtureStatus.Completed) return f
    // Seedad, plausibel — inte kalibrerad matchmotor-realism (behövs inte för en dev-snap).
    const homeScore = Math.floor(rand() * 6) + 2
    const awayScore = Math.floor(rand() * 6) + 1
    if (f.isCup) cupWinners.set(f.id, homeScore >= awayScore ? f.homeClubId : f.awayClubId)
    return { ...f, status: FixtureStatus.Completed, homeScore, awayScore }
  })

  const standings = calculateStandings(clubIds, fixtures)

  const cupBracket = game.cupBracket ? {
    ...game.cupBracket,
    matches: game.cupBracket.matches.map(m =>
      m.fixtureId && cupWinners.has(m.fixtureId) ? { ...m, winnerId: cupWinners.get(m.fixtureId)! } : m
    ),
  } : game.cupBracket

  const next: SaveGame = { ...game, fixtures, standings, currentMatchday: targetMatchday, cupBracket }

  const crashes = checkInvariants(next).filter(f => f.severity === 'crash')
  if (crashes.length > 0) {
    throw new Error(
      `gameStateFactory.atRound(${targetMatchday}): fejkad historik bryter mot invarianter — ` +
      crashes.map(c => `${c.name}: ${c.message}`).join(' | ')
    )
  }

  return next
}

// ── Squad-tillstånd ──────────────────────────────────────────────────────────

function managedPlayerIds(game: SaveGame, count: number): string[] {
  return game.players
    .filter(p => p.clubId === game.managedClubId)
    .slice(0, count)
    .map(p => p.id)
}

export function withInjuries(game: SaveGame, count: number): SaveGame {
  const ids = new Set(managedPlayerIds(game, count))
  return {
    ...game,
    players: game.players.map(p =>
      ids.has(p.id) ? { ...p, isInjured: true, injuryDaysRemaining: 10 } : p
    ),
  }
}

export function withSuspended(game: SaveGame, count: number): SaveGame {
  const ids = new Set(managedPlayerIds(game, count))
  return {
    ...game,
    players: game.players.map(p =>
      ids.has(p.id) ? { ...p, suspensionGamesRemaining: 1 } : p
    ),
  }
}

export function withLowMorale(game: SaveGame, count: number): SaveGame {
  const ids = new Set(managedPlayerIds(game, count))
  return {
    ...game,
    players: game.players.map(p =>
      ids.has(p.id) ? { ...p, morale: 30, lowMoraleDays: 12 } : p
    ),
  }
}

export function withExpiringContracts(game: SaveGame, count: number): SaveGame {
  const ids = new Set(managedPlayerIds(game, count))
  return {
    ...game,
    players: game.players.map(p =>
      ids.has(p.id) ? { ...p, contractUntilSeason: game.currentSeason } : p
    ),
  }
}

/** Längsta riktiga efternamnen i truppen — för "fylld elva, längsta namn"-baseline. */
export function withLongestSurnames(game: SaveGame): SaveGame {
  const LONG_SURNAMES = [
    'Kristoffersson-Ek', 'Bergqvist-Åhman', 'Söderström', 'Wickström',
    'Hasselqvist', 'Fredriksson', 'Lindqvist-Berg', 'Gunnarsson',
    'Svanström', 'Öhrnberg', 'Kristensson',
  ]
  const managedIds = game.players.filter(p => p.clubId === game.managedClubId).map(p => p.id)
  const nameById = new Map(managedIds.map((id, i) => [id, LONG_SURNAMES[i % LONG_SURNAMES.length]]))
  return {
    ...game,
    players: game.players.map(p =>
      nameById.has(p.id) ? { ...p, lastName: nameById.get(p.id)! } : p
    ),
  }
}

// ── Uppställning (lineup) ────────────────────────────────────────────────────

/**
 * Sätter managedClubPendingLineup med formationens slots delvis (eller helt)
 * fyllda — `emptyCount` slots lämnas null. useLineupEditor läser detta direkt
 * vid mount (savedLineup) och tvångsfyller INTE (auto-fill-guarden triggar
 * bara på trasigt state — skadade/avstängda i startelvan, eller
 * inkonsekventa slots — inte på ett avsiktligt ofullständigt men konsekvent
 * savedLineup).
 */
export function withLineupSlots(game: SaveGame, opts: { emptyCount: number; formation?: FormationType }): SaveGame {
  const formation = opts.formation ?? '5-3-2'
  const template = FORMATIONS[formation]
  const filledSlotCount = Math.max(0, template.slots.length - opts.emptyCount)

  const available = game.players.filter(p =>
    p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0
  )

  const lineupSlots: Record<string, string | null> = {}
  const startingPlayerIds: string[] = []
  let filled = 0
  for (const slot of template.slots) {
    if (filled >= filledSlotCount) {
      lineupSlots[slot.id] = null
      continue
    }
    const candidate = available.find(p => p.position === slot.position && !startingPlayerIds.includes(p.id))
      ?? available.find(p => !startingPlayerIds.includes(p.id))
    if (!candidate) {
      lineupSlots[slot.id] = null
      continue
    }
    lineupSlots[slot.id] = candidate.id
    startingPlayerIds.push(candidate.id)
    filled++
  }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const baseTactic: Tactic = managedClub?.activeTactic ?? {
    mentality: 'balanced', tempo: 'normal', press: 'medium', passingRisk: 'mixed',
    width: 'normal', attackingFocus: 'mixed', cornerStrategy: 'standard', penaltyKillStyle: 'active',
  } as Tactic

  const tactic: Tactic = { ...baseTactic, formation, lineupSlots }
  const benchPlayerIds = available.filter(p => !startingPlayerIds.includes(p.id)).slice(0, 5).map(p => p.id)

  const pendingLineup: TeamSelection = {
    startingPlayerIds, benchPlayerIds, captainPlayerId: startingPlayerIds[0], tactic,
  }

  return { ...game, managedClubPendingLineup: pendingLineup }
}

