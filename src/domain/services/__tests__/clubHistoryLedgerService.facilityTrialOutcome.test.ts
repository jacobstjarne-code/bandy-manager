import { describe, it, expect } from 'vitest'
import { buildFacilityTrialOutcomeLedgerEntry } from '../clubHistoryLedgerService'

describe('buildFacilityTrialOutcomeLedgerEntry — liggare-ny-facility-trial-outcome', () => {
  it('bygger en facility_trial_outcome-post med stabil semanticKey och payload', () => {
    const entry = buildFacilityTrialOutcomeLedgerEntry({
      clubId: 'club_x',
      season: 2026,
      matchday: 15,
      stage: 'bordlagd',
      outcome: 'bordlagd',
      support: 47,
    })

    expect(entry).toEqual({
      type: 'facility_trial_outcome',
      semanticKey: 'facility_trial_outcome_club_x_s2026',
      season: 2026,
      matchday: 15,
      clubId: 'club_x',
      subject: { kind: 'club', id: 'club_x' },
      significance: 50,
      facilityTrialOutcome: { stage: 'bordlagd', outcome: 'bordlagd', support: 47 },
    })
  })

  it('significance: bara ren röstningsbordläggning stannar på 50, alla andra utfall väger 65', () => {
    const tabled = buildFacilityTrialOutcomeLedgerEntry({ clubId: 'c', season: 1, matchday: 1, stage: 'bordlagd', outcome: 'bordlagd', support: 50 })
    const voteFailed = buildFacilityTrialOutcomeLedgerEntry({ clubId: 'c', season: 1, matchday: 1, stage: 'nedlagd', outcome: 'nedlagd_fall', support: 30 })
    const selfAbandoned = buildFacilityTrialOutcomeLedgerEntry({ clubId: 'c', season: 1, matchday: 1, stage: 'nedlagd', outcome: 'nedlagd_egen', support: 50 })
    const municipalityNo = buildFacilityTrialOutcomeLedgerEntry({ clubId: 'c', season: 1, matchday: 1, stage: 'bordlagd', outcome: 'kommun_nej', support: 45 })
    const noBacker = buildFacilityTrialOutcomeLedgerEntry({ clubId: 'c', season: 1, matchday: 1, stage: 'nedlagd', outcome: 'nedlagd_ingen_finansiering', support: 55 })

    expect(tabled.significance).toBe(50)
    expect(voteFailed.significance).toBe(65)
    expect(selfAbandoned.significance).toBe(65)
    expect(municipalityNo.significance).toBe(65)
    expect(noBacker.significance).toBe(65)
  })
})
