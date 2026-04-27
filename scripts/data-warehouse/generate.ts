/**
 * Data Warehouse — Match Generator
 *
 * Genererar syntetiska matcher mot SQLite-databasen för analys och kalibrering.
 * Kör med: node_modules/.bin/vite-node scripts/data-warehouse/generate.ts [--pilot]
 *
 * --pilot: genererar 50 matcher (proportionellt urval) istf 1050.
 */

import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { readFileSync, mkdirSync } from 'fs'
import { simulateMatch } from '../../src/domain/services/matchEngine'
import { ENGINE_VERSION } from '../../src/domain/services/matchCore'
import { FORMATIONS } from '../../src/domain/entities/Formation'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  MatchEventType,
  WeatherCondition,
  IceQuality,
} from '../../src/domain/enums'
import type { Player } from '../../src/domain/entities/Player'
import type { Fixture, TeamSelection } from '../../src/domain/entities/Fixture'
import type { Tactic } from '../../src/domain/entities/Club'
import type { FormationType } from '../../src/domain/entities/Formation'
import type { Weather } from '../../src/domain/entities/Weather'

// ---- CONSTANTS ----

const DB_PATH = './data-warehouse/matches.db'
const SCHEMA_PATH = './scripts/data-warehouse/001-init-schema.sql'
const PILOT_MODE = process.argv.includes('--pilot')
const TOTAL_MATCHES = PILOT_MODE ? 50 : 1050

// Formation weights for realistic bucket
const REALISTIC_FORMATIONS: Array<{ f: FormationType; weight: number }> = [
  { f: '5-3-2', weight: 0.50 },
  { f: '4-3-3', weight: 0.30 },
  { f: '3-3-4', weight: 0.20 },
]

// Tactic profiles
type TacticProfile = {
  mentality: 'defensive' | 'balanced' | 'offensive'
  tempo: 'low' | 'normal' | 'high'
  press: 'low' | 'medium' | 'high'
  passingRisk: 'safe' | 'mixed' | 'direct'
  width: 'narrow' | 'normal' | 'wide'
  attackingFocus: 'wings' | 'mixed' | 'central'
  cornerStrategy: 'safe' | 'standard' | 'aggressive'
  penaltyKillStyle: 'passive' | 'active' | 'aggressive'
}

const TACTIC_PROFILES: Record<string, TacticProfile> = {
  defensive: {
    mentality: 'defensive', tempo: 'low', press: 'low',
    passingRisk: 'direct', width: 'narrow', attackingFocus: 'wings',
    cornerStrategy: 'safe', penaltyKillStyle: 'passive',
  },
  balanced: {
    mentality: 'balanced', tempo: 'normal', press: 'medium',
    passingRisk: 'mixed', width: 'normal', attackingFocus: 'mixed',
    cornerStrategy: 'standard', penaltyKillStyle: 'active',
  },
  pressing: {
    mentality: 'offensive', tempo: 'high', press: 'high',
    passingRisk: 'mixed', width: 'normal', attackingFocus: 'mixed',
    cornerStrategy: 'standard', penaltyKillStyle: 'aggressive',
  },
  attacking: {
    mentality: 'offensive', tempo: 'high', press: 'medium',
    passingRisk: 'direct', width: 'wide', attackingFocus: 'central',
    cornerStrategy: 'aggressive', penaltyKillStyle: 'active',
  },
}
const PROFILE_NAMES = Object.keys(TACTIC_PROFILES)

// All tactic enum values
const ALL_MENTALITIES: TacticProfile['mentality'][] = ['defensive', 'balanced', 'offensive']
const ALL_TEMPOS: TacticProfile['tempo'][] = ['low', 'normal', 'high']
const ALL_PRESSES: TacticProfile['press'][] = ['low', 'medium', 'high']
const ALL_PASSING_RISKS: TacticProfile['passingRisk'][] = ['safe', 'mixed', 'direct']
const ALL_WIDTHS: TacticProfile['width'][] = ['narrow', 'normal', 'wide']
const ALL_ATTACK_FOCUSES: TacticProfile['attackingFocus'][] = ['wings', 'mixed', 'central']
const ALL_CORNER_STRATEGIES: TacticProfile['cornerStrategy'][] = ['safe', 'standard', 'aggressive']
const ALL_PENALTY_KILLS: TacticProfile['penaltyKillStyle'][] = ['passive', 'active', 'aggressive']
const ALL_FORMATIONS: FormationType[] = ['5-3-2', '4-3-3', '3-3-4', '3-4-3', '2-3-2-3', '4-2-4']

// Weather options
const WEATHER_CONDITIONS = [
  WeatherCondition.Clear,
  WeatherCondition.Overcast,
  WeatherCondition.LightSnow,
  WeatherCondition.HeavySnow,
  WeatherCondition.Fog,
  WeatherCondition.Thaw,
]
const ICE_QUALITIES = [
  IceQuality.Excellent,
  IceQuality.Good,
  IceQuality.Moderate,
  IceQuality.Poor,
]

// Bucket seed offsets — ensures unique seeds across buckets
const BUCKET_OFFSETS: Record<string, number> = {
  realistic: 0,
  varied: 100000,
  edge: 200000,
  control: 300000,
  limits: 400000,
}

// ---- SEEDED RNG (mulberry32) ----

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// ---- TRIANGULAR DISTRIBUTION ----
// min=50, max=92, mode=70

function triangularCA(rng: () => number): number {
  const min = 50, max = 92, mode = 70
  const c = (mode - min) / (max - min)
  const u = rng()
  let x: number
  if (u < c) {
    x = min + Math.sqrt(u * (max - min) * (mode - min))
  } else {
    x = max - Math.sqrt((1 - u) * (max - min) * (max - mode))
  }
  return Math.round(x)
}

// ---- SYNTHETIC PLAYER GENERATION ----
// Follows calibrate.ts pattern exactly.

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
      skating: ca,
      acceleration: ca,
      stamina: ca,
      ballControl: ca,
      passing: ca,
      shooting: ca,
      dribbling: ca,
      vision: ca,
      decisions: ca,
      workRate: ca,
      positioning: ca,
      defending: ca,
      cornerSkill: ca,
      goalkeeping: isGK ? Math.min(100, ca + 20) : 20,
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

// Generate a squad based on formation (11 starters + 5 bench)
function makeSquad(
  clubId: string,
  ca: number,
  formation: FormationType,
  seed: number,
): { players: Player[]; lineup: TeamSelection } {
  const rng = mulberry32(seed)
  const template = FORMATIONS[formation]

  // Build position list from formation slots
  const starterPositions = template.slots.map(s => s.position)

  // Create starters with slight CA variance (±5)
  const starters: Player[] = starterPositions.map(pos => {
    const variance = Math.round((rng() - 0.5) * 10)
    const playerCA = Math.min(100, Math.max(30, ca + variance))
    return makePlayer(clubId, pos, playerCA)
  })

  // Bench: 1 GK, 2 DEF, 1 HALF, 1 FWD (standard bench composition)
  const benchPositions = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender,
    PlayerPosition.Defender,
    PlayerPosition.Half,
    PlayerPosition.Forward,
  ]
  const bench: Player[] = benchPositions.map(pos => {
    const variance = Math.round((rng() - 0.5) * 10)
    const playerCA = Math.min(100, Math.max(30, ca + variance - 5)) // bench slightly weaker
    return makePlayer(clubId, pos, playerCA)
  })

  const tactic: Tactic = {
    mentality: 'balanced',
    tempo: 'normal',
    press: 'medium',
    passingRisk: 'mixed',
    width: 'normal',
    attackingFocus: 'mixed',
    cornerStrategy: 'standard',
    penaltyKillStyle: 'active',
    formation,
  }

  const lineup: TeamSelection = {
    startingPlayerIds: starters.map(p => p.id),
    benchPlayerIds: bench.map(p => p.id),
    tactic,
  }

  return { players: [...starters, ...bench], lineup }
}

// ---- WEIGHTED PICK ----

function weightedPick<T>(items: Array<{ f: T; weight: number }>, rng: () => number): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rng() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.f
  }
  return items[items.length - 1].f
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ---- TACTIC FROM PROFILE ----

function tacticFromProfile(profile: TacticProfile, formation: FormationType): Tactic {
  return {
    mentality: profile.mentality,
    tempo: profile.tempo,
    press: profile.press,
    passingRisk: profile.passingRisk,
    width: profile.width,
    attackingFocus: profile.attackingFocus,
    cornerStrategy: profile.cornerStrategy,
    penaltyKillStyle: profile.penaltyKillStyle,
    formation,
  }
}

// ---- SAMPLING BUCKET GENERATORS ----

type MatchConfig = {
  homeCA: number
  awayCA: number
  homeFormation: FormationType
  awayFormation: FormationType
  homeTactic: Tactic
  awayTactic: Tactic
  homeAdvantage: number
  weather: Weather | undefined
  seed: number
}

function makeWeather(rng: () => number): Weather {
  const condition = pickRandom(WEATHER_CONDITIONS, rng)
  const iceQuality = pickRandom(ICE_QUALITIES, rng)
  const temperature = Math.round(-15 + rng() * 20) // -15 to +5 degrees
  return {
    temperature,
    condition,
    windStrength: Math.round(rng() * 10),
    iceQuality,
    snowfall: condition === WeatherCondition.LightSnow || condition === WeatherCondition.HeavySnow,
    region: 'Sverige',
  }
}

function makeNeutralWeather(): Weather {
  return {
    temperature: -5,
    condition: WeatherCondition.Clear,
    windStrength: 2,
    iceQuality: IceQuality.Good,
    snowfall: false,
    region: 'Sverige',
  }
}

function generateRealistic(matchIndex: number, bucketSeed: number): MatchConfig {
  const seed = matchIndex * 7919 + BUCKET_OFFSETS.realistic + bucketSeed
  const rng = mulberry32(seed)

  const homeCA = triangularCA(rng)
  const awayCA = triangularCA(rng)
  const homeFormation = weightedPick(REALISTIC_FORMATIONS, rng)
  const awayFormation = weightedPick(REALISTIC_FORMATIONS, rng)
  const homeProfileName = pickRandom(PROFILE_NAMES, rng)
  const awayProfileName = pickRandom(PROFILE_NAMES, rng)

  return {
    homeCA, awayCA,
    homeFormation, awayFormation,
    homeTactic: tacticFromProfile(TACTIC_PROFILES[homeProfileName], homeFormation),
    awayTactic: tacticFromProfile(TACTIC_PROFILES[awayProfileName], awayFormation),
    homeAdvantage: 0.14,
    weather: rng() < 0.6 ? makeWeather(rng) : undefined, // 60% chance of weather
    seed,
  }
}

function generateVaried(matchIndex: number, bucketSeed: number): MatchConfig {
  const seed = matchIndex * 7919 + BUCKET_OFFSETS.varied + bucketSeed
  const rng = mulberry32(seed)

  const homeCA = Math.round(40 + rng() * 55) // 40-95
  const awayCA = Math.round(40 + rng() * 55)
  const homeFormation = pickRandom(ALL_FORMATIONS, rng)
  const awayFormation = pickRandom(ALL_FORMATIONS, rng)

  const homeTactic: Tactic = {
    mentality: pickRandom(ALL_MENTALITIES, rng),
    tempo: pickRandom(ALL_TEMPOS, rng),
    press: pickRandom(ALL_PRESSES, rng),
    passingRisk: pickRandom(ALL_PASSING_RISKS, rng),
    width: pickRandom(ALL_WIDTHS, rng),
    attackingFocus: pickRandom(ALL_ATTACK_FOCUSES, rng),
    cornerStrategy: pickRandom(ALL_CORNER_STRATEGIES, rng),
    penaltyKillStyle: pickRandom(ALL_PENALTY_KILLS, rng),
    formation: homeFormation,
  }
  const awayTactic: Tactic = {
    mentality: pickRandom(ALL_MENTALITIES, rng),
    tempo: pickRandom(ALL_TEMPOS, rng),
    press: pickRandom(ALL_PRESSES, rng),
    passingRisk: pickRandom(ALL_PASSING_RISKS, rng),
    width: pickRandom(ALL_WIDTHS, rng),
    attackingFocus: pickRandom(ALL_ATTACK_FOCUSES, rng),
    cornerStrategy: pickRandom(ALL_CORNER_STRATEGIES, rng),
    penaltyKillStyle: pickRandom(ALL_PENALTY_KILLS, rng),
    formation: awayFormation,
  }

  return {
    homeCA, awayCA,
    homeFormation, awayFormation,
    homeTactic, awayTactic,
    homeAdvantage: 0.14,
    weather: rng() < 0.5 ? makeWeather(rng) : undefined,
    seed,
  }
}

// Edge patterns: 4 extreme matchups × 25 each
function generateEdge(matchIndex: number, bucketSeed: number): MatchConfig {
  const seed = matchIndex * 7919 + BUCKET_OFFSETS.edge + bucketSeed
  const rng = mulberry32(seed)
  const pattern = matchIndex % 4

  let homeCA: number, awayCA: number, homeTacticProfile: TacticProfile, awayTacticProfile: TacticProfile

  switch (pattern) {
    case 0: // Strong home vs weak away
      homeCA = 90; awayCA = 50
      homeTacticProfile = TACTIC_PROFILES.attacking
      awayTacticProfile = TACTIC_PROFILES.defensive
      break
    case 1: // Weak home vs strong away
      homeCA = 50; awayCA = 90
      homeTacticProfile = TACTIC_PROFILES.defensive
      awayTacticProfile = TACTIC_PROFILES.attacking
      break
    case 2: // Equal strength, maximal tactic contrast (pressing vs defensive)
      homeCA = 70; awayCA = 70
      homeTacticProfile = TACTIC_PROFILES.pressing
      awayTacticProfile = TACTIC_PROFILES.defensive
      break
    case 3: // Equal strength, both attacking
      homeCA = 70; awayCA = 70
      homeTacticProfile = TACTIC_PROFILES.attacking
      awayTacticProfile = TACTIC_PROFILES.attacking
      break
    default:
      homeCA = 70; awayCA = 70
      homeTacticProfile = TACTIC_PROFILES.balanced
      awayTacticProfile = TACTIC_PROFILES.balanced
  }

  const homeFormation: FormationType = '5-3-2'
  const awayFormation: FormationType = '5-3-2'

  return {
    homeCA, awayCA,
    homeFormation, awayFormation,
    homeTactic: tacticFromProfile(homeTacticProfile, homeFormation),
    awayTactic: tacticFromProfile(awayTacticProfile, awayFormation),
    homeAdvantage: 0.14,
    weather: rng() < 0.3 ? makeWeather(rng) : undefined,
    seed,
  }
}

function generateControl(matchIndex: number, bucketSeed: number): MatchConfig {
  const seed = matchIndex * 7919 + BUCKET_OFFSETS.control + bucketSeed
  const formation: FormationType = '5-3-2'
  const BASE_CA = 70
  const BASE: TacticProfile = TACTIC_PROFILES.balanced

  // Vary one tactic dimension at a time. 7 dimensions × 7 matches each = 49. Match 49 = baseline.
  const dim = Math.floor(matchIndex / 7) // 0-7
  const idx = matchIndex % 7            // cycle within dimension

  let homeTactic: Tactic = { ...BASE, formation }
  let awayTactic: Tactic = { ...BASE, formation }

  if (matchIndex === 49) {
    // Baseline match — everything balanced
  } else {
    switch (dim) {
      case 0: { // mentality: 3 home × 3 away = 9 combos; use idx to pick
        const homeM = ALL_MENTALITIES[Math.floor(idx / 3) % 3]
        const awayM = ALL_MENTALITIES[idx % 3]
        homeTactic = { ...BASE, mentality: homeM, formation }
        awayTactic = { ...BASE, mentality: awayM, formation }
        break
      }
      case 1: { // press
        const homeP = ALL_PRESSES[Math.floor(idx / 3) % 3]
        const awayP = ALL_PRESSES[idx % 3]
        homeTactic = { ...BASE, press: homeP, formation }
        awayTactic = { ...BASE, press: awayP, formation }
        break
      }
      case 2: { // tempo
        const homeT = ALL_TEMPOS[Math.floor(idx / 3) % 3]
        const awayT = ALL_TEMPOS[idx % 3]
        homeTactic = { ...BASE, tempo: homeT, formation }
        awayTactic = { ...BASE, tempo: awayT, formation }
        break
      }
      case 3: { // passingRisk
        const homePR = ALL_PASSING_RISKS[Math.floor(idx / 3) % 3]
        const awayPR = ALL_PASSING_RISKS[idx % 3]
        homeTactic = { ...BASE, passingRisk: homePR, formation }
        awayTactic = { ...BASE, passingRisk: awayPR, formation }
        break
      }
      case 4: { // cornerStrategy
        const homeCS = ALL_CORNER_STRATEGIES[Math.floor(idx / 3) % 3]
        const awayCS = ALL_CORNER_STRATEGIES[idx % 3]
        homeTactic = { ...BASE, cornerStrategy: homeCS, formation }
        awayTactic = { ...BASE, cornerStrategy: awayCS, formation }
        break
      }
      case 5: { // width
        const homeW = ALL_WIDTHS[Math.floor(idx / 3) % 3]
        const awayW = ALL_WIDTHS[idx % 3]
        homeTactic = { ...BASE, width: homeW, formation }
        awayTactic = { ...BASE, width: awayW, formation }
        break
      }
      case 6: { // attackingFocus
        const homeAF = ALL_ATTACK_FOCUSES[Math.floor(idx / 3) % 3]
        const awayAF = ALL_ATTACK_FOCUSES[idx % 3]
        homeTactic = { ...BASE, attackingFocus: homeAF, formation }
        awayTactic = { ...BASE, attackingFocus: awayAF, formation }
        break
      }
    }
  }

  return {
    homeCA: BASE_CA, awayCA: BASE_CA,
    homeFormation: formation, awayFormation: formation,
    homeTactic, awayTactic,
    homeAdvantage: 0.0, // neutral ground for control
    weather: makeNeutralWeather(),
    seed,
  }
}

function generateLimits(matchIndex: number, bucketSeed: number): MatchConfig {
  const seed = matchIndex * 7919 + BUCKET_OFFSETS.limits + bucketSeed
  const formation: FormationType = '5-3-2'
  const BASE_CA = 70
  const BASE: TacticProfile = TACTIC_PROFILES.balanced

  // 4 groups of 12-13 matches each, 3 seeds per pair
  // Group 0 (0-11): press=low home vs press=high away
  // Group 1 (12-23): cornerStrategy=safe vs cornerStrategy=aggressive
  // Group 2 (24-36): narrow width vs wide width
  // Group 3 (37-49): passingRisk=safe vs passingRisk=direct

  let homeTactic: Tactic
  let awayTactic: Tactic

  if (matchIndex < 12) {
    // press contrast — 4 pairs × 3 seeds
    const pairIdx = Math.floor(matchIndex / 3) % 4
    const homePress = pairIdx % 2 === 0 ? 'low' as const : 'high' as const
    const awayPress = pairIdx % 2 === 0 ? 'high' as const : 'low' as const
    homeTactic = { ...BASE, press: homePress, formation }
    awayTactic = { ...BASE, press: awayPress, formation }
  } else if (matchIndex < 24) {
    // cornerStrategy contrast
    const localIdx = matchIndex - 12
    const pairIdx = Math.floor(localIdx / 3) % 4
    const homeCS = pairIdx % 2 === 0 ? 'safe' as const : 'aggressive' as const
    const awayCS = pairIdx % 2 === 0 ? 'aggressive' as const : 'safe' as const
    homeTactic = { ...BASE, cornerStrategy: homeCS, formation }
    awayTactic = { ...BASE, cornerStrategy: awayCS, formation }
  } else if (matchIndex < 37) {
    // width contrast
    const localIdx = matchIndex - 24
    const pairIdx = Math.floor(localIdx / 3) % 5
    const homeW = pairIdx % 2 === 0 ? 'narrow' as const : 'wide' as const
    const awayW = pairIdx % 2 === 0 ? 'wide' as const : 'narrow' as const
    homeTactic = { ...BASE, width: homeW, formation }
    awayTactic = { ...BASE, width: awayW, formation }
  } else {
    // passingRisk contrast
    const localIdx = matchIndex - 37
    const pairIdx = Math.floor(localIdx / 3) % 5
    const homePR = pairIdx % 2 === 0 ? 'safe' as const : 'direct' as const
    const awayPR = pairIdx % 2 === 0 ? 'direct' as const : 'safe' as const
    homeTactic = { ...BASE, passingRisk: homePR, formation }
    awayTactic = { ...BASE, passingRisk: awayPR, formation }
  }

  return {
    homeCA: BASE_CA, awayCA: BASE_CA,
    homeFormation: formation, awayFormation: formation,
    homeTactic, awayTactic,
    homeAdvantage: 0.0, // neutral ground for limits
    weather: makeNeutralWeather(),
    seed,
  }
}

// ---- MAIN ----

function main() {
  console.log(`\nBandy Manager Data Warehouse — Match Generator`)
  console.log(`Engine version: ${ENGINE_VERSION}`)
  console.log(`Mode: ${PILOT_MODE ? 'PILOT (50 matcher)' : 'FULL (1050 matcher)'}`)
  console.log(`DB: ${DB_PATH}\n`)

  // Ensure data-warehouse dir exists
  mkdirSync('./data-warehouse/reports', { recursive: true })

  // Open DB
  const db = new Database(DB_PATH)

  // Enable WAL mode for performance
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

  // Apply schema
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  db.exec(schema)

  // Prepare statements
  const insertMatch = db.prepare(`
    INSERT INTO matches (
      match_id, engine_version, seed, run_timestamp, sampling_bucket,
      home_team_id, away_team_id, home_ca, away_ca,
      home_formation, away_formation,
      home_mentality, home_tempo, home_press, home_passing_risk,
      home_play_width, home_attack_focus, home_corner_strategy, home_pp_strategy,
      away_mentality, away_tempo, away_press, away_passing_risk,
      away_play_width, away_attack_focus, away_corner_strategy, away_pp_strategy,
      weather_condition, weather_temperature, weather_ice_quality,
      home_goals, away_goals, home_corners, away_corners,
      home_shots, away_shots, home_on_target, away_on_target,
      home_penalties, away_penalties, home_expulsions, away_expulsions,
      home_possession, away_possession, result_outcome
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `)

  const insertPeriod = db.prepare(`
    INSERT INTO match_periods (match_id, period, home_goals, away_goals, home_corners, away_corners, home_expulsions, away_expulsions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertEvent = db.prepare(`
    INSERT INTO match_events (match_id, event_type, minute, team, player_id, is_corner_goal, is_penalty_goal, score_home_at_event, score_away_at_event)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Bucket distribution
  let bucketCounts: Record<string, number>
  if (PILOT_MODE) {
    bucketCounts = { realistic: 29, varied: 12, edge: 5, control: 2, limits: 2 }
  } else {
    bucketCounts = { realistic: 600, varied: 250, edge: 100, control: 50, limits: 50 }
  }

  const runTimestamp = new Date().toISOString()
  let totalInserted = 0
  let successCount = 0

  const insertMatchFull = db.transaction((config: MatchConfig, bucket: string, matchIndex: number) => {
    const matchId = randomUUID()
    const homeId = `team_home_${matchIndex}`
    const awayId = `team_away_${matchIndex}`

    // Reset player IDs per match for consistent naming
    _globalPid = matchIndex * 100

    const homeResult = makeSquad(homeId, config.homeCA, config.homeFormation, config.seed)
    const awayResult = makeSquad(awayId, config.awayCA, config.awayFormation, config.seed + 50000)

    // Apply the bucket-specific tactic to the lineup
    const homeLineup: TeamSelection = {
      ...homeResult.lineup,
      tactic: config.homeTactic,
    }
    const awayLineup: TeamSelection = {
      ...awayResult.lineup,
      tactic: config.awayTactic,
    }

    const fixture: Fixture = {
      id: `fix_${matchId}`,
      leagueId: 'warehouse',
      homeClubId: homeId,
      awayClubId: awayId,
      season: 1,
      matchday: matchIndex + 1,
      roundNumber: matchIndex + 1,
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
      isCup: false,
      isKnockout: false,
      isNeutralVenue: false,
    }

    let result
    try {
      result = simulateMatch({
        fixture,
        homeLineup,
        awayLineup,
        homePlayers: homeResult.players,
        awayPlayers: awayResult.players,
        homeAdvantage: config.homeAdvantage,
        seed: config.seed,
        weather: config.weather,
      })
    } catch (err) {
      console.error(`  Error simulating match ${matchIndex}: ${err}`)
      return false
    }

    const f = result.fixture
    const report = f.report!
    const allEvents = f.events

    // Determine outcome
    const outcome = f.homeScore > f.awayScore ? 'home_win' : f.homeScore < f.awayScore ? 'away_win' : 'draw'

    // Count expulsions (RedCard events — utvisning i bandy)
    let homeExp = 0, awayExp = 0
    for (const ev of allEvents) {
      if (ev.type === MatchEventType.RedCard) {
        if (ev.clubId === homeId) homeExp++
        else if (ev.clubId === awayId) awayExp++
      }
    }

    // Count penalties awarded
    let homePenalties = 0, awayPenalties = 0
    for (const ev of allEvents) {
      if (ev.type === MatchEventType.Penalty) {
        if (ev.clubId === homeId) homePenalties++
        else if (ev.clubId === awayId) awayPenalties++
      }
    }

    // Insert main match row
    insertMatch.run(
      matchId,
      ENGINE_VERSION,
      config.seed,
      runTimestamp,
      bucket,
      homeId, awayId,
      config.homeCA, config.awayCA,
      config.homeFormation, config.awayFormation,
      // Home tactic
      config.homeTactic.mentality,
      config.homeTactic.tempo,
      config.homeTactic.press,
      config.homeTactic.passingRisk,
      config.homeTactic.width,
      config.homeTactic.attackingFocus,
      config.homeTactic.cornerStrategy,
      config.homeTactic.penaltyKillStyle,
      // Away tactic
      config.awayTactic.mentality,
      config.awayTactic.tempo,
      config.awayTactic.press,
      config.awayTactic.passingRisk,
      config.awayTactic.width,
      config.awayTactic.attackingFocus,
      config.awayTactic.cornerStrategy,
      config.awayTactic.penaltyKillStyle,
      // Weather
      config.weather?.condition ?? null,
      config.weather?.temperature ?? null,
      config.weather?.iceQuality ?? null,
      // Results
      f.homeScore,
      f.awayScore,
      report.cornersHome,
      report.cornersAway,
      report.shotsHome,
      report.shotsAway,
      report.onTargetHome,
      report.onTargetAway,
      homePenalties,
      awayPenalties,
      homeExp,
      awayExp,
      report.possessionHome,
      report.possessionAway,
      outcome,
    )

    // Compute period stats from events
    type PeriodStats = { homeGoals: number; awayGoals: number; homeCorners: number; awayCorners: number; homeExp: number; awayExp: number }
    const periods: Record<number, PeriodStats> = {
      1: { homeGoals: 0, awayGoals: 0, homeCorners: 0, awayCorners: 0, homeExp: 0, awayExp: 0 },
      2: { homeGoals: 0, awayGoals: 0, homeCorners: 0, awayCorners: 0, homeExp: 0, awayExp: 0 },
    }

    let runningHomeScore = 0
    let runningAwayScore = 0

    for (const ev of allEvents) {
      const period = ev.minute < 45 ? 1 : 2
      const team = ev.clubId === homeId ? 'home' : 'away'
      const isHome = team === 'home'

      if (ev.type === MatchEventType.Goal) {
        if (isHome) { periods[period].homeGoals++; runningHomeScore++ }
        else { periods[period].awayGoals++; runningAwayScore++ }
      }
      if (ev.type === MatchEventType.Corner) {
        if (isHome) periods[period].homeCorners++
        else periods[period].awayCorners++
      }
      if (ev.type === MatchEventType.RedCard) {
        if (isHome) periods[period].homeExp++
        else periods[period].awayExp++
      }

      // Insert event row — for goals track running score
      let scoreHomeAtEvent = runningHomeScore
      let scoreAwayAtEvent = runningAwayScore
      // For non-goal events, use last known score
      insertEvent.run(
        matchId,
        ev.type,
        ev.minute,
        ev.clubId === homeId ? 'home' : 'away',
        ev.playerId ?? null,
        ev.isCornerGoal ? 1 : 0,
        ev.isPenaltyGoal ? 1 : 0,
        scoreHomeAtEvent,
        scoreAwayAtEvent,
      )
    }

    // Insert period rows
    for (const [p, stats] of Object.entries(periods)) {
      insertPeriod.run(
        matchId,
        parseInt(p),
        stats.homeGoals, stats.awayGoals,
        stats.homeCorners, stats.awayCorners,
        stats.homeExp, stats.awayExp,
      )
    }

    return true
  })

  // Generate matches per bucket
  const buckets = ['realistic', 'varied', 'edge', 'control', 'limits'] as const
  for (const bucket of buckets) {
    const count = bucketCounts[bucket]
    console.log(`Generating ${count} ${bucket} matches...`)

    for (let i = 0; i < count; i++) {
      let config: MatchConfig
      switch (bucket) {
        case 'realistic': config = generateRealistic(i, 0); break
        case 'varied':    config = generateVaried(i, 0); break
        case 'edge':      config = generateEdge(i, 0); break
        case 'control':   config = generateControl(i, 0); break
        case 'limits':    config = generateLimits(i, 0); break
      }

      const ok = insertMatchFull(config, bucket, totalInserted)
      if (ok) successCount++
      totalInserted++

      if (totalInserted % 50 === 0) {
        console.log(`  Progress: ${totalInserted}/${TOTAL_MATCHES} (${Math.round(totalInserted / TOTAL_MATCHES * 100)}%)`)
      }
    }
  }

  // Sanity summary
  const matchCount = (db.prepare('SELECT COUNT(*) as n FROM matches').get() as { n: number }).n
  const avgGoals = (db.prepare('SELECT AVG(home_goals + away_goals) as avg FROM matches').get() as { avg: number }).avg
  const homeWinRate = (db.prepare("SELECT AVG(CASE WHEN result_outcome = 'home_win' THEN 1.0 ELSE 0.0 END) as rate FROM matches").get() as { rate: number }).rate
  const bucketDist = db.prepare('SELECT sampling_bucket, COUNT(*) as n FROM matches GROUP BY sampling_bucket').all() as Array<{ sampling_bucket: string; n: number }>

  console.log(`\n=== Generation complete ===`)
  console.log(`Inserted: ${matchCount} matches (${successCount} succeeded)`)
  console.log(`Avg goals/match: ${avgGoals?.toFixed(2)} (target: ~9.12)`)
  console.log(`Home win rate: ${(homeWinRate * 100)?.toFixed(1)}% (target: ~50.2%)`)
  console.log(`Bucket distribution:`)
  for (const row of bucketDist) {
    console.log(`  ${row.sampling_bucket}: ${row.n}`)
  }

  db.close()
  console.log(`\nDB saved to ${DB_PATH}`)
}

main()
