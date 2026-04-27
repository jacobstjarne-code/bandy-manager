/**
 * Data Warehouse — Validation Script
 *
 * Kör sanity checks mot databasen och genererar en rapport.
 * Kör med: node_modules/.bin/vite-node scripts/data-warehouse/validate.ts [--pilot]
 *
 * Exit code 0 om alla kontroller passerar, 1 om någon failar.
 */

import Database from 'better-sqlite3'
import { writeFileSync, mkdirSync } from 'fs'
import { simulateMatch } from '../../src/domain/services/matchEngine'
import { ENGINE_VERSION } from '../../src/domain/services/matchCore'
import { FORMATIONS } from '../../src/domain/entities/Formation'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  WeatherCondition,
  IceQuality,
} from '../../src/domain/enums'
import type { Player } from '../../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../../src/domain/entities/Fixture'
import type { Tactic } from '../../src/domain/entities/Club'
import type { FormationType } from '../../src/domain/entities/Formation'
import type { Weather } from '../../src/domain/entities/Weather'

const DB_PATH = './data-warehouse/matches.db'
const REPORT_PATH = './data-warehouse/reports/initial-run-validation.md'
const PILOT_MODE = process.argv.includes('--pilot')
const EXPECTED_TOTAL = PILOT_MODE ? 50 : 1050
const EXPECTED_BUCKETS = PILOT_MODE
  ? { realistic: 29, varied: 12, edge: 5, control: 2, limits: 2 }
  : { realistic: 600, varied: 250, edge: 100, control: 50, limits: 50 }

// ---- Re-create synthetic players for reproducibility check ----

let _globalPid = 0

function makePlayer(clubId: string, position: PlayerPosition, ca: number): Player {
  const id = `p${++_globalPid}`
  const isGK = position === PlayerPosition.Goalkeeper
  return {
    id,
    firstName: 'X',
    lastName: `${id}`,
    age: 26,
    nationality: 'SWE',
    clubId,
    academyClubId: undefined,
    isHomegrown: false,
    position,
    archetype: isGK ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 0,
    contractUntilSeason: 2,
    marketValue: 0,
    morale: 70,
    form: 70,
    fitness: 85,
    sharpness: 75,
    isFullTimePro: false,
    currentAbility: ca,
    potentialAbility: ca,
    developmentRate: 50,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: isGK ? Math.min(100, ca + 20) : 20,
      cornerRecovery: ca,
    },
    injuryProneness: 50,
    discipline: 70,
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    isCharacterPlayer: false,
    trait: undefined,
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 },
    careerMilestones: [],
  }
}

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function makeSquad(
  clubId: string,
  ca: number,
  formation: FormationType,
  seed: number,
): { players: Player[]; lineup: TeamSelection } {
  const rng = mulberry32(seed)
  const template = FORMATIONS[formation]
  const starterPositions = template.slots.map(s => s.position)

  const starters: Player[] = starterPositions.map(pos => {
    const variance = Math.round((rng() - 0.5) * 10)
    const playerCA = Math.min(100, Math.max(30, ca + variance))
    return makePlayer(clubId, pos, playerCA)
  })

  const benchPositions = [
    PlayerPosition.Goalkeeper, PlayerPosition.Defender,
    PlayerPosition.Defender, PlayerPosition.Half, PlayerPosition.Forward,
  ]
  const bench: Player[] = benchPositions.map(pos => {
    const variance = Math.round((rng() - 0.5) * 10)
    const playerCA = Math.min(100, Math.max(30, ca + variance - 5))
    return makePlayer(clubId, pos, playerCA)
  })

  const tactic: Tactic = {
    mentality: 'balanced', tempo: 'normal', press: 'medium',
    passingRisk: 'mixed', width: 'normal', attackingFocus: 'mixed',
    cornerStrategy: 'standard', penaltyKillStyle: 'active', formation,
  }

  return {
    players: [...starters, ...bench],
    lineup: {
      startingPlayerIds: starters.map(p => p.id),
      benchPlayerIds: bench.map(p => p.id),
      tactic,
    },
  }
}

// ---- CHECK HELPERS ----

type CheckResult = {
  name: string
  passed: boolean
  details: string
}

function check(
  name: string,
  condition: boolean,
  details: string,
): CheckResult {
  return { name, passed: condition, details }
}

function numCheck(
  name: string,
  value: number,
  target: number,
  tolerance: number,
  unit = '',
): CheckResult {
  const passed = Math.abs(value - target) <= tolerance
  const diff = (value - target).toFixed(3)
  const sign = parseFloat(diff) >= 0 ? '+' : ''
  const details = `${value.toFixed(3)}${unit} (mål ${target}${unit} ±${tolerance}, diff ${sign}${diff})`
  return { name, passed, details }
}

// ---- MAIN ----

function main() {
  console.log('\nBandy Manager Data Warehouse — Validation')
  console.log(`Engine version: ${ENGINE_VERSION}`)
  console.log(`Mode: ${PILOT_MODE ? 'PILOT' : 'FULL'}`)
  console.log(`DB: ${DB_PATH}\n`)

  const db = new Database(DB_PATH, { readonly: true })
  const results: CheckResult[] = []
  const ts = new Date().toISOString()

  // 1. Total match count
  const totalRow = db.prepare('SELECT COUNT(*) as n FROM matches').get() as { n: number }
  results.push(check(
    'Total antal matcher',
    totalRow.n === EXPECTED_TOTAL,
    `${totalRow.n} matcher (förväntat: ${EXPECTED_TOTAL})`,
  ))

  // 2. All seeds are unique
  const uniqueSeedsRow = db.prepare('SELECT COUNT(DISTINCT seed) as n FROM matches').get() as { n: number }
  results.push(check(
    'Unika seeds',
    uniqueSeedsRow.n === totalRow.n,
    `${uniqueSeedsRow.n} unika av ${totalRow.n} total`,
  ))

  // 3. Sampling bucket distribution
  const bucketRows = db.prepare('SELECT sampling_bucket, COUNT(*) as n FROM matches GROUP BY sampling_bucket').all() as Array<{ sampling_bucket: string; n: number }>
  const bucketMap: Record<string, number> = {}
  for (const row of bucketRows) bucketMap[row.sampling_bucket] = row.n

  let bucketOk = true
  const bucketDetails: string[] = []
  for (const [bucket, expected] of Object.entries(EXPECTED_BUCKETS)) {
    const actual = bucketMap[bucket] ?? 0
    if (actual !== expected) bucketOk = false
    bucketDetails.push(`${bucket}: ${actual} (förväntat ${expected})`)
  }
  results.push(check('Bucket-distribution', bucketOk, bucketDetails.join(', ')))

  // 4. Engine version consistent
  const versionRows = db.prepare('SELECT DISTINCT engine_version FROM matches').all() as Array<{ engine_version: string }>
  results.push(check(
    'Engine version konsistent',
    versionRows.length === 1 && versionRows[0].engine_version === ENGINE_VERSION,
    `Versioner i DB: ${versionRows.map(r => r.engine_version).join(', ')} (aktuell: ${ENGINE_VERSION})`,
  ))

  // 5. Period sums match match totals (CRITICAL)
  type PeriodSumRow = { match_id: string; period_home: number; period_away: number; match_home: number; match_away: number }
  const periodSumRows = db.prepare(`
    SELECT
      m.match_id,
      COALESCE(SUM(mp.home_goals), 0) as period_home,
      COALESCE(SUM(mp.away_goals), 0) as period_away,
      m.home_goals as match_home,
      m.away_goals as match_away
    FROM matches m
    LEFT JOIN match_periods mp ON mp.match_id = m.match_id
    GROUP BY m.match_id
    HAVING period_home != match_home OR period_away != match_away
    LIMIT 5
  `).all() as PeriodSumRow[]

  results.push(check(
    'Period-summor stämmer med match-totaler',
    periodSumRows.length === 0,
    periodSumRows.length === 0
      ? 'Alla period-summor stämmer'
      : `${periodSumRows.length} matcher med inkonsistenta period-summor`,
  ))

  // 6. No NULL in critical columns
  const nullRow = db.prepare(`
    SELECT COUNT(*) as n FROM matches WHERE
    match_id IS NULL OR engine_version IS NULL OR seed IS NULL OR
    home_goals IS NULL OR away_goals IS NULL OR result_outcome IS NULL OR
    home_ca IS NULL OR away_ca IS NULL
  `).get() as { n: number }
  results.push(check(
    'Inga NULL i kritiska kolumner',
    nullRow.n === 0,
    `${nullRow.n} rader med NULL-värden i kritiska kolumner`,
  ))

  // 7. Avg goals per match (target ~9.12)
  const avgGoalsRow = db.prepare('SELECT AVG(home_goals + away_goals) as avg FROM matches').get() as { avg: number }
  results.push(numCheck('Mål per match', avgGoalsRow.avg ?? 0, 9.12, 2.0))

  // 8. Home win rate (target ~50.2%)
  const homeWinRow = db.prepare(`
    SELECT AVG(CASE WHEN result_outcome = 'home_win' THEN 1.0 ELSE 0.0 END) as rate FROM matches
  `).get() as { rate: number }
  results.push(numCheck('Hemmavinst-rate', (homeWinRow.rate ?? 0) * 100, 50.2, 10.0, '%'))

  // 9. Avg corners per match (bandy range: typically 15-25 total)
  const avgCornersRow = db.prepare('SELECT AVG(home_corners + away_corners) as avg FROM matches').get() as { avg: number }
  const avgCorners = avgCornersRow.avg ?? 0
  results.push(check(
    'Hörnor per match (rimligt band)',
    avgCorners >= 5 && avgCorners <= 40,
    `${avgCorners.toFixed(1)} hörnor/match (förväntat: 5-40)`,
  ))

  // 10. Reproducibility: pick 5 matches and re-simulate
  const sampleMatches = db.prepare(`
    SELECT match_id, seed, home_ca, away_ca, home_formation, away_formation,
           home_mentality, home_tempo, home_press, home_passing_risk,
           home_play_width, home_attack_focus, home_corner_strategy, home_pp_strategy,
           away_mentality, away_tempo, away_press, away_passing_risk,
           away_play_width, away_attack_focus, away_corner_strategy, away_pp_strategy,
           weather_condition, weather_temperature, weather_ice_quality,
           home_goals, away_goals
    FROM matches ORDER BY RANDOM() LIMIT 5
  `).all() as Array<{
    match_id: string; seed: number; home_ca: number; away_ca: number
    home_formation: string; away_formation: string
    home_mentality: string; home_tempo: string; home_press: string; home_passing_risk: string
    home_play_width: string; home_attack_focus: string; home_corner_strategy: string; home_pp_strategy: string
    away_mentality: string; away_tempo: string; away_press: string; away_passing_risk: string
    away_play_width: string; away_attack_focus: string; away_corner_strategy: string; away_pp_strategy: string
    weather_condition: string | null; weather_temperature: number | null; weather_ice_quality: string | null
    home_goals: number; away_goals: number
  }>

  let reproOk = 0
  const reproDetails: string[] = []

  for (const row of sampleMatches) {
    const homeId = 'repro_home'
    const awayId = 'repro_away'
    _globalPid = row.seed % 100000

    const homeFormation = row.home_formation as FormationType
    const awayFormation = row.away_formation as FormationType

    const homeResult = makeSquad(homeId, row.home_ca, homeFormation, row.seed)
    const awayResult = makeSquad(awayId, row.away_ca, awayFormation, row.seed + 50000)

    const homeTactic: Tactic = {
      mentality: row.home_mentality as any, tempo: row.home_tempo as any,
      press: row.home_press as any, passingRisk: row.home_passing_risk as any,
      width: row.home_play_width as any, attackingFocus: row.home_attack_focus as any,
      cornerStrategy: row.home_corner_strategy as any, penaltyKillStyle: row.home_pp_strategy as any,
      formation: homeFormation,
    }
    const awayTactic: Tactic = {
      mentality: row.away_mentality as any, tempo: row.away_tempo as any,
      press: row.away_press as any, passingRisk: row.away_passing_risk as any,
      width: row.away_play_width as any, attackingFocus: row.away_attack_focus as any,
      cornerStrategy: row.away_corner_strategy as any, penaltyKillStyle: row.away_pp_strategy as any,
      formation: awayFormation,
    }

    const weather: Weather | undefined = row.weather_condition ? {
      temperature: row.weather_temperature ?? -5,
      condition: row.weather_condition as WeatherCondition,
      windStrength: 3,
      iceQuality: (row.weather_ice_quality ?? 'good') as IceQuality,
      snowfall: row.weather_condition === WeatherCondition.LightSnow || row.weather_condition === WeatherCondition.HeavySnow,
      region: 'Sverige',
    } : undefined

    const fixture: Fixture = {
      id: `repro_${row.match_id}`,
      leagueId: 'warehouse',
      homeClubId: homeId, awayClubId: awayId,
      season: 1, matchday: 1, roundNumber: 1,
      status: FixtureStatus.Scheduled,
      homeScore: 0, awayScore: 0,
      events: [],
      isCup: false, isKnockout: false, isNeutralVenue: false,
    }

    try {
      const result = simulateMatch({
        fixture,
        homeLineup: { ...homeResult.lineup, tactic: homeTactic },
        awayLineup: { ...awayResult.lineup, tactic: awayTactic },
        homePlayers: homeResult.players,
        awayPlayers: awayResult.players,
        homeAdvantage: 0.14,
        seed: row.seed,
        weather,
      })
      const rf = result.fixture
      const scoreMatch = rf.homeScore === row.home_goals && rf.awayScore === row.away_goals
      if (scoreMatch) reproOk++
      reproDetails.push(
        `${row.match_id.slice(0, 8)}: DB=${row.home_goals}-${row.away_goals} Repro=${rf.homeScore}-${rf.awayScore} ${scoreMatch ? 'OK' : 'FAIL'}`,
      )
    } catch (err) {
      reproDetails.push(`${row.match_id.slice(0, 8)}: ERROR ${err}`)
    }
  }

  results.push(check(
    `Reprodukbarhet (5 slumpmässiga matcher)`,
    reproOk === sampleMatches.length,
    `${reproOk}/${sampleMatches.length} identiska resultat. ${reproDetails.join(' | ')}`,
  ))

  db.close()

  // ---- Print results ----

  const allPassed = results.every(r => r.passed)
  console.log('Check                                    Status  Detaljer')
  console.log('─'.repeat(90))
  for (const r of results) {
    const status = r.passed ? '  OK  ' : ' FAIL '
    console.log(`${r.name.padEnd(42)} [${status}]  ${r.details}`)
  }
  console.log()
  if (allPassed) {
    console.log('Alla kontroller passerade.')
  } else {
    const failed = results.filter(r => !r.passed).map(r => r.name)
    console.log(`FAILED kontroller: ${failed.join(', ')}`)
  }

  // ---- Write report ----

  mkdirSync('./data-warehouse/reports', { recursive: true })

  const rows = results.map(r => {
    const status = r.passed ? 'OK' : 'FAIL'
    return `| ${r.name} | ${status} | ${r.details} |`
  }).join('\n')

  const report = `# Data Warehouse — Valideringsrapport

**Datum:** ${ts}
**Engine version:** ${ENGINE_VERSION}
**Mode:** ${PILOT_MODE ? 'PILOT (50 matcher)' : 'FULL (1050 matcher)'}
**Resultat:** ${allPassed ? 'ALLA KONTROLLER PASSERADE' : 'NÅGRA KONTROLLER FAILADE'}

## Kontroller

| Kontroll | Status | Detaljer |
|----------|--------|----------|
${rows}

## Noteringar

- Period-shots och period-possession lagras inte (NULL) — deriveras inte från events.
- Expulsions är mappade från MatchEventType.RedCard (bandy-terminologi: utvisning, inte rött kort).
- Reproducibilitetskontrollen förutsätter identisk squad-generering med samma seed. Väderparametrar (windStrength, snowfall) rekonstrueras approximativt och kan skilja marginellt.
- Control och limits-buckets kör med homeAdvantage=0 (neutral plan) för att isolera taktikeffekter.
`

  writeFileSync(REPORT_PATH, report, 'utf8')
  console.log(`\nRapport skriven till ${REPORT_PATH}`)

  process.exit(allPassed ? 0 : 1)
}

main()
