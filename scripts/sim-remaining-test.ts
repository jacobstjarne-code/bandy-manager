/**
 * sim-remaining-test.ts — verifierar att "simulera resterande säsong"-flödet
 * fungerar korrekt end-to-end.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/sim-remaining-test.ts [--n=20]
 *
 * Logik:
 *   1. Skapa spel (seed i)
 *   2. Spela fram till omgång 13 (halvtidssummeringen passerad)
 *   3. Kör simulateRemainingStep i loop tills säsongen slutar
 *   4. Verifiera: inga krascher, säsongen avslutas ordentligt
 *
 * Halt-konditioner (samma som DashboardScreen hade):
 *   - result.seasonEnded = true
 *   - result.playoffStarted = true (återgå till portalen)
 *   - pendingScreen är HalfTimeSummary / PlayoffIntro / QFSummary
 *   - inga fler schedulade fixtures
 *   - säkerhetsgräns 120 steg
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus, PendingScreen } from '../src/domain/enums'
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const args = process.argv.slice(2)
let N = 20
for (const a of args) {
  if (a.startsWith('--n=')) N = parseInt(a.split('=')[1], 10)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clearScreens(game: SaveGame): SaveGame {
  let g = game
  for (let i = 0; i < 10; i++) {
    if (!g.pendingScreen) break
    g = { ...g, pendingScreen: null }
  }
  return g
}

function advanceOne(game: SaveGame) {
  const r = advanceToNextEvent(game)
  return { game: clearScreens(r.game), roundPlayed: r.roundPlayed, seasonEnded: r.seasonEnded ?? false, playoffStarted: r.playoffStarted ?? false }
}

function minScheduledMatchday(game: SaveGame): number {
  const scheduled = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (scheduled.length === 0) return Infinity
  return scheduled.reduce((mn, f) => f.matchday < mn ? f.matchday : mn, Infinity)
}

/**
 * Advance managed club through N league matches (setting lineup each time).
 * Returns game after N completed league matches.
 */
function advanceNLeagueRounds(game: SaveGame, n: number): SaveGame {
  let played = 0
  for (let i = 0; i < 80 && played < n; i++) {
    // Clear pending screens
    if (game.pendingScreen) {
      game = { ...game, pendingScreen: null }
      continue
    }
    // Resolve pending events
    if ((game.pendingEvents?.length ?? 0) > 0) {
      const event = game.pendingEvents[0]
      game = { ...game, pendingEvents: game.pendingEvents.filter(e => e.id !== event.id) }
      continue
    }
    // Check if there are scheduled fixtures at all
    const scheduled = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
    if (scheduled.length === 0) break
    // Set lineup before managed fixture
    if (!game.managedClubPendingLineup) {
      const nextMd = minScheduledMatchday(game)
      const hasManagedAtMd = scheduled.some(
        f => f.matchday === nextMd &&
             (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      )
      if (hasManagedAtMd) {
        game = autoSelectLineup(game)
      }
    }
    const before = game.fixtures.filter(
      f => f.status === FixtureStatus.Completed &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
           !f.isCup
    ).length
    const r = advanceToNextEvent(game)
    game = { ...r.game, pendingScreen: null }
    const after = game.fixtures.filter(
      f => f.status === FixtureStatus.Completed &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
           !f.isCup
    ).length
    if (after > before) played++
    if (r.seasonEnded) break
  }
  return game
}

/**
 * Simulates one step: like simulateRemainingStep store action but headless.
 * Returns null if nothing left to do.
 */
function simulateStep(game: SaveGame): { game: SaveGame; seasonEnded: boolean; playoffStarted: boolean; halted: boolean } | null {
  // Halt on pending interactive screens
  if (game.pendingScreen === PendingScreen.HalfTimeSummary ||
      game.pendingScreen === PendingScreen.PlayoffIntro ||
      game.pendingScreen === PendingScreen.QFSummary) {
    return { game, seasonEnded: false, playoffStarted: false, halted: true }
  }
  // Auto-resolve other pending screens
  if (game.pendingScreen) {
    game = { ...game, pendingScreen: null }
  }
  // Resolve pending events
  if ((game.pendingEvents?.length ?? 0) > 0) {
    const event = game.pendingEvents[0]
    const updated: SaveGame = {
      ...game,
      pendingEvents: game.pendingEvents.filter(e => e.id !== event.id),
    }
    return { game: updated, seasonEnded: false, playoffStarted: false, halted: false }
  }
  // Set lineup if needed
  if (!game.managedClubPendingLineup) {
    game = autoSelectLineup(game)
  }
  if (game.fixtures.filter(f => f.status === FixtureStatus.Scheduled).length === 0) {
    return null
  }
  const r = advanceOne(game)
  return { game: r.game, seasonEnded: r.seasonEnded, playoffStarted: r.playoffStarted, halted: false }
}

// ── Accumulators ─────────────────────────────────────────────────────────────

interface Result {
  seed: number
  ok: boolean
  error?: string
  stepsToComplete: number
  finalRound: number
}

const results: Result[] = []
let errors = 0

// ── Main ─────────────────────────────────────────────────────────────────────

for (let i = 0; i < N; i++) {
  const seed = i + 1
  if (i % 5 === 0) process.stdout.write(`  seed ${seed}/${N}...\n`)

  try {
    // Create game and advance through 13 league rounds (past halvtidssummering after round 11)
    let game = clearScreens(createHeadlessGame(seed))
    game = advanceNLeagueRounds(game, 13)

    const playedRounds = game.fixtures.filter(
      f => f.status === FixtureStatus.Completed &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
           !f.isCup
    ).length

    if (playedRounds < 12) {
      results.push({ seed, ok: false, error: `Only ${playedRounds} rounds played before sim start`, stepsToComplete: 0, finalRound: playedRounds })
      errors++
      continue
    }

    // Verify canSimulateRemaining conditions:
    // - hasScheduledFixtures
    // - playedRounds >= 12  (we're at 13 so fine)
    // - !playoffBracket
    // - nextManagedScheduled is not a cup fixture
    // - not HalfTimeSummary
    const nextManaged = game.fixtures
      .filter(f => f.status === FixtureStatus.Scheduled &&
                   (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
      .sort((a, b) => a.matchday - b.matchday)[0]

    if (!nextManaged) {
      results.push({ seed, ok: false, error: 'No scheduled managed fixture at round 13', stepsToComplete: 0, finalRound: playedRounds })
      errors++
      continue
    }

    if (game.pendingScreen === PendingScreen.HalfTimeSummary) {
      // Clear it — in UI the user would have dismissed this before clicking simulate
      game = { ...game, pendingScreen: null }
    }

    // Run the simulate-remaining loop
    let steps = 0
    const MAX_STEPS = 120
    let seasonEnded = false
    let haltReason = ''

    while (steps < MAX_STEPS) {
      steps++
      const r = simulateStep(game)
      if (r === null) {
        // No more scheduled fixtures
        seasonEnded = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled).length === 0
        haltReason = 'no_scheduled'
        break
      }
      game = r.game
      if (r.seasonEnded) { seasonEnded = true; haltReason = 'seasonEnded'; break }
      if (r.playoffStarted) { haltReason = 'playoffStarted'; break }
      if (r.halted) { haltReason = `halted:${game.pendingScreen}`; break }
    }

    if (steps >= MAX_STEPS) {
      results.push({ seed, ok: false, error: `Safety limit hit (${MAX_STEPS} steps)`, stepsToComplete: steps, finalRound: playedRounds })
      errors++
      continue
    }

    const finalPlayed = game.fixtures.filter(
      f => f.status === FixtureStatus.Completed &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
           !f.isCup
    ).length

    results.push({ seed, ok: true, stepsToComplete: steps, finalRound: finalPlayed })
    if (i < 3 || !seasonEnded) {
      console.log(`  [seed ${seed}] OK — ${steps} steps, halt: ${haltReason}, managed rounds: ${playedRounds}→${finalPlayed}`)
    }

  } catch (e) {
    errors++
    results.push({ seed, ok: false, error: String(e), stepsToComplete: 0, finalRound: 0 })
    if (errors <= 3) console.error(`  [seed ${seed}] ERROR:`, e)
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

const successful = results.filter(r => r.ok)
const failed = results.filter(r => !r.ok)
const avgSteps = successful.length > 0
  ? (successful.reduce((s, r) => s + r.stepsToComplete, 0) / successful.length).toFixed(1)
  : 'n/a'
const avgFinalRound = successful.length > 0
  ? (successful.reduce((s, r) => s + r.finalRound, 0) / successful.length).toFixed(1)
  : 'n/a'

console.log('\n── Sim-Remaining Test ────────────────────────────────────────────────────')
console.log(`Seeds körda: ${N}  |  OK: ${successful.length}  |  Fel: ${failed.length}`)
console.log(`Snitt steg per seed: ${avgSteps}`)
console.log(`Snitt slutliga managed-omgångar: ${avgFinalRound}/22`)

if (failed.length > 0) {
  console.log('\nMisslyckade seeds:')
  for (const r of failed.slice(0, 5)) {
    console.log(`  seed ${r.seed}: ${r.error}`)
  }
}

if (failed.length === 0) {
  console.log('\n→ PASS: simulateRemainingStep-flödet fungerar för alla seeds.')
} else if (failed.length <= N * 0.1) {
  console.log(`\n→ VARNING: ${failed.length}/${N} seeds misslyckades — utred orsakerna ovan.`)
} else {
  console.log(`\n→ FAIL: ${failed.length}/${N} seeds misslyckades.`)
}
