/**
 * Analyserar season_stats.json mot bandygrytan-targets.
 *
 * Kör med: npm run analyze-stress
 * (kräver att npm run stress har körts först)
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { accumulateScorelineMinutes } from './stress/scoreline-utils'

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

// ══════════════════════════════════════════════════════════════════════════════
// F. UTVISNINGAR × SPELLÄGE × FAS (stress-data)
// Referens: SCORELINE_REFERENCE.md (bandygrytan 1.1+1.4)
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nF. UTVISNINGAR × SPELLÄGE × FAS (stress-data)`)
console.log(DIV)

// Bandygrytan-referens (från SCORELINE_REFERENCE.md, sektion 1.1):
//   Ledning 22.5/kmin (1.04x), Jämnt 19.6/kmin (0.91x), Underläge 22.5/kmin (1.04x)
const FOUL_REF = { leading: 22.5, tied: 19.6, trailing: 22.5 }

type ScorelineStateF = 'leading' | 'tied' | 'trailing'
const STATE_LABELS_F: Array<[string, ScorelineStateF]> = [
  ['Ledning', 'leading'], ['Jämnt', 'tied'], ['Underläge', 'trailing'],
]

function computeStressFoulStats(matches: typeof allMatches) {
  const stateMinutes: Record<ScorelineStateF, number> = { leading: 0, tied: 0, trailing: 0 }
  const stateFouls:   Record<ScorelineStateF, number> = { leading: 0, tied: 0, trailing: 0 }

  for (const m of matches) {
    const { home, away } = accumulateScorelineMinutes(m.goals, 90)
    stateMinutes.leading  += home.leading  + away.leading
    stateMinutes.tied     += home.tied     + away.tied
    stateMinutes.trailing += home.trailing + away.trailing

    for (const s of m.suspensions) {
      // Classify scoreline at suspension minute using accumulated goals up to that minute
      let h = 0, a = 0
      for (const g of m.goals) {
        // Tie-break: goal at same minute = happened before the suspension
        if (g.minute <= s.minute) { if (g.team === 'home') h++; else a++ }
      }
      const diff = s.team === 'home' ? h - a : a - h
      const state: ScorelineStateF = diff > 0 ? 'leading' : diff < 0 ? 'trailing' : 'tied'
      stateFouls[state]++
    }
  }

  return { stateMinutes, stateFouls }
}

const phases_f = [
  { key: 'regular'       as const, label: 'Grundserie' },
  { key: 'playoff_qf'   as const, label: 'KVF'        },
  { key: 'playoff_sf'   as const, label: 'SF'         },
  { key: 'playoff_final'as const, label: 'Final'      },
]

// Overall (all phases)
{
  const { stateMinutes, stateFouls } = computeStressFoulStats(allMatches)
  const totalSusp = Object.values(stateFouls).reduce((s, n) => s + n, 0)
  console.log(`  Totala utvisningar klassificerade: ${totalSusp}`)
  console.log()
  console.log(`  ${''.padEnd(12)} ${'Minuter'.padStart(9)} ${'Utvisn'.padStart(9)} ${'Per 1kmin'.padStart(11)} ${'Referens'.padStart(10)} ${'Diff'.padStart(8)}`)
  console.log('  ' + '─'.repeat(62))
  for (const [label, state] of STATE_LABELS_F) {
    const rate = stateMinutes[state] > 0 ? (stateFouls[state] / stateMinutes[state]) * 1000 : 0
    const ref = FOUL_REF[state]
    const diff = rate - ref
    const sign = diff >= 0 ? '+' : ''
    console.log(
      `  ${label.padEnd(12)}` +
      ` ${String(stateMinutes[state]).padStart(9)}` +
      ` ${String(stateFouls[state]).padStart(9)}` +
      ` ${rate.toFixed(2).padStart(11)}` +
      ` ${ref.toFixed(1).padStart(10)}` +
      ` ${(sign + diff.toFixed(2)).padStart(8)}`,
    )
  }
}

// Per phase
console.log()
console.log(`  ${''.padEnd(14)} ${'Grundserie'.padStart(12)} ${'KVF'.padStart(8)} ${'SF'.padStart(8)} ${'Final'.padStart(8)}`)
console.log('  ' + '─'.repeat(52))

const phaseRates_f: Record<string, Record<ScorelineStateF, number>> = {}
for (const { key } of phases_f) {
  const ms = allMatches.filter(m => m.phase === key)
  const { stateMinutes, stateFouls } = computeStressFoulStats(ms)
  phaseRates_f[key] = {
    leading:  stateMinutes.leading  > 0 ? (stateFouls.leading  / stateMinutes.leading)  * 1000 : 0,
    tied:     stateMinutes.tied     > 0 ? (stateFouls.tied     / stateMinutes.tied)     * 1000 : 0,
    trailing: stateMinutes.trailing > 0 ? (stateFouls.trailing / stateMinutes.trailing) * 1000 : 0,
  }
}

for (const [label, state] of STATE_LABELS_F) {
  const vals = phases_f.map(({ key }) => {
    const r = phaseRates_f[key]?.[state] ?? 0
    return r > 0 ? r.toFixed(2) : '—'
  })
  const [v0, ...vRest] = vals
  console.log(`  ${label.padEnd(14)} ${v0.padStart(12)} ${vRest.map(v => v.padStart(8)).join('')}`)
}

const matchCounts_f = phases_f.map(({ key }) => allMatches.filter(m => m.phase === key).length)
console.log(`  ${'(n matcher)'.padEnd(14)} ${String(matchCounts_f[0]).padStart(12)} ${matchCounts_f.slice(1).map(n => String(n).padStart(8)).join('')}`)
console.log()

{
  // Interpretation
  const regRates = phaseRates_f.regular
  if (regRates) {
    const leading_rate = regRates.leading, tied_rate = regRates.tied, trailing_rate = regRates.trailing
    const baseRate = (leading_rate + tied_rate + trailing_rate) / 3
    const leadRel = baseRate > 0 ? leading_rate / baseRate : 1
    const trailRel = baseRate > 0 ? trailing_rate / baseRate : 1
    if (Math.abs(leadRel - 1) < 0.15 && Math.abs(trailRel - 1) < 0.15) {
      console.log('  → Jämnt fördelat i stress-data (stämmer med bandygrytan-referens).')
    } else if (trailRel > leadRel) {
      console.log('  → Underläge dominerar i motor — frustrationsfouls överdrivna.')
    } else {
      console.log('  → Avvikelse mot bandygrytan-referens — motor-kalibrering krävs (Sprint 25b).')
    }
  }
  // Check overall total
  const totalStressSusp = allMatches.reduce((s, m) => s + m.suspensions.length, 0)
  const avgPerMatch = totalStressSusp / allMatches.length
  const refAvg = 3.77
  const diff = avgPerMatch - refAvg
  const sign = diff >= 0 ? '+' : ''
  console.log(`  Snitt utvisningar/match: ${avgPerMatch.toFixed(2)} (bandygrytan: ${refAvg}, diff ${sign}${diff.toFixed(2)}) — Gap 3 bekräftat.`)
}

// ══════════════════════════════════════════════════════════════════════════════
// G. STRAFF × SPELLÄGE × FAS (stress-data)
// Referens: SCORELINE_REFERENCE.md (bandygrytan 1.3)
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nG. STRAFF × SPELLÄGE × FAS (stress-data)`)
console.log(DIV)

// Bandygrytan-referens: ledning 3.04/kmin, jämnt 2.57/kmin, underläge 2.53/kmin
const PEN_REF = { leading: 3.04, tied: 2.57, trailing: 2.53 }

function computeStressPenaltyStats(matches: typeof allMatches) {
  const stateMinutes: Record<ScorelineStateF, number> = { leading: 0, tied: 0, trailing: 0 }
  const statePenalties: Record<ScorelineStateF, number> = { leading: 0, tied: 0, trailing: 0 }

  for (const m of matches) {
    const { home, away } = accumulateScorelineMinutes(m.goals, 90)
    stateMinutes.leading  += home.leading  + away.leading
    stateMinutes.tied     += home.tied     + away.tied
    stateMinutes.trailing += home.trailing + away.trailing

    for (const g of m.goals.filter(g => g.isPenaltyGoal)) {
      // Score before this penalty goal: count goals with minute < g.minute
      let h = 0, a = 0
      for (const og of m.goals) {
        if (og.minute < g.minute) { if (og.team === 'home') h++; else a++ }
      }
      const diff = g.team === 'home' ? h - a : a - h
      const state: ScorelineStateF = diff > 0 ? 'leading' : diff < 0 ? 'trailing' : 'tied'
      statePenalties[state]++
    }
  }

  return { stateMinutes, statePenalties }
}

const totalPenGoals = allMatches.reduce((s, m) => s + m.goals.filter(g => g.isPenaltyGoal).length, 0)
const totalAllGoals = allMatches.reduce((s, m) => s + m.goals.length, 0)
const penPct = totalAllGoals > 0 ? (totalPenGoals / totalAllGoals * 100).toFixed(2) : '0'

console.log(`  Totala straffmål: ${totalPenGoals} (${penPct}% av mål)`)
if (totalPenGoals === 0) {
  console.log('  → Gap 5 bekräftat: motor producerar inga straffmål. Kräver Sprint 25c.')
} else {
  console.log(`  Estimerat antal straffar (÷ 0.70): ~${Math.round(totalPenGoals / 0.70)}`)
  console.log()

  // Overall
  {
    const { stateMinutes, statePenalties } = computeStressPenaltyStats(allMatches)
    const totalClass = Object.values(statePenalties).reduce((s, n) => s + n, 0)
    console.log(`  Straffmål klassificerade: ${totalClass}`)
    console.log()
    console.log(`  ${''.padEnd(12)} ${'Minuter'.padStart(9)} ${'Straff'.padStart(9)} ${'Per 1kmin'.padStart(11)} ${'Referens'.padStart(10)} ${'Diff'.padStart(8)}`)
    console.log('  ' + '─'.repeat(62))
    for (const [label, state] of STATE_LABELS_F) {
      const rate = stateMinutes[state] > 0 ? (statePenalties[state] / stateMinutes[state]) * 1000 : 0
      const ref = PEN_REF[state]
      const diff = rate - ref
      const sign = diff >= 0 ? '+' : ''
      console.log(
        `  ${label.padEnd(12)}` +
        ` ${String(stateMinutes[state]).padStart(9)}` +
        ` ${String(statePenalties[state]).padStart(9)}` +
        ` ${rate.toFixed(3).padStart(11)}` +
        ` ${ref.toFixed(2).padStart(10)}` +
        ` ${(sign + diff.toFixed(3)).padStart(8)}`,
      )
    }
  }

  // Per phase
  console.log()
  console.log(`  ${''.padEnd(14)} ${'Grundserie'.padStart(12)} ${'KVF'.padStart(8)} ${'SF'.padStart(8)} ${'Final'.padStart(8)}`)
  console.log('  ' + '─'.repeat(52))

  const phases_g = [
    { key: 'regular'        as const, label: 'Grundserie' },
    { key: 'playoff_qf'    as const, label: 'KVF'        },
    { key: 'playoff_sf'    as const, label: 'SF'         },
    { key: 'playoff_final' as const, label: 'Final'      },
  ]

  const phaseRates_g: Record<string, Record<ScorelineStateF, number>> = {}
  const phasePenCounts: Record<string, number> = {}

  for (const { key } of phases_g) {
    const ms = allMatches.filter(m => m.phase === key)
    const { stateMinutes, statePenalties } = computeStressPenaltyStats(ms)
    phasePenCounts[key] = Object.values(statePenalties).reduce((s, n) => s + n, 0)
    phaseRates_g[key] = {
      leading:  stateMinutes.leading  > 0 ? (statePenalties.leading  / stateMinutes.leading)  * 1000 : 0,
      tied:     stateMinutes.tied     > 0 ? (statePenalties.tied     / stateMinutes.tied)     * 1000 : 0,
      trailing: stateMinutes.trailing > 0 ? (statePenalties.trailing / stateMinutes.trailing) * 1000 : 0,
    }
  }

  for (const [label, state] of STATE_LABELS_F) {
    const vals = phases_g.map(({ key }) => {
      const n = phasePenCounts[key]
      if (n === 0) return '—'
      const r = phaseRates_g[key]?.[state] ?? 0
      return r > 0 ? r.toFixed(3) : '0.000'
    })
    const [v0, ...vRest] = vals
    console.log(`  ${label.padEnd(14)} ${v0.padStart(12)} ${vRest.map(v => v.padStart(8)).join('')}`)
  }
  console.log(`  ${'(n straffmål)'.padEnd(14)} ${String(phasePenCounts.regular).padStart(12)} ${['playoff_qf','playoff_sf','playoff_final'].map(k => String(phasePenCounts[k]).padStart(8)).join('')}`)
}

// ══════════════════════════════════════════════════════════════════════════════
// H. PER-FAS ANALYS — goalsPerMatch / homeWin% / avgSusp / cornerGoalPct
// Targets: ANALYS_SLUTSPEL.md + SCORELINE_REFERENCE.md
// Tolerances from SPRINT_25D spec (wider for smaller playoff samples).
// ══════════════════════════════════════════════════════════════════════════════

console.log(`\nH. PER-FAS ANALYS (Sprint 25d)`)
console.log(DIV)

{
  type PhaseKey = 'regular' | 'playoff_qf' | 'playoff_sf' | 'playoff_final'

  const PHASE_META: Array<{
    key: PhaseKey
    label: string
    targets: { goalsPerMatch: number; homeWinPct: number; avgSusp: number; cornerGoalPct: number }
    tol:     { goalsPerMatch: number; homeWinPct: number; avgSusp: number; cornerGoalPct: number }
  }> = [
    {
      key: 'regular',
      label: 'Grundserie',
      targets: { goalsPerMatch: 9.12, homeWinPct: 50.2, avgSusp: 3.77, cornerGoalPct: 22.2 },
      tol:     { goalsPerMatch: 0.3,  homeWinPct: 2.0,  avgSusp: 0.3,  cornerGoalPct: 2.0  },
    },
    {
      key: 'playoff_qf',
      label: 'KVF',
      targets: { goalsPerMatch: 8.81, homeWinPct: 60.3, avgSusp: 3.18, cornerGoalPct: 20.0 },
      tol:     { goalsPerMatch: 0.5,  homeWinPct: 4.0,  avgSusp: 0.4,  cornerGoalPct: 3.0  },
    },
    {
      key: 'playoff_sf',
      label: 'SF',
      targets: { goalsPerMatch: 8.39, homeWinPct: 57.9, avgSusp: 3.55, cornerGoalPct: 18.8 },
      tol:     { goalsPerMatch: 0.6,  homeWinPct: 5.0,  avgSusp: 0.5,  cornerGoalPct: 4.0  },
    },
    {
      key: 'playoff_final',
      label: 'Final',
      targets: { goalsPerMatch: 7.00, homeWinPct: 50.0, avgSusp: 4.08, cornerGoalPct: 16.7 },
      tol:     { goalsPerMatch: 1.0,  homeWinPct: 8.0,  avgSusp: 0.7,  cornerGoalPct: 5.0  },
    },
  ]

  // ✅ within tolerance, 🔶 within 2× tolerance, ❌ outside 2× tolerance
  function grade(value: number, target: number, tol: number): string {
    const d = Math.abs(value - target)
    if (d <= tol) return '✅'
    if (d <= tol * 2) return '🔶'
    return '❌'
  }

  const COL = { label: 12, val: 7, tgt: 7, tol: 7, sym: 3 }
  const header = `  ${'Fas'.padEnd(COL.label)} ${'mål/match'.padStart(COL.val)} ${'target'.padStart(COL.tgt)}   ${'homeWin%'.padStart(COL.val)} ${'target'.padStart(COL.tgt)}   ${'avgSusp'.padStart(COL.val)} ${'target'.padStart(COL.tgt)}   ${'corner%'.padStart(COL.val)} ${'target'.padStart(COL.tgt)}`
  console.log(header)
  console.log('  ' + '─'.repeat(header.length - 2))

  for (const { key, label, targets, tol } of PHASE_META) {
    const ms = allMatches.filter(m => m.phase === key)
    if (ms.length === 0) { console.log(`  ${label.padEnd(COL.label)} (inga matcher)`); continue }

    const totalGoals   = ms.reduce((s, m) => s + m.homeScore + m.awayScore, 0)
    const gpm          = totalGoals / ms.length
    const homeWins     = ms.filter(m => m.homeScore > m.awayScore).length
    const homeWinPct   = (homeWins / ms.length) * 100
    const totalSusp    = ms.reduce((s, m) => s + m.suspensions.length, 0)
    const avgSusp      = totalSusp / ms.length
    const allGoalsArr  = ms.flatMap(m => m.goals)
    const cornerGoals  = allGoalsArr.filter(g => g.isCornerGoal).length
    const cornerPct    = allGoalsArr.length > 0 ? (cornerGoals / allGoalsArr.length) * 100 : 0

    const gG = grade(gpm,        targets.goalsPerMatch, tol.goalsPerMatch)
    const gH = grade(homeWinPct, targets.homeWinPct,    tol.homeWinPct)
    const gS = grade(avgSusp,    targets.avgSusp,       tol.avgSusp)
    const gC = grade(cornerPct,  targets.cornerGoalPct, tol.cornerGoalPct)

    console.log(
      `  ${label.padEnd(COL.label)}` +
      ` ${gG} ${gpm.toFixed(2).padStart(COL.val)} ${targets.goalsPerMatch.toFixed(2).padStart(COL.tgt)}` +
      `   ${gH} ${homeWinPct.toFixed(1).padStart(COL.val)} ${targets.homeWinPct.toFixed(1).padStart(COL.tgt)}` +
      `   ${gS} ${avgSusp.toFixed(2).padStart(COL.val)} ${targets.avgSusp.toFixed(2).padStart(COL.tgt)}` +
      `   ${gC} ${cornerPct.toFixed(1).padStart(COL.val)} ${targets.cornerGoalPct.toFixed(1).padStart(COL.tgt)}` +
      `  (n=${ms.length})`
    )
  }
  console.log()
  console.log('  Toleranser: ✅ inom tol  🔶 inom 2×tol  ❌ >2×tol')
  console.log('  Tol per fas (mål/homeWin/susp/corner): regular ±0.3/±2/±0.3/±2 | KVF ±0.5/±4/±0.4/±3 | SF ±0.6/±5/±0.5/±4 | Final ±1.0/±8/±0.7/±5')
}

console.log()
