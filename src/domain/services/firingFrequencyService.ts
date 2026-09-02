import { ClubExpectation } from '../enums'

export type FiringReason = 'boardPatience' | 'consecutiveFailures' | 'licenseDenied' | 'bankruptcy' | 'unknown'

interface FiringSeasonSummary {
  id?: string
  season: number
  clubId: string
  boardExpectation: ClubExpectation
  boardTruth?: {
    relationship: {
      managerFired: boolean
      firedReason?: Exclude<FiringReason, 'unknown'>
    }
  }
}

export interface FiringAnalysisSave {
  id: string
  currentSeason: number
  managedClubId: string
  clubs: Array<{ id: string; boardExpectation: ClubExpectation }>
  seasonSummaries: FiringSeasonSummary[]
  seasonStartBoardExpectation?: ClubExpectation
  managerFired?: boolean
  firedAtSeason?: number
  firedReason?: Exclude<FiringReason, 'unknown'>
}

export interface FiringFrequencyRow {
  clubProfile: ClubExpectation
  observedManagerSeasons: number
  firings: number
  firingRate: number
  reasons: Record<FiringReason, number>
}

export interface FiringFrequencyReport {
  rows: FiringFrequencyRow[]
  totalRecords: number
  analyzedManagerSeasons: number
  firings: number
  firingRate: number | null
  excludedUnknownHistoricalSeasons: number
  excludedDuplicateRecords: number
  terminalFiringsWithoutSeasonTruth: number
}

const EXPECTATION_ORDER: ClubExpectation[] = [
  ClubExpectation.Survive,
  ClubExpectation.AvoidBottom,
  ClubExpectation.MidTable,
  ClubExpectation.ChallengeTop,
  ClubExpectation.WinLeague,
]
const EXPECTATIONS = new Set<string>(EXPECTATION_ORDER)
const FIRING_REASONS = new Set<string>([
  'boardPatience', 'consecutiveFailures', 'licenseDenied', 'bankruptcy',
])

function emptyReasons(): Record<FiringReason, number> {
  return {
    boardPatience: 0,
    consecutiveFailures: 0,
    licenseDenied: 0,
    bankruptcy: 0,
    unknown: 0,
  }
}

/**
 * U9 — retrospektiv avskedsfrekvens ur riktiga save-exporter.
 *
 * En observation är en avslutad tränarsäsong vars SeasonSummary.boardTruth
 * explicit säger om tränaren avskedades. Det ger både rätt nämnare och den
 * boardExpectation som faktiskt gällde den säsongen; klubbens live-värde kan
 * redan ha stegats inför nästa år. Ett explicit top-level managerFired utan
 * motsvarande boardTruth räknas som en terminal del-säsong (t.ex. konkurs).
 * Äldre summaries utan fruset utfall exkluderas i stället för att antas vara
 * lyckade. Överlappande exporter dedupliceras på save + summary-identitet.
 */
export function analyzeFiringFrequency(saves: readonly FiringAnalysisSave[]): FiringFrequencyReport {
  const seen = new Set<string>()
  const rows = new Map<ClubExpectation, { seasons: number; firings: number; reasons: Record<FiringReason, number> }>()
  let totalRecords = 0
  let analyzedManagerSeasons = 0
  let firings = 0
  let excludedUnknownHistoricalSeasons = 0
  let excludedDuplicateRecords = 0
  let terminalFiringsWithoutSeasonTruth = 0

  const record = (profile: ClubExpectation, fired: boolean, reason?: Exclude<FiringReason, 'unknown'>) => {
    analyzedManagerSeasons++
    const row = rows.get(profile) ?? { seasons: 0, firings: 0, reasons: emptyReasons() }
    row.seasons++
    if (fired) {
      firings++
      row.firings++
      row.reasons[reason ?? 'unknown']++
    }
    rows.set(profile, row)
  }

  for (const save of saves) {
    let terminalFiringCovered = false

    for (const summary of save.seasonSummaries) {
      totalRecords++
      const relationship = summary.boardTruth?.relationship
      if (relationship?.managerFired
        && summary.clubId === save.managedClubId
        && (save.firedAtSeason === undefined || summary.season === save.firedAtSeason)) {
        // Måste sättas även när samma summary redan sågs i en tidigare
        // export; annars skulle den senare exportens top-level-flagga skapa
        // en falsk extra terminal observation.
        terminalFiringCovered = true
      }
      const summaryIdentity = summary.id ?? `${summary.season}\u0000${summary.clubId}`
      const dedupeKey = `${save.id}\u0000summary\u0000${summaryIdentity}`
      if (seen.has(dedupeKey)) {
        excludedDuplicateRecords++
        continue
      }
      seen.add(dedupeKey)

      if (relationship === undefined) {
        excludedUnknownHistoricalSeasons++
        continue
      }

      record(summary.boardExpectation, relationship.managerFired, relationship.firedReason)
    }

    if (save.managerFired === true && !terminalFiringCovered) {
      totalRecords++
      const season = save.firedAtSeason ?? save.currentSeason
      const terminalKey = `${save.id}\u0000terminal\u0000${season}\u0000${save.managedClubId}`
      if (seen.has(terminalKey)) {
        excludedDuplicateRecords++
        continue
      }
      seen.add(terminalKey)

      const matchingSummary = [...save.seasonSummaries]
        .reverse()
        .find(summary => summary.clubId === save.managedClubId && summary.season === season)
      const liveClub = save.clubs.find(club => club.id === save.managedClubId)
      const profile = matchingSummary?.boardExpectation
        ?? save.seasonStartBoardExpectation
        ?? liveClub?.boardExpectation
      if (profile === undefined) {
        excludedUnknownHistoricalSeasons++
        continue
      }
      record(profile, true, save.firedReason)
      terminalFiringsWithoutSeasonTruth++
    }
  }

  const reportRows = EXPECTATION_ORDER
    .filter(profile => rows.has(profile))
    .map((profile): FiringFrequencyRow => {
      const row = rows.get(profile)!
      return {
        clubProfile: profile,
        observedManagerSeasons: row.seasons,
        firings: row.firings,
        firingRate: row.firings / row.seasons,
        reasons: row.reasons,
      }
    })

  return {
    rows: reportRows,
    totalRecords,
    analyzedManagerSeasons,
    firings,
    firingRate: analyzedManagerSeasons > 0 ? firings / analyzedManagerSeasons : null,
    excludedUnknownHistoricalSeasons,
    excludedDuplicateRecords,
    terminalFiringsWithoutSeasonTruth,
  }
}

function isExpectation(value: unknown): value is ClubExpectation {
  return typeof value === 'string' && EXPECTATIONS.has(value)
}

function isFiringReason(value: unknown): value is Exclude<FiringReason, 'unknown'> {
  return typeof value === 'string' && FIRING_REASONS.has(value)
}

export function isFiringAnalysisSave(value: unknown): value is FiringAnalysisSave {
  if (typeof value !== 'object' || value === null) return false
  const save = value as Record<string, unknown>
  if (typeof save.id !== 'string' || typeof save.currentSeason !== 'number'
    || typeof save.managedClubId !== 'string' || !Array.isArray(save.clubs)
    || !Array.isArray(save.seasonSummaries)) return false
  if (save.managerFired !== undefined && typeof save.managerFired !== 'boolean') return false
  if (save.firedAtSeason !== undefined && typeof save.firedAtSeason !== 'number') return false
  if (save.firedReason !== undefined && !isFiringReason(save.firedReason)) return false
  if (save.seasonStartBoardExpectation !== undefined && !isExpectation(save.seasonStartBoardExpectation)) return false

  const validClubs = save.clubs.every(value => {
    if (typeof value !== 'object' || value === null) return false
    const club = value as Record<string, unknown>
    return typeof club.id === 'string' && isExpectation(club.boardExpectation)
  })
  const validSummaries = save.seasonSummaries.every(value => {
    if (typeof value !== 'object' || value === null) return false
    const summary = value as Record<string, unknown>
    if (summary.id !== undefined && typeof summary.id !== 'string') return false
    if (typeof summary.season !== 'number' || typeof summary.clubId !== 'string'
      || !isExpectation(summary.boardExpectation)) return false
    if (summary.boardTruth === undefined) return true
    if (typeof summary.boardTruth !== 'object' || summary.boardTruth === null) return false
    const relationship = (summary.boardTruth as Record<string, unknown>).relationship
    if (typeof relationship !== 'object' || relationship === null) return false
    const relation = relationship as Record<string, unknown>
    return typeof relation.managerFired === 'boolean'
      && (relation.firedReason === undefined || isFiringReason(relation.firedReason))
  })
  return validClubs && validSummaries
}
