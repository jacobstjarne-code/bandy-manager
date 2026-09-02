/**
 * fatigue-vs-fresh-test.ts — Mäter om trött trupp ger sämre match 2-resultat.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/fatigue-vs-fresh-test.ts [--n=200]
 *
 * Design (§2.1 i CODE_UPPDRAG_2026-05-22.md):
 *   Live-vs-sim-testet avgjorde att live=sim (ingen skillnad). Men bägge sidor
 *   gick in med samma nedtröttade trupp. Det här testet mäter TRÖTT vs UTVILAD:
 *
 *   Scenario A: spela match 1 normalt (truppen tröttnar) → match 2 med trött trupp
 *   Scenario B: exakt samma state INNAN match 1, men med fitness återställd till
 *               topp (90) för alla spelare → spela match 2 direkt (skip match 1)
 *
 *   Är vinstandelen i match 2 systematiskt lägre i A (trött) vs B (utvilad)?
 *
 * RÖR INGA PARAMETRAR — detta är enbart en mätning.
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus } from '../src/domain/enums'
import { createHeadlessGame, autoSelectLineup } from './stress/fixtures'
import { advanceUntilManagedFixture } from '../src/testing/advanceUntilManagedFixture'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { Fixture } from '../src/domain/entities/Fixture'

const args = process.argv.slice(2)
let N = 200
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
  return { game: clearScreens(r.game), roundPlayed: r.roundPlayed, seasonEnded: r.seasonEnded ?? false }
}

function minScheduledMatchday(game: SaveGame): number {
  const scheduled = game.fixtures.filter(f => f.status === FixtureStatus.Scheduled)
  if (scheduled.length === 0) return Infinity
  return scheduled.reduce((mn, f) => f.matchday < mn ? f.matchday : mn, Infinity)
}

/**
 * PT-8 (2026-07-18): loop-villkoret (samma "klubben spelar inte varje
 * matchday"-bugg som bet PT-3-harnesset och 1c-testerna, se BACKLOG) flyttat
 * till den delade src/testing/advanceUntilManagedFixture.ts. Denna funktion
 * behåller bara sin egen lineup-strategi (conditional autoSelectLineup, bara
 * när managed club faktiskt har en fixture på nästa matchday) som
 * `advanceOneRound`-callback. seasonEnded-brytningen behövs inte separat —
 * scheduled.length===0-kollen i den delade hjälparen täcker samma fall.
 */
function advanceUntilMatchday(game: SaveGame, targetMatchday: number): SaveGame {
  return advanceUntilManagedFixture(
    game,
    g => {
      if (!g.managedClubPendingLineup) {
        const nextMd = minScheduledMatchday(g)
        const hasManagedAtMd = g.fixtures.some(
          f => f.status === FixtureStatus.Scheduled && f.matchday === nextMd &&
               (f.homeClubId === g.managedClubId || f.awayClubId === g.managedClubId)
        )
        if (hasManagedAtMd) g = autoSelectLineup(g)
      }
      return clearScreens(advanceToNextEvent(g).game)
    },
    { targetMatchday, maxRounds: 50 },
  )
}

/** Restore all managed-club player fitness to 90 (fresh baseline). */
function restoreFitness(game: SaveGame): SaveGame {
  return {
    ...game,
    players: game.players.map(p =>
      p.clubId === game.managedClubId
        ? { ...p, fitness: 90, isInjured: false, suspensionGamesRemaining: 0 }
        : p
    ),
  }
}

function outcome(game: SaveGame, f: Fixture): 'win' | 'draw' | 'loss' {
  const id = game.managedClubId
  const isHome = f.homeClubId === id
  const ms = isHome ? f.homeScore ?? 0 : f.awayScore ?? 0
  const os = isHome ? f.awayScore ?? 0 : f.homeScore ?? 0
  return ms > os ? 'win' : ms < os ? 'loss' : 'draw'
}

function avgFitness(game: SaveGame): number {
  const starters = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured)
  if (starters.length === 0) return 0
  return starters.reduce((s, p) => s + p.fitness, 0) / starters.length
}

// ── Accumulators ─────────────────────────────────────────────────────────────

interface Tally { win: number; draw: number; loss: number; n: number }
const newTally = (): Tally => ({ win: 0, draw: 0, loss: 0, n: 0 })
const addTally = (t: Tally, o: 'win' | 'draw' | 'loss') => { t[o]++; t.n++ }
const pct = (t: Tally, o: keyof Omit<Tally,'n'>) => t.n > 0 ? (t[o] / t.n * 100).toFixed(1) + '%' : 'n/a'

const tallyA = newTally()  // match 2 with tired squad (played match 1)
const tallyB = newTally()  // match 2 with fresh squad (fitness reset, skip match 1)
let errors = 0
let fitnessA_sum = 0, fitnessB_sum = 0, fitnessSamples = 0

// ── Main ─────────────────────────────────────────────────────────────────────

for (let i = 0; i < N; i++) {
  const seed = i + 1
  if (i % 50 === 0) process.stdout.write(`  seed ${seed}/${N}...\n`)

  try {
    let game0 = clearScreens(createHeadlessGame(seed))
    const managedId = game0.managedClubId

    // Find first two league fixtures
    const leagueFixtures = game0.fixtures
      .filter(f => !f.isCup && (f.homeClubId === managedId || f.awayClubId === managedId))
      .sort((a, b) => a.matchday - b.matchday)
    if (leagueFixtures.length < 2) { errors++; continue }

    const m1Matchday = leagueFixtures[0].matchday
    const m2Matchday = leagueFixtures[1].matchday

    // Advance to just before m1 (drain earlier rounds)
    const gameAtM1 = advanceUntilMatchday(game0, m1Matchday)

    // ── Scenario A: play match 1 (truppen tröttnar), then play match 2 ────────
    const gameA_lined = autoSelectLineup(gameAtM1)
    const { game: gA_after } = advanceOne(gameA_lined)
    const m1A = gA_after.fixtures.find(
      f => f.id === leagueFixtures[0].id && f.status === FixtureStatus.Completed
    )
    if (!m1A) { errors++; continue }

    const gameA2base = advanceUntilMatchday(gA_after, m2Matchday)
    const gameA2_lined = autoSelectLineup(gameA2base)
    const { game: gA_final } = advanceOne(gameA2_lined)
    const m2A = gA_final.fixtures.find(
      f => f.id === leagueFixtures[1].id && f.status === FixtureStatus.Completed
    )
    if (!m2A) { errors++; continue }

    // ── Scenario B: skip match 1 (restore fitness), play match 2 ─────────────
    // Start from same state as just before m1, but restore fitness first
    const gameBfresh = restoreFitness(gameAtM1)
    // Inject m1's completed result (same outcome as A) so standings/fixtures align,
    // then advance AI fixtures at m1Matchday
    let gameB: SaveGame = {
      ...gameBfresh,
      fixtures: gameBfresh.fixtures.map(f => f.id === leagueFixtures[0].id ? { ...m1A } : f),
      managedClubPendingLineup: undefined,
    }
    // Process the AI matches at m1Matchday (advance once from m1Matchday with managed Completed)
    const nextMdB = minScheduledMatchday(gameB)
    if (nextMdB === m1Matchday) {
      const { game: gB_processed } = advanceOne(gameB)
      gameB = gB_processed
    }

    // Restore fitness AGAIN after the advance reduced it for live starters
    gameB = restoreFitness(gameB)

    const gameB2base = advanceUntilMatchday(gameB, m2Matchday)
    const gameB2_lined = autoSelectLineup(gameB2base)
    const { game: gB_final } = advanceOne(gameB2_lined)
    const m2B = gB_final.fixtures.find(
      f => f.id === leagueFixtures[1].id && f.status === FixtureStatus.Completed
    )
    if (!m2B) { errors++; continue }

    // ── Measure fitness difference ────────────────────────────────────────────
    const fA = avgFitness(gameA2_lined)
    const fB = avgFitness(gameB2_lined)
    fitnessA_sum += fA
    fitnessB_sum += fB
    fitnessSamples++

    addTally(tallyA, outcome(gA_final, m2A))
    addTally(tallyB, outcome(gB_final, m2B))

  } catch (e) {
    errors++
    if (errors <= 3) console.error(`  [seed ${seed}] error:`, e)
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

const avgFitnessA = fitnessSamples > 0 ? (fitnessA_sum / fitnessSamples).toFixed(1) : 'n/a'
const avgFitnessB = fitnessSamples > 0 ? (fitnessB_sum / fitnessSamples).toFixed(1) : 'n/a'

console.log('\n── Trött vs Utvilad — Match 2 ──────────────────────────────────────────')
console.log(`Seeds: ${N}  |  Jämförbara: ${tallyA.n}  |  Fel: ${errors}`)
console.log(`\nSnitt fitness vid match 2:  A (trött) = ${avgFitnessA}  |  B (utvilad) = ${avgFitnessB}`)
console.log(`\nA (trött):   W ${pct(tallyA,'win')}  D ${pct(tallyA,'draw')}  L ${pct(tallyA,'loss')}  (n=${tallyA.n})`)
console.log(`B (utvilad): W ${pct(tallyB,'win')}  D ${pct(tallyB,'draw')}  L ${pct(tallyB,'loss')}  (n=${tallyB.n})`)

if (tallyA.n > 0 && tallyB.n > 0) {
  const winDiff = tallyB.win / tallyB.n - tallyA.win / tallyA.n
  const lossDiff = tallyB.loss / tallyB.n - tallyA.loss / tallyA.n
  console.log(`\nDiff utvilad vs trött:  W ${(winDiff*100).toFixed(1)}pp  L ${(lossDiff*100).toFixed(1)}pp`)

  if (Math.abs(winDiff) < 0.04) {
    console.log('\n→ Ingen statistiskt meningsfull trötthetseffekt i match 2.')
    console.log('  Match-2-känslan förklaras troligen av UI-skippen (1.6), inte av fitness.')
  } else if (winDiff > 0.04) {
    console.log('\n→ BEKRÄFTAT: utvilad trupp ger systematiskt BÄTTRE match 2-odds (+' + (winDiff*100).toFixed(1) + 'pp win).')
    console.log('  Trötthetsaxeln är en verklig balansfråga — överväg C-FT1.')
  } else {
    console.log('\n→ Oväntat: trött trupp ger faktiskt BÄTTRE odds. Kontrollera fitness-mätningen.')
  }
}
