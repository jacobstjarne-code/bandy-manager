/**
 * DOM_KALIBRERING_AVSKED_HEROS §D2.
 *
 * Mäter en medvetet tydlig akademisatsning: klubben går in på Satsning,
 * betalar 50 tkr och välkomnar eventuell startmecenat. Övriga händelser
 * använder stress-fixturens minsta-ingrepp-policy. Två säsonger körs för
 * samtliga klubbmallar och flera seeds; utfall grupperas på samma
 * LÄTT/MEDEL/SVÅR-klassning som klubbvalet visar.
 *
 * Kör:
 * node_modules/.bin/vite-node scripts/akademi-tvasasong-solvens-matning-2026-09-08.ts
 */
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { applyFinanceChange } from '../src/domain/services/economyService'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import { selectThreeOffers } from '../src/domain/services/offerSelectionService'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { autoResolvePendingEvents, autoResolvePendingScreen, autoSelectLineup } from './stress/fixtures'

const SEEDS = [3, 11, 29]
const SEASONS = 2
const ACADEMY_START_COST = 50_000
const DEEP_NEGATIVE = -100_000

interface RunResult {
  clubId: string
  difficulty: 'easy' | 'medium' | 'hard'
  seed: number
  start: number
  finish: number
  minimum: number
  criticalPathBeforeDeepNegative: boolean
  crossedDeepNegative: boolean
  completed: boolean
}

function hasCriticalPath(game: SaveGame): boolean {
  const events = [...(game.pendingEvents ?? []), ...(game.deferredDecisions ?? [])]
  return events.some(event => event.type === 'economicStress')
    || game.inbox.some(item => item.title === 'Ekonomisk varning')
    || (game.resolvedEventIds ?? []).some(id => id.startsWith('event_economic_stress_'))
}

function beginInvestment(game: SaveGame): SaveGame {
  let invested: SaveGame = {
    ...game,
    pendingScreen: null,
    academyLevel: 'developing' as const,
    clubs: applyFinanceChange(game.clubs, game.managedClubId, -ACADEMY_START_COST),
  }
  for (const event of [...(invested.pendingEvents ?? [])]) {
    if (event.id.startsWith('event_mecenat_intro_')) {
      invested = resolveEvent(invested, event.id, 'welcome', () => 0.5, false)
    }
  }
  return invested
}

function run(clubId: string, seed: number, difficulty: RunResult['difficulty']): RunResult {
  let game = beginInvestment(createNewGame({ managerName: `D2-${clubId}-${seed}`, clubId, seed }))
  const firstSeason = game.currentSeason
  const start = game.clubs.find(club => club.id === clubId)!.finances
  let minimum = start
  let criticalPathBeforeDeepNegative = false
  let crossedDeepNegative = false
  let stepSeed = seed * 10_000
  let guard = 0

  while (game.currentSeason < firstSeason + SEASONS && guard < 4_000) {
    guard++
    game = autoResolvePendingEvents(game, () => 0.5)
    const screen = autoResolvePendingScreen(game)
    if (screen.unresolvable) break
    game = autoSelectLineup(screen.game)
    const result = advanceToNextEvent(game, stepSeed++)
    game = result.game

    const balance = game.clubs.find(club => club.id === clubId)!.finances
    minimum = Math.min(minimum, balance)
    if (balance >= DEEP_NEGATIVE && hasCriticalPath(game)) criticalPathBeforeDeepNegative = true
    if (balance < DEEP_NEGATIVE) crossedDeepNegative = true

    // D2 mäter ekonomin, inte sportsligt avsked. Säsongsrollovern är redan
    // genomförd när seasonEnded returneras; återställ bara stoppflaggan.
    if (game.managerFired && result.seasonEnded) game = { ...game, managerFired: false }
  }

  return {
    clubId,
    difficulty,
    seed,
    start,
    finish: game.clubs.find(club => club.id === clubId)!.finances,
    minimum,
    criticalPathBeforeDeepNegative,
    crossedDeepNegative,
    completed: game.currentSeason >= firstSeason + SEASONS,
  }
}

function kr(value: number): string {
  return `${Math.round(value / 1_000)} tkr`
}

// Använd erbjudandeflödets faktiska etikett. selectThreeOffers garanterar en
// synlig LÄTT/MEDEL/SVÅR-plats och har en dokumenterad närmaste-grupp-fallback
// om råpoolen är tom; D2 testar spelarens erbjudna kontrakt, inte en dold pool.
const results = SEEDS.flatMap(offerSeed => selectThreeOffers(offerSeed).map((offer, index) =>
  run(offer.clubId, offerSeed * 101 + index, offer.difficulty),
))
for (const difficulty of ['easy', 'medium', 'hard'] as const) {
  const group = results.filter(result => result.difficulty === difficulty)
  const passes = group.filter(result => result.finish >= DEEP_NEGATIVE || result.criticalPathBeforeDeepNegative)
  const deep = group.filter(result => result.crossedDeepNegative)
  const sortedFinish = group.map(result => result.finish).sort((a, b) => a - b)
  const median = sortedFinish[Math.floor(sortedFinish.length / 2)] ?? 0
  console.log(
    `${difficulty.toUpperCase()}: ${passes.length}/${group.length} godkända · `
      + `${deep.length} under -100 tkr · median slut ${kr(median)} · `
      + `spann ${kr(sortedFinish[0] ?? 0)}…${kr(sortedFinish.at(-1) ?? 0)}`,
  )
}

const failures = results.filter(result => !result.completed || (result.finish < DEEP_NEGATIVE && !result.criticalPathBeforeDeepNegative))
if (failures.length > 0) {
  console.log('\nUNDERKÄNDA:')
  for (const result of failures) {
    console.log(`${result.clubId} seed ${result.seed}: slut ${kr(result.finish)}, min ${kr(result.minimum)}, klar=${result.completed}, kritisk väg=${result.criticalPathBeforeDeepNegative}`)
  }
  process.exitCode = 1
} else {
  console.log(`\nGODKÄNT: ${results.length}/${results.length} körningar uppfyllde D2.`)
}
