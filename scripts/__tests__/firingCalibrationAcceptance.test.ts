import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  type FiringCalibrationReport,
  verifyFiringCalibrationReport,
} from '../firing-calibration-acceptance'

const formalReportPath = resolve(
  process.cwd(),
  'docs/matningar/AVSKEDSKALIBRERING_FORMELL_10000_2026-09-07.json',
)

function formalReport(): FiringCalibrationReport {
  return JSON.parse(readFileSync(formalReportPath, 'utf8')) as FiringCalibrationReport
}

describe('verifyFiringCalibrationReport', () => {
  it('godkänner den formella 10 000-seedsmätningen', () => {
    const result = verifyFiringCalibrationReport(formalReport())

    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('underkänner ett litet diagnostiskt sample även om frekvenserna träffar', () => {
    const report = formalReport()
    report.config.seeds = 20
    for (const club of report.clubs) {
      club.requestedRuns = 20
      club.validRuns = 20
      club.firedRuns = Math.round((club.firingRate ?? 0) * 20)
      club.firingRate = club.firedRuns / club.validRuns
    }

    const result = verifyFiringCalibrationReport(report)

    expect(result.ok).toBe(false)
    expect(result.issues).toContain('Formell acceptans kräver 10000 seeds per klubb; rapporten har 20.')
  })

  it('låser Heros till 55–65 procent, inklusive ändpunkterna', () => {
    const lower = formalReport()
    const lowerHeros = lower.clubs.find(club => club.clubId === 'club_heros')!
    lowerHeros.firedRuns = 5_500
    lowerHeros.firingRate = 0.55
    expect(verifyFiringCalibrationReport(lower).ok).toBe(true)

    const upper = formalReport()
    const upperHeros = upper.clubs.find(club => club.clubId === 'club_heros')!
    upperHeros.firedRuns = 6_500
    upperHeros.firingRate = 0.65
    expect(verifyFiringCalibrationReport(upper).ok).toBe(true)

    const outside = formalReport()
    const outsideHeros = outside.clubs.find(club => club.clubId === 'club_heros')!
    outsideHeros.firedRuns = 6_501
    outsideHeros.firingRate = 0.6501
    expect(verifyFiringCalibrationReport(outside).issues).toContain('Heros: 65.01 % är över målet 55–65 %.')
  })

  it('kräver strikt under 50 procent för båda mittklubbarna', () => {
    for (const clubId of ['club_soderfors', 'club_lesjofors']) {
      const report = formalReport()
      const club = report.clubs.find(candidate => candidate.clubId === clubId)!
      club.firedRuns = 5_000
      club.firingRate = 0.50

      const result = verifyFiringCalibrationReport(report)

      expect(result.ok).toBe(false)
      expect(result.issues.some(issue => issue.startsWith(`${club.clubName}: 50.00 %`))).toBe(true)
    }
  })

  it('underkänner ofullständiga körningar, krascher och okända orsaker', () => {
    const report = formalReport()
    const heros = report.clubs.find(club => club.clubId === 'club_heros')!
    heros.validRuns = 9_999
    heros.crashes.push({ seed: 99_999 })
    heros.reasons.unknown = 1
    heros.unknownReasonSeeds.push(99_998)

    const result = verifyFiringCalibrationReport(report)

    expect(result.ok).toBe(false)
    expect(result.issues).toContain('Heros: bara 9999/10000 körningar är giltiga.')
    expect(result.issues).toContain('Heros: 1 krascher.')
    expect(result.issues).toContain('Heros: avsked med okänd orsak finns.')
  })
})
