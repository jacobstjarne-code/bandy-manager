import { describe, it, expect } from 'vitest'
import { deriveMatchTypeAxes, deriveUtfall } from '../matchTypeAxes'
import type { Fixture } from '../../entities/Fixture'
import type { PlayoffBracket } from '../../entities/Playoff'
import { PlayoffRound, PlayoffStatus, FixtureStatus } from '../../enums'

const HOME = 'club-home'
const AWAY = 'club-away'

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fx-1', leagueId: 'liga', season: 8, roundNumber: 10, matchday: 10,
    homeClubId: HOME, awayClubId: AWAY, status: FixtureStatus.Completed,
    homeScore: 2, awayScore: 1, events: [],
    ...overrides,
  }
}

describe('deriveMatchTypeAxes — GRANSKA DEL 4 steg 1 (2026-08-11)', () => {
  it('liga: hemmamatch', () => {
    const axes = deriveMatchTypeAxes(makeFixture(), HOME, null)
    expect(axes).toEqual({
      tavlingstyp: 'liga', skede: undefined, plats: 'hemma',
      utfall: 'vunnet', gavLigapoang: true, arDerby: false,
    })
  })

  it('liga: bortamatch', () => {
    const axes = deriveMatchTypeAxes(makeFixture({ homeClubId: AWAY, awayClubId: HOME }), HOME, null)
    expect(axes.plats).toBe('borta')
  })

  it.each([
    [1, 'forstarunda'],
    [2, 'kvartsfinal'],
    [3, 'semifinal'],
    [4, 'final'],
  ] as const)('cup rond %i → skede %s', (round, skede) => {
    const axes = deriveMatchTypeAxes(makeFixture({ isCup: true, isKnockout: true, roundNumber: round }), HOME, null)
    expect(axes.tavlingstyp).toBe('cup')
    expect(axes.skede).toBe(skede)
  })

  it('cupsemifinal på neutral plan (finalhelgen) — plats:neutral, INTE tavlingstyp:slutspel', () => {
    // Regression mot buggen i GranskaOversikt.tsx:590-596 (kaptenens kontextgren):
    // cupService.ts sätter isNeutralVenue på BÅDE cupsemi och cupfinal
    // (isCupFinalWeekend = nextRound >= 3) — en isNeutralVenue-baserad
    // "är det final"-koll klassificerar därför cupsemin fel. Axlarna gör inte
    // det misstaget: skede kommer från roundNumber, inte från isNeutralVenue.
    const axes = deriveMatchTypeAxes(
      makeFixture({ isCup: true, isKnockout: true, isNeutralVenue: true, isCupFinalhelgen: true, roundNumber: 3 }),
      HOME, null,
    )
    expect(axes).toEqual({
      tavlingstyp: 'cup', skede: 'semifinal', plats: 'neutral',
      utfall: 'vunnet', gavLigapoang: false, arDerby: false,
    })
  })

  it('cupfinal = cup + final, inte ett eget tavlingstyp-värde', () => {
    const axes = deriveMatchTypeAxes(
      makeFixture({ isCup: true, isKnockout: true, isNeutralVenue: true, isCupFinalhelgen: true, roundNumber: 4 }),
      HOME, null,
    )
    expect(axes.tavlingstyp).toBe('cup')
    expect(axes.skede).toBe('final')
  })

  function bracketWith(round: PlayoffRound, fixtureId: string): PlayoffBracket {
    const series = { id: 's1', round, homeClubId: HOME, awayClubId: AWAY, fixtures: [fixtureId], homeWins: 0, awayWins: 0, winnerId: null, loserId: null }
    return {
      season: 8, status: PlayoffStatus.QuarterFinals,
      quarterFinals: round === PlayoffRound.QuarterFinal ? [series] : [],
      semiFinals: round === PlayoffRound.SemiFinal ? [series] : [],
      final: round === PlayoffRound.Final ? series : null,
      champion: null,
    }
  }

  it('slutspel kvartsfinal — skede ur bracket.quarterFinals', () => {
    const fixture = makeFixture({ id: 'po-qf-1', isKnockout: true })
    const axes = deriveMatchTypeAxes(fixture, HOME, bracketWith(PlayoffRound.QuarterFinal, 'po-qf-1'))
    expect(axes.tavlingstyp).toBe('slutspel')
    expect(axes.skede).toBe('kvartsfinal')
  })

  it('slutspel semifinal — skede ur bracket.semiFinals', () => {
    const fixture = makeFixture({ id: 'po-sf-1', isKnockout: true })
    const axes = deriveMatchTypeAxes(fixture, HOME, bracketWith(PlayoffRound.SemiFinal, 'po-sf-1'))
    expect(axes.skede).toBe('semifinal')
  })

  it('SM-final = tavlingstyp:slutspel + skede:final (neutral plan)', () => {
    const fixture = makeFixture({ id: 'po-final', isKnockout: true, isFinaldag: true, isNeutralVenue: true })
    const axes = deriveMatchTypeAxes(fixture, HOME, bracketWith(PlayoffRound.Final, 'po-final'))
    expect(axes).toEqual({
      tavlingstyp: 'slutspel', skede: 'final', plats: 'neutral',
      utfall: 'vunnet', gavLigapoang: false, arDerby: false,
    })
  })

  it('slutspelsfixture utan matchande bracket-post → skede undefined (inte krasch)', () => {
    const fixture = makeFixture({ id: 'po-unknown', isKnockout: true })
    const axes = deriveMatchTypeAxes(fixture, HOME, bracketWith(PlayoffRound.Final, 'po-final'))
    expect(axes.skede).toBeUndefined()
  })

  it('slutspel utan bracket alls (null) → skede undefined, inte krasch', () => {
    const fixture = makeFixture({ id: 'po-1', isKnockout: true })
    const axes = deriveMatchTypeAxes(fixture, HOME, null)
    expect(axes.tavlingstyp).toBe('slutspel')
    expect(axes.skede).toBeUndefined()
  })

  it('avsked går före cup/slutspel — farewellMatchForPlayerId kan i teorin träffa en cupmatch', () => {
    const fixture = makeFixture({ isCup: true, isKnockout: true, roundNumber: 2, farewellMatchForPlayerId: 'p-1' })
    const axes = deriveMatchTypeAxes(fixture, HOME, null)
    expect(axes.tavlingstyp).toBe('avsked')
  })

  it('avsked i en vanlig ligamatch — det normala fallet', () => {
    const fixture = makeFixture({ farewellMatchForPlayerId: 'p-1' })
    const axes = deriveMatchTypeAxes(fixture, HOME, null)
    expect(axes.tavlingstyp).toBe('avsked')
    expect(axes.skede).toBeUndefined()
  })

  describe('arDerby och gavLigapoang', () => {
    it('rivalklubbar i cup → arDerby:true, gavLigapoang:false', () => {
      const axes = deriveMatchTypeAxes(
        makeFixture({ homeClubId: 'club_soderfors', awayClubId: 'club_skutskar', isCup: true, isKnockout: true, roundNumber: 1 }),
        'club_soderfors', null,
      )
      expect(axes.arDerby).toBe(true)
      expect(axes.gavLigapoang).toBe(false)
    })

    it('avsked ger inga ligapoäng även i en annars vanlig ligamatch', () => {
      const axes = deriveMatchTypeAxes(makeFixture({ farewellMatchForPlayerId: 'p-1' }), HOME, null)
      expect(axes.gavLigapoang).toBe(false)
    })
  })
})

describe('deriveUtfall — U2 (SLUTTEST_KO.md, 2026-08-17), symptom 1', () => {
  it('rak vinst/förlust/oavgjort ur homeScore/awayScore', () => {
    expect(deriveUtfall(makeFixture({ homeScore: 3, awayScore: 1 }), HOME)).toBe('vunnet')
    expect(deriveUtfall(makeFixture({ homeScore: 1, awayScore: 3 }), HOME)).toBe('forlorat')
    expect(deriveUtfall(makeFixture({ homeScore: 2, awayScore: 2 }), HOME)).toBe('oavgjort')
  })

  it('straffseger: homeScore===awayScore men penaltyResult avgör — INTE oavgjort', () => {
    const fixture = makeFixture({
      homeScore: 2, awayScore: 2, wentToPenalties: true, penaltyResult: { home: 5, away: 4 },
    })
    expect(deriveUtfall(fixture, HOME)).toBe('vunnet')
    expect(deriveUtfall(fixture, AWAY)).toBe('forlorat')
  })

  it('straffar, samma resultat, men managedClub är bortalaget', () => {
    const fixture = makeFixture({
      homeClubId: HOME, awayClubId: AWAY,
      homeScore: 1, awayScore: 1, wentToPenalties: true, penaltyResult: { home: 3, away: 5 },
    })
    expect(deriveUtfall(fixture, AWAY)).toBe('vunnet')
    expect(deriveUtfall(fixture, HOME)).toBe('forlorat')
  })

  it('penaltyResult räcker även om en äldre fixture saknar wentToPenalties-flaggan', () => {
    const fixture = makeFixture({
      homeScore: 2, awayScore: 2, penaltyResult: { home: 4, away: 3 },
    })
    expect(deriveUtfall(fixture, HOME)).toBe('vunnet')
    expect(deriveUtfall(fixture, AWAY)).toBe('forlorat')
  })

  it('förlängningsseger utan straffar', () => {
    const fixture = makeFixture({ homeScore: 3, awayScore: 3, overtimeResult: 'away' })
    expect(deriveUtfall(fixture, AWAY)).toBe('vunnet')
    expect(deriveUtfall(fixture, HOME)).toBe('forlorat')
  })
})
