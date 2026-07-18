/**
 * live-vs-sim.ts — Jämför player state efter match 1 i sim vs live-sökväg.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/live-vs-sim.ts [--n=200]
 *
 * Design: för varje seed körs matchdag m1 på exakt samma startstate i A och B.
 *
 *   Scenario A: roundProcessor simulerar m1 normalt (sim-sökväg)
 *               → game state gA_after = state EFTER m1 processad
 *
 *   Scenario B: exakt samma startstate som precis innan m1 i A.
 *               managed fixture injiceras som "live" (Completed, same result as A),
 *               managedClubPendingLineup = undefined.
 *               advanceOne kör → processas AI-matcher + managed starter-fitness.
 *               → game state gB_after = state EFTER m1 processad
 *
 *   Om gA_after ≈ gB_after → ingen domain-bug, buggen är i UI/store.
 *   Om skillnader finns → loggas vad som skiljer.
 *
 * Match 2: körs IDENTISKT från gA_after resp gB_after.
 *          Odds-skillnad i match 2 implicerar domain-bug OM states är lika.
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus } from '../src/domain/enums'
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import { advanceUntilManagedFixture } from '../src/testing/advanceUntilManagedFixture'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Fixture } from '../src/domain/entities/Fixture'

// ── Arg parsing ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
let N = 200
for (const a of args) {
  if (a.startsWith('--n=')) N = parseInt(a.split('=')[1], 10)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearScreens(game: SaveGame): SaveGame {
  while (game.pendingScreen) game = { ...game, pendingScreen: null }
  return game
}

function advanceOne(game: SaveGame): { game: SaveGame; roundPlayed: number | null } {
  const r = advanceToNextEvent(game)
  return { game: clearScreens(r.game), roundPlayed: r.roundPlayed }
}

function minScheduledMatchday(game: SaveGame): number {
  const scheduled = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (scheduled.length === 0) return Infinity
  return scheduled.reduce((mn, f) => f.matchday < mn ? f.matchday : mn, Infinity)
}

/**
 * Advance until the next scheduled matchday IS targetMatchday (i.e., drain all matchdays before it).
 *
 * PT-8 (2026-07-18): denna funktion satte tidigare ALDRIG lineup under
 * dräneringen (bara i advanceAtMatchday, vid mål-matchdagen) — höll för att
 * m1 hittills alltid varit matchday 1 här (ingen dränering körs), men var en
 * landmina om skriptet någonsin anropas med en senare targetMatchday och en
 * klubb med bye i cupkvalet. Samma bugg som bet PT-3-harnesset och 1c-testerna
 * (se BACKLOG PT-8) — fixad genom att gå via den delade
 * src/testing/advanceUntilManagedFixture.ts, som sätter lineup varje varv.
 */
function advanceUntilMatchday(game: SaveGame, targetMatchday: number): SaveGame {
  return advanceUntilManagedFixture(
    game,
    g => clearScreens(advanceToNextEvent(autoSelectLineup(g)).game),
    { targetMatchday, maxRounds: 40 },
  )
}

/**
 * Advance exactly ONE matchday at targetMatchday.
 * Assumes the game is positioned at targetMatchday (nextScheduled = targetMatchday).
 * Sets lineup for managed fixture if needed (sim path).
 */
function advanceAtMatchday(game: SaveGame, targetMatchday: number): { game: SaveGame; ok: boolean } {
  const nextMd = minScheduledMatchday(game)
  if (nextMd !== targetMatchday) return { game, ok: false }

  // Set lineup if managed fixture is at this matchday and lineup not set
  const managedFix = game.fixtures.find(
    f => f.matchday === targetMatchday &&
         f.status === FixtureStatus.Scheduled &&
         (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
  )
  if (managedFix && !game.managedClubPendingLineup) {
    game = autoSelectLineup(game)
  }

  const { game: next } = advanceOne(game)
  return { game: next, ok: true }
}

type PlayerSnap = Record<string, { fitness: number; form: number; inj: boolean; susp: number; sharpness: number }>

function snapManaged(game: SaveGame): PlayerSnap {
  const s: PlayerSnap = {}
  for (const p of game.players) {
    if (p.clubId !== game.managedClubId) continue
    s[p.id] = { fitness: p.fitness, form: p.form, inj: p.isInjured, susp: p.suspensionGamesRemaining, sharpness: p.sharpness ?? 0 }
  }
  return s
}

interface SnapDiff {
  field: string
  count: number
  avgDiff: number  // B - A
}

function analyzeSnaps(a: PlayerSnap, b: PlayerSnap): SnapDiff[] {
  const fields: SnapDiff[] = [
    { field: 'fitness', count: 0, avgDiff: 0 },
    { field: 'form', count: 0, avgDiff: 0 },
    { field: 'injury', count: 0, avgDiff: 0 },
    { field: 'susp', count: 0, avgDiff: 0 },
    { field: 'sharpness', count: 0, avgDiff: 0 },
  ]
  for (const pid of Object.keys(a)) {
    const pa = a[pid], pb = b[pid]
    if (!pb) continue
    if (pa.fitness !== pb.fitness) { fields[0].count++; fields[0].avgDiff += pb.fitness - pa.fitness }
    if (pa.form !== pb.form)       { fields[1].count++; fields[1].avgDiff += pb.form - pa.form }
    if (pa.inj !== pb.inj)         { fields[2].count++; fields[2].avgDiff += (pb.inj ? 1 : 0) - (pa.inj ? 1 : 0) }
    if (pa.susp !== pb.susp)       { fields[3].count++; fields[3].avgDiff += pb.susp - pa.susp }
    if (pa.sharpness !== pb.sharpness) { fields[4].count++; fields[4].avgDiff += pb.sharpness - pa.sharpness }
  }
  return fields.filter(f => f.count > 0 || f.avgDiff !== 0)
}

function avgFitness(s: PlayerSnap): number {
  const v = Object.values(s)
  return v.reduce((sum, p) => sum + p.fitness, 0) / v.length
}

function outcome(game: SaveGame, f: Fixture): 'win' | 'draw' | 'loss' {
  const id = game.managedClubId
  const isHome = f.homeClubId === id
  const ms = isHome ? f.homeScore ?? 0 : f.awayScore ?? 0
  const os = isHome ? f.awayScore ?? 0 : f.homeScore ?? 0
  return ms > os ? 'win' : ms < os ? 'loss' : 'draw'
}

// ── Accumulators ──────────────────────────────────────────────────────────────

interface Tally { win: number; draw: number; loss: number; n: number }
const newTally = (): Tally => ({ win: 0, draw: 0, loss: 0, n: 0 })
const addTally = (t: Tally, o: 'win' | 'draw' | 'loss') => { t[o]++; t.n++ }
const pct = (t: Tally, o: 'win' | 'draw' | 'loss') =>
  t.n > 0 ? (t[o] / t.n * 100).toFixed(1) + '%' : 'n/a'

const diffAccum: Record<string, { totalDiff: number; n: number; seeds: number }> = {}
let totalSeedsWithAnyDiff = 0
let totalCompared = 0

// ── Main ──────────────────────────────────────────────────────────────────────

const tallyA = newTally()  // match 2 after sim m1
const tallyB = newTally()  // match 2 after live m1
let errors = 0

for (let i = 0; i < N; i++) {
  const seed = i + 1
  if (i % 50 === 0) process.stdout.write(`  seed ${seed}/${N}...\n`)

  try {
    // ── Start state: initial game ──────────────────────────────────────────────
    let game0 = clearScreens(createHeadlessGame(seed))
    const managedId = game0.managedClubId

    // Find managed club's first league fixture matchday
    const firstManagedFix = game0.fixtures
      .filter(f => !f.isCup && f.status === FixtureStatus.Scheduled &&
                   (f.homeClubId === managedId || f.awayClubId === managedId))
      .sort((a, b) => a.matchday - b.matchday)[0]
    if (!firstManagedFix) { errors++; continue }
    const m1Matchday = firstManagedFix.matchday

    // Advance to m1 matchday (drain pre-m1 matchdays if any)
    const gameAtM1 = advanceUntilMatchday(game0, m1Matchday)

    // ── Scenario A: sim m1 ────────────────────────────────────────────────────
    // Set lineup and advance at m1
    const gameA_lined = autoSelectLineup(gameAtM1)
    const { game: gA_after, ok: okA } = advanceAtMatchday(gameA_lined, m1Matchday)
    if (!okA) { errors++; continue }

    // Verify m1 was completed
    const m1A = gA_after.fixtures.find(
      f => f.id === firstManagedFix.id && f.status === FixtureStatus.Completed
    )
    if (!m1A) { errors++; continue }

    const snapA = snapManaged(gA_after)

    // ── Scenario B: "live" m1 ─────────────────────────────────────────────────
    // Start from SAME state as just before m1 in A (gameAtM1, not gameA_lined)
    // Inject live result: mark m1 fixture as completed (same data as A), clear pending lineup
    let gameB = {
      ...gameAtM1,
      fixtures: gameAtM1.fixtures.map(f => f.id === firstManagedFix.id ? { ...m1A } : f),
      managedClubPendingLineup: undefined,
    }

    // Now advance once at m1Matchday:
    //   - managed fixture is Completed → starters added to startersThisRound (for fitness)
    //   - AI fixtures at m1Matchday are Scheduled → simulated with same seed as in A
    //
    // We call advanceOne directly (NOT advanceAtMatchday/advanceUntilManagedMatchday)
    // because advanceAtMatchday would try to setLineup for the managed fixture —
    // but the managed fixture is already Completed, so no lineup needed.
    const nextMdB = minScheduledMatchday(gameB)
    if (nextMdB !== m1Matchday) { errors++; continue }

    const { game: gB_after } = advanceOne(gameB)

    const snapB = snapManaged(gB_after)

    // ── Compare states after m1 ───────────────────────────────────────────────
    totalCompared++
    const diffs = analyzeSnaps(snapA, snapB)
    if (diffs.length > 0) {
      totalSeedsWithAnyDiff++
      for (const d of diffs) {
        if (!diffAccum[d.field]) diffAccum[d.field] = { totalDiff: 0, n: 0, seeds: 0 }
        diffAccum[d.field].totalDiff += d.avgDiff
        diffAccum[d.field].n += d.count
        diffAccum[d.field].seeds++
      }
      if (totalSeedsWithAnyDiff <= 3) {
        console.log(`\n[seed ${seed}] STATE DIFF after m1 (fitnessA=${avgFitness(snapA).toFixed(1)}, fitnessB=${avgFitness(snapB).toFixed(1)}):`)
        for (const d of diffs) {
          console.log(`  ${d.field}: ${d.count} players differ, avgDiff B-A = ${(d.avgDiff/d.count).toFixed(2)}`)
        }
      }
    }

    // ── Match 2 (advance from each post-m1 state) ────────────────────────────
    const m2Fix = gA_after.fixtures
      .filter(f => !f.isCup && f.status === FixtureStatus.Scheduled &&
                   (f.homeClubId === managedId || f.awayClubId === managedId))
      .sort((a, b) => a.matchday - b.matchday)[0]
    if (!m2Fix) { errors++; continue }
    const m2Matchday = m2Fix.matchday

    // Advance A to m2
    const gameA2 = advanceUntilMatchday(gA_after, m2Matchday)
    const { game: gA_final, ok: okA2 } = advanceAtMatchday(gameA2, m2Matchday)
    if (!okA2) { errors++; continue }
    const m2A = gA_final.fixtures.find(f => f.id === m2Fix.id && f.status === FixtureStatus.Completed)
    if (!m2A) { errors++; continue }
    addTally(tallyA, outcome(gA_final, m2A))

    // Advance B to m2 (from gB_after, same m2 fixture)
    const gameB2 = advanceUntilMatchday(gB_after, m2Matchday)
    const { game: gB_final, ok: okB2 } = advanceAtMatchday(gameB2, m2Matchday)
    if (!okB2) { errors++; continue }
    const m2B = gB_final.fixtures.find(f => f.id === m2Fix.id && f.status === FixtureStatus.Completed)
    if (!m2B) { errors++; continue }
    addTally(tallyB, outcome(gB_final, m2B))

  } catch (e) {
    errors++
    if (errors <= 3) console.error(`  [seed ${seed}] error:`, e)
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log('\n── Player state efter match 1 (jämförelse A vs B) ──────────────────────')
console.log(`Seeds analyserade: ${totalCompared}  |  Seeds med state-diff: ${totalSeedsWithAnyDiff}`)
if (Object.keys(diffAccum).length > 0) {
  for (const [field, stats] of Object.entries(diffAccum)) {
    console.log(`  ${field}: ${stats.seeds} seeds, ${stats.n} players differ, avgDiff B-A = ${(stats.totalDiff / stats.n).toFixed(2)}`)
  }
} else {
  console.log('  Inga state-diffs hittade — A och B är identiska efter match 1.')
}

console.log('\n── Match 2-resultat ─────────────────────────────────────────────────────')
console.log(`A sim→sim   (match 2): W ${pct(tallyA,'win')}  D ${pct(tallyA,'draw')}  L ${pct(tallyA,'loss')}  (n=${tallyA.n})`)
console.log(`B live→sim  (match 2): W ${pct(tallyB,'win')}  D ${pct(tallyB,'draw')}  L ${pct(tallyB,'loss')}  (n=${tallyB.n})`)
console.log(`\nFel: ${errors}/${N}`)

if (tallyA.n > 0 && tallyB.n > 0) {
  const winDiff = tallyB.win / tallyB.n - tallyA.win / tallyA.n
  const lossDiff = tallyB.loss / tallyB.n - tallyA.loss / tallyA.n
  console.log(`\nDiff live→sim vs sim→sim:  W ${(winDiff*100).toFixed(1)}pp  L ${(lossDiff*100).toFixed(1)}pp`)

  if (Math.abs(winDiff) < 0.04) {
    console.log('\n→ SLUTSATS: Ingen statistiskt meningsfull skillnad i match 2-odds.')
    console.log('  Domain-logiken behandlar live och sim identiskt efter match 1.')
    console.log('  Buggen beror troligen på UI-flödet (se nedan för vad man bör kontrollera).')
  } else if (winDiff < -0.04) {
    console.log('\n→ BEKRÄFTAT: live→sim ger systematiskt SÄMRE match 2-odds.')
    console.log('  Det finns en domain-logik-bugg i denna sökväg.')
  } else {
    console.log('\n→ Oväntat: live→sim ger faktiskt BÄTTRE odds i match 2.')
    console.log('  Kontrollera simulationens korrekthet.')
  }
}

console.log('\n── Vad att kontrollera i UI (om ingen domain-bug) ───────────────────────')
console.log('1. Säkerställ att advance() INTE kallas automatiskt efter saveLiveMatchResult')
console.log('   utan att spelaren har satt lineup för nästa match.')
console.log('2. Kontrollera att setPlayerLineup() anropas korrekt med uppdaterad tacticState')
console.log('   (club.activeTactic bör vara synkroniserat via updateTactic).')
console.log('3. Verifiera att matchMode = "quicksim" INTE skippas av misstag i någon state.')
