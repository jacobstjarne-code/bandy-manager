/**
 * A-M2 (SEXSÄSONGSAUDITEN 2026-08-26): "Ni är utslagna" visades även för
 * klubbar som ALDRIG kvalificerade sig för slutspelet (inte bara de som
 * spelade och förlorade en kvartsfinal). Se qfSummaryStatus.ts för rotorsak.
 */
import { describe, it, expect } from 'vitest'
import { getQFSummaryStatus } from '../qfSummaryStatus'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'

function makeSeries(overrides: Partial<PlayoffSeries> = {}): PlayoffSeries {
  return {
    id: 'qf1',
    round: 'quarterFinal',
    homeClubId: 'managed',
    awayClubId: 'opp',
    fixtures: [],
    homeWins: 0,
    awayWins: 0,
    winnerId: null,
    loserId: null,
    ...overrides,
  } as PlayoffSeries
}

describe('getQFSummaryStatus', () => {
  it('managed club var aldrig i kvartsfinalsbraketten → never_qualified (inte "eliminated")', () => {
    const qfMatchups = [makeSeries({ id: 'qf1', homeClubId: 'other1', awayClubId: 'other2', winnerId: 'other1', loserId: 'other2' })]
    expect(getQFSummaryStatus(qfMatchups, 'managed')).toBe('never_qualified')
  })

  it('managed club spelade och förlorade kvartsfinalen → eliminated', () => {
    const qfMatchups = [makeSeries({ homeClubId: 'managed', awayClubId: 'opp', winnerId: 'opp', loserId: 'managed' })]
    expect(getQFSummaryStatus(qfMatchups, 'managed')).toBe('eliminated')
  })

  it('managed club spelade och vann kvartsfinalen → advanced', () => {
    const qfMatchups = [makeSeries({ homeClubId: 'managed', awayClubId: 'opp', winnerId: 'managed', loserId: 'opp' })]
    expect(getQFSummaryStatus(qfMatchups, 'managed')).toBe('advanced')
  })

  it('tom bracket (t.ex. inget slutspel genererat än) → never_qualified', () => {
    expect(getQFSummaryStatus([], 'managed')).toBe('never_qualified')
  })
})
