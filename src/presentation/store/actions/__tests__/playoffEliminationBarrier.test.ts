import { describe, it, expect } from 'vitest'
import { shouldStopAutoLoopForPlayoffElimination, buildMultiWeekPeriod } from '../gameFlowActions'
import type { FinanceEntry } from '../../../../domain/services/economyService'

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
