/**
 * Headless season stress-test.
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/stress-test.ts [--seeds=10] [--seasons=5] [--bail-on-crash]
 *
 * Alias: npm run stress
 */

// Sprint 22.7 diagnostic: enable squad-composition logging in seasonEndProcessor
// Remove this line once BUG-STRESS-02 is diagnosed and fixed.
process.env.STRESS_DEBUG = 'true'

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SaveGame } from '../src/domain/entities/SaveGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'

import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import { checkInvariants } from './stress/invariants'
import { printSeedProgress, printFinalReport } from './stress/reporter'
import type { SeedResult } from './stress/reporter'

// ── Arg parsing ──────────────────────────────────────────────────────────────

function parseArgs(): { seeds: number; seasons: number; bailOnCrash: boolean } {
  const args = process.argv.slice(2)
  let seeds       = 10
  let seasons     = 5
  let bailOnCrash = false

  for (const arg of args) {
    if (arg.startsWith('--seeds='))    seeds       = parseInt(arg.split('=')[1], 10)
    if (arg.startsWith('--seasons='))  seasons     = parseInt(arg.split('=')[1], 10)
    if (arg === '--bail-on-crash')     bailOnCrash = true
  }
  return { seeds, seasons, bailOnCrash }
}

// ── Failure dump ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const FAILURES_DIR = resolve(__dirname, 'stress/failures')

function writeDump(
  seed: number,
  season: number,
  round: number | null,
  errorMsg: string,
  stack: string | undefined,
  game: SaveGame,
  lastActions: string[],
): void {
  if (!existsSync(FAILURES_DIR)) {
    mkdirSync(FAILURES_DIR, { recursive: true })
  }
  const r = round ?? 0
  const filename = resolve(FAILURES_DIR, `seed${seed + 1}-season${season}-round${r}.json`)
  const content = JSON.stringify({
    seed: seed + 1,
    season,
    round: r,
    error: errorMsg,
    stack,
    gameSnapshot: game,
    lastActions,
  }, null, 2)
  try {
    writeFileSync(filename, content)
  } catch (e) {
    console.error(`  [dump] Failed to write ${filename}: ${e}`)
  }
}

// ── Ring buffer for lastActions ───────────────────────────────────────────────

const RING_SIZE = 10

function makeRingBuffer(): { push: (s: string) => void; snapshot: () => string[] } {
  const buf: string[] = []
  return {
    push(s: string) {
      if (buf.length >= RING_SIZE) buf.shift()
      buf.push(s)
    },
    snapshot() { return [...buf] },
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { seeds, seasons, bailOnCrash } = parseArgs()

  console.log(`\nStarting stress test: ${seeds} seeds × ${seasons} seasons`)
  console.log('─'.repeat(50))

  const results: SeedResult[] = []
  let exitCode = 0

  for (let seedIdx = 0; seedIdx < seeds; seedIdx++) {
    const ring = makeRingBuffer()
    const warnings: SeedResult['warnings'] = []
    let game: SaveGame
    let seedCrashed = false
    let crashReason: string | undefined
    let crashSeason: number | undefined
    let crashRound: number | null | undefined
    let seasonsCompleted = 0
    let seasonsAttempted = 0

    try {
      game = createHeadlessGame(seedIdx)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const stack = e instanceof Error ? e.stack : undefined
      const placeholder = { id: `seed-${seedIdx}`, error: 'createNewGame failed' } as unknown as SaveGame
      writeDump(seedIdx, 0, null, `createNewGame: ${msg}`, stack, placeholder, [])
      results.push({
        seed: seedIdx, seasonsCompleted: 0, seasonsAttempted: 0,
        crashed: true, crashReason: `createNewGame: ${msg}`, crashSeason: 0, crashRound: null,
        warnings: [],
      })
      if (bailOnCrash) { exitCode = 1; break }
      continue
    }

    for (let season = 1; season <= seasons; season++) {
      seasonsAttempted++
      let seasonDone = false
      let stepSeed = seedIdx * 100_000 + season * 1_000

      while (!seasonDone && !seedCrashed) {
        // Always set lineup before advancing (advance clears managedClubPendingLineup each round)
        game = autoSelectLineup(game)

        // Advance
        let roundPlayed: number | null = null
        try {
          const result = advanceToNextEvent(game, stepSeed++)
          game = result.game
          roundPlayed = result.roundPlayed
          ring.push(`advance season=${season} round=${roundPlayed ?? 'season-end'} seed=${stepSeed - 1}`)

          if (result.seasonEnded) {
            seasonDone = true
          }
        } catch (e) {
          const msg   = e instanceof Error ? e.message : String(e)
          const stack = e instanceof Error ? e.stack : undefined
          crashReason = msg
          crashSeason = season
          crashRound  = roundPlayed
          writeDump(seedIdx, season, roundPlayed, msg, stack, game, ring.snapshot())
          seedCrashed = true
          break
        }

        // Check invariants
        const findings = checkInvariants(game)
        let invariantCrash = false

        for (const f of findings) {
          if (f.severity === 'crash') {
            crashReason = `invariant:${f.name} — ${f.message}`
            crashSeason = season
            crashRound  = roundPlayed
            writeDump(seedIdx, season, roundPlayed, crashReason, undefined, game, ring.snapshot())
            seedCrashed    = true
            invariantCrash = true
            break
          } else {
            warnings.push({ season, round: roundPlayed, finding: f })
          }
        }

        if (invariantCrash) break

        // Auto-resolve any pending screen
        const resolved = autoResolvePendingScreen(game)
        game = resolved.game

        if (resolved.unresolvable) {
          crashReason = `unresolvableScreen:${resolved.screenType}`
          crashSeason = season
          crashRound  = roundPlayed
          writeDump(seedIdx, season, roundPlayed, crashReason, undefined, game, ring.snapshot())
          seedCrashed = true
          break
        }
      }

      if (seedCrashed) break
      seasonsCompleted++
    }

    const seedResult: SeedResult = {
      seed: seedIdx,
      seasonsCompleted,
      seasonsAttempted,
      crashed: seedCrashed,
      crashReason,
      crashSeason,
      crashRound: crashRound ?? null,
      warnings,
    }
    results.push(seedResult)

    printSeedProgress(seedResult, seeds)

    if (seedCrashed) {
      exitCode = 1
      if (bailOnCrash) break
    }
  }

  console.log()
  printFinalReport({ seeds, maxSeasons: seasons, results })

  process.exit(exitCode)
}

main().catch(e => {
  console.error('Unhandled error in stress-test:', e)
  process.exit(1)
})
