import { describe, it, expect } from 'vitest'
import { buildLicenseEventLedgerEntry } from '../clubHistoryLedgerService'

describe('buildLicenseEventLedgerEntry — liggare-ny-license-event', () => {
  it('bygger en license_event-post med stabil semanticKey och payload', () => {
    const entry = buildLicenseEventLedgerEntry({
      clubId: 'club_x',
      season: 2026,
      matchday: 22,
      status: 'first_warning',
      deficitKr: 15000,
    })

    expect(entry).toEqual({
      type: 'license_event',
      semanticKey: 'license_event_club_x_s2026',
      season: 2026,
      matchday: 22,
      clubId: 'club_x',
      subject: { kind: 'club', id: 'club_x' },
      significance: 50,
      licenseEvent: { status: 'first_warning', deficitKr: 15000 },
    })
  })

  it('significance-trappan: first_warning/cleared 50, point_deduction 75, license_denied 95', () => {
    const warning = buildLicenseEventLedgerEntry({ clubId: 'c', season: 1, matchday: 1, status: 'first_warning' })
    const cleared = buildLicenseEventLedgerEntry({ clubId: 'c', season: 1, matchday: 1, status: 'cleared' })
    const deduction = buildLicenseEventLedgerEntry({ clubId: 'c', season: 1, matchday: 1, status: 'point_deduction', pointsDeducted: 3 })
    const denied = buildLicenseEventLedgerEntry({ clubId: 'c', season: 1, matchday: 1, status: 'license_denied' })

    expect(warning.significance).toBe(50)
    expect(cleared.significance).toBe(50)
    expect(deduction.significance).toBe(75)
    expect(denied.significance).toBe(95)
  })

  it('deficitKr och pointsDeducted saknas helt (inte undefined-nyckel) när de inte anges', () => {
    const entry = buildLicenseEventLedgerEntry({ clubId: 'c', season: 1, matchday: 1, status: 'cleared' })
    expect(entry.licenseEvent).toEqual({ status: 'cleared' })
    expect('deficitKr' in (entry.licenseEvent ?? {})).toBe(false)
    expect('pointsDeducted' in (entry.licenseEvent ?? {})).toBe(false)
  })
})
