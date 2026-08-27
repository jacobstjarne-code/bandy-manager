/**
 * decisionFatigueService — tester för getFatigueState
 *
 * Regression för SEXSÄSONGSAUDITEN 2026-08-26, M4: "Beslutsbördan säger
 * 'Lugn' trots en överfull upplevelse". Rotorsak: getFatigueState räknade
 * bara deferredDecisions.length — ignorerade helt aktiva pendingEvents
 * (max 3, alltid obesvarade tills spelaren agerar). En spelare med 3
 * aktiva + 2-4 köade (5-7 obesvarade beslut totalt) såg "Lugn" eftersom
 * bara deferred-delen (2-4) jämfördes mot varm/het-trösklarna (5/7).
 *
 * Fix: måttet räknar nu OBESVARADE beslut = aktiva + köade.
 */

import { describe, it, expect } from 'vitest'
import { getFatigueState } from '../domain/services/decisionFatigueService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { GameEvent } from '../domain/entities/GameEvent'

function makeEvent(id: string): GameEvent {
  return {
    id,
    type: 'community_goodwill',
    title: `Event ${id}`,
    body: 'Test event',
    date: '2026-10-01',
    resolved: false,
    choices: [{ id: 'c1', text: 'Ja' }],
  } as unknown as GameEvent
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_a',
    currentDate: '2026-10-15',
    currentSeason: 2,
    currentMatchday: 5,
    clubs: [],
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [],
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    deferredDecisions: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

describe('getFatigueState', () => {
  it('är calm/0 utan aktiva eller köade beslut', () => {
    const game = makeGame({ pendingEvents: [], deferredDecisions: [] })
    expect(getFatigueState(game)).toEqual({ meter: 0, pressure: 'calm' })
  })

  it('räknar bara deferred, blir calm om aktiv-kön är tom (regressionsskydd, oförändrat beteende)', () => {
    const game = makeGame({
      pendingEvents: [],
      deferredDecisions: [makeEvent('d1'), makeEvent('d2')],
    })
    expect(getFatigueState(game).pressure).toBe('calm')
  })

  it('BUGFIX M4: 3 aktiva + 2 köade (5 obesvarade) blir warm, inte calm', () => {
    const game = makeGame({
      pendingEvents: [makeEvent('a'), makeEvent('b'), makeEvent('c')],
      deferredDecisions: [makeEvent('d1'), makeEvent('d2')],
    })
    const state = getFatigueState(game)
    expect(state.pressure).toBe('warm')
    expect(state.meter).toBeGreaterThan(0)
  })

  it('BUGFIX M4: 3 aktiva + 4 köade (7 obesvarade) blir hot', () => {
    const game = makeGame({
      pendingEvents: [makeEvent('a'), makeEvent('b'), makeEvent('c')],
      deferredDecisions: [makeEvent('d1'), makeEvent('d2'), makeEvent('d3'), makeEvent('d4')],
    })
    expect(getFatigueState(game).pressure).toBe('hot')
  })

  it('resolved pendingEvents räknas inte som aktiva (obesvarade = ej resolved, choices finns)', () => {
    const game = makeGame({
      pendingEvents: [
        { ...makeEvent('a'), resolved: true },
        { ...makeEvent('b'), resolved: true },
      ] as never,
      deferredDecisions: [makeEvent('d1')],
    })
    expect(getFatigueState(game).pressure).toBe('calm')
  })

  it('hög ålder på ett köat beslut ger warm/hot även med få obesvarade totalt', () => {
    const game = makeGame({
      currentMatchday: 10,
      pendingEvents: [],
      deferredDecisions: [{ ...makeEvent('old'), deferredAt: 4 } as never],
    })
    // ålder 6 >= 5 → hot, trots att totalt bara 1 obesvarat beslut finns
    expect(getFatigueState(game).pressure).toBe('hot')
  })
})
