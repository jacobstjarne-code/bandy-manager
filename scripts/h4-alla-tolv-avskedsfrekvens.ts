/**
 * Avskedskalibrering for H4-rundan.
 *
 * En kort lokal kontroll:
 *   npm run calibrate:firing -- --seeds=20
 *
 * Den beslutade baslinjen:
 *   npm run calibrate:firing -- --seeds=10000 --seasons=6 --json
 *
 * Standardurvalet ar Heros, Soderfors, Lesjofors och Forsbacka (toppklubb).
 * Anvand --clubs=all for hela ligan eller en kommaseparerad lista med klubb-id:n.
 * Skriptet laser SaveGame.firedReason — det gissar aldrig avskedsorsaken fran
 * efterhandsvarden som boardPatience eller licenseStatus.
 */

import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { CLUB_TEMPLATES } from '../src/domain/services/worldGenerator'
import { autoBuildCheapestAffordableFacility, autoResolvePendingScreen, autoSelectLineup } from './stress/fixtures'

const DEFAULT_CLUB_IDS = [
  'club_heros',
  'club_soderfors',
  'club_lesjofors',
  'club_forsbacka',
] as const

type StoredFiredReason = NonNullable<SaveGame['firedReason']>
type ObservedFiredReason = StoredFiredReason | 'unknown' | null

interface CalibrationConfig {
  seeds: number
  seasons: number
  seedStart: number
  clubIds: string[]
  json: boolean
}

interface RunResult {
  clubId: string
  seed: number
  firedSeason: number | null
  firedReason: ObservedFiredReason
  crashed: boolean
  crashMsg: string | null
}

interface ClubReport {
  clubId: string
  clubName: string
  reputation: number
  boardExpectation: string
  requestedRuns: number
  validRuns: number
  firedRuns: number
  firingRate: number | null
  reasons: Record<StoredFiredReason | 'unknown', number>
  firedBySeason: Record<string, number>
  crashes: Array<{ seed: number; message: string }>
  unknownReasonSeeds: number[]
}

interface CalibrationReport {
  schemaVersion: 1
  config: Omit<CalibrationConfig, 'json'>
  clubs: ClubReport[]
}

function usage(): string {
  return [
    'Avskedskalibrering',
    '',
    'Val:',
    '  --seeds=N          antal seeds per klubb (standard 20)',
    '  --seasons=N        hogsta antal sasonger per karriar (standard 6)',
    '  --seed-start=N      forsta seed (standard 90000)',
    '  --clubs=ID,ID      klubb-id:n, eller all (standard: fyra kalibreringsklubbar)',
    '  --json              maskinlasbar sammanfattning till stdout',
    '  --help              visa denna hjalp',
  ].join('\n')
}

function positiveIntegerOption(args: string[], name: string, fallback: number): number {
  const prefix = `--${name}=`
  const raw = args.find(arg => arg.startsWith(prefix))?.slice(prefix.length)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${prefix}<varde> maste vara ett positivt heltal`)
  }
  return value
}

function parseConfig(args: string[]): CalibrationConfig | null {
  if (args.includes('--help')) return null

  const knownFlags = new Set(['--json', '--help'])
  const knownPrefixes = ['--seeds=', '--seasons=', '--seed-start=', '--clubs=']
  const unknown = args.find(arg => !knownFlags.has(arg) && !knownPrefixes.some(prefix => arg.startsWith(prefix)))
  if (unknown) throw new Error(`Okant val: ${unknown}`)

  const clubsArg = args.find(arg => arg.startsWith('--clubs='))?.slice('--clubs='.length)
  const clubIds = clubsArg === 'all'
    ? CLUB_TEMPLATES.map(club => club.id)
    : clubsArg
      ? clubsArg.split(',').map(id => id.trim()).filter(Boolean)
      : [...DEFAULT_CLUB_IDS]

  if (clubIds.length === 0) throw new Error('--clubs maste innehalla minst ett klubb-id')
  const duplicateClub = clubIds.find((clubId, index) => clubIds.indexOf(clubId) !== index)
  if (duplicateClub) throw new Error(`Klubb-id angivet flera ganger: ${duplicateClub}`)

  const knownClubIds = new Set(CLUB_TEMPLATES.map(club => club.id))
  const invalidClub = clubIds.find(clubId => !knownClubIds.has(clubId))
  if (invalidClub) throw new Error(`Okant klubb-id: ${invalidClub}`)

  return {
    seeds: positiveIntegerOption(args, 'seeds', 20),
    seasons: positiveIntegerOption(args, 'seasons', 6),
    seedStart: positiveIntegerOption(args, 'seed-start', 90_000),
    clubIds,
    json: args.includes('--json'),
  }
}

function runOne(clubId: string, seed: number, seasons: number): RunResult {
  let game: SaveGame = createNewGame({ managerName: `FiringCalibration-${seed}`, clubId, seed })
  game = { ...game, pendingScreen: null }

  try {
    for (let season = 1; season <= seasons; season++) {
      let stepSeed = seed * 100_000 + season * 1_000
      let seasonDone = false
      let guardRounds = 0

      while (!seasonDone) {
        guardRounds++
        if (guardRounds > 2000) throw new Error(`season ${season} never ended — round guard tripped`)

        game = autoSelectLineup(game)
        game = autoBuildCheapestAffordableFacility(game)
        const result = advanceToNextEvent(game, stepSeed++)
        game = result.game

        if (result.seasonEnded || game.managerFired) {
          seasonDone = true
        } else {
          const resolved = autoResolvePendingScreen(game)
          if (resolved.unresolvable) throw new Error(`unresolvable pendingScreen: ${resolved.screenType}`)
          game = resolved.game
        }
      }

      if (game.managerFired) {
        return {
          clubId,
          seed,
          firedSeason: season,
          firedReason: game.firedReason ?? 'unknown',
          crashed: false,
          crashMsg: null,
        }
      }

      game = autoResolvePendingScreen(game).game
    }
  } catch (error) {
    return {
      clubId,
      seed,
      firedSeason: null,
      firedReason: null,
      crashed: true,
      crashMsg: error instanceof Error ? error.message : String(error),
    }
  }

  return { clubId, seed, firedSeason: null, firedReason: null, crashed: false, crashMsg: null }
}

function summarizeClub(clubId: string, seeds: number, results: RunResult[]): ClubReport {
  const template = CLUB_TEMPLATES.find(club => club.id === clubId)
  if (!template) throw new Error(`Klubbmallen saknas for ${clubId}`)

  const valid = results.filter(result => !result.crashed)
  const fired = valid.filter(result => result.firedSeason !== null)
  const reasons: ClubReport['reasons'] = {
    boardPatience: 0,
    consecutiveFailures: 0,
    licenseDenied: 0,
    bankruptcy: 0,
    unknown: 0,
  }
  const firedBySeason: Record<string, number> = {}

  for (const result of fired) {
    reasons[result.firedReason ?? 'unknown']++
    const seasonKey = String(result.firedSeason)
    firedBySeason[seasonKey] = (firedBySeason[seasonKey] ?? 0) + 1
  }

  return {
    clubId,
    clubName: template.name,
    reputation: template.reputation,
    boardExpectation: template.boardExpectation,
    requestedRuns: seeds,
    validRuns: valid.length,
    firedRuns: fired.length,
    firingRate: valid.length > 0 ? fired.length / valid.length : null,
    reasons,
    firedBySeason,
    crashes: results
      .filter(result => result.crashed)
      .map(result => ({ seed: result.seed, message: result.crashMsg ?? 'unknown crash' })),
    unknownReasonSeeds: fired
      .filter(result => result.firedReason === 'unknown')
      .map(result => result.seed),
  }
}

function printHumanReport(report: CalibrationReport): void {
  console.log(`\n=== Avskedskalibrering: ${report.config.seasons} sasonger x ${report.config.seeds} seeds ===\n`)
  for (const club of report.clubs) {
    const rate = club.firingRate === null ? '—' : `${(club.firingRate * 100).toFixed(1)}%`
    const reasons = Object.entries(club.reasons)
      .filter(([, count]) => count > 0)
      .map(([reason, count]) => `${reason}=${count}`)
      .join(', ') || '—'
    const seasons = Object.entries(club.firedBySeason)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([season, count]) => `S${season}=${count}`)
      .join(', ') || '—'
    const warnings = [
      club.crashes.length > 0 ? `KRASCH=${club.crashes.length}` : '',
      club.unknownReasonSeeds.length > 0 ? `OKAND_ORSAK=${club.unknownReasonSeeds.length}` : '',
    ].filter(Boolean).join(' ')

    console.log(
      `${club.clubName.padEnd(12)} (${club.clubId}, rep=${club.reputation}, ${club.boardExpectation}): `
      + `avsked ${club.firedRuns}/${club.validRuns} (${rate}); orsaker: ${reasons}; sasong: ${seasons}`
      + (warnings ? `; ${warnings}` : ''),
    )
    for (const crash of club.crashes) console.log(`  KRASCH seed=${crash.seed}: ${crash.message}`)
    if (club.unknownReasonSeeds.length > 0) {
      console.log(`  OKAND ORSAK seeds: ${club.unknownReasonSeeds.join(', ')}`)
    }
  }
  console.log('\n=== SLUT ===\n')
}

function main(): void {
  let config: CalibrationConfig | null
  try {
    config = parseConfig(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    console.error('\n' + usage())
    process.exitCode = 2
    return
  }

  if (!config) {
    console.log(usage())
    return
  }

  const clubs: ClubReport[] = []
  for (const clubId of config.clubIds) {
    const results: RunResult[] = []
    for (let index = 0; index < config.seeds; index++) {
      results.push(runOne(clubId, config.seedStart + index, config.seasons))
      if (!config.json && config.seeds >= 100 && (index + 1) % Math.max(1, Math.floor(config.seeds / 10)) === 0) {
        console.error(`${clubId}: ${index + 1}/${config.seeds}`)
      }
    }
    clubs.push(summarizeClub(clubId, config.seeds, results))
  }

  const report: CalibrationReport = {
    schemaVersion: 1,
    config: {
      seeds: config.seeds,
      seasons: config.seasons,
      seedStart: config.seedStart,
      clubIds: config.clubIds,
    },
    clubs,
  }

  if (config.json) console.log(JSON.stringify(report, null, 2))
  else printHumanReport(report)

  if (clubs.some(club => club.crashes.length > 0 || club.unknownReasonSeeds.length > 0)) {
    process.exitCode = 1
  }
}

main()
