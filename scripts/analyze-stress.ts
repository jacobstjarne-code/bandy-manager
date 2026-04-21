/**
 * Analyserar season_stats.json mot bandygrytan-targets.
 *
 * Kör med: npm run analyze-stress
 * (kräver att npm run stress har körts först)
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATS_PATH = resolve(__dirname, 'stress/season_stats.json')
const TARGETS_PATH = resolve(__dirname, '../docs/data/bandygrytan_detailed.json')

// ── Load files ────────────────────────────────────────────────────────────────

let statsRaw: ReturnType<typeof JSON.parse>
let targetsRaw: ReturnType<typeof JSON.parse>

try {
  statsRaw = JSON.parse(readFileSync(STATS_PATH, 'utf-8'))
} catch {
  console.error(`\n❌ Kan inte läsa ${STATS_PATH}`)
  console.error('   Kör "npm run stress" först för att generera loggfilen.\n')
  process.exit(1)
}

try {
  targetsRaw = JSON.parse(readFileSync(TARGETS_PATH, 'utf-8'))
} catch {
  console.error(`\n❌ Kan inte läsa ${TARGETS_PATH}\n`)
  process.exit(1)
}

const targets = targetsRaw.calibrationTargets.herr as {
  avgGoalsPerMatch: number
  avgHomeGoals: number
  avgAwayGoals: number
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  avgCornersPerMatch: number
  cornerGoalPct: number
  penaltyGoalPct: number
  avgShotsPerMatch: number
  avgSuspensionsPerMatch: number
  avgHalfTimeGoals: number
  htLeadWinPct: number
  goalsSecondHalfPct: number
}

const timeTargets = (targetsRaw.herr.timeDistributions.goals.byDecile as Array<{ range: string; pct: number }>)

type MatchStat = {
  seed: number
  season: number
  round: number
  phase: 'regular' | 'cup' | 'playoff_qf' | 'playoff_sf' | 'playoff_final'
  homeClubId: string
  awayClubId: string
  homeScore: number
  awayScore: number
  halfTimeHome: number
  halfTimeAway: number
  goals: Array<{ minute: number; team: 'home' | 'away'; isCornerGoal: boolean; isPenaltyGoal: boolean }>
  suspensions: Array<{ minute: number; team: 'home' | 'away' }>
  cornersHome: number
  cornersAway: number
  shotsHome: number
  shotsAway: number
  attendance: number
}

type SeasonStats = { seed: number; season: number; matches: MatchStat[] }

const allSeasons = statsRaw.seasons as SeasonStats[]
const allMatches = allSeasons.flatMap(s => s.matches)
const regular = allMatches.filter(m => m.phase === 'regular')

const meta = statsRaw._meta as { seeds: number; seasonsPerSeed: number; totalMatches: number; generatedAt: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0
}

function checkPct(name: string, value: number, target: number, tolerance: number): void {
  const ok = Math.abs(value - target) <= tolerance
  const diff = value - target
  const sign = diff >= 0 ? '+' : ''
  console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(26)} ${value.toFixed(1)}%   (mål ${target}% ±${tolerance}, diff ${sign}${diff.toFixed(1)}pp)`)
}

function checkVal(name: string, value: number, target: number, tolerance: number, decimals = 2): void {
  const ok = Math.abs(value - target) <= tolerance
  const diff = value - target
  const sign = diff >= 0 ? '+' : ''
  console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(26)} ${value.toFixed(decimals)}   (mål ${target} ±${tolerance}, diff ${sign}${diff.toFixed(decimals)})`)
}

const DIV = '─'.repeat(62)

// ══════════════════════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(62)}`)
console.log(`  STRESS-ANALYS — ${meta.seeds} seeds × ${meta.seasonsPerSeed} säsonger`)
console.log(`  Totalt ${meta.totalMatches} matcher (varav ${regular.length} grundserie)`)
console.log(`  Genererad: ${new Date(meta.generatedAt).toLocaleString('sv-SE')}`)
console.log(`${'═'.repeat(62)}`)

// ══════════════════════════════════════════════════════════════════════════════
// A. GRUNDSERIE-AGGREGAT
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nA. GRUNDSERIE-AGGREGAT (jämförelse med bandygrytan ${targets.avgGoalsPerMatch} mål/match)`)
console.log(DIV)

if (regular.length === 0) {
  console.log('  (inga grundserie-matcher insamlade)')
} else {
  const totalGoals = regular.reduce((s, m) => s + m.homeScore + m.awayScore, 0)
  const totalHomeGoals = regular.reduce((s, m) => s + m.homeScore, 0)
  const totalAwayGoals = regular.reduce((s, m) => s + m.awayScore, 0)
  const homeWins = regular.filter(m => m.homeScore > m.awayScore).length
  const draws    = regular.filter(m => m.homeScore === m.awayScore).length
  const awayWins = regular.filter(m => m.awayScore > m.homeScore).length
  const n = regular.length

  const allGoals = regular.flatMap(m => m.goals)
  const cornerGoals = allGoals.filter(g => g.isCornerGoal).length
  const penaltyGoals = allGoals.filter(g => g.isPenaltyGoal).length
  const secondHalfGoals = allGoals.filter(g => g.minute >= 45).length

  const totalCorners = regular.reduce((s, m) => s + m.cornersHome + m.cornersAway, 0)
  const totalSuspensions = regular.reduce((s, m) => s + m.suspensions.length, 0)
  const totalHtGoals = regular.reduce((s, m) => s + m.halfTimeHome + m.halfTimeAway, 0)

  // htLeadWinPct: matches where leading team at HT won the match
  const htLeadMatches = regular.filter(m => m.halfTimeHome !== m.halfTimeAway)
  const htLeadWins = htLeadMatches.filter(m => {
    const htLeader = m.halfTimeHome > m.halfTimeAway ? 'home' : 'away'
    const winner   = m.homeScore > m.awayScore ? 'home' : m.awayScore > m.homeScore ? 'away' : 'draw'
    return htLeader === winner
  }).length

  checkVal('goalsPerMatch',        totalGoals / n,         targets.avgGoalsPerMatch,    1.5, 2)
  checkVal('avgHomeGoals',         totalHomeGoals / n,     targets.avgHomeGoals,        1.0, 2)
  checkVal('avgAwayGoals',         totalAwayGoals / n,     targets.avgAwayGoals,        1.0, 2)
  checkPct('homeWinPct',           pct(homeWins, n),       targets.homeWinPct,          5.0)
  checkPct('drawPct',              pct(draws, n),          targets.drawPct,             3.0)
  checkPct('awayWinPct',           pct(awayWins, n),       targets.awayWinPct,          5.0)
  checkPct('cornerGoalPct',        pct(cornerGoals, totalGoals), targets.cornerGoalPct, 3.0)
  checkPct('penaltyGoalPct',       pct(penaltyGoals, totalGoals), targets.penaltyGoalPct, 2.0)
  checkVal('avgCornersPerMatch',   totalCorners / n,       targets.avgCornersPerMatch,  3.0, 2)
  checkVal('avgSuspensionsPerMatch', totalSuspensions / n, targets.avgSuspensionsPerMatch, 1.0, 2)
  checkVal('avgHalfTimeGoals',     totalHtGoals / n,       targets.avgHalfTimeGoals,   0.5, 2)
  checkPct('htLeadWinPct',         pct(htLeadWins, htLeadMatches.length), targets.htLeadWinPct, 5.0)
  checkPct('goalsSecondHalfPct',   pct(secondHalfGoals, totalGoals), targets.goalsSecondHalfPct, 3.0)
}

// ══════════════════════════════════════════════════════════════════════════════
// B. MÅLMINUTS-FÖRDELNING
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nB. MÅLMINUTS-FÖRDELNING (regular season)`)
console.log(DIV)

const allRegularGoals = regular.flatMap(m => m.goals)

if (allRegularGoals.length === 0) {
  console.log('  (inga mål insamlade)')
} else {
  const buckets = [
    { label: '0-10',  min: 0,  max: 10 },
    { label: '10-20', min: 10, max: 20 },
    { label: '20-30', min: 20, max: 30 },
    { label: '30-40', min: 30, max: 40 },
    { label: '40-50', min: 40, max: 50 },
    { label: '50-60', min: 50, max: 60 },
    { label: '60-70', min: 60, max: 70 },
    { label: '70-80', min: 70, max: 80 },
    { label: '80-90', min: 80, max: 90 },
  ]

  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i]
    const count = allRegularGoals.filter(g => g.minute >= b.min && g.minute < b.max).length
    const actualPct = pct(count, allRegularGoals.length)
    const targetEntry = timeTargets[i]
    const targetPct = targetEntry?.pct ?? 0
    const diff = actualPct - targetPct
    const ok = Math.abs(diff) <= 2.0
    const sign = diff >= 0 ? '+' : ''
    console.log(`  ${ok ? '✅' : '❌'} ${b.label.padEnd(6)}  ${actualPct.toFixed(1).padStart(5)}%   (target ${String(targetPct).padStart(4)}%,  diff ${sign}${diff.toFixed(1)}pp)`)
  }

  // Over 90
  const over90 = allRegularGoals.filter(g => g.minute >= 90).length
  const over90Pct = pct(over90, allRegularGoals.length)
  console.log(`         90+     ${over90Pct.toFixed(1).padStart(5)}%   (target  3.9%, informativt)`)
}

// ══════════════════════════════════════════════════════════════════════════════
// C. SLUTSPEL VS GRUNDSERIE
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nC. SLUTSPEL VS GRUNDSERIE`)
console.log(DIV)

// Targets from ANALYS_SLUTSPEL.md
const playoffTargets: Record<string, number> = {
  regular:       9.12,
  playoff_qf:    8.81,
  playoff_sf:    8.39,
  playoff_final: 7.00,
}

for (const [phase, target] of Object.entries(playoffTargets)) {
  const matches = allMatches.filter(m => m.phase === phase)
  if (matches.length === 0) {
    console.log(`  (${phase}: inga matcher)`)
    continue
  }
  const goals = matches.reduce((s, m) => s + m.homeScore + m.awayScore, 0)
  const gpm = goals / matches.length
  const diff = gpm - target
  const ok = Math.abs(diff) <= 1.5
  const sign = diff >= 0 ? '+' : ''
  console.log(`  ${ok ? '✅' : '❌'} ${phase.padEnd(16)} ${gpm.toFixed(2)} mål/match  (mål ${target}, n=${matches.length}, diff ${sign}${diff.toFixed(2)})`)
}

// ══════════════════════════════════════════════════════════════════════════════
// D. COMEBACK-FREKVENS
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nD. COMEBACK-FREKVENS (halvtidsunderläge → vinst)`)
console.log(DIV)

// Targets from ANALYS_MATCHMONSTER.md §1
const comebackTargets: Array<{ label: string; deficit: (h: number, a: number) => boolean; target: number }> = [
  { label: '−1 mål i halvlek', deficit: (h, a) => Math.abs(h - a) === 1, target: 24.5 },
  { label: '−2 mål i halvlek', deficit: (h, a) => Math.abs(h - a) === 2, target: 11.0 },
  { label: '−3 mål i halvlek', deficit: (h, a) => Math.abs(h - a) === 3, target: 3.7 },
  { label: '−4+ mål i halvlek', deficit: (h, a) => Math.abs(h - a) >= 4, target: 1.3 },
]

const regularWithHt = regular.filter(m => m.halfTimeHome !== m.halfTimeAway)

for (const ct of comebackTargets) {
  const trailing = regularWithHt.filter(m => {
    const htTrailingTeam = m.halfTimeHome < m.halfTimeAway ? 'home' : 'away'
    const deficit = Math.abs(m.halfTimeHome - m.halfTimeAway)
    // Check correct deficit bucket
    if (!ct.deficit(m.halfTimeHome, m.halfTimeAway)) return false
    // Did trailing team come back?
    const trailingWon =
      (htTrailingTeam === 'home' && m.homeScore > m.awayScore) ||
      (htTrailingTeam === 'away' && m.awayScore > m.homeScore)
    return trailingWon
  }).length

  const total = regularWithHt.filter(m => ct.deficit(m.halfTimeHome, m.halfTimeAway)).length
  if (total === 0) {
    console.log(`  ${ct.label.padEnd(22)}  (inga matcher)`)
    continue
  }
  const actualPct = pct(trailing, total)
  const diff = actualPct - ct.target
  const ok = Math.abs(diff) <= 4.0
  const sign = diff >= 0 ? '+' : ''
  console.log(`  ${ok ? '✅' : '❌'} ${ct.label.padEnd(22)}  ${actualPct.toFixed(1).padStart(5)}%   (mål ${ct.target}%, n=${total}, diff ${sign}${diff.toFixed(1)}pp)`)
}

// ══════════════════════════════════════════════════════════════════════════════
// E. HEMMAFÖRDEL PER PERIOD
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nE. HEMMAFÖRDEL PER PERIOD (andel mål av hemmalaget)`)
console.log(DIV)

const buckets = [
  { label: '0-10',  min: 0,  max: 10 },
  { label: '10-20', min: 10, max: 20 },
  { label: '20-30', min: 20, max: 30 },
  { label: '30-40', min: 30, max: 40 },
  { label: '40-50', min: 40, max: 50 },
  { label: '50-60', min: 50, max: 60 },
  { label: '60-70', min: 60, max: 70 },
  { label: '70-80', min: 70, max: 80 },
  { label: '80-90', min: 80, max: 90 },
]

// Expected home share: ~53-55% (homeWinPct 50.2%, home scores more than away)
// No precise per-bucket targets in ANALYS_MATCHMONSTER.md — show raw data
for (const b of buckets) {
  const inBucket = allRegularGoals.filter(g => g.minute >= b.min && g.minute < b.max)
  if (inBucket.length === 0) { console.log(`  ${b.label}  (inga mål)`); continue }
  const homeGoals = inBucket.filter(g => g.team === 'home').length
  const homePct = pct(homeGoals, inBucket.length)
  const bar = '█'.repeat(Math.round(homePct / 2))
  console.log(`  ${b.label.padEnd(6)}  ${homePct.toFixed(1).padStart(5)}%  ${bar}`)
}
console.log(`  (Förväntat: ~53-55% per period — ingen exakt per-bucket-referens)`)

console.log()
