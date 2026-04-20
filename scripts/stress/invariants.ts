/**
 * Stress-test invariants — körs efter varje advanceToNextEvent.
 * Varje funktion returnerar [] vid OK, eller InvariantFinding[] vid brott.
 */

import type { SaveGame } from '../../src/domain/entities/SaveGame'
import { FixtureStatus, PlayerPosition } from '../../src/domain/enums'

export interface InvariantFinding {
  name: string
  severity: 'crash' | 'warn'
  message: string
}

// 4.1 tableSum — max diff i spelade matcher ≤ 1
function checkTableSum(game: SaveGame): InvariantFinding[] {
  const played = game.standings.map(s => s.wins + s.draws + s.losses)
  if (played.length === 0) return []
  const maxPlayed = Math.max(...played)
  const minPlayed = Math.min(...played)
  if (maxPlayed - minPlayed > 1) {
    return [{
      name: 'tableSum',
      severity: 'crash',
      message: `Standings mismatch: max=${maxPlayed} min=${minPlayed} diff=${maxPlayed - minPlayed} (max 1 tillåtet)`,
    }]
  }
  return []
}

// 4.2 fixtureCount — varje klubb ska ha exakt 22 ligamatcher i innevarande säsong
function checkFixtureCount(game: SaveGame): InvariantFinding[] {
  const currentSeason = game.currentSeason
  // Exclude playoff fixtures (roundNumber > 22, matchday 27+) — they're not cup but not league either
  const leagueFixtures = game.fixtures.filter(f => !f.isCup && f.season === currentSeason && f.roundNumber <= 22)
  if (leagueFixtures.length === 0) return []  // säsong ej igång ännu

  const findings: InvariantFinding[] = []
  for (const club of game.clubs) {
    const count = leagueFixtures.filter(
      f => f.homeClubId === club.id || f.awayClubId === club.id
    ).length
    if (count !== 22) {
      findings.push({
        name: 'fixtureCount',
        severity: 'crash',
        message: `${club.name} has ${count} league fixtures in season ${currentSeason} (expected 22)`,
      })
    }
  }
  return findings
}

// 4.3 playerAges — ålder 16–42
function checkPlayerAges(game: SaveGame): InvariantFinding[] {
  const findings: InvariantFinding[] = []
  for (const p of game.players) {
    if (p.age < 16 || p.age > 42) {
      findings.push({
        name: 'playerAges',
        severity: 'crash',
        message: `${p.firstName} ${p.lastName} (id=${p.id}) has invalid age ${p.age}`,
      })
    }
  }
  return findings
}

// 4.4 squadSize — 14–30 spelare per klubb
function checkSquadSize(game: SaveGame): InvariantFinding[] {
  const findings: InvariantFinding[] = []
  for (const club of game.clubs) {
    const count = game.players.filter(p => p.clubId === club.id).length
    if (count < 14) {
      findings.push({
        name: 'squadSize',
        severity: 'crash',
        message: `${club.name} has ${count} players (minimum 14)`,
      })
    } else if (count > 30) {
      findings.push({
        name: 'squadSize',
        severity: 'warn',
        message: `${club.name} has ${count} players (maximum 30)`,
      })
    }
  }
  return findings
}

// 4.5 positionCoverage — 1 MV, 2 DEF, 2 HALF, 2 FWD per klubb
function checkPositionCoverage(game: SaveGame): InvariantFinding[] {
  const findings: InvariantFinding[] = []
  for (const club of game.clubs) {
    const players = game.players.filter(p => p.clubId === club.id)
    const gks   = players.filter(p => p.position === PlayerPosition.Goalkeeper).length
    const defs  = players.filter(p => p.position === PlayerPosition.Defender).length
    const halfs = players.filter(
      p => p.position === PlayerPosition.Half || p.position === PlayerPosition.Midfielder
    ).length
    const fwds  = players.filter(p => p.position === PlayerPosition.Forward).length

    if (gks   < 1) findings.push({ name: 'positionCoverage', severity: 'crash', message: `${club.name}: no goalkeeper` })
    if (defs  < 2) findings.push({ name: 'positionCoverage', severity: 'crash', message: `${club.name}: only ${defs} defenders (min 2)` })
    if (halfs < 2) findings.push({ name: 'positionCoverage', severity: 'crash', message: `${club.name}: only ${halfs} halfs/midfielders (min 2)` })
    if (fwds  < 2) findings.push({ name: 'positionCoverage', severity: 'crash', message: `${club.name}: only ${fwds} forwards (min 2)` })
  }
  return findings
}

// 4.6 finance — cash och weeklyIncome
function checkFinance(game: SaveGame): InvariantFinding[] {
  const findings: InvariantFinding[] = []
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return findings

  const cash = managedClub.finances
  if (cash < -2_000_000 && !game.managerFired) {
    // < -2M without game-over = bug (evaluateFinanceStatus should have set managerFired)
    findings.push({
      name: 'finance',
      severity: 'crash',
      message: `Managed club cash=${cash.toLocaleString('sv-SE')} kr (under -2 000 000 utan game-over — konkurs-mekanik ej triggad)`,
    })
  } else if (cash < -2_000_000 && game.managerFired) {
    findings.push({
      name: 'finance',
      severity: 'warn',
      message: `Managed club cash=${cash.toLocaleString('sv-SE')} kr (game-over korrekt triggad via managerFired)`,
    })
  } else if (cash < -1_000_000) {
    findings.push({
      name: 'finance',
      severity: 'warn',
      message: `Managed club cash=${cash.toLocaleString('sv-SE')} kr (under -1 000 000, licens-varning ska ha skickats)`,
    })
  }
  if (cash > 50_000_000) {
    findings.push({
      name: 'finance',
      severity: 'warn',
      message: `Managed club cash=${cash.toLocaleString('sv-SE')} kr (orealistiskt högt, möjlig income-bugg)`,
    })
  }

  // weeklyBase = reputation × 120 (från economyService)
  const weeklyBase = managedClub.reputation * 120
  if (weeklyBase <= 0) {
    findings.push({
      name: 'finance',
      severity: 'warn',
      message: `Managed club weeklyBase=${weeklyBase} (ska vara positivt, reputation=${managedClub.reputation})`,
    })
  }
  return findings
}

// 4.7 cupBracket — om cup aktiv: bracket ska ha olösta matches med fixtures
function checkCupBracket(game: SaveGame): InvariantFinding[] {
  if (!game.cupBracket || game.cupBracket.completed) return []

  const cupFixtures = game.fixtures.filter(
    f => f.isCup && f.status === FixtureStatus.Scheduled
  )
  const realUnresolved = game.cupBracket.matches.filter(m => !m.isBye && !m.winnerId)

  if (realUnresolved.length > 0 && cupFixtures.length === 0) {
    return [{
      name: 'cupBracket',
      severity: 'crash',
      message: `Cup bracket active (completed=false) with ${realUnresolved.length} unresolved real matches but 0 scheduled cup fixtures`,
    }]
  }
  return []
}

// 4.8 playoffBracket — kvartsfinal ska ha 4 par
function checkPlayoffBracket(game: SaveGame): InvariantFinding[] {
  if (!game.playoffBracket) return []

  const qfCount = game.playoffBracket.quarterFinals.length
  if (qfCount !== 4) {
    return [{
      name: 'playoffBracket',
      severity: 'crash',
      message: `Playoff quarterFinals has ${qfCount} series (expected 4)`,
    }]
  }
  return []
}

// 4.9 noUndefined — obligatoriska fält på fixtures och players
function checkNoUndefined(game: SaveGame): InvariantFinding[] {
  const findings: InvariantFinding[] = []
  for (const f of game.fixtures) {
    if (!f.homeClubId)                         findings.push({ name: 'noUndefined', severity: 'crash', message: `Fixture ${f.id}: missing homeClubId` })
    if (!f.awayClubId)                         findings.push({ name: 'noUndefined', severity: 'crash', message: `Fixture ${f.id}: missing awayClubId` })
    if (f.matchday == null || isNaN(f.matchday)) findings.push({ name: 'noUndefined', severity: 'crash', message: `Fixture ${f.id}: missing/invalid matchday (${f.matchday})` })
  }
  for (const p of game.players) {
    if (!p.id)       findings.push({ name: 'noUndefined', severity: 'crash', message: `Player missing id (clubId=${p.clubId})` })
    if (!p.clubId)   findings.push({ name: 'noUndefined', severity: 'crash', message: `Player ${p.id}: missing clubId` })
    if (!p.position) findings.push({ name: 'noUndefined', severity: 'crash', message: `Player ${p.id}: missing position` })
  }
  return findings
}

// 4.10 matchdayMonotonic — inga schemalagda fixtures bakom senaste spelade matchday (innevarande säsong)
function checkMatchdayMonotonic(game: SaveGame): InvariantFinding[] {
  const currentSeason = game.currentSeason
  const currentSeasonFixtures = game.fixtures.filter(f => f.season === currentSeason)

  const completedMatchdays = currentSeasonFixtures
    .filter(f => f.status === FixtureStatus.Completed)
    .map(f => f.matchday)

  if (completedMatchdays.length === 0) return []

  const maxCompleted = Math.max(...completedMatchdays)
  const stragglers = currentSeasonFixtures.filter(
    f => f.status === FixtureStatus.Scheduled && f.matchday < maxCompleted
  )
  if (stragglers.length > 0) {
    return [{
      name: 'matchdayMonotonic',
      severity: 'crash',
      message: `${stragglers.length} scheduled fixture(s) with matchday < maxCompleted (${maxCompleted}) in season ${currentSeason}: ${stragglers.slice(0, 3).map(f => `${f.id}(md=${f.matchday})`).join(', ')}`,
    }]
  }
  return []
}

// 4.11 pendingScreenConsistency — screen satt → nödvändig data ska finnas
function checkPendingScreenConsistency(game: SaveGame): InvariantFinding[] {
  const ps = game.pendingScreen
  if (!ps) return []

  if (ps === 'season_summary' && (game.seasonSummaries ?? []).length === 0) {
    return [{
      name: 'pendingScreenConsistency',
      severity: 'crash',
      message: `pendingScreen=season_summary but seasonSummaries is empty`,
    }]
  }
  return []
}

// 4.12 saveGameSize — < 10 MB
function checkSaveGameSize(game: SaveGame): InvariantFinding[] {
  const bytes = JSON.stringify(game).length
  if (bytes >= 10_000_000) {
    return [{
      name: 'saveGameSize',
      severity: 'warn',
      message: `SaveGame is ${(bytes / 1_000_000).toFixed(2)} MB (möjlig memory leak i narrativeLog e.dyl.)`,
    }]
  }
  return []
}

// ── Sammanslagen export ──────────────────────────────────────────────────────

export const INVARIANT_NAMES = [
  'tableSum', 'fixtureCount', 'playerAges', 'squadSize', 'positionCoverage',
  'finance', 'cupBracket', 'playoffBracket', 'noUndefined', 'matchdayMonotonic',
  'pendingScreenConsistency', 'saveGameSize',
] as const

export function checkInvariants(game: SaveGame): InvariantFinding[] {
  return [
    ...checkTableSum(game),
    ...checkFixtureCount(game),
    ...checkPlayerAges(game),
    ...checkSquadSize(game),
    ...checkPositionCoverage(game),
    ...checkFinance(game),
    ...checkCupBracket(game),
    ...checkPlayoffBracket(game),
    ...checkNoUndefined(game),
    ...checkMatchdayMonotonic(game),
    ...checkPendingScreenConsistency(game),
    ...checkSaveGameSize(game),
  ]
}
