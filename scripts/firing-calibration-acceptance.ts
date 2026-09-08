export interface FiringCalibrationClubReport {
  clubId: string
  clubName: string
  requestedRuns: number
  validRuns: number
  firedRuns: number
  firingRate: number | null
  reasons: Record<string, number>
  crashes: unknown[]
  unknownReasonSeeds: number[]
}

export interface FiringCalibrationReport {
  config: {
    seeds: number
    seasons: number
    clubIds: string[]
  }
  clubs: FiringCalibrationClubReport[]
}

export interface FiringCalibrationAcceptance {
  ok: boolean
  issues: string[]
  summaries: Array<{
    clubId: string
    clubName: string
    firingRate: number
  }>
}

const REQUIRED_SEEDS_PER_CLUB = 10_000
const REQUIRED_SEASONS = 6

const RATE_TARGETS = {
  club_heros: { minInclusive: 0.55, maxInclusive: 0.65 },
  club_soderfors: { maxExclusive: 0.50 },
  club_lesjofors: { maxExclusive: 0.50 },
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseReport(value: unknown): FiringCalibrationReport | null {
  if (!isRecord(value) || !isRecord(value.config) || !Array.isArray(value.clubs)) return null
  const config = value.config
  if (
    typeof config.seeds !== 'number'
    || typeof config.seasons !== 'number'
    || !Array.isArray(config.clubIds)
    || !config.clubIds.every(id => typeof id === 'string')
  ) return null
  return value as unknown as FiringCalibrationReport
}

/**
 * Maskinell dom av den frusna H4-acceptansen.
 *
 * Toppklubbens separata krav — att en WinLeague-klubb inte sparkas enbart
 * för en tredjeplats — är ett deterministiskt domäntest och ska inte gissas
 * ur Forsbackas aggregerade frekvens här.
 */
export function verifyFiringCalibrationReport(value: unknown): FiringCalibrationAcceptance {
  const report = parseReport(value)
  if (!report) return { ok: false, issues: ['Rapporten har ogiltigt schema.'], summaries: [] }

  const issues: string[] = []
  if (report.config.seeds !== REQUIRED_SEEDS_PER_CLUB) {
    issues.push(`Formell acceptans kräver ${REQUIRED_SEEDS_PER_CLUB} seeds per klubb; rapporten har ${report.config.seeds}.`)
  }
  if (report.config.seasons !== REQUIRED_SEASONS) {
    issues.push(`Formell acceptans kräver ${REQUIRED_SEASONS} säsonger; rapporten har ${report.config.seasons}.`)
  }

  const summaries: FiringCalibrationAcceptance['summaries'] = []
  for (const [clubId, target] of Object.entries(RATE_TARGETS)) {
    const club = report.clubs.find(candidate => candidate.clubId === clubId)
    if (!club) {
      issues.push(`Rapporten saknar ${clubId}.`)
      continue
    }

    if (club.requestedRuns !== report.config.seeds) {
      issues.push(`${club.clubName}: requestedRuns ${club.requestedRuns} matchar inte config.seeds ${report.config.seeds}.`)
    }
    if (club.validRuns !== club.requestedRuns) {
      issues.push(`${club.clubName}: bara ${club.validRuns}/${club.requestedRuns} körningar är giltiga.`)
    }
    if (club.crashes.length > 0) issues.push(`${club.clubName}: ${club.crashes.length} krascher.`)
    if ((club.reasons.unknown ?? 0) > 0 || club.unknownReasonSeeds.length > 0) {
      issues.push(`${club.clubName}: avsked med okänd orsak finns.`)
    }
    if (club.firingRate === null || !Number.isFinite(club.firingRate)) {
      issues.push(`${club.clubName}: firingRate saknas eller är ogiltig.`)
      continue
    }

    const derivedRate = club.validRuns > 0 ? club.firedRuns / club.validRuns : Number.NaN
    if (!Number.isFinite(derivedRate) || Math.abs(derivedRate - club.firingRate) > Number.EPSILON) {
      issues.push(`${club.clubName}: firingRate matchar inte firedRuns/validRuns.`)
    }

    if ('minInclusive' in target && club.firingRate < target.minInclusive) {
      issues.push(`${club.clubName}: ${(club.firingRate * 100).toFixed(2)} % är under målet 55–65 %.`)
    }
    if ('maxInclusive' in target && club.firingRate > target.maxInclusive) {
      issues.push(`${club.clubName}: ${(club.firingRate * 100).toFixed(2)} % är över målet 55–65 %.`)
    }
    if ('maxExclusive' in target && club.firingRate >= target.maxExclusive) {
      issues.push(`${club.clubName}: ${(club.firingRate * 100).toFixed(2)} % är inte under 50 %.`)
    }

    summaries.push({ clubId, clubName: club.clubName, firingRate: club.firingRate })
  }

  return { ok: issues.length === 0, issues, summaries }
}

