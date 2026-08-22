import { describe, it, expect } from 'vitest'
import { shouldStopAutoLoopForPlayoffElimination, buildMultiWeekPeriod, clearDatedOffersAtSeasonEnd } from '../gameFlowActions'
import { hasManagedClubFutureFixture } from '../../../utils/nextActionCue'
import type { FinanceEntry } from '../../../../domain/services/economyService'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../domain/entities/Fixture'
import { FixtureStatus } from '../../../../domain/enums'

/**
 * High 3 (Skutskär-auditen, docs/incoming/bandy-manager-skutskaer-audit-52009671-2026-08-20.md):
 * advance()s auto-loop fortsatte genom resten av slutspelet direkt efter
 * att den hanterade klubben slogs ut. Granska visade fortfarande den just
 * spelade matchen, men flera veckors löner/världshändelser hade redan
 * summerats till en oförklarad "Ekonomi −100 tkr"-rad.
 */

describe('shouldStopAutoLoopForPlayoffElimination', () => {
  it('true när eliminering just inträffade denna advance (null → satt)', () => {
    const before = { lastPlayoffElimination: null }
    const after = { lastPlayoffElimination: { season: 1, round: 'quarterfinal' as never, opponentName: 'Västanfors', resultat: '1–3' } }
    expect(shouldStopAutoLoopForPlayoffElimination(before, after)).toBe(true)
  })

  it('false om ingen eliminering skett alls (null → null)', () => {
    expect(shouldStopAutoLoopForPlayoffElimination({ lastPlayoffElimination: null }, { lastPlayoffElimination: null })).toBe(false)
  })

  it('false om elimineringen redan hade skett INNAN denna advance (satt → satt, samma post) — annars stoppar loopen permanent hela säsongen', () => {
    const info = { season: 1, round: 'quarterfinal' as never, opponentName: 'Västanfors', resultat: '1–3' }
    expect(shouldStopAutoLoopForPlayoffElimination({ lastPlayoffElimination: info }, { lastPlayoffElimination: info })).toBe(false)
  })

  it('false om lastPlayoffElimination är undefined på båda (ingen slutspelshistorik ännu)', () => {
    expect(shouldStopAutoLoopForPlayoffElimination({ lastPlayoffElimination: undefined }, { lastPlayoffElimination: undefined })).toBe(false)
  })
})

describe('buildMultiWeekPeriod', () => {
  const log: FinanceEntry[] = [
    { round: 5, amount: 5000, reason: 'sponsor' as never, label: 'Sponsorintäkt' },
    { round: 6, amount: -3000, reason: 'wages' as never, label: 'Löner' },
    { round: 7, amount: -3000, reason: 'wages' as never, label: 'Löner' },
    { round: 8, amount: 1000, reason: 'attendance' as never, label: 'Matchintäkt' }, // utanför perioden
  ]

  it('undefined om ingen auto-loop körts (autoLoops=0)', () => {
    expect(buildMultiWeekPeriod(0, 5, 7, log)).toBeUndefined()
  })

  it('undefined om round-numren saknas', () => {
    expect(buildMultiWeekPeriod(2, null, 7, log)).toBeUndefined()
    expect(buildMultiWeekPeriod(2, 5, null, log)).toBeUndefined()
  })

  it('bygger fromRound/toRound och filtrerar financeLog till exakt perioden', () => {
    const period = buildMultiWeekPeriod(2, 5, 7, log)
    expect(period).toEqual({
      fromRound: 5,
      toRound: 7,
      financeLogEntries: [
        { round: 5, amount: 5000, label: 'Sponsorintäkt' },
        { round: 6, amount: -3000, label: 'Löner' },
        { round: 7, amount: -3000, label: 'Löner' },
      ],
    })
    // round 8-posten (utanför perioden) läcker inte in
    expect(period!.financeLogEntries.some(e => e.round === 8)).toBe(false)
  })
})

/**
 * Medium 5 (Skutskär-auditen, 2026-08-22): "Efter uttåget behövde jag
 * hantera spelar-/sponsorkort innan årsboken kunde öppnas." Ett kvarstående
 * sponsorerbjudande lovar veckointäkt över omgångar som inte längre spelas.
 */
function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'f', leagueId: 'L', season: 1, roundNumber: 1, matchday: 1,
    homeClubId: 'x', awayClubId: 'y', status: FixtureStatus.Scheduled, events: [],
    ...overrides,
  } as Fixture
}

function sponsorOfferEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 's1', type: 'sponsorOffer', title: 't', body: 'b',
    choices: [{ id: 'accept', label: 'A', effect: { type: 'noOp' } }],
    resolved: false,
    ...overrides,
  }
}

describe('hasManagedClubFutureFixture', () => {
  it('false när klubben inte har någon egen schemalagd match kvar (andra klubbars matcher räknas inte)', () => {
    const game = { managedClubId: 'managed', fixtures: [makeFixture({ homeClubId: 'other1', awayClubId: 'other2' })] } as SaveGame
    expect(hasManagedClubFutureFixture(game)).toBe(false)
  })

  it('true när klubben har en egen schemalagd match kvar', () => {
    const game = { managedClubId: 'managed', fixtures: [makeFixture({ homeClubId: 'managed', awayClubId: 'other' })] } as SaveGame
    expect(hasManagedClubFutureFixture(game)).toBe(true)
  })

  it('en COMPLETED egen match räknas inte som "kvar"', () => {
    const game = { managedClubId: 'managed', fixtures: [makeFixture({ homeClubId: 'managed', awayClubId: 'other', status: FixtureStatus.Completed })] } as SaveGame
    expect(hasManagedClubFutureFixture(game)).toBe(false)
  })
})

describe('clearDatedOffersAtSeasonEnd', () => {
  it('tar bort ett OBESVARAT sponsorOffer-event', () => {
    const result = clearDatedOffersAtSeasonEnd([sponsorOfferEvent()])
    expect(result).toEqual([])
  })

  it('rör INTE ett redan resolvat sponsorOffer-event', () => {
    const resolved = sponsorOfferEvent({ id: 's2', resolved: true })
    expect(clearDatedOffersAtSeasonEnd([resolved])).toEqual([resolved])
  })

  it('rör INTE andra event-typer', () => {
    const other: GameEvent = { id: 'o1', type: 'academyEvent', title: 't', body: 'b', choices: [], resolved: false }
    expect(clearDatedOffersAtSeasonEnd([other])).toEqual([other])
  })

  it('blandad kö: bara det obesvarade sponsorOffer-eventet försvinner', () => {
    const sponsor = sponsorOfferEvent()
    const resolved = sponsorOfferEvent({ id: 's3', resolved: true })
    const other: GameEvent = { id: 'o2', type: 'academyEvent', title: 't', body: 'b', choices: [], resolved: false }
    expect(clearDatedOffersAtSeasonEnd([sponsor, resolved, other])).toEqual([resolved, other])
  })
})
