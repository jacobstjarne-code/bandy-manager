import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { EventLedgerEntry } from '../../entities/Narrative'
import { academyEconomyYearbookLine, academyYearbookLines, latestLoanReturnAttribution, loanReturnAttribution } from '../academyLedgerPresentationService'

function loanEntry(overrides: Partial<EventLedgerEntry> = {}): EventLedgerEntry {
  return {
    type: 'loan_returned',
    semanticKey: 'loan_returned_p1_ext:test_s2025_m8',
    season: 2025,
    matchday: 8,
    clubId: 'club_forsbacka',
    subject: { kind: 'player', id: 'p1' },
    subject2: { kind: 'club', id: 'ext:test' },
    subjectSnapshot: { name: 'Torsten Isaksson' },
    subject2Snapshot: { name: 'Testklubben' },
    significance: 65,
    loan: { caAtStart: 43, caAtReturn: 54, loanBonus: 5, matches: 4, goals: 2, avgRating: 7.4 },
    ...overrides,
  }
}

describe('akademins liggarpresentation', () => {
  it('fryser domens ekonomirad ur samma driftpris och säsongens liggarutfall', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 2 })
    const game = {
      ...base,
      currentMatchday: 22,
      academyLevel: 'developing' as const,
      eventLedger: [
        {
          type: 'academy_upgrade_started', semanticKey: 'academy_upgrade_started_test', season: 2025, matchday: 4,
          clubId: base.managedClubId, subject: { kind: 'club', id: base.managedClubId }, significance: 40,
          academyUpgrade: { fromLevel: 'developing', toLevel: 'elite', costKr: 150_000, readySeason: 2026 },
        } satisfies EventLedgerEntry,
        {
          type: 'academy_promotion', semanticKey: 'academy_promotion_test', season: 2025, matchday: 8,
          clubId: base.managedClubId, subject: { kind: 'player', id: 'y1' }, significance: 40,
        } satisfies EventLedgerEntry,
        loanEntry(),
      ],
    }

    expect(academyEconomyYearbookLine(game)).toBe(
      'Akademin: 150 + 110 tkr. Gav 1 uppflyttade och 11 i utveckling.',
    )
  })

  it('skriver domens tre attributionsgrenar ordagrant ur returpayloaden', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 2 })
    expect(loanReturnAttribution(game, loanEntry())).toBe(
      'Torsten Isaksson tillbaka från Testklubben: 43→54. Lånet gav 5, träningen resten.',
    )
    expect(loanReturnAttribution(game, loanEntry({
      loan: { caAtStart: 43, caAtReturn: 46, loanBonus: 0, matches: 3, goals: 0, avgRating: 6.7 },
    }))).toBe(
      'Torsten Isaksson tillbaka från Testklubben: 43→46. Lånet gav inget mätbart — matcherna gjorde han ändå.',
    )
    expect(loanReturnAttribution(game, loanEntry({
      loan: { caAtStart: 43, caAtReturn: 43, loanBonus: 0, matches: 0, goals: 0, avgRating: 0 },
    }))).toBe(
      'Torsten Isaksson tillbaka från Testklubben. Ingen match, ingen utveckling. Fel lån.',
    )
  })

  it('läser senaste returen i Akademi-vyn och fryser högst tre årsboksrader efter significance', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 2 })
    const game = {
      ...base,
      eventLedger: [
        loanEntry(),
        loanEntry({ semanticKey: 'loan_returned_p2_ext:test_s2025_m9', matchday: 9, subjectSnapshot: { name: 'Senaste Spelaren' }, significance: 50 }),
        {
          type: 'youth_aged_out', semanticKey: 'youth_aged_out_y1_s2025', season: 2025, matchday: 22,
          clubId: base.managedClubId, subject: { kind: 'player', id: 'y1' }, subjectSnapshot: { name: 'Ung Talang' },
          significance: 60, youthAgedOut: { outcome: 'released', stars: 3, caAtExit: 29 },
        } satisfies EventLedgerEntry,
        {
          type: 'youth_intake', semanticKey: 'youth_intake_club_forsbacka_s2025_summer', season: 2025, matchday: 22,
          clubId: base.managedClubId, subject: { kind: 'club', id: base.managedClubId }, significance: 35,
          youthIntake: { count: 5, academyLevel: 'basic', source: 'summer' },
        } satisfies EventLedgerEntry,
      ],
    }

    expect(latestLoanReturnAttribution(game)).toContain('Senaste Spelaren tillbaka från Testklubben')
    expect(academyYearbookLines(game)).toEqual([
      'Torsten Isaksson tillbaka från Testklubben: 43→54. Lånet gav 5, träningen resten.',
      'Ung Talang, 3 stjärnor, lämnade akademin vid tjugo års ålder.',
      'Senaste Spelaren tillbaka från Testklubben: 43→54. Lånet gav 5, träningen resten.',
    ])
  })

  it('böjer en ensam akademistjärna i singular', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 2 })
    const game = {
      ...base,
      eventLedger: [{
        type: 'youth_aged_out', semanticKey: 'youth_aged_out_y1_s2025', season: 2025, matchday: 22,
        clubId: base.managedClubId, subject: { kind: 'player', id: 'y1' }, subjectSnapshot: { name: 'Filip Dahlberg' },
        significance: 60, youthAgedOut: { outcome: 'released', stars: 1, caAtExit: 29 },
      } satisfies EventLedgerEntry],
    }

    expect(academyYearbookLines(game)).toEqual([
      'Filip Dahlberg, 1 stjärna, lämnade akademin vid tjugo års ålder.',
    ])
  })
})
