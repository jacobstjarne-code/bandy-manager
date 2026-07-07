// A5-underlag — genererar målsekvenser från motorn (matchCore via produktionsvägen
// roundProcessor→simulateMatch) för momentum-jämförelse mot verklig data.
//
// Kör: node_modules/.bin/vite-node scripts/sim_goal_sequences.ts
// Output: docs/data/sim_goal_sequences.json (per match: slutresultat + mål [minut, team]).
//
// Replikerar stress-test.ts drivloop men samlar mål-events, inte säsongsstatistik.

import { writeFileSync } from 'node:fs'
import { FixtureStatus, MatchEventType } from '../src/domain/enums'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEEDS = 3
const SEASONS = 3
const MAX_MATCHES = 2500

type Goal = { minute: number; team: 'home' | 'away' }
type Seq = { homeScore: number; awayScore: number; goals: Goal[] }
const sequences: Seq[] = []

function completedIds(game: SaveGame): Set<string> {
  return new Set(game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id))
}

outer:
for (let seedIdx = 0; seedIdx < SEEDS; seedIdx++) {
  let game: SaveGame
  try {
    game = createHeadlessGame(seedIdx)
  } catch {
    continue
  }
  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let stepSeed = seedIdx * 100_000 + season * 1_000
    let prev = completedIds(game)
    let guard = 0
    while (!seasonDone && guard++ < 3000) {
      game = autoSelectLineup(game)
      let result
      try {
        result = advanceToNextEvent(game, stepSeed++)
      } catch {
        break
      }
      game = result.game

      for (const fix of game.fixtures) {
        if (fix.status !== FixtureStatus.Completed || prev.has(fix.id)) continue
        const goals: Goal[] = (fix.events ?? [])
          .filter(e => e.type === MatchEventType.Goal && e.minute <= 90)
          .map(e => ({ minute: e.minute, team: (e.clubId === fix.homeClubId ? 'home' : 'away') as 'home' | 'away' }))
        sequences.push({ homeScore: fix.homeScore ?? 0, awayScore: fix.awayScore ?? 0, goals })
      }
      prev = completedIds(game)
      if (sequences.length >= MAX_MATCHES) break outer

      if (result.seasonEnded || game.managerFired) seasonDone = true
      const resolved = autoResolvePendingScreen(game)
      game = resolved.game
      if (resolved.unresolvable) break
    }
    if (game.managerFired) break
  }
}

writeFileSync(
  'docs/data/sim_goal_sequences.json',
  JSON.stringify({
    _meta: { source: 'matchCore via roundProcessor', seeds: SEEDS, seasons: SEASONS, n_matches: sequences.length },
    matches: sequences,
  }),
)
console.log(`sim: ${sequences.length} matcher, ${sequences.reduce((a, s) => a + s.goals.length, 0)} mål → docs/data/sim_goal_sequences.json`)
