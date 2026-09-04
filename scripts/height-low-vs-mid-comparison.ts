/**
 * Formationer V2: kvantifierar skillnaden mellan lågt och normalt höjdläge.
 * Höjdläget är inte längre ett separat pressfält utan härleds ur formationen:
 * `541_hem` = low och `532_tvatoppar` = mid. Två identiska seed-serier,
 * enda skillnaden är den hanterade klubbens formation.
 *
 * Kör: node_modules/.bin/vite-node scripts/height-low-vs-mid-comparison.ts
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import type { FormationType } from '../src/domain/entities/Formation'

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

function runOne(seed: number, formation: FormationType): RunResult {
  let game: SaveGame = createNewGame({ managerName: `HeightTest-${seed}`, clubId: 'club_forsbacka', seed })
  game = { ...game, pendingScreen: null }
  game = {
    ...game,
    clubs: game.clubs.map(club => club.id === game.managedClubId
      ? { ...club, activeTactic: { ...club.activeTactic, formation } }
      : club),
  }

  let goalsFor = 0, goalsAgainst = 0, wins = 0, draws = 0, losses = 0
  for (let season = 1; season <= SEASONS; season++) {
    let stepSeed = seed * 100_000 + season * 1_000
    let seasonDone = false
    let guard = 0
    while (!seasonDone) {
      if (++guard > 2000) throw new Error('season never ended')
      game = autoSelectLineup(game)
      const result = advanceToNextEvent(game, stepSeed++)
      game = result.game
      if (result.seasonEnded || game.managerFired) seasonDone = true
      else game = autoResolvePendingScreen(game).game
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
    game = autoResolvePendingScreen(game).game
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
  const avg = (pick: (result: RunResult) => number) =>
    results.reduce((sum, result) => sum + pick(result), 0) / results.length
  console.log(`\n=== ${label} (${results.length} körningar, ${SEASONS} säsonger var) ===`)
  console.log(`Snitt slutplacering: ${avg(result => result.finalPosition).toFixed(2)}`)
  console.log(`Snitt poäng (sista säsongen): ${avg(result => result.points).toFixed(2)}`)
  console.log(`Snitt GF/GA (ackumulerat): ${avg(result => result.goalsFor).toFixed(1)} / ${avg(result => result.goalsAgainst).toFixed(1)}`)
  console.log(`Snitt V-O-F (ackumulerat): ${avg(result => result.wins).toFixed(2)}-${avg(result => result.draws).toFixed(2)}-${avg(result => result.losses).toFixed(2)}`)
}

function main(): void {
  const lowResults: RunResult[] = []
  const midResults: RunResult[] = []
  for (let i = 0; i < RUNS; i++) {
    lowResults.push(runOne(30_000 + i, '541_hem'))
    midResults.push(runOne(30_000 + i, '532_tvatoppar'))
  }

  summarize('heightMode = LOW (5-4-1 hem)', lowResults)
  summarize('heightMode = MID (5-3-2 två toppar)', midResults)
  const avgPositionDiff = (midResults.reduce((sum, result) => sum + result.finalPosition, 0)
    - lowResults.reduce((sum, result) => sum + result.finalPosition, 0)) / RUNS
  const avgGoalsForDiff = (midResults.reduce((sum, result) => sum + result.goalsFor, 0)
    - lowResults.reduce((sum, result) => sum + result.goalsFor, 0)) / RUNS
  console.log(`\n=== SKILLNAD (mid - low) ===`)
  console.log(`Snittplacering: ${avgPositionDiff.toFixed(3)} platser`)
  console.log(`Snitt gjorda mål (ackumulerat över ${SEASONS} säsonger): ${avgGoalsForDiff.toFixed(2)}`)
}

main()
