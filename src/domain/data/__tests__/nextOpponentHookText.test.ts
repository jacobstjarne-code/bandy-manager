import { describe, it, expect } from 'vitest'
import { buildNextOpponentHook } from '../nextOpponentHookText'
import type { NextOpponentTeaserFacts } from '../../services/nextOpponentTeaserService'

function makeFacts(overrides: Partial<NextOpponentTeaserFacts> = {}): NextOpponentTeaserFacts {
  return {
    opponentName: 'Testklubben IF',
    opponentShortName: 'Testklubben',
    isHome: true,
    matchday: 10,
    date: '2026-01-10',
    opponentForm: ['V', 'V', 'F', 'O', 'V'],
    opponentLeaguePosition: 5,
    managedLeaguePosition: 3,
    opponentLeaguePoints: 20,
    managedLeaguePoints: 24,
    opponentUnbeatenStreakAtVenue: 0,
    opponentUnbeatenStreakSinceDate: null,
    previousMeetingThisSeason: null,
    calendarAnchor: null,
    ...overrides,
  }
}

describe('buildNextOpponentHook — B3 (2026-07-20)', () => {
  it('titelraden är "Nästa: {motståndare} {hemma|borta}"', () => {
    expect(buildNextOpponentHook(makeFacts({ isHome: true })).title).toBe('Nästa: Testklubben hemma')
    expect(buildNextOpponentHook(makeFacts({ isHome: false })).title).toBe('Nästa: Testklubben borta')
  })

  it('prio 1a — obesegrad hemma med känt datum ger månadsrad (bara när vi spelar borta)', () => {
    const facts = makeFacts({ isHome: false, opponentUnbeatenStreakAtVenue: 4, opponentUnbeatenStreakSinceDate: '2025-11-03' })
    expect(buildNextOpponentHook(facts).factLine).toBe('De har inte förlorat hemma sedan november.')
  })

  it('prio 1b — obesegrad hemma utan tidigare förlust i data ger "i år"-varianten', () => {
    const facts = makeFacts({ isHome: false, opponentUnbeatenStreakAtVenue: 2, opponentUnbeatenStreakSinceDate: null })
    expect(buildNextOpponentHook(facts).factLine).toBe('Ingen har vunnit där i år.')
  })

  it('obesegrad-hemma-fakta ignoreras när VI är hemmalag (det är inte deras hemmaplan)', () => {
    const facts = makeFacts({ isHome: true, opponentUnbeatenStreakAtVenue: 5, opponentUnbeatenStreakSinceDate: '2025-10-01' })
    expect(buildNextOpponentHook(facts).factLine).not.toContain('förlorat hemma')
  })

  it('prio 2 — tidigare möte, vi förlorade', () => {
    const facts = makeFacts({ previousMeetingThisSeason: { date: '2025-11-01', managedScore: 1, opponentScore: 3, isHome: true } })
    expect(buildNextOpponentHook(facts).factLine).toBe('Sist tog de två poäng av er.')
  })

  it('prio 2 — tidigare möte, vi vann', () => {
    const facts = makeFacts({ previousMeetingThisSeason: { date: '2025-11-01', managedScore: 3, opponentScore: 1, isHome: true } })
    expect(buildNextOpponentHook(facts).factLine).toBe('Ni vann senast. De minns det.')
  })

  it('prio 2 — tidigare möte, oavgjort', () => {
    const facts = makeFacts({ previousMeetingThisSeason: { date: '2025-11-01', managedScore: 2, opponentScore: 2, isHome: true } })
    expect(buildNextOpponentHook(facts).factLine).toBe('Sist skildes ni oavgjorda.')
  })

  it('prio 3 — tabellgrannar bara vid EXAKT två poängs skillnad', () => {
    const twoApart = makeFacts({ managedLeaguePoints: 24, opponentLeaguePoints: 22 })
    expect(buildNextOpponentHook(twoApart).factLine).toBe('Två poäng skiljer er i tabellen.')

    const threeApart = makeFacts({ managedLeaguePoints: 24, opponentLeaguePoints: 21 })
    expect(buildNextOpponentHook(threeApart).factLine).not.toBe('Två poäng skiljer er i tabellen.')
  })

  it('prio 4 — de ligger strax under, bara vid EXAKT en placering under', () => {
    const oneUnder = makeFacts({ managedLeaguePoints: 24, opponentLeaguePoints: 24, managedLeaguePosition: 3, opponentLeaguePosition: 4 })
    expect(buildNextOpponentHook(oneUnder).factLine).toBe('De ligger strax under er. Det gör dem farliga.')

    const twoUnder = makeFacts({ managedLeaguePoints: 24, opponentLeaguePoints: 24, managedLeaguePosition: 3, opponentLeaguePosition: 5 })
    expect(buildNextOpponentHook(twoUnder).factLine).not.toBe('De ligger strax under er. Det gör dem farliga.')
  })

  it('fallback — obligatorisk när ingen fakta är stark nog', () => {
    const facts = makeFacts({
      opponentUnbeatenStreakAtVenue: 0,
      previousMeetingThisSeason: null,
      managedLeaguePoints: 24, opponentLeaguePoints: 20,
      managedLeaguePosition: 3, opponentLeaguePosition: 8,
    })
    expect(buildNextOpponentHook(facts).factLine).toBe('Inget särskilt på pappret. Det brukar betyda något annat på isen.')
  })

  it('prioritetsordning — obesegrad hemma slår tidigare möte när båda gäller', () => {
    const facts = makeFacts({
      isHome: false,
      opponentUnbeatenStreakAtVenue: 3,
      opponentUnbeatenStreakSinceDate: '2025-12-05',
      previousMeetingThisSeason: { date: '2025-11-01', managedScore: 3, opponentScore: 1, isHome: true },
    })
    expect(buildNextOpponentHook(facts).factLine).toBe('De har inte förlorat hemma sedan december.')
  })
})
