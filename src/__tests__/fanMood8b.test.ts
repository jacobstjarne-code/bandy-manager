/**
 * §B (8b) — fanMood som egen mätare till orten-paritet.
 * Låser: drift mot 50 (3 %/omg), diminishing returns på positivt delta,
 * oavgjort = 0, negativa delta opåverkade. Speglar communityProcessor-pulsen.
 */
import { describe, it, expect } from 'vitest'
import { processNarrative } from '../application/useCases/processors/narrativeProcessor'
import { createNewGame } from '../application/useCases/createNewGame'
import { FixtureStatus } from '../domain/enums'

const base = createNewGame({ managerName: 'T', clubId: 'club_forsbacka', season: 2025, seed: 5 })
const me = base.managedClubId
const rand = () => 0.5
const g = (fanMood: number) => ({ ...base, fanMood })
const homeFixture = (my: number, their: number) =>
  ({
    id: 'fx', homeClubId: me, awayClubId: base.clubs.find(c => c.id !== me)!.id,
    homeScore: my, awayScore: their, status: FixtureStatus.PLAYED, events: [],
    matchday: 1, roundNumber: 1, isCup: false, isPlayoff: false,
  }) as never

const run = (fanMood: number, fx: ReturnType<typeof homeFixture> | null) =>
  processNarrative(g(fanMood), fx, 5, '2026-01-01', rand).fanMood

describe('8b fanMood orten-paritet', () => {
  it('driftar 3 % mot 50 varje omgång utan match', () => {
    expect(run(80, null)).toBeCloseTo(79.1, 5)   // -0.9
    expect(run(50, null)).toBeCloseTo(50, 5)      // ankaret rör sig inte
    expect(run(20, null)).toBeCloseTo(20.9, 5)    // +0.9
  })

  it('diminishing returns: vinst lyfter mindre ju högre nivån', () => {
    const at50 = run(50, homeFixture(2, 1)) - 50   // full +4 (drift 0)
    const at75 = run(75, homeFixture(2, 1)) - 75   // ×0.5 minus drift
    const at90 = run(90, homeFixture(2, 1)) - 90   // ×0.25, drift dominerar
    expect(at50).toBeCloseTo(4, 5)
    expect(at75).toBeLessThan(at50)
    expect(at90).toBeLessThan(0)                   // vid taket vänder en vinst nedåt
  })

  it('oavgjort ger 0 — bara driften kvar', () => {
    expect(run(60, homeFixture(2, 2))).toBeCloseTo(59.7, 5)  // = ren drift
  })

  it('förlust biter fullt på alla nivåer (ej dimmad)', () => {
    expect(run(50, homeFixture(0, 2))).toBeCloseTo(46, 5)        // -4
    expect(run(90, homeFixture(0, 2))).toBeCloseTo(84.8, 5)      // -4 + drift -1.2
  })
})
