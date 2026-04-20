/**
 * Stress-test reporter — progress lines under körning + slutrapport per §6.
 */

import type { InvariantFinding } from './invariants'
import { INVARIANT_NAMES } from './invariants'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SeedResult {
  seed: number
  seasonsCompleted: number
  seasonsAttempted: number
  crashed: boolean
  crashReason?: string
  crashSeason?: number
  crashRound?: number | null
  warnings: Array<{ season: number; round: number | null; finding: InvariantFinding }>
}

// ── Progress (stdout during run) ─────────────────────────────────────────────

/**
 * Prints one progress line per seed.
 * Format: [seed 1/10] season 1 ✓  season 2 ✓  season 3 ✗ invariant:squadSize @ round 17
 */
export function printSeedProgress(result: SeedResult, totalSeeds: number): void {
  let line = `[seed ${result.seed + 1}/${totalSeeds}]`

  for (let s = 1; s <= result.seasonsAttempted; s++) {
    if (s <= result.seasonsCompleted) {
      line += `  season ${s} ✓`
    } else if (result.crashed && s === result.crashSeason) {
      const where = result.crashRound != null ? ` @ round ${result.crashRound}` : ''
      const reason = result.crashReason ? `  ${result.crashReason}` : ''
      line += `  season ${s} ✗${reason}${where}`
    }
  }

  console.log(line)
}

/**
 * Prints one line per advance step (verbose mode only).
 */
export function printAdvanceStep(seedIdx: number, season: number, roundPlayed: number | null): void {
  const rnd = roundPlayed != null ? `round ${roundPlayed}` : 'season-end'
  process.stdout.write(`  [s${season}] ${rnd}\r`)
}

// ── Final report (§6.2) ───────────────────────────────────────────────────────

export interface FinalStats {
  seeds: number
  maxSeasons: number
  results: SeedResult[]
}

export function printFinalReport(stats: FinalStats): void {
  const { seeds, maxSeasons, results } = stats
  const totalAttempted = results.reduce((s, r) => s + r.seasonsAttempted, 0)
  const totalCompleted = results.reduce((s, r) => s + r.seasonsCompleted, 0)
  const crashes = results.filter(r => r.crashed)

  // Collect all warnings
  const allWarnings = results.flatMap(r =>
    r.warnings.map(w => ({ seed: r.seed, ...w }))
  )

  // Per-invariant violation counts
  const crashCounts: Record<string, number> = {}
  const warnCounts:  Record<string, number> = {}
  for (const name of INVARIANT_NAMES) {
    crashCounts[name] = 0
    warnCounts[name]  = 0
  }
  for (const r of results) {
    if (r.crashed && r.crashReason) {
      const name = r.crashReason.replace(/^invariant:/, '').split(' ')[0]
      crashCounts[name] = (crashCounts[name] ?? 0) + 1
    }
  }
  for (const w of allWarnings) {
    const name = w.finding.name
    warnCounts[name] = (warnCounts[name] ?? 0) + 1
  }

  console.log()
  console.log('═══ STRESS TEST ═══')
  console.log(`Seeds: ${seeds}`)
  console.log(`Max seasons: ${maxSeasons}`)
  console.log(`Completed: ${totalCompleted} seasons out of ${totalAttempted} attempted`)
  console.log()

  if (crashes.length === 0) {
    console.log('Crashes: 0')
  } else {
    console.log(`Crashes: ${crashes.length}`)
    for (const r of crashes) {
      const round = r.crashRound != null ? ` round ${r.crashRound}` : ''
      console.log(`  - seed ${r.seed + 1} season ${r.crashSeason}${round}: ${r.crashReason}`)
    }
  }
  console.log()

  const nonCrashWarnings = allWarnings.filter(w => w.finding.severity === 'warn')
  if (nonCrashWarnings.length === 0) {
    console.log('Invariant breaks (non-crash warns): 0')
  } else {
    console.log(`Invariant breaks (non-crash warns): ${nonCrashWarnings.length}`)
    const warnsByName: Record<string, number> = {}
    for (const w of nonCrashWarnings) {
      warnsByName[w.finding.name] = (warnsByName[w.finding.name] ?? 0) + 1
    }
    for (const [name, count] of Object.entries(warnsByName)) {
      console.log(`  - ${name}: ${count}`)
    }
  }
  console.log()

  console.log('Per-invariant summary:')
  for (const name of INVARIANT_NAMES) {
    const crashes = crashCounts[name] ?? 0
    const warns   = warnCounts[name]  ?? 0
    if (crashes > 0) {
      console.log(`  ${name}: ${crashes} violations (crashes)`)
    } else if (warns > 0) {
      console.log(`  ${name}: ${warns} warnings`)
    } else {
      console.log(`  ${name}: 0 violations`)
    }
  }
  console.log()
  console.log('Failure dumps: scripts/stress/failures/')
}
