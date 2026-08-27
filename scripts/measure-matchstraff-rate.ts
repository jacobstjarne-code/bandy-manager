/**
 * PÅSTÅENDEGRINDEN väg 1 (2026-08-24, Jacobs order): mät hur ofta tre
 * utvisningar på samma spelare i samma match faktiskt sker i en
 * stresskörning. Matchstraffet är inte längre en 2%-slump — det härleds ur
 * REGLER.md:s regel ("Tredje utvisningen på samma spelare = automatiskt
 * matchstraff"), se playerStateProcessor.ts. Frekvensen bestämmer om regeln
 * behöver ett komplement.
 *
 * Kör: npx vite-node scripts/measure-matchstraff-rate.ts [seeds] [seasons]
 */
import { createHeadlessGame, autoSelectLineup, autoBuildCheapestAffordableFacility } from './stress/fixtures'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { SaveGame } from '../src/domain/entities/SaveGame'

const SEEDS = Number(process.argv[2] ?? 20)
const SEASONS = Number(process.argv[3] ?? 3)

let totalMatches = 0
let matchesWithMatchstraff = 0
let totalMatchstraffCount = 0
let totalSuspensionEvents = 0

for (let seedIdx = 0; seedIdx < SEEDS; seedIdx++) {
  let game: SaveGame = createHeadlessGame(seedIdx)

  for (let season = 1; season <= SEASONS; season++) {
    let seasonDone = false
    let stepSeed = seedIdx * 100_000 + season * 1_000
    let previouslyCompletedIds = new Set<string>(
      game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id)
    )

    while (!seasonDone) {
      game = autoSelectLineup(game)
      game = autoBuildCheapestAffordableFacility(game)

      let result
      try {
        result = advanceToNextEvent(game, stepSeed++)
      } catch (e) {
        console.error(`seed=${seedIdx} season=${season}: crash, skippar resten av säsongen (${e instanceof Error ? e.message : e})`)
        break
      }
      game = result.game

      const newlyCompleted = result.game.fixtures.filter(f =>
        f.status === FixtureStatus.Completed && !previouslyCompletedIds.has(f.id)
      )
      for (const fixture of newlyCompleted) {
        totalMatches++
        const countPerPlayer: Record<string, number> = {}
        for (const event of fixture.events) {
          if (event.type === MatchEventType.Suspension && event.playerId) {
            totalSuspensionEvents++
            countPerPlayer[event.playerId] = (countPerPlayer[event.playerId] ?? 0) + 1
          }
        }
        const matchstraffInThisMatch = Object.values(countPerPlayer).filter(c => c >= 3).length
        if (matchstraffInThisMatch > 0) {
          matchesWithMatchstraff++
          totalMatchstraffCount += matchstraffInThisMatch
        }
      }
      previouslyCompletedIds = new Set(result.game.fixtures.filter(f => f.status === FixtureStatus.Completed).map(f => f.id))

      if (result.roundPlayed === null) seasonDone = true
      if (result.seasonEnded) seasonDone = true
    }
  }
}

console.log(`\nMatchstraff-frekvens (REGLER.md, tredje utvisningen samma spelare samma match)`)
console.log('─'.repeat(60))
console.log(`Seeds × säsonger:            ${SEEDS} × ${SEASONS}`)
console.log(`Totalt simulerade matcher:   ${totalMatches}`)
console.log(`Totalt utvisningar:          ${totalSuspensionEvents} (${(totalSuspensionEvents / totalMatches).toFixed(2)}/match)`)
console.log(`Matcher med ≥1 matchstraff:  ${matchesWithMatchstraff} (${(100 * matchesWithMatchstraff / totalMatches).toFixed(3)}%)`)
console.log(`Totalt antal matchstraff:    ${totalMatchstraffCount} (${(100 * totalMatchstraffCount / totalMatches).toFixed(3)}% av matcher, kan vara >1/match)`)
