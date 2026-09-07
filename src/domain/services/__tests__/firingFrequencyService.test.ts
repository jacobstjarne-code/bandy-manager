import { describe, expect, it } from 'vitest'
import { ClubExpectation } from '../../enums'
import type { FiringAnalysisSave } from '../firingFrequencyService'
import { analyzeFiringFrequency, isFiringAnalysisSave, storedFiringReason } from '../firingFrequencyService'

function summary(
  id: string,
  season: number,
  profile: ClubExpectation,
  fired: boolean,
  firedReason?: 'boardPatience' | 'consecutiveFailures' | 'licenseDenied' | 'bankruptcy',
): FiringAnalysisSave['seasonSummaries'][number] {
  return {
    id,
    season,
    clubId: 'club-a',
    boardExpectation: profile,
    boardTruth: { relationship: { managerFired: fired, firedReason } },
  }
}

function save(overrides: Partial<FiringAnalysisSave> = {}): FiringAnalysisSave {
  return {
    id: 'save-1',
    currentSeason: 4,
    managedClubId: 'club-a',
    clubs: [{ id: 'club-a', boardExpectation: ClubExpectation.MidTable }],
    seasonSummaries: [],
    ...overrides,
  }
}

describe('analyzeFiringFrequency', () => {
  it('räknar manager-säsonger och avsked per den profil som faktiskt gällde', () => {
    const report = analyzeFiringFrequency([save({
      seasonSummaries: [
        summary('s1', 1, ClubExpectation.MidTable, false),
        summary('s2', 2, ClubExpectation.MidTable, false),
        summary('s3', 3, ClubExpectation.MidTable, true, 'boardPatience'),
      ],
      managerFired: true,
      firedAtSeason: 3,
    })])

    expect(report).toMatchObject({
      analyzedManagerSeasons: 3,
      firings: 1,
      firingRate: 1 / 3,
      terminalFiringsWithoutSeasonTruth: 0,
    })
    expect(report.rows[0]).toMatchObject({
      clubProfile: ClubExpectation.MidTable,
      observedManagerSeasons: 3,
      firings: 1,
      firingRate: 1 / 3,
      reasons: { boardPatience: 1 },
    })
  })

  it('håller klubbprofiler och avskedsorsaker isär', () => {
    const report = analyzeFiringFrequency([save({
      seasonSummaries: [
        summary('s1', 1, ClubExpectation.Survive, false),
        summary('s2', 2, ClubExpectation.AvoidBottom, true, 'licenseDenied'),
        summary('s3', 3, ClubExpectation.WinLeague, true, 'consecutiveFailures'),
      ],
    })])

    expect(report.rows.map(row => [row.clubProfile, row.firingRate])).toEqual([
      [ClubExpectation.Survive, 0],
      [ClubExpectation.AvoidBottom, 1],
      [ClubExpectation.WinLeague, 1],
    ])
    expect(report.rows[1].reasons.licenseDenied).toBe(1)
    expect(report.rows[2].reasons.consecutiveFailures).toBe(1)
  })

  it('exkluderar obelagda legacy-säsonger men räknar explicit konkurs mitt i säsongen', () => {
    const report = analyzeFiringFrequency([save({
      currentSeason: 3,
      seasonSummaries: [{
        id: 'legacy-s1', season: 1, clubId: 'club-a', boardExpectation: ClubExpectation.AvoidBottom,
      }],
      seasonStartBoardExpectation: ClubExpectation.AvoidBottom,
      managerFired: true,
      firedAtSeason: 3,
      firedReason: 'bankruptcy',
    })])

    expect(report.excludedUnknownHistoricalSeasons).toBe(1)
    expect(report.analyzedManagerSeasons).toBe(1)
    expect(report.terminalFiringsWithoutSeasonTruth).toBe(1)
    expect(report.rows[0]).toMatchObject({
      clubProfile: ClubExpectation.AvoidBottom,
      firings: 1,
      reasons: { bankruptcy: 1 },
    })
  })

  it('deduplicerar överlappande exporter av samma save och summary-id', () => {
    const first = save({ seasonSummaries: [summary('s1', 1, ClubExpectation.MidTable, false)] })
    const second = save({ seasonSummaries: [
      summary('s1', 1, ClubExpectation.MidTable, false),
      summary('s2', 2, ClubExpectation.MidTable, false),
    ] })
    const report = analyzeFiringFrequency([first, second])

    expect(report.totalRecords).toBe(3)
    expect(report.analyzedManagerSeasons).toBe(2)
    expect(report.excludedDuplicateRecords).toBe(1)
  })

  it('skapar inte en extra terminal post när ett avsked återkommer i överlappande exporter', () => {
    const firedSummary = summary('s3', 3, ClubExpectation.MidTable, true, 'boardPatience')
    const exported = save({ seasonSummaries: [firedSummary], managerFired: true, firedAtSeason: 3 })
    const report = analyzeFiringFrequency([exported, exported])

    expect(report.analyzedManagerSeasons).toBe(1)
    expect(report.firings).toBe(1)
    expect(report.terminalFiringsWithoutSeasonTruth).toBe(0)
    expect(report.excludedDuplicateRecords).toBe(1)
  })

  it('räknar inte en ännu pågående säsong som ett lyckat icke-avsked', () => {
    const report = analyzeFiringFrequency([save({ currentSeason: 1 })])
    expect(report.analyzedManagerSeasons).toBe(0)
    expect(report.firingRate).toBeNull()
  })

  it('validerar den minsta retrospektiva save-formen', () => {
    expect(isFiringAnalysisSave(save())).toBe(true)
    expect(isFiringAnalysisSave({ ...save(), clubs: [{ id: 'club-a', boardExpectation: 'godtycklig' }] })).toBe(false)
    expect(isFiringAnalysisSave({ ...save(), seasonSummaries: [{ season: 1, clubId: 'club-a' }] })).toBe(false)
  })
})

describe('storedFiringReason', () => {
  it('läser sportsligt avsked från den frusna styrelsedomen', () => {
    const game = save({
      currentSeason: 4,
      firedAtSeason: 3,
      managerFired: true,
      seasonSummaries: [
        summary('s2', 2, ClubExpectation.MidTable, false),
        summary('s3', 3, ClubExpectation.MidTable, true, 'consecutiveFailures'),
      ],
    })

    expect(storedFiringReason(game)).toBe('consecutiveFailures')
  })

  it('faller tillbaka till toppfältet för konkurs mitt i säsongen', () => {
    const game = save({
      currentSeason: 3,
      firedAtSeason: 3,
      managerFired: true,
      firedReason: 'bankruptcy',
      seasonSummaries: [summary('s2', 2, ClubExpectation.AvoidBottom, false)],
    })

    expect(storedFiringReason(game)).toBe('bankruptcy')
  })

  it('gissar inte från andra statefält när frusen orsak saknas', () => {
    const game = save({
      firedAtSeason: 4,
      managerFired: true,
      seasonSummaries: [summary('s4', 4, ClubExpectation.MidTable, true)],
    })

    expect(storedFiringReason(game)).toBeUndefined()
  })
})
