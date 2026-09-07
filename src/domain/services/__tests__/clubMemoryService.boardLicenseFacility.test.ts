import { describe, expect, it } from 'vitest'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { ClubExpectation } from '../../enums'
import { buildMemoryEventFromLedger } from '../clubMemoryService'

const CLUB_ID = 'club_a'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'save_test', managedClubId: CLUB_ID, currentSeason: 3, currentMatchday: 10,
    currentDate: '2028-12-10', clubs: Array.from({ length: 12 }, (_, i) => ({ id: `club_${i}` })),
    players: [], fixtures: [], standings: [],
    inbox: [], pendingEvents: [], playoffBracket: null, ledgerTold: {}, eventLedger: [],
    seasonSummaries: [],
    ...overrides,
  } as unknown as SaveGame
}

function baseEntry(overrides: Partial<EventLedgerEntry> = {}): EventLedgerEntry {
  return {
    type: 'board_verdict',
    semanticKey: 'x',
    clubId: CLUB_ID,
    season: 2,
    matchday: 22,
    subject: { kind: 'club', id: CLUB_ID },
    significance: 60,
    ...overrides,
  } as EventLedgerEntry
}

describe('Krönikan/Berättaren — board_verdict DEL 2(b) (ingen ny prosa, återanvänder boardService.ts)', () => {
  it('bygger texten av seasonVerdictText + seasonVerdictZoneLine på POSTENS EGEN säsongs boardTruth', () => {
    const entry = baseEntry({
      season: 2,
      boardVerdict: { verdict: 'exceeded', objectiveStatus: 'met', patienceBand: 'stabilt' },
    })
    const game = makeGame({
      currentSeason: 5, // annan säsong än posten — bevisar att live-state ignoreras
      seasonSummaries: [{
        id: 's2', season: 2, clubId: CLUB_ID,
        boardTruth: {
          statedGoal: { expectation: ClubExpectation.WinLeague, anchorPosition: 1, label: 'Vinna ligan' },
          outcome: { finalPosition: 1, rating: 5, verdict: 'exceeded', isChampion: true },
          relationship: { boardPatienceAfter: 80, zone: 'stabilt', consecutiveFailuresAfter: 0, managerFired: false },
        },
      }] as unknown as SaveGame['seasonSummaries'],
    })
    const memory = buildMemoryEventFromLedger(game, entry, CLUB_ID)
    expect(memory?.text).toBe('Styrelsen hade inte väntat sig det här. Ni har vårt förtroende.')
  })

  it('ingen matchande seasonSummary → ingen mening hellre än falsk', () => {
    const entry = baseEntry({ season: 9, boardVerdict: { verdict: 'met', objectiveStatus: 'met', patienceBand: 'stabilt' } })
    expect(buildMemoryEventFromLedger(makeGame({ seasonSummaries: [] }), entry, CLUB_ID)).toBeNull()
  })
})

describe('Krönikan/Berättaren — license_event DEL 2 (återanvänder licensbrevets inboxpost ordagrant)', () => {
  it('läser inbox_license_status_{season} rubrik+kropp', () => {
    const entry = baseEntry({
      type: 'license_event', season: 4,
      licenseEvent: { status: 'point_deduction', deficitKr: -120000, pointsDeducted: 3 },
    })
    const game = makeGame({
      inbox: [{
        id: 'inbox_license_status_4', date: '2028-06-01', type: 'license_review',
        title: 'Licensnämnden: poängavdrag', body: 'Klubben fick tre poängs avdrag efter underskottet.', isRead: true,
      }] as unknown as SaveGame['inbox'],
    })
    expect(buildMemoryEventFromLedger(game, entry, CLUB_ID)?.text)
      .toBe('Klubben fick tre poängs avdrag efter underskottet.')
  })

  it('rensad/saknad inboxpost → ingen mening hellre än falsk', () => {
    const entry = baseEntry({ type: 'license_event', season: 4, licenseEvent: { status: 'cleared' } })
    expect(buildMemoryEventFromLedger(makeGame({ inbox: [] }), entry, CLUB_ID)).toBeNull()
  })
})

describe('Krönikan/Berättaren — facility_trial_outcome DEL 2 (återanvänder PROVNING_RESOLUTION ordagrant)', () => {
  it('nedlagd_egen: samma text som kafferums-ekot', () => {
    const entry = baseEntry({
      type: 'facility_trial_outcome',
      facilityTrialOutcome: { stage: 'nedlagd', outcome: 'nedlagd_egen', support: 40 },
    })
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)?.text)
      .toBe('Du la ner frågan själv. Västra Sidan noterade det. Sånt glöms inte — på det bra sättet.')
  })

  it('kommun_nej: samma text som kafferums-ekot', () => {
    const entry = baseEntry({
      type: 'facility_trial_outcome',
      facilityTrialOutcome: { stage: 'nedlagd', outcome: 'kommun_nej', support: 20 },
    })
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)?.text)
      .toBe('Kommunen sa nej. Inte till hallen. Till oss.')
  })

  it('nedlagd_ingen_finansiering saknar egen låst text → ingen mening hellre än falsk', () => {
    const entry = baseEntry({
      type: 'facility_trial_outcome',
      facilityTrialOutcome: { stage: 'nedlagd', outcome: 'nedlagd_ingen_finansiering', support: 10 },
    })
    expect(buildMemoryEventFromLedger(makeGame(), entry, CLUB_ID)).toBeNull()
  })
})
