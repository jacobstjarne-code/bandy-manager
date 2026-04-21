/**
 * Kalibrering V2 — Detaljerad analys av Bandygrytan-data + motorsimulering.
 * 
 * Kör med: node_modules/.bin/vite-node scripts/calibrate_v2.ts
 * 
 * Kräver: docs/data/bandygrytan_detailed.json (schema v2 med per-match-data)
 * Fallback: docs/data/bandygrytan_stats.json (v1, bara simulering)
 * 
 * Output:
 *   1. Tidsmönster inom match (5-min buckets)
 *   2. Utvisningar — tid, säsong, slutspel
 *   3. Säsongskurvor — målsnitt och hemmavinst per omgångsfas
 *   4. Hörnmål-variation per säsong
 *   5. Komma-ikapp-effekten (halvtidsunderläge → slutresultat)
 *   6. Slutspel vs grundserie — strukturella skillnader
 *   7. Motorsimulering (200 matcher, jämför mot targets)
 */

import { simulateMatch } from '../src/domain/services/matchEngine'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../src/domain/enums'
import type { Player } from '../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../src/domain/entities/Fixture'
import { accumulateScorelineMinutes, bucket30min, bucket15min } from './stress/scoreline-utils'
import * as fs from 'fs'
import * as path from 'path'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

interface MatchGoal {
  minute: number
  team: 'home' | 'away'
  type: 'open' | 'corner' | 'penalty' | 'own_goal'
}

interface MatchFoul {
  minute: number
  team: 'home' | 'away'
  duration: number | null
  scoreAtTime?: { home: number; away: number }
}

interface DetailedMatch {
  matchId: string
  season: string
  round: number
  phase: 'regular' | 'quarterfinal' | 'semifinal' | 'final'
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  halfTimeHome: number | null
  halfTimeAway: number | null
  goals: MatchGoal[]
  fouls: MatchFoul[]
  corners: { home: number | null; away: number | null } | null
  attendance: number | null
  overtime: boolean
  penalties: boolean
}

interface DetailedData {
  _meta: { totalMatches: number; seasons: string[] }
  calibrationTargets: Record<string, { target: number; tolerance: number }>
  combined: Record<string, unknown>
  bySeason: Record<string, Record<string, unknown>>
  herr?: { matches?: DetailedMatch[] }
  matches: DetailedMatch[]
}

// ══════════════════════════════════════════════════════════════════════════════
// LOAD DATA
// ══════════════════════════════════════════════════════════════════════════════

const DETAILED_PATH = path.resolve(__dirname, '../docs/data/bandygrytan_detailed.json')

let detailedData: DetailedData | null = null
let hasDetailedData = false

if (fs.existsSync(DETAILED_PATH)) {
  const raw = JSON.parse(fs.readFileSync(DETAILED_PATH, 'utf-8'))
  // Matches live under raw.herr.matches (schema v2) or raw.matches (legacy)
  const matchArray: DetailedMatch[] = raw?.herr?.matches ?? raw?.matches ?? []
  detailedData = { ...raw, matches: matchArray.filter((m: Record<string, unknown>) => !m.___EXAMPLE) }
  hasDetailedData = detailedData.matches.length > 0
}

if (!hasDetailedData) {
  console.log('⚠  Detaljerad data saknas (docs/data/bandygrytan_detailed.json)')
  console.log('   Kör bara motorsimuleringssektion (del 7).\n')
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY
// ══════════════════════════════════════════════════════════════════════════════

function pct(n: number, total: number): string {
  return total > 0 ? (n / total * 100).toFixed(1) + '%' : 'n/a'
}

function avg(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

function bucket5min(minute: number): string {
  if (minute >= 90) return '90+'
  const start = Math.floor(minute / 5) * 5
  return `${start}-${start + 4}`
}

function bucket10min(minute: number): string {
  if (minute >= 90) return '90+'
  const start = Math.floor(minute / 10) * 10
  return `${start}-${start + 9}`
}

function roundPhase(round: number): 'early' | 'mid' | 'late' {
  if (round <= 6) return 'early'
  if (round <= 14) return 'mid'
  return 'late'
}

const DIV = '─'.repeat(70)

// ══════════════════════════════════════════════════════════════════════════════
// 1. TIDSMÖNSTER INOM MATCHEN
// ══════════════════════════════════════════════════════════════════════════════

function analyzeGoalTiming(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  1. TIDSMÖNSTER INOM MATCHEN')
  console.log(`${'═'.repeat(70)}\n`)

  const allGoals = matches.flatMap(m => m.goals)
  const total = allGoals.length

  const buckets5: Record<string, number> = {}
  for (const g of allGoals) { buckets5[bucket5min(g.minute)] = (buckets5[bucket5min(g.minute)] || 0) + 1 }

  console.log('  5-minutersbuckets (andel av alla mål):')
  console.log(DIV)

  const ordered5 = [
    '0-4','5-9','10-14','15-19','20-24','25-29','30-34','35-39','40-44',
    '45-49','50-54','55-59','60-64','65-69','70-74','75-79','80-84','85-89','90+'
  ]
  for (const b of ordered5) {
    const count = buckets5[b] || 0
    const share = count / total
    const bar = '█'.repeat(Math.round(share * 200))
    const mark = b === '45-49' ? '  ◄ HALVTID' : ''
    console.log(`  ${b.padEnd(6)} ${pct(count, total).padStart(6)}  ${bar}${mark}`)
  }

  const firstHalf = allGoals.filter(g => g.minute < 45).length
  const secondHalf = allGoals.filter(g => g.minute >= 45).length
  console.log(`\n  1:a halvlek: ${pct(firstHalf, total)} (${firstHalf} mål)`)
  console.log(`  2:a halvlek: ${pct(secondHalf, total)} (${secondHalf} mål)`)

  const first5 = allGoals.filter(g => g.minute < 5).length
  const lateGoals = allGoals.filter(g => g.minute >= 80).length
  console.log(`\n  Öppningsmål (0-4 min): ${pct(first5, total)} — ${(first5 / matches.length).toFixed(2)} per match`)
  console.log(`  Slutminuterna (80+): ${pct(lateGoals, total)} — ${(lateGoals / matches.length).toFixed(2)} per match`)

  // TIMING_WEIGHTS (10-min buckets)
  console.log('\n  Föreslagna TIMING_WEIGHTS (10-min buckets, normaliserat):')
  console.log(DIV)
  const buckets10: Record<string, number> = {}
  for (const g of allGoals) { buckets10[bucket10min(g.minute)] = (buckets10[bucket10min(g.minute)] || 0) + 1 }
  const keys10 = ['0-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80-89','90+']
  const baseline = total / keys10.length
  for (const b of keys10) {
    const weight = (buckets10[b] || 0) / baseline
    console.log(`  ${b.padEnd(6)} weight: ${weight.toFixed(3)}`)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. UTVISNINGAR
// ══════════════════════════════════════════════════════════════════════════════

function analyzeFouls(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  2. UTVISNINGAR — TID, SÄSONG, SLUTSPEL')
  console.log(`${'═'.repeat(70)}\n`)

  const withFouls = matches.filter(m => m.fouls && m.fouls.length > 0)
  const allFouls = withFouls.flatMap(m => m.fouls)
  const totalF = allFouls.length

  console.log(`  Matcher med utvisningsdata: ${withFouls.length}`)
  console.log(`  Totala utvisningar: ${totalF}`)
  console.log(`  Snitt per match: ${(totalF / withFouls.length).toFixed(2)}`)

  // A) Tidsdistribution
  console.log('\n  A) Utvisningar per 10-minutersperiod:')
  console.log(DIV)
  const fBuckets: Record<string, number> = {}
  for (const f of allFouls) { fBuckets[bucket10min(f.minute)] = (fBuckets[bucket10min(f.minute)] || 0) + 1 }
  const keys10 = ['0-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80-89','90+']
  for (const b of keys10) {
    const count = fBuckets[b] || 0
    const bar = '█'.repeat(Math.round((count / totalF) * 150))
    console.log(`  ${b.padEnd(6)} ${pct(count, totalF).padStart(6)} (${count})  ${bar}`)
  }

  // B) Säsongsfas
  console.log('\n  B) Utvisningar per säsongsfas (omg 1-6 / 7-14 / 15-22):')
  console.log(DIV)
  const regular = withFouls.filter(m => m.phase === 'regular')
  const byPhase: Record<string, { fouls: number; matches: number }> = {
    early: { fouls: 0, matches: 0 }, mid: { fouls: 0, matches: 0 }, late: { fouls: 0, matches: 0 },
  }
  for (const m of regular) {
    const p = roundPhase(m.round)
    byPhase[p].matches++
    byPhase[p].fouls += m.fouls.length
  }
  for (const [phase, d] of Object.entries(byPhase)) {
    const label = phase === 'early' ? 'Omg 1-6 ' : phase === 'mid' ? 'Omg 7-14' : 'Omg 15-22'
    console.log(`  ${label}: ${d.matches > 0 ? (d.fouls / d.matches).toFixed(2) : 'n/a'} utvisn/match (${d.matches} matcher)`)
  }

  // C) Grundserie vs slutspel
  console.log('\n  C) Grundserie vs slutspel:')
  console.log(DIV)
  const regAll = withFouls.filter(m => m.phase === 'regular')
  const playAll = withFouls.filter(m => m.phase !== 'regular')
  const regAvg = regAll.length > 0 ? regAll.reduce((s, m) => s + m.fouls.length, 0) / regAll.length : 0
  const playAvg = playAll.length > 0 ? playAll.reduce((s, m) => s + m.fouls.length, 0) / playAll.length : 0
  console.log(`  Grundserie: ${regAvg.toFixed(2)} utvisn/match (${regAll.length} matcher)`)
  console.log(`  Slutspel:   ${playAvg.toFixed(2)} utvisn/match (${playAll.length} matcher)`)
  if (playAll.length > 0 && regAll.length > 0) {
    console.log(`  Skillnad:   ${((playAvg / regAvg - 1) * 100).toFixed(1)}% ${playAvg > regAvg ? 'fler' : 'färre'} i slutspel`)
  }

  // D) Frustrations-effekt
  console.log('\n  D) Frustrations-effekt (utvisningar vid underläge):')
  console.log(DIV)
  let trailing = 0, leading = 0, tied = 0
  for (const m of withFouls) {
    const sortedGoals = [...m.goals].sort((a, b) => a.minute - b.minute)
    for (const foul of m.fouls) {
      let h = 0, a = 0
      for (const g of sortedGoals) { if (g.minute > foul.minute) break; if (g.team === 'home') h++; else a++ }
      const diff = foul.team === 'home' ? h - a : a - h
      if (diff < 0) trailing++; else if (diff > 0) leading++; else tied++
    }
  }
  const tot = trailing + leading + tied
  console.log(`  Vid underläge: ${pct(trailing, tot)} (${trailing})`)
  console.log(`  Vid oavgjort:  ${pct(tied, tot)} (${tied})`)
  console.log(`  Vid ledning:   ${pct(leading, tot)} (${leading})`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 2B. POWERPLAY — MÅL UNDER AKTIV UTVISNING
// ══════════════════════════════════════════════════════════════════════════════

function analyzePowerplay(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  2B. POWERPLAY — MÅL UNDER AKTIV UTVISNING')
  console.log(`${'═'.repeat(70)}\n`)

  const withBoth = matches.filter(m => m.fouls?.length > 0 && m.goals?.length > 0)
  if (withBoth.length === 0) { console.log('  Ingen data med både mål och utvisningar.'); return }

  let goalsInPP = 0       // mål av laget med numerärt överläge
  let goalsSH = 0         // mål av laget som har en utvisad (shorthanded)
  let goalsEvenStrength = 0
  let totalGoals = 0
  let ppMinutesTotal = 0
  let evenMinutesTotal = 0

  for (const m of withBoth) {
    const suspensions = m.fouls.map(f => ({
      team: f.team,
      start: f.minute,
      end: f.minute + (f.duration || 10),
    }))

    for (const goal of m.goals) {
      totalGoals++
      const activeHome = suspensions.filter(s => s.team === 'home' && s.start <= goal.minute && s.end > goal.minute)
      const activeAway = suspensions.filter(s => s.team === 'away' && s.start <= goal.minute && s.end > goal.minute)
      const homeShort = activeHome.length - activeAway.length

      if (homeShort === 0) {
        goalsEvenStrength++
      } else if (
        (homeShort > 0 && goal.team === 'away') ||
        (homeShort < 0 && goal.team === 'home')
      ) {
        goalsInPP++
      } else {
        goalsSH++
      }
    }

    for (let min = 0; min < 90; min++) {
      const aH = suspensions.filter(s => s.team === 'home' && s.start <= min && s.end > min).length
      const aA = suspensions.filter(s => s.team === 'away' && s.start <= min && s.end > min).length
      if (aH !== aA) ppMinutesTotal++; else evenMinutesTotal++
    }
  }

  const ppShare = ppMinutesTotal / (ppMinutesTotal + evenMinutesTotal)
  const ppRate = ppMinutesTotal > 0 ? goalsInPP / ppMinutesTotal * 90 : 0
  const evenRate = evenMinutesTotal > 0 ? goalsEvenStrength / evenMinutesTotal * 90 : 0
  const shRate = ppMinutesTotal > 0 ? goalsSH / ppMinutesTotal * 90 : 0

  console.log(`  Matcher analyserade: ${withBoth.length}`)
  console.log(`  Totala mål: ${totalGoals}`)
  console.log()
  console.log(`  Mål i numerärt överläge (PP):     ${goalsInPP} (${pct(goalsInPP, totalGoals)})`)
  console.log(`  Mål i numerärt underläge (SH):    ${goalsSH} (${pct(goalsSH, totalGoals)})`)
  console.log(`  Mål i lika styrka:                ${goalsEvenStrength} (${pct(goalsEvenStrength, totalGoals)})`)
  console.log()
  console.log(`  Andel av matchtid i PP/SH:        ${(ppShare * 100).toFixed(1)}%`)
  console.log()
  console.log('  Målfrekvens (mål per 90 min):')
  console.log(DIV)
  console.log(`  Lika styrka:        ${evenRate.toFixed(2)} mål/90 min`)
  console.log(`  Numerärt överläge:  ${ppRate.toFixed(2)} mål/90 min`)
  console.log(`  Numerärt underläge: ${shRate.toFixed(2)} mål/90 min`)
  if (evenRate > 0) {
    const mult = ppRate / evenRate
    console.log()
    console.log(`  ► PP-effekt: ${mult.toFixed(2)}x målfrekvens vid numerärt överläge`)
    console.log(`    (${mult > 1 ? '+' : ''}${((mult - 1) * 100).toFixed(0)}% jämfört med lika styrka)`)
    if (mult < 1.3) {
      console.log(`  ► Svag effekt — utvisningar påverkar spelet mindre i bandy än hockey.`)
    } else if (mult < 1.6) {
      console.log(`  ► Märkbar men inte dramatisk effekt. 5-3-1-omställningen dämpar.`)
    } else {
      console.log(`  ► Stark effekt — utvisningar avgör matcher.`)
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. SÄSONGSKURVOR
// ══════════════════════════════════════════════════════════════════════════════

function analyzeSeasonCurves(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  3. SÄSONGSKURVOR — MÅLSNITT OCH HEMMAVINST PER OMGÅNGSFAS')
  console.log(`${'═'.repeat(70)}\n`)

  const regular = matches.filter(m => m.phase === 'regular' && m.round != null)
  const byRound: Record<number, DetailedMatch[]> = {}
  for (const m of regular) { if (!byRound[m.round]) byRound[m.round] = []; byRound[m.round].push(m) }

  console.log('  Målsnitt per omgång:')
  console.log(DIV)
  for (const r of Object.keys(byRound).map(Number).sort((a, b) => a - b)) {
    const ms = byRound[r]
    const goals = ms.reduce((s, m) => s + m.homeScore + m.awayScore, 0) / ms.length
    const hw = ms.filter(m => m.homeScore > m.awayScore).length
    const bar = '█'.repeat(Math.round(goals * 3))
    console.log(`  Omg ${String(r).padStart(2)}: ${goals.toFixed(1)} mål/match  H ${pct(hw, ms.length).padStart(5)}  (${ms.length} m)  ${bar}`)
  }

  console.log('\n  Sammanfattning per fas:')
  console.log(DIV)
  for (const phase of ['early', 'mid', 'late'] as const) {
    const ms = regular.filter(m => roundPhase(m.round) === phase)
    if (ms.length === 0) continue
    const goals = ms.reduce((s, m) => s + m.homeScore + m.awayScore, 0) / ms.length
    const hw = ms.filter(m => m.homeScore > m.awayScore).length / ms.length
    const dr = ms.filter(m => m.homeScore === m.awayScore).length / ms.length
    const label = phase === 'early' ? 'Tidigt (1-6) ' : phase === 'mid' ? 'Mitt (7-14)  ' : 'Sent (15-22) '
    console.log(`  ${label}: ${goals.toFixed(1)} mål/match, ${(hw*100).toFixed(1)}% hemma, ${(dr*100).toFixed(1)}% oavgjort (${ms.length} m)`)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. HÖRNMÅL-VARIATION
// ══════════════════════════════════════════════════════════════════════════════

function analyzeCornerVariation(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  4. HÖRNMÅL-VARIATION PER SÄSONG')
  console.log(`${'═'.repeat(70)}\n`)

  const seasons = [...new Set(matches.map(m => m.season))].sort()
  console.log('  Säsong       Mål   Hörnmål  Andel    Straffmål  Andel')
  console.log(DIV)

  const shares: number[] = []
  for (const s of seasons) {
    const ms = matches.filter(m => m.season === s)
    const allG = ms.flatMap(m => m.goals)
    const tot = allG.length
    const corn = allG.filter(g => g.type === 'corner').length
    const pen = allG.filter(g => g.type === 'penalty').length
    const cp = tot > 0 ? corn / tot : 0
    shares.push(cp)
    console.log(`  ${s.padEnd(11)}  ${String(tot).padStart(4)}  ${String(corn).padStart(7)}  ${(cp*100).toFixed(1).padStart(5)}%   ${String(pen).padStart(9)}  ${pct(pen, tot).padStart(5)}`)
  }

  if (shares.length >= 3) {
    const first3 = avg(shares.slice(0, 3))
    const last3 = avg(shares.slice(-3))
    const trend = last3 - first3
    console.log(`\n  Trend: Första 3 snitt ${(first3*100).toFixed(1)}%, sista 3: ${(last3*100).toFixed(1)}%`)
    console.log(`  → ${Math.abs(trend) < 0.01 ? 'Stabilt' : trend > 0 ? 'Mer hörnberoende' : 'Mindre hörnberoende'}`)
  }
  const min = Math.min(...shares), max = Math.max(...shares)
  console.log(`\n  Spridning: ${(min*100).toFixed(1)}% — ${(max*100).toFixed(1)}% (${((max-min)*100).toFixed(1)} pp)`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. KOMMA-IKAPP
// ══════════════════════════════════════════════════════════════════════════════

function analyzeComebacks(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  5. KOMMA-IKAPP-EFFEKTEN (HALVTIDSUNDERLÄGE → SLUTRESULTAT)')
  console.log(`${'═'.repeat(70)}\n`)

  const withHT = matches.filter(m => m.halfTimeHome !== null && m.halfTimeAway !== null)
  if (withHT.length === 0) { console.log('  Ingen halvtidsdata.'); return }

  console.log(`  Matcher med halvtidsdata: ${withHT.length}`)

  const buckets: Record<string, { total: number; won: number; drew: number; lost: number; diffs: number[] }> = {}

  for (const m of withHT) {
    for (const p of ['home', 'away'] as const) {
      const myHT = p === 'home' ? m.halfTimeHome! : m.halfTimeAway!
      const oppHT = p === 'home' ? m.halfTimeAway! : m.halfTimeHome!
      const myFT = p === 'home' ? m.homeScore : m.awayScore
      const oppFT = p === 'home' ? m.awayScore : m.homeScore
      const deficit = oppHT - myHT
      if (deficit <= 0) continue
      const key = deficit >= 4 ? '4+' : String(deficit)
      if (!buckets[key]) buckets[key] = { total: 0, won: 0, drew: 0, lost: 0, diffs: [] }
      buckets[key].total++
      if (myFT > oppFT) buckets[key].won++
      else if (myFT === oppFT) buckets[key].drew++
      else buckets[key].lost++
      buckets[key].diffs.push((myFT - myHT) - (oppFT - oppHT))
    }
  }

  console.log('\n  Underläge  Antal   Vann    Kryss   Förlorade  2:a halvlek diff')
  console.log(DIV)
  for (const key of ['1', '2', '3', '4+']) {
    const b = buckets[key]
    if (!b || b.total === 0) continue
    const d = avg(b.diffs)
    console.log(`  ${(key+' mål').padEnd(11)} ${String(b.total).padStart(4)}   ${pct(b.won,b.total).padStart(5)}   ${pct(b.drew,b.total).padStart(5)}   ${pct(b.lost,b.total).padStart(9)}   ${d>0?'+':''}${d.toFixed(2)}`)
  }

  const allT = Object.values(buckets)
  const totalT = allT.reduce((s, b) => s + b.total, 0)
  const totalW = allT.reduce((s, b) => s + b.won, 0)
  console.log(`\n  Totalt: ${totalT} underlägen vid halvtid, ${pct(totalW, totalT)} vann ändå`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. SLUTSPEL VS GRUNDSERIE
// ══════════════════════════════════════════════════════════════════════════════

function analyzePlayoffVsRegular(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  6. SLUTSPEL VS GRUNDSERIE')
  console.log(`${'═'.repeat(70)}\n`)

  const regular = matches.filter(m => m.phase === 'regular')
  const playoff = matches.filter(m => m.phase !== 'regular')
  if (playoff.length === 0) { console.log('  Ingen slutspelsdata.'); return }

  function stats(ms: DetailedMatch[]) {
    const goals = ms.reduce((s, m) => s + m.homeScore + m.awayScore, 0)
    const allG = ms.flatMap(m => m.goals)
    return {
      n: ms.length,
      gpm: goals / ms.length,
      cornPct: allG.length > 0 ? allG.filter(g => g.type === 'corner').length / allG.length : 0,
      penPct: allG.length > 0 ? allG.filter(g => g.type === 'penalty').length / allG.length : 0,
      hwPct: ms.filter(m => m.homeScore > m.awayScore).length / ms.length,
      drPct: ms.filter(m => m.homeScore === m.awayScore).length / ms.length,
      fpm: ms.filter(m => m.fouls?.length > 0).length > 0
        ? ms.reduce((s, m) => s + (m.fouls?.length || 0), 0) / ms.filter(m => m.fouls?.length > 0).length : 0,
    }
  }

  const r = stats(regular), p = stats(playoff)
  function row(label: string, rv: number, pv: number, fmt: (n: number) => string) {
    const d = pv - rv
    console.log(`  ${label.padEnd(20)} ${fmt(rv).padStart(10)}   ${fmt(pv).padStart(10)}   ${(d>0?'+':'')+fmt(d)}`)
  }

  console.log('                    Grundserie     Slutspel       Diff')
  console.log(DIV)
  row('Matcher', r.n, p.n, n => String(Math.round(n)))
  row('Mål/match', r.gpm, p.gpm, n => n.toFixed(2))
  row('Hörnmål %', r.cornPct*100, p.cornPct*100, n => n.toFixed(1)+'%')
  row('Straffmål %', r.penPct*100, p.penPct*100, n => n.toFixed(1)+'%')
  row('Hemmaseger %', r.hwPct*100, p.hwPct*100, n => n.toFixed(1)+'%')
  row('Oavgjort %', r.drPct*100, p.drPct*100, n => n.toFixed(1)+'%')
  row('Utvisn/match', r.fpm, p.fpm, n => n.toFixed(2))

  const qf = matches.filter(m => m.phase === 'quarterfinal')
  const sf = matches.filter(m => m.phase === 'semifinal')
  const fi = matches.filter(m => m.phase === 'final')
  if (qf.length > 0 || sf.length > 0 || fi.length > 0) {
    console.log('\n  Per slutspelsrunda:')
    console.log(DIV)
    for (const [label, ms] of [['Kvartsfinal', qf], ['Semifinal', sf], ['Final', fi]] as const) {
      if (ms.length === 0) continue
      const s = stats(ms as DetailedMatch[])
      console.log(`  ${(label as string).padEnd(14)}: ${s.gpm.toFixed(1)} mål/m, ${(s.cornPct*100).toFixed(1)}% hörn, ${s.fpm.toFixed(1)} utvisn (${ms.length} m)`)
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 1.5 — VERIFIERINGSPASS: MÅLSNITT + HÖRNMÅL% × FAS
// ══════════════════════════════════════════════════════════════════════════════

function verifyPhaseStats(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  1.5  MÅLSNITT + HÖRNMÅL% × FAS (verifieringspass)')
  console.log(`${'═'.repeat(70)}\n`)

  const phases = [
    { key: 'regular' as const,      label: 'Grundserie', goalTarget: 9.12, cornTarget: 22.2 },
    { key: 'quarterfinal' as const, label: 'KVF',        goalTarget: 8.81, cornTarget: 20.0 },
    { key: 'semifinal' as const,    label: 'SF',         goalTarget: 8.39, cornTarget: 18.8 },
    { key: 'final' as const,        label: 'Final',      goalTarget: 7.00, cornTarget: 16.7 },
  ]

  console.log('  MÅLSNITT × FAS (target = ANALYS_SLUTSPEL.md):')
  console.log('  ' + '─'.repeat(60))
  for (const { key, label, goalTarget } of phases) {
    const ms = matches.filter(m => m.phase === key)
    if (ms.length === 0) { console.log(`  — ${label.padEnd(14)}: n/a`); continue }
    const gpm = ms.reduce((s, m) => s + m.homeScore + m.awayScore, 0) / ms.length
    const ok = Math.abs(gpm - goalTarget) < 0.5
    console.log(`  ${ok ? '✅' : '❌'} ${label.padEnd(14)}: ${gpm.toFixed(2)} mål/match  (target ${goalTarget}, n=${ms.length})`)
  }

  console.log()
  console.log('  HÖRNMÅL% × FAS:')
  console.log('  ' + '─'.repeat(60))
  for (const { key, label, cornTarget } of phases) {
    const ms = matches.filter(m => m.phase === key)
    if (ms.length === 0) { console.log(`  — ${label.padEnd(14)}: n/a`); continue }
    const allGoals = ms.flatMap(m => m.goals)
    const cornPct = allGoals.length > 0 ? allGoals.filter(g => g.type === 'corner').length / allGoals.length * 100 : 0
    const ok = Math.abs(cornPct - cornTarget) < 2.0
    console.log(`  ${ok ? '✅' : '❌'} ${label.padEnd(14)}: ${cornPct.toFixed(1)}%  (target ${cornTarget}%, n=${ms.length})`)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 1.1 + 1.2 — UTVISNINGAR × SPELLÄGE (normaliserat mot tid)
// ══════════════════════════════════════════════════════════════════════════════

type ScorelineState = 'leading' | 'tied' | 'trailing'
const STATE_LABELS: [string, ScorelineState][] = [
  ['Ledning', 'leading'], ['Jämnt', 'tied'], ['Underläge', 'trailing'],
]

interface FoulScorelineStats {
  stateMinutes: Record<ScorelineState, number>
  stateFouls:   Record<ScorelineState, number>
  periodStateMinutes: Record<string, Record<ScorelineState, number>>
  periodStateFouls:   Record<string, Record<ScorelineState, number>>
  matchCount: number
  foulCount: number
}

const PERIODS_30 = ['0-29', '30-59', '60-89', '90+'] as const

function computeFoulScorelineStats(matches: DetailedMatch[]): FoulScorelineStats {
  const stateMinutes: Record<ScorelineState, number> = { leading: 0, tied: 0, trailing: 0 }
  const stateFouls:   Record<ScorelineState, number> = { leading: 0, tied: 0, trailing: 0 }
  const periodStateMinutes: Record<string, Record<ScorelineState, number>> = {}
  const periodStateFouls:   Record<string, Record<ScorelineState, number>> = {}
  let foulCount = 0

  for (const p of PERIODS_30) {
    periodStateMinutes[p] = { leading: 0, tied: 0, trailing: 0 }
    periodStateFouls[p]   = { leading: 0, tied: 0, trailing: 0 }
  }

  for (const m of matches) {
    // Accumulate total state minutes (both teams)
    const { home, away } = accumulateScorelineMinutes(m.goals, 90)
    stateMinutes.leading  += home.leading  + away.leading
    stateMinutes.tied     += home.tied     + away.tied
    stateMinutes.trailing += home.trailing + away.trailing

    // Minute-by-minute per period × state for both teams
    const sorted = [...m.goals].sort((a, b) => a.minute - b.minute)
    let h = 0, a = 0, gi = 0
    for (let min = 1; min <= 90; min++) {
      while (gi < sorted.length && sorted[gi].minute <= min) {
        if (sorted[gi].team === 'home') h++; else a++
        gi++
      }
      const period = bucket30min(min)
      const homeState: ScorelineState = h > a ? 'leading' : h < a ? 'trailing' : 'tied'
      const awayState: ScorelineState = a > h ? 'leading' : a < h ? 'trailing' : 'tied'
      periodStateMinutes[period][homeState]++
      periodStateMinutes[period][awayState]++
    }

    // Fouls classified via pre-computed scoreAtTime
    for (const foul of m.fouls ?? []) {
      const sat = foul.scoreAtTime
      if (!sat) continue
      foulCount++
      const diff = foul.team === 'home' ? sat.home - sat.away : sat.away - sat.home
      const state: ScorelineState = diff > 0 ? 'leading' : diff < 0 ? 'trailing' : 'tied'
      stateFouls[state]++
      const period = bucket30min(foul.minute)
      periodStateFouls[period][state]++
    }
  }

  return {
    stateMinutes, stateFouls, periodStateMinutes, periodStateFouls,
    matchCount: matches.length, foulCount,
  }
}

function analyzeScorelineFouls(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  1.1 + 1.2  UTVISNINGAR × SPELLÄGE (normaliserat mot tid)')
  console.log(`${'═'.repeat(70)}\n`)

  const matchesWithFouls = matches.filter(m => m.fouls?.some(f => f.scoreAtTime))
  if (matchesWithFouls.length === 0) { console.log('  Ingen utvisningsdata med scoreAtTime.'); return }

  const s = computeFoulScorelineStats(matchesWithFouls)

  const rates: Record<ScorelineState, number> = {
    leading:  s.stateMinutes.leading  > 0 ? s.stateFouls.leading  / s.stateMinutes.leading  : 0,
    tied:     s.stateMinutes.tied     > 0 ? s.stateFouls.tied     / s.stateMinutes.tied     : 0,
    trailing: s.stateMinutes.trailing > 0 ? s.stateFouls.trailing / s.stateMinutes.trailing : 0,
  }
  const baseRate = (rates.leading + rates.tied + rates.trailing) / 3

  console.log(`  Matcher med utvisningsdata (scoreAtTime): ${matchesWithFouls.length}`)
  console.log(`  Utvisningar klassificerade: ${s.foulCount}`)
  console.log()
  console.log(`  ${''.padEnd(16)} ${'Minuter'.padStart(9)} ${'Utvisn'.padStart(9)} ${'Per 1kmin'.padStart(11)} ${'Relation'.padStart(10)}`)
  console.log('  ' + '─'.repeat(58))

  for (const [label, state] of STATE_LABELS) {
    const rel = baseRate > 0 ? rates[state] / baseRate : 0
    console.log(
      `  ${label.padEnd(16)}` +
      ` ${String(s.stateMinutes[state]).padStart(9)}` +
      ` ${String(s.stateFouls[state]).padStart(9)}` +
      ` ${(rates[state] * 1000).toFixed(3).padStart(11)}` +
      ` ${rel.toFixed(2).padStart(9)}x`,
    )
  }

  console.log()
  const rL = rates.leading, rT = rates.tied, rU = rates.trailing
  if (rU > rL * 1.3 && rU > rT * 1.3) {
    console.log('  → Underläge klart vanligast — frustrations-/pressfouls dominerar.')
    console.log('    Hypotes 2 (domarfenomen) möjlig om period-breakdown visar fas-förändring.')
  } else if (rL > rU * 1.3 && rL > rT * 1.3) {
    console.log('  → Ledning klart vanligast — "skydda resultatet"-fouls dominerar.')
  } else if (Math.max(rL, rU) / (rT > 0 ? rT : 1) < 1.2) {
    console.log('  → Jämnt fördelat — spelläge påverkar inte utvisningsfrekvens.')
    console.log('    Hypotes 1 (vinstprocent-bias) bekräftad.')
  } else {
    console.log('  → Svag spelläges-känslighet. Hypotes 1 delvis bekräftad.')
  }

  // 1.2: Period × state
  console.log()
  console.log('  UTVISNINGAR × PERIOD × SPELLÄGE (per 1000 min)')
  console.log(`  ${''.padEnd(14)} ${PERIODS_30.map(p => p.padStart(8)).join('')}`)
  console.log('  ' + '─'.repeat(46))
  for (const [label, state] of STATE_LABELS) {
    const vals = PERIODS_30.map(p => {
      const mins = s.periodStateMinutes[p][state]
      const fouls = s.periodStateFouls[p][state]
      return mins > 0 ? ((fouls / mins) * 1000).toFixed(2) : '—'
    })
    console.log(`  ${label.padEnd(14)} ${vals.map(v => v.padStart(8)).join('')}`)
  }
  console.log('\n  (Utvisningar per 1000 spelade minuter)')
}

// ══════════════════════════════════════════════════════════════════════════════
// 1.3 — STRAFF × SPELLÄGE (normaliserat mot tid)
// ══════════════════════════════════════════════════════════════════════════════

function analyzeScorelinePenalties(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  1.3  STRAFF × SPELLÄGE (straffmål + 70% konverteringsantagande)')
  console.log(`${'═'.repeat(70)}\n`)

  const totalGoals = matches.reduce((s, m) => s + m.goals.length, 0)
  const penaltyGoals = matches.flatMap(m =>
    m.goals.filter(g => g.type === 'penalty').map(g => ({ goal: g, matchGoals: m.goals })),
  )

  console.log(`  Totalt straffmål: ${penaltyGoals.length} (${pct(penaltyGoals.length, totalGoals)} av mål)`)
  console.log(`  Estimerat antal straffar (÷ 0.70): ${Math.round(penaltyGoals.length / 0.70)}`)

  if (penaltyGoals.length === 0) { console.log('  Inga straffmål — gap 5 bekräftat.'); return }

  // Accumulate total state minutes across all matches for normalization
  const stateMinutes: Record<ScorelineState, number> = { leading: 0, tied: 0, trailing: 0 }
  for (const m of matches) {
    const { home, away } = accumulateScorelineMinutes(m.goals, 90)
    stateMinutes.leading  += home.leading  + away.leading
    stateMinutes.tied     += home.tied     + away.tied
    stateMinutes.trailing += home.trailing + away.trailing
  }

  const statePenalties: Record<ScorelineState, number> = { leading: 0, tied: 0, trailing: 0 }
  const periodPenalties: Record<string, number> = {}

  for (const { goal, matchGoals } of penaltyGoals) {
    // Score before this goal: count all goals with minute < goal.minute (strict)
    let h = 0, a = 0
    for (const g of matchGoals) {
      if (g.minute < goal.minute) {
        if (g.team === 'home') h++; else a++
      }
    }
    const diff = goal.team === 'home' ? h - a : a - h
    const state: ScorelineState = diff > 0 ? 'leading' : diff < 0 ? 'trailing' : 'tied'
    statePenalties[state]++

    const b = bucket15min(goal.minute)
    periodPenalties[b] = (periodPenalties[b] ?? 0) + 1
  }

  const rates: Record<ScorelineState, number> = {
    leading:  stateMinutes.leading  > 0 ? statePenalties.leading  / stateMinutes.leading  : 0,
    tied:     stateMinutes.tied     > 0 ? statePenalties.tied     / stateMinutes.tied     : 0,
    trailing: stateMinutes.trailing > 0 ? statePenalties.trailing / stateMinutes.trailing : 0,
  }

  console.log()
  console.log('  Per spelläge (normaliserat mot tid, per 1000 min):')
  console.log('  ' + '─'.repeat(58))
  for (const [label, state] of STATE_LABELS) {
    console.log(
      `  ${label.padEnd(14)}` +
      ` ${String(statePenalties[state]).padStart(5)} straffmål` +
      `  ${(rates[state] * 1000).toFixed(3).padStart(8)}/kmin`,
    )
  }

  console.log()
  console.log('  Per period (15-min buckets):')
  console.log('  ' + '─'.repeat(40))
  for (const p of ['0-14', '15-29', '30-44', '45-59', '60-74', '75-89', '90+']) {
    const n = periodPenalties[p] ?? 0
    console.log(`  ${p.padEnd(8)} ${pct(n, penaltyGoals.length).padStart(7)}  (${n})`)
  }

  console.log()
  if (rates.tied > rates.leading * 1.2 && rates.tied > rates.trailing * 1.2) {
    console.log('  → Jämnt läge ger flest straffar/min — chans-drivet (stämmer med teorin).')
  } else if (rates.trailing > rates.leading * 1.2) {
    console.log('  → Underläge ger flest — desperat press genererar försvarsfouls.')
  } else {
    console.log('  → Jämn fördelning per spelläge.')
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 1.4 — UTVISNINGAR + STRAFF × FAS × SPELLÄGE
// ══════════════════════════════════════════════════════════════════════════════

function analyzeScorelineByPhase(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  1.4  UTVISNINGAR + STRAFF × FAS × SPELLÄGE (per 1000 min)')
  console.log(`${'═'.repeat(70)}\n`)

  const phases = [
    { key: 'regular' as const,      label: 'Grundserie' },
    { key: 'quarterfinal' as const, label: 'KVF'        },
    { key: 'semifinal' as const,    label: 'SF'         },
    { key: 'final' as const,        label: 'Final'      },
  ]

  // ── Fouls per phase ──────────────────────────────────────────────────────

  console.log('  UTVISNINGAR × FAS × SPELLÄGE (per 1000 min)')
  console.log(`  ${''.padEnd(14)} ${'Grundserie'.padStart(12)} ${'KVF'.padStart(8)} ${'SF'.padStart(8)} ${'Final'.padStart(8)}`)
  console.log('  ' + '─'.repeat(52))

  const foulRates: Record<string, Record<ScorelineState, number>> = {}
  const foulMatchCounts: Record<string, number> = {}

  for (const { key } of phases) {
    const ms = matches.filter(m => m.phase === key && m.fouls?.some(f => f.scoreAtTime))
    foulMatchCounts[key] = ms.length
    const s = computeFoulScorelineStats(ms)
    foulRates[key] = {
      leading:  s.stateMinutes.leading  > 0 ? (s.stateFouls.leading  / s.stateMinutes.leading)  * 1000 : 0,
      tied:     s.stateMinutes.tied     > 0 ? (s.stateFouls.tied     / s.stateMinutes.tied)     * 1000 : 0,
      trailing: s.stateMinutes.trailing > 0 ? (s.stateFouls.trailing / s.stateMinutes.trailing) * 1000 : 0,
    }
  }

  for (const [label, state] of STATE_LABELS) {
    const vals = phases.map(({ key }, i) => {
      const rate = foulRates[key]?.[state] ?? 0
      const n = foulMatchCounts[key]
      if (n === 0) return '—'
      const str = rate > 0 ? rate.toFixed(2) : '—'
      // Small sample warning for KVF/SF/Final (i > 0) handled with asterisk if n<10
      return i > 0 && n < 10 ? str + '*' : str
    })
    const [v0, ...vRest] = vals
    console.log(`  ${label.padEnd(14)} ${v0.padStart(12)} ${vRest.map(v => v.padStart(8)).join('')}`)
  }
  console.log(`  ${'(n matcher)'.padEnd(14)} ${String(foulMatchCounts.regular).padStart(12)} ${['quarterfinal','semifinal','final'].map(k => String(foulMatchCounts[k]).padStart(8)).join('')}`)

  // ── Penalties per phase ───────────────────────────────────────────────────

  console.log()
  console.log('  STRAFF × FAS × SPELLÄGE (per 1000 min)')
  console.log(`  ${''.padEnd(14)} ${'Grundserie'.padStart(12)} ${'KVF'.padStart(8)} ${'SF'.padStart(8)} ${'Final'.padStart(8)}`)
  console.log('  ' + '─'.repeat(52))

  const penRates: Record<string, Record<ScorelineState, number>> = {}
  const penGoalCounts: Record<string, number> = {}

  for (const { key } of phases) {
    const ms = matches.filter(m => m.phase === key)
    const stateMinutes: Record<ScorelineState, number> = { leading: 0, tied: 0, trailing: 0 }
    const statePenalties: Record<ScorelineState, number> = { leading: 0, tied: 0, trailing: 0 }
    let penCount = 0

    for (const m of ms) {
      const { home, away } = accumulateScorelineMinutes(m.goals, 90)
      stateMinutes.leading  += home.leading  + away.leading
      stateMinutes.tied     += home.tied     + away.tied
      stateMinutes.trailing += home.trailing + away.trailing

      for (const g of m.goals.filter(g => g.type === 'penalty')) {
        penCount++
        let h = 0, a = 0
        for (const og of m.goals) {
          if (og.minute < g.minute) { if (og.team === 'home') h++; else a++ }
        }
        const diff = g.team === 'home' ? h - a : a - h
        const state: ScorelineState = diff > 0 ? 'leading' : diff < 0 ? 'trailing' : 'tied'
        statePenalties[state]++
      }
    }

    penGoalCounts[key] = penCount
    penRates[key] = {
      leading:  stateMinutes.leading  > 0 ? (statePenalties.leading  / stateMinutes.leading)  * 1000 : 0,
      tied:     stateMinutes.tied     > 0 ? (statePenalties.tied     / stateMinutes.tied)     * 1000 : 0,
      trailing: stateMinutes.trailing > 0 ? (statePenalties.trailing / stateMinutes.trailing) * 1000 : 0,
    }
  }

  for (const [label, state] of STATE_LABELS) {
    const vals = phases.map(({ key }, i) => {
      const n = penGoalCounts[key]
      if (n === 0) return '—'
      const rate = penRates[key]?.[state] ?? 0
      const str = rate > 0 ? rate.toFixed(2) : '—'
      return i > 0 && n < 10 ? str + '*' : str
    })
    const [v0, ...vRest] = vals
    console.log(`  ${label.padEnd(14)} ${v0.padStart(12)} ${vRest.map(v => v.padStart(8)).join('')}`)
  }
  console.log(`  ${'(n straffmål)'.padEnd(14)} ${String(penGoalCounts.regular).padStart(12)} ${['quarterfinal','semifinal','final'].map(k => String(penGoalCounts[k]).padStart(8)).join('')}`)
  console.log('\n  * = indikativt, litet urval')
}

// ══════════════════════════════════════════════════════════════════════════════
// 1.6 — HEMMAFÖRDEL I SLUTSPEL — DEKOMPONERAD PER SPELNUMMER
// ══════════════════════════════════════════════════════════════════════════════

function analyzePlayoffHomeAdvDecomposed(matches: DetailedMatch[]) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  1.6  HEMMAFÖRDEL I SLUTSPEL — DEKOMPONERAD PER SPELNUMMER')
  console.log(`${'═'.repeat(70)}\n`)

  type PlayoffPhase = 'quarterfinal' | 'semifinal' | 'final'
  const playoffPhases: PlayoffPhase[] = ['quarterfinal', 'semifinal', 'final']
  const phaseLabels: Record<PlayoffPhase, string> = { quarterfinal: 'KVF', semifinal: 'SF', final: 'Final' }

  // Group by (season, phase, canonical team pair) and sort by date within each group
  const seriesMap: Record<string, DetailedMatch[]> = {}
  for (const m of matches.filter(m => m.phase !== 'regular')) {
    const pair = [m.homeTeam, m.awayTeam].sort().join('|')
    const k = `${m.season}|${m.phase}|${pair}`
    if (!seriesMap[k]) seriesMap[k] = []
    seriesMap[k].push(m)
  }
  for (const series of Object.values(seriesMap)) {
    series.sort((a, b) => a.date.localeCompare(b.date))
  }

  // Collect results per phase × game number
  const results: Record<PlayoffPhase, Record<number, { homeWins: number; total: number }>> = {
    quarterfinal: {}, semifinal: {}, final: {},
  }

  for (const series of Object.values(seriesMap)) {
    const phase = series[0].phase as PlayoffPhase
    if (!results[phase]) continue
    for (let i = 0; i < series.length; i++) {
      const gameNum = i + 1
      if (!results[phase][gameNum]) results[phase][gameNum] = { homeWins: 0, total: 0 }
      results[phase][gameNum].total++
      if (series[i].homeScore > series[i].awayScore) results[phase][gameNum].homeWins++
    }
  }

  const maxGame = Math.max(
    ...Object.values(results).flatMap(r => Object.keys(r).map(Number)),
    1,
  )
  const gameNums = Array.from({ length: maxGame }, (_, i) => i + 1)

  console.log(`  ${''.padEnd(12)} ${gameNums.map(g => `Spel ${g}`.padStart(10)).join('')}`)
  console.log('  ' + '─'.repeat(12 + gameNums.length * 10))

  for (const phase of playoffPhases) {
    const label = phaseLabels[phase]
    const vals = gameNums.map(g => {
      const d = results[phase][g]
      if (!d || d.total === 0) return '—'
      const h = (d.homeWins / d.total * 100).toFixed(0)
      return `${h}% (${d.total})`
    })
    console.log(`  ${(label + ' hemma%').padEnd(12)} ${vals.map(v => v.padStart(10)).join('')}`)
  }

  console.log()
  console.log('  Tolkning:')
  const qfG1 = results.quarterfinal[1]
  if (qfG1 && qfG1.total > 0) {
    const pct1 = qfG1.homeWins / qfG1.total * 100
    if (pct1 > 55) {
      console.log(`  KVF Spel 1: ${pct1.toFixed(0)}% hemmaseger → rankingsfördel, inte plansfaktor.`)
    } else {
      console.log(`  KVF Spel 1: ${pct1.toFixed(0)}% → plansfaktor kan bidra utöver rankning.`)
    }
  }
  const seriesCount = Object.keys(seriesMap).length
  console.log(`  Baserat på ${seriesCount} serier (spel 1 = högre rankat lag hemma per definition).`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. MOTORSIMULERING
// ══════════════════════════════════════════════════════════════════════════════

const CLUB_CAS = [85, 78, 68, 65, 63, 62, 60, 55, 52, 50, 48, 45]

function pickMatchupCA(seed: number): [number, number] {
  const rng = (s: number) => { s = ((s * 1664525 + 1013904223) | 0) >>> 0; return s / 0xffffffff }
  const r1 = rng(seed * 7919), r2 = rng(seed * 6271 + 31)
  let i = Math.floor(r1 * CLUB_CAS.length), j = Math.floor(r2 * CLUB_CAS.length)
  if (j === i) j = (j + 1) % CLUB_CAS.length
  return [CLUB_CAS[i], CLUB_CAS[j]]
}

let _pid = 0
function makePlayer(clubId: string, position: PlayerPosition, ca = 55): Player {
  const id = `p${++_pid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id, firstName: 'X', lastName: `${id}`, age: 26, nationality: 'SWE',
    clubId, academyClubId: undefined, isHomegrown: false,
    position, archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0, contractUntilSeason: 2, marketValue: 0,
    morale: 70, form: 70, fitness: 85, sharpness: 75, isFullTimePro: false,
    currentAbility: ca, potentialAbility: ca,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? ca + 20 : 20,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    isCharacterPlayer: false, trait: undefined,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  } as Player
}

function makeSquad(clubId: string, ca = 55): Player[] {
  return [
    makePlayer(clubId, PlayerPosition.Goalkeeper, ca),
    ...Array(3).fill(null).map(() => makePlayer(clubId, PlayerPosition.Defender, ca)),
    ...Array(3).fill(null).map(() => makePlayer(clubId, PlayerPosition.Half, ca)),
    ...Array(4).fill(null).map(() => makePlayer(clubId, PlayerPosition.Forward, ca)),
    makePlayer(clubId, PlayerPosition.Goalkeeper, ca),
    makePlayer(clubId, PlayerPosition.Defender, ca),
    makePlayer(clubId, PlayerPosition.Half, ca),
    ...Array(2).fill(null).map(() => makePlayer(clubId, PlayerPosition.Forward, ca)),
  ]
}

const defaultTactic = {
  mentality: 'balanced' as const, tempo: 'normal' as const, press: 'medium' as const,
  width: 'normal' as const, attackingFocus: 'mixed' as const,
  cornerStrategy: 'standard' as const, passingRisk: 'safe' as const, penaltyKillStyle: 'active' as const,
}

function runSimulation() {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('  7. MOTORSIMULERING (200 matcher, varierad lagstyrka)')
  console.log(`${'═'.repeat(70)}\n`)

  const TARGETS = {
    goalsPerMatch:   { target: 9.12,  tolerance: 1.5  },
    cornerGoalShare: { target: 0.222, tolerance: 0.03 },
    homeWinRate:     { target: 0.502, tolerance: 0.05 },
    drawRate:        { target: 0.116, tolerance: 0.03 },
    secondHalfShare: { target: 0.542, tolerance: 0.03 },
  }

  const N = 200
  let totalGoals = 0, cornerGoals = 0, homeWins = 0, draws = 0, secondHalfGoals = 0
  const goalMinutes: number[] = []

  for (let i = 0; i < N; i++) {
    const [homeCA, awayCA] = pickMatchupCA(i)
    _pid = 0
    const hp = makeSquad('home', homeCA), ap = makeSquad('away', awayCA)
    const hl: TeamSelection = { startingPlayerIds: hp.slice(0,11).map(p=>p.id), benchPlayerIds: hp.slice(11,16).map(p=>p.id), tactic: defaultTactic }
    const al: TeamSelection = { startingPlayerIds: ap.slice(0,11).map(p=>p.id), benchPlayerIds: ap.slice(11,16).map(p=>p.id), tactic: defaultTactic }
    const fix = { id:`fix${i}`, leagueId:'cal', homeClubId:'home', awayClubId:'away',
      season:1, matchday:i+1, roundNumber:i+1, status:FixtureStatus.Scheduled,
      date:'2025-01-01', homeScore:0, awayScore:0, events:[], attendance:500,
      isCup:false, isKnockout:false, isNeutralVenue:false } as Fixture

    const result = simulateMatch({ fixture:fix, homeLineup:hl, awayLineup:al, homePlayers:hp, awayPlayers:ap, homeAdvantage:0.14, seed:i*1337 })
    const f = result.fixture
    const gs = (f.homeScore??0) + (f.awayScore??0)
    totalGoals += gs
    if ((f.homeScore??0) > (f.awayScore??0)) homeWins++
    if ((f.homeScore??0) === (f.awayScore??0)) draws++
    for (const ev of f.events) {
      if (ev.type === MatchEventType.Goal) {
        if (ev.minute >= 45) secondHalfGoals++
        if (ev.isCornerGoal) cornerGoals++
        goalMinutes.push(ev.minute)
      }
    }
  }

  const gpm = totalGoals/N, hwr = homeWins/N, dr = draws/N
  const cs = totalGoals > 0 ? cornerGoals/totalGoals : 0
  const sh = totalGoals > 0 ? secondHalfGoals/totalGoals : 0

  function check(name: string, value: number, t: { target: number; tolerance: number }) {
    const ok = Math.abs(value - t.target) <= t.tolerance
    const diff = value - t.target
    console.log(`  ${ok?'✅':'❌'} ${name.padEnd(18)} ${value.toFixed(3)}  (mål ${t.target} ±${t.tolerance}, diff ${diff>0?'+':''}${diff.toFixed(3)})`)
  }

  check('goalsPerMatch', gpm, TARGETS.goalsPerMatch)
  check('cornerGoalShare', cs, TARGETS.cornerGoalShare)
  check('homeWinRate', hwr, TARGETS.homeWinRate)
  check('drawRate', dr, TARGETS.drawRate)
  check('secondHalfShare', sh, TARGETS.secondHalfShare)

  if (goalMinutes.length > 0) {
    console.log('\n  Simulerade mål per 10-min bucket:')
    console.log(DIV)
    const sb: Record<string, number> = {}
    for (const m of goalMinutes) { sb[bucket10min(m)] = (sb[bucket10min(m)]||0) + 1 }
    const keys = ['0-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80-89','90+']
    for (const b of keys) {
      const share = (sb[b]||0) / goalMinutes.length
      console.log(`  ${b.padEnd(6)}  ${(share*100).toFixed(1).padStart(5)}%`)
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70))
console.log('  BANDY MANAGER — KALIBRERING V2')
console.log('  Bandygrytan-data + motorsimulering')
console.log('═'.repeat(70))

if (hasDetailedData && detailedData) {
  const matches = detailedData.matches
  const seasonCount = (detailedData._meta as Record<string, unknown>).seasons
    ? ((detailedData._meta as Record<string, unknown>).seasons as unknown[]).length
    : new Set(matches.map(m => m.season)).size
  console.log(`\n  Laddat ${matches.length} matcher från ${seasonCount} säsonger`)
  analyzeGoalTiming(matches)
  analyzeFouls(matches)
  analyzePowerplay(matches)
  analyzeSeasonCurves(matches)
  analyzeCornerVariation(matches)
  analyzeComebacks(matches)
  analyzePlayoffVsRegular(matches)
  verifyPhaseStats(matches)
  analyzeScorelineFouls(matches)
  analyzeScorelinePenalties(matches)
  analyzeScorelineByPhase(matches)
  analyzePlayoffHomeAdvDecomposed(matches)
}

runSimulation()

console.log('\n' + '═'.repeat(70))
console.log('  KLART')
console.log('═'.repeat(70) + '\n')
