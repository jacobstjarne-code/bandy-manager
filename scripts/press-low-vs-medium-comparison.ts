/**
 * B2-verifiering (SLUTTEST_KO.md, 2026-08-19): kvantifierar hur stor
 * skillnaden faktiskt är mellan press='low' och press='medium' i praktiken
 * — inte bara att en skillnad finns (bekräftat: pressModifier 0.85 vs 1.0
 * via tacticModifiers.ts, konsumerat i matchCore.ts:967-968), utan HUR
 * MYCKET den syns i faktiska matchresultat över många säsonger.
 *
 * Samma motor som scripts/stress-test.ts. Två identiska seed-serier,
 * enda skillnaden är managed-klubbens press-inställning tvingad till
 * 'low' respektive 'medium' innan simulering, allt annat orört.
 *
 * Kör: node_modules/.bin/vite-node scripts/press-low-vs-medium-comparison.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { TacticPress } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const RUNS = 20
const SEASONS = 2

interface RunResult {
  seed: number
  finalPosition: number
  points: number
  goalsFor: number
  goalsAgainst: number
  wins: number
  draws: number
  losses: number
}

function runOne(seed: number, press: TacticPress): RunResult {
  let game: SaveGame = createNewGame({ managerName: `PressTest-${seed}`, clubId: 'club_forsbacka', seed })
  game = { ...game, pendingScreen: null }

  // Tvinga press på managed-klubben, allt annat orört.
  game = {
    ...game,
    clubs: game.clubs.map(c =>
      c.id === game.managedClubId ? { ...c, activeTactic: { ...c.activeTactic, press } } : c
    ),
  }

  let goalsFor = 0, goalsAgainst = 0, wins = 0, draws = 0, losses = 0

  for (let season = 1; season <= SEASONS; season++) {
    let stepSeed = seed * 100_000 + season * 1_000
    let seasonDone = false
    let guard = 0

    while (!seasonDone) {
      guard++
      if (guard > 2000) throw new Error('season never ended')
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      if (result.seasonEnded || game.managerFired) {
        seasonDone = true
      } else {
        const resolved = autoResolvePendingScreen(game)
        game = resolved.game
      }
    }

    const summary = (game.seasonSummaries ?? []).at(-1)
    if (summary) {
      goalsFor += summary.goalsFor
      goalsAgainst += summary.goalsAgainst
      wins += summary.wins
      draws += summary.draws
      losses += summary.losses
    }

    if (game.managerFired) break
    const resolved = autoResolvePendingScreen(game)
    game = resolved.game
  }

  const lastSummary = (game.seasonSummaries ?? []).at(-1)
  return {
    seed,
    finalPosition: lastSummary?.finalPosition ?? -1,
    points: lastSummary?.points ?? 0,
    goalsFor, goalsAgainst, wins, draws, losses,
  }
}

function summarize(label: string, results: RunResult[]): void {
  const n = results.length
  const avg = (f: (r: RunResult) => number) => results.reduce((s, r) => s + f(r), 0) / n
  console.log(`\n=== ${label} (${n} körningar, ${SEASONS} säsonger var) ===`)
  console.log(`Snitt slutplacering: ${avg(r => r.finalPosition).toFixed(2)}`)
  console.log(`Snitt poäng (sista säsongen): ${avg(r => r.points).toFixed(2)}`)
  console.log(`Snitt GF/GA (ackumulerat): ${avg(r => r.goalsFor).toFixed(1)} / ${avg(r => r.goalsAgainst).toFixed(1)}`)
  console.log(`Snitt V-O-F (ackumulerat): ${avg(r => r.wins).toFixed(2)}-${avg(r => r.draws).toFixed(2)}-${avg(r => r.losses).toFixed(2)}`)
}

function main(): void {
  const lowResults: RunResult[] = []
  const mediumResults: RunResult[] = []

  for (let i = 0; i < RUNS; i++) {
    lowResults.push(runOne(30_000 + i, TacticPress.Low))
    mediumResults.push(runOne(30_000 + i, TacticPress.Medium)) // samma seed-serie, bara press skiljer
  }

  summarize('press = LOW', lowResults)
  summarize('press = MEDIUM', mediumResults)

  const avgPosDiff = (mediumResults.reduce((s, r) => s + r.finalPosition, 0) - lowResults.reduce((s, r) => s + r.finalPosition, 0)) / RUNS
  const avgGoalsForDiff = (mediumResults.reduce((s, r) => s + r.goalsFor, 0) - lowResults.reduce((s, r) => s + r.goalsFor, 0)) / RUNS
  console.log(`\n=== SKILLNAD (medium - low) ===`)
  console.log(`Snittplacering: ${avgPosDiff.toFixed(3)} platser`)
  console.log(`Snitt gjorda mål (ackumulerat över ${SEASONS} säsonger): ${avgGoalsForDiff.toFixed(2)}`)
}

main()
