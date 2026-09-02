/**
 * measure_sp6_interrupts.ts
 *
 * Mäter C-SP6: interrupt-spik inför andra semi-finalen.
 * Simulerar X seeds till playoffs, snappar countPendingInterrupts vid:
 *   A) Precis efter QF-serien är avgjord (managed team kvalat till SF)
 *   B) Precis innan SF match 1
 *   C) Precis efter SF match 1 / innan SF match 2  ← "inför andra semin"
 *
 * Kör med:
 *   node_modules/.bin/vite-node scripts/measure_sp6_interrupts.ts [--seeds=20]
 */

import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { countPendingInterrupts } from '../src/domain/services/interruptClassifier'
import { createHeadlessGame, autoSelectLineup, autoResolvePendingScreen } from './stress/fixtures'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { FixtureStatus } from '../src/domain/enums'

// ── Arg parsing ──────────────────────────────────────────────────────────────

const seeds = (() => {
  const arg = process.argv.find(a => a.startsWith('--seeds='))
  return arg ? parseInt(arg.split('=')[1], 10) : 20
})()

// ── Helpers ──────────────────────────────────────────────────────────────────

function totalInterrupts(game: SaveGame): number {
  const counts = countPendingInterrupts(game)
  return Object.values(counts).reduce((s, c) => s + c.total, 0)
}

function interruptSummary(game: SaveGame): string {
  const counts = countPendingInterrupts(game)
  const parts: string[] = []
  for (const [cat, c] of Object.entries(counts)) {
    if (c.total > 0) parts.push(`${cat}:${c.total}(${c.actionable}A/${c.informational}I)`)
  }
  return parts.length ? parts.join(' ') : 'none'
}

function managedSFSeries(game: SaveGame) {
  const mid = game.managedClubId
  return game.playoffBracket?.semiFinals.find(
    s => s.homeClubId === mid || s.awayClubId === mid
  ) ?? null
}

function sfGamesPlayed(game: SaveGame): number {
  const sf = managedSFSeries(game)
  if (!sf) return 0
  return sf.homeWins + sf.awayWins
}

function nextManagedFixture(game: SaveGame) {
  const mid = game.managedClubId
  return game.fixtures
    .filter(f =>
      f.status === FixtureStatus.Scheduled &&
      (f.homeClubId === mid || f.awayClubId === mid)
    )
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
}

// ── Advance with auto-resolve ────────────────────────────────────────────────

const MAX_STEPS = 2000

function advanceFull(game: SaveGame): SaveGame | undefined {
  let g = game
  for (let i = 0; i < MAX_STEPS; i++) {
    // Resolve pending screen
    const r = autoResolvePendingScreen(g)
    if (r.unresolvable) return undefined
    g = r.game

    // Auto-resolve pending events
    if (g.pendingEvents?.some(e => !e.resolved)) {
      g = {
        ...g,
        pendingEvents: g.pendingEvents!.map(e => ({ ...e, resolved: true })),
      }
      continue
    }
    // Auto-resolve weekly decision
    if (g.pendingWeeklyDecision) {
      g = { ...g, pendingWeeklyDecision: undefined }
      continue
    }
    // Auto-resolve scene
    if (g.pendingScene) {
      g = { ...g, pendingScene: undefined }
      continue
    }
    return g
  }
  return undefined
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface SeedReport {
  seed: number
  reachedSF: boolean
  afterQF?: string
  beforeSF1?: string
  beforeSF2?: string
  totalBeforeSF2?: number
  note?: string
}

const reports: SeedReport[] = []

console.log(`\nC-SP6 interrupt mätning — ${seeds} seeds\n`)

for (let seed = 0; seed < seeds; seed++) {
  let game = createHeadlessGame(seed)
  const report: SeedReport = { seed, reachedSF: false }

  let steps = 0
  let reachedSF = false
  let snappedAfterQF = false
  let snappedBeforeSF1 = false
  let snappedBeforeSF2 = false

  while (steps < MAX_STEPS) {
    steps++

    // Select lineup before advancing
    game = autoSelectLineup(game)

    // Advance one step
    try {
      game = advanceToNextEvent(game).game
    } catch {
      report.note = 'crash'
      break
    }

    // Resolve any blocking state
    const resolved = advanceFull(game)
    if (!resolved) { report.note = 'unresolvable screen'; break }
    game = resolved

    const sf = managedSFSeries(game)
    const gamesInSF = sfGamesPlayed(game)
    const next = nextManagedFixture(game)

    // Snap A: managed team just reached SF (QF won, SF series exists but 0 games played)
    if (!snappedAfterQF && sf && gamesInSF === 0) {
      snappedAfterQF = true
      report.afterQF = interruptSummary(game)
      reachedSF = true
    }

    // Snap B: right before SF match 1 (SF series has 0 games, next managed fixture is in SF)
    if (!snappedBeforeSF1 && sf && gamesInSF === 0 && next) {
      const nextIsInSF = sf.fixtures.includes(next.id)
      if (nextIsInSF) {
        snappedBeforeSF1 = true
        report.beforeSF1 = interruptSummary(game)
      }
    }

    // Snap C: after SF match 1 / before SF match 2
    if (!snappedBeforeSF2 && sf && gamesInSF === 1) {
      snappedBeforeSF2 = true
      report.beforeSF2 = interruptSummary(game)
      report.totalBeforeSF2 = totalInterrupts(game)
    }

    // Stop once we've captured all three snaps or SF is done
    if (snappedBeforeSF2) break
    if (sf?.winnerId) break

    // Stop if regular season not done and we've passed matchday 30+ without SF
    if (game.currentMatchday > 35 && !sf) break
  }

  report.reachedSF = reachedSF
  reports.push(report)

  const sfLabel = report.reachedSF ? '✓ SF' : '— no SF'
  const before2 = report.beforeSF2 ?? '—'
  const total = report.totalBeforeSF2 !== undefined ? ` (${report.totalBeforeSF2} total)` : ''
  console.log(`  seed ${String(seed).padStart(2)}: ${sfLabel}  |  inför SF2: ${before2}${total}${report.note ? '  ⚠ ' + report.note : ''}`)
}

// ── Summary ──────────────────────────────────────────────────────────────────

const sfSeeds = reports.filter(r => r.reachedSF)
console.log(`\n── Sammanfattning ──────────────────────────────────────────────`)
console.log(`Seeds som nådde SF: ${sfSeeds.length}/${seeds}`)

if (sfSeeds.length > 0) {
  const totals = sfSeeds.filter(r => r.totalBeforeSF2 !== undefined).map(r => r.totalBeforeSF2!)
  const avg = totals.reduce((s, v) => s + v, 0) / totals.length
  const max = Math.max(...totals)
  const min = Math.min(...totals)
  const over5 = totals.filter(v => v > 5).length
  console.log(`Interrupts inför SF2:  avg=${avg.toFixed(1)}  min=${min}  max=${max}  >5: ${over5}/${totals.length}`)
  console.log(`\nNormala 1-3 → om max är ≥6 utan tydlig legit orsak = dubbel-trigger-kandidat.`)
  console.log(`\nPerSeed-breakdown (SF-seeds):`)
  for (const r of sfSeeds) {
    console.log(`  seed ${String(r.seed).padStart(2)}:  afterQF=[${r.afterQF ?? '—'}]  beforeSF1=[${r.beforeSF1 ?? '—'}]  beforeSF2=[${r.beforeSF2 ?? '—'}]`)
  }
}
