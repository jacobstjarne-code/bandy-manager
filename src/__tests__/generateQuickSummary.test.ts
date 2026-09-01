import { describe, it, expect } from 'vitest'
import { generateQuickSummary } from '../presentation/screens/granska/helpers'
import type { Fixture } from '../domain/entities/Fixture'
import { MatchEventType } from '../domain/enums'

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fx-1', leagueId: 'liga', season: 8, roundNumber: 10, matchday: 10,
    homeClubId: 'home', awayClubId: 'away', status: 'completed' as never,
    homeScore: 2, awayScore: 1, events: [],
    ...overrides,
  }
}

describe('generateQuickSummary — GRANSKA DEL 4 steg 4 (2026-08-11/12)', () => {
  it('liga (inga axlar skickade) — befintlig default-prosa, oförändrad', () => {
    const out = generateQuickSummary(makeFixture(), true, [])
    expect(out).toContain('seger')
  })

  it('cup, icke-final (skede satt men inte final) — samma default-prosa som liga', () => {
    const out = generateQuickSummary(makeFixture(), true, [], 'cup', 'kvartsfinal')
    expect(out).toContain('seger')
  })

  it('skede:final, vinst — delad text cup/slutspel', () => {
    expect(generateQuickSummary(makeFixture({ homeScore: 3, awayScore: 1 }), true, [], 'cup', 'final'))
      .toBe('Det var finalen. Ni tog den.')
    expect(generateQuickSummary(makeFixture({ homeScore: 3, awayScore: 1 }), true, [], 'slutspel', 'final'))
      .toBe('Det var finalen. Ni tog den.')
  })

  it('skede:final, förlust', () => {
    expect(generateQuickSummary(makeFixture({ homeScore: 1, awayScore: 3 }), true, [], 'cup', 'final'))
      .toBe('Det var finalen. Ni fick åka hem utan.')
  })

  it('skede:final, straffavgjord — rotorsaksfixen: lika på fullt slut ska INTE tolkas som "ej vinst"', () => {
    const fixture = makeFixture({ homeScore: 2, awayScore: 2, penaltyResult: { home: 4, away: 3 } })
    expect(generateQuickSummary(fixture, true, [], 'cup', 'final')).toBe('Det var finalen. Ni tog den.')
    expect(generateQuickSummary(fixture, false, [], 'cup', 'final')).toBe('Det var finalen. Ni fick åka hem utan.')
  })

  it('skede:final, förlängningsavgjord', () => {
    const fixture = makeFixture({ homeScore: 2, awayScore: 2, overtimeResult: 'away' })
    expect(generateQuickSummary(fixture, false, [], 'slutspel', 'final')).toBe('Det var finalen. Ni tog den.')
    expect(generateQuickSummary(fixture, true, [], 'slutspel', 'final')).toBe('Det var finalen. Ni fick åka hem utan.')
  })

  it('tavlingstyp:slutspel, icke-final — vinst/förlust', () => {
    expect(generateQuickSummary(makeFixture({ homeScore: 3, awayScore: 1 }), true, [], 'slutspel', 'kvartsfinal'))
      .toBe('Slutspel. Det märks på tempot.')
    expect(generateQuickSummary(makeFixture({ homeScore: 1, awayScore: 3 }), true, [], 'slutspel', 'kvartsfinal'))
      .toBe('Slutspel. En match till hade suttit fint.')
  })

  it('tavlingstyp:avsked, vinst/förlust', () => {
    expect(generateQuickSummary(makeFixture({ homeScore: 3, awayScore: 1 }), true, [], 'avsked', undefined))
      .toBe('Sista matchen på hemmaisen. Publiken stannade kvar efteråt.')
    expect(generateQuickSummary(makeFixture({ homeScore: 1, awayScore: 3 }), true, [], 'avsked', undefined))
      .toBe('Sista matchen på hemmaisen. Resultatet spelade mindre roll än vanligt.')
  })

  it('tavlingstyp:avsked, äkta oavgjort — tredje raden (2026-08-12)', () => {
    const out = generateQuickSummary(makeFixture({ homeScore: 2, awayScore: 2 }), true, [], 'avsked', undefined)
    expect(out).toBe('Sista matchen på hemmaisen. Oavgjort, och ingen brydde sig särskilt.')
  })

  it('default-prosan följer straffavgörandet i stället för råa 2–2', () => {
    const fixture = makeFixture({ homeScore: 2, awayScore: 2, wentToPenalties: true, penaltyResult: { home: 4, away: 3 } })
    expect(generateQuickSummary(fixture, true, [])).toContain('seger')
    expect(generateQuickSummary(fixture, false, [])).toContain('förlust')
  })

  it('målskyttsraden tar bara med den hanterade klubbens spelare', () => {
    const fixture = makeFixture({ events: [
      { type: MatchEventType.Goal, clubId: 'home', playerId: 'ours', minute: 12 },
      { type: MatchEventType.Goal, clubId: 'away', playerId: 'theirs', minute: 20 },
    ] as never })
    const players = [{ id: 'ours', lastName: 'Berg' }, { id: 'theirs', lastName: 'Borta' }] as never
    const out = generateQuickSummary(fixture, true, players)
    expect(out).toContain('Berg')
    expect(out).not.toContain('Borta')
  })

  it('minut 55 är inte längre slutminuter; minut 84 är det', () => {
    const at55 = makeFixture({ events: [{ type: MatchEventType.Goal, clubId: 'home', minute: 55 }] as never })
    const at84 = makeFixture({ events: [{ type: MatchEventType.Goal, clubId: 'home', minute: 84 }] as never })
    expect(generateQuickSummary(at55, true, [])).not.toContain('slutminuterna')
    expect(generateQuickSummary(at84, true, [])).toContain('slutminuterna')
  })
})
