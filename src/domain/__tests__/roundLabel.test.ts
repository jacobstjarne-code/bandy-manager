/**
 * HIGH 5 (BANDY_MANAGER_AUDIT_5_SASONGER_..._2026-08-29): "matchnummer och
 * omgångsnummer beskriver olika verkligheter på olika skärmar."
 *
 * Symptomet i audit: samma derby stod som "Omgång 4" i portalen och "OMG 8"
 * live, för att ytorna läste `roundNumber` respektive `matchday` med IDENTISK
 * formatering. En slutspelsmatch visades som "Omgång 28" — ett tal som inte
 * betydde något alls.
 *
 * Testerna nedan låser båda halvorna: att etiketten är tävlingsmedveten, och
 * att den är EN funktion (så portal/live/rapport/årsbok inte KAN gå isär).
 */
import { describe, it, expect } from 'vitest'
import { getRoundLabel, playoffRoundName, playoffRoundNameUpper, playoffRoundDefinite } from '../roundLabel'
import { getPlayoffRoundForFixture, nextPlayoffStart } from '../services/playoffService'
import { PlayoffRound, FixtureStatus } from '../enums'
import type { Fixture } from '../entities/Fixture'
import type { PlayoffBracket, PlayoffSeries } from '../entities/Playoff'

function makeFixture(over: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture_x',
    leagueId: 'league_2025',
    season: 2025,
    roundNumber: 4,
    matchday: 8,
    homeClubId: 'club_1',
    awayClubId: 'club_2',
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...over,
  }
}

function makeSeries(id: string, round: PlayoffRound, fixtureIds: string[]): PlayoffSeries {
  return {
    id, round,
    homeClubId: 'club_1', awayClubId: 'club_2',
    fixtures: fixtureIds,
    homeWins: 0, awayWins: 0, winnerId: null, loserId: null,
  }
}

function makeBracket(): PlayoffBracket {
  return {
    season: 2025,
    status: 'quarterFinals' as PlayoffBracket['status'],
    quarterFinals: [makeSeries('qf1', PlayoffRound.QuarterFinal, ['f_qf_g1', 'f_qf_g2'])],
    semiFinals: [makeSeries('sf1', PlayoffRound.SemiFinal, ['f_sf_g1'])],
    final: makeSeries('final', PlayoffRound.Final, ['f_final_g1']),
    champion: null,
  }
}

describe('getRoundLabel — liga', () => {
  it('använder roundNumber (det tal spelaren tänker i), inte matchday', () => {
    // Ligaomgång 4 ligger på matchday 8 (cupen 1-4 före ligan 5-26).
    // Audit-symptomet var exakt att matchday visades som omgång.
    const fixture = makeFixture({ roundNumber: 4, matchday: 8 })
    expect(getRoundLabel(fixture)).toEqual({ short: 'Omg 4', long: 'Omgång 4' })
  })

  it('sista ligaomgången', () => {
    expect(getRoundLabel(makeFixture({ roundNumber: 22, matchday: 26 })).long).toBe('Omgång 22')
  })
})

describe('getRoundLabel — cup', () => {
  const cases: Array<[number, string]> = [
    [1, 'Cup · förstarunda'],
    [2, 'Cup · kvartsfinal'],
    [3, 'Cup · semifinal'],
    [4, 'Cup · final'],
  ]
  for (const [round, expected] of cases) {
    it(`cuprond ${round} → "${expected}" (delegerar till cupService)`, () => {
      const fixture = makeFixture({ isCup: true, isKnockout: true, roundNumber: round, matchday: round })
      expect(getRoundLabel(fixture)).toEqual({ short: expected, long: expected })
    })
  }

  it('säger ALDRIG "Omgång N" för en cupmatch', () => {
    // Rotorsaken: cuprond 2 (kvartsfinal) renderades som "Omgång 2" på flera
    // ytor eftersom mallen var densamma som ligans.
    const fixture = makeFixture({ isCup: true, isKnockout: true, roundNumber: 2, matchday: 2 })
    expect(getRoundLabel(fixture).long).not.toMatch(/Omg/)
  })
})

describe('getRoundLabel — slutspel', () => {
  const bracket = makeBracket()

  it('kvartsfinal → fas ur bracketen, inte roundNumber', () => {
    const fixture = makeFixture({ id: 'f_qf_g1', isKnockout: true, roundNumber: 23, matchday: 27 })
    expect(getRoundLabel(fixture, bracket)).toEqual({
      short: 'Slutspel · kvartsfinal',
      long: 'Slutspel · kvartsfinal',
    })
  })

  it('semifinal', () => {
    const fixture = makeFixture({ id: 'f_sf_g1', isKnockout: true, roundNumber: 28, matchday: 32 })
    expect(getRoundLabel(fixture, bracket).long).toBe('Slutspel · semifinal')
  })

  it('SM-finalen får sitt eget namn, inte "Slutspel · sm-final"', () => {
    const fixture = makeFixture({ id: 'f_final_g1', isKnockout: true, isFinaldag: true, roundNumber: 33, matchday: 37 })
    expect(getRoundLabel(fixture, bracket).long).toBe('SM-Final')
  })

  it('"Omgång 28" kan inte längre uppstå — talet når aldrig ytan', () => {
    // Auditens exakta fynd. roundNumber 28 finns kvar på fixturen (fältet är
    // fortfarande monotont, se nextPlayoffStart) men etiketten läser det inte.
    const fixture = makeFixture({ id: 'f_qf_g1', isKnockout: true, roundNumber: 28, matchday: 27 })
    const label = getRoundLabel(fixture, bracket)
    expect(label.long).not.toContain('28')
    expect(label.short).not.toContain('28')
  })

  it('utan bracket (gammal sparfil) → "Slutspel", aldrig ett vilseledande tal', () => {
    const fixture = makeFixture({ id: 'okänd', isKnockout: true, roundNumber: 31, matchday: 35 })
    expect(getRoundLabel(fixture, null)).toEqual({ short: 'Slutspel', long: 'Slutspel' })
    expect(getRoundLabel(fixture, undefined).long).toBe('Slutspel')
  })
})

describe('EN etikett — portal/live/rapport/årsbok kan inte gå isär', () => {
  it('samma derby-fixture ger samma etikett oavsett vem som frågar', () => {
    // Audit-scenariot, återskapat: derbyt i ligaomgång 4 = matchday 8.
    // Portalen läste roundNumber ("Omgång 4"), MatchLiveScreen matchday
    // ("OMG 8"), årsboken matchday ("Omgång 8"). Nu finns bara EN funktion,
    // så alla anrop med samma fixture ger per konstruktion samma svar.
    const derby = makeFixture({ id: 'fixture_derby', roundNumber: 4, matchday: 8 })

    const portal = getRoundLabel(derby)                 // TabellScreen/NextMatchCard
    const live = getRoundLabel(derby)                   // MatchLiveScreen (masthead)
    const rapport = getRoundLabel(derby)                // MatchReportView
    const arsbok = getRoundLabel(derby)                 // SeasonSummary/klubbminnet

    expect(live).toEqual(portal)
    expect(rapport).toEqual(portal)
    expect(arsbok).toEqual(portal)
    expect(portal.long).toBe('Omgång 4')
    // Och framför allt: ingen yta visar längre matchday-talet som omgång.
    expect(portal.long).not.toContain('8')
    expect(portal.short).not.toContain('8')
  })

  it('samma sak för en cupmatch där roundNumber och matchday är IDENTISKA', () => {
    // Cupen är den lömska varianten: roundNumber === matchday (båda 2), så
    // ett fältbyte syns inte i talet — bara i vad talet BETYDER.
    const cup = makeFixture({ id: 'fixture_cup', isCup: true, isKnockout: true, roundNumber: 2, matchday: 2 })
    expect(getRoundLabel(cup).long).toBe('Cup · kvartsfinal')
    expect(getRoundLabel(cup).long).not.toBe('Omgång 2')
  })
})

describe('playoffRound-namnen — de sex sammanslagna dubletterna', () => {
  it('titelform (ChampionScreen, GameHeader, NextMatchCard, PortalScreen)', () => {
    expect(playoffRoundName(PlayoffRound.QuarterFinal)).toBe('Kvartsfinal')
    expect(playoffRoundName(PlayoffRound.SemiFinal)).toBe('Semifinal')
    expect(playoffRoundName(PlayoffRound.Final)).toBe('SM-Final')
  })

  it('versalform (MatchReportView, MatchScreen, situationService)', () => {
    expect(playoffRoundNameUpper(PlayoffRound.QuarterFinal)).toBe('KVARTSFINAL')
    expect(playoffRoundNameUpper(PlayoffRound.SemiFinal)).toBe('SEMIFINAL')
    expect(playoffRoundNameUpper(PlayoffRound.Final)).toBe('SM-FINAL')
  })

  it('bestämd form (AnslagOverlay, {rond}-substitution i prosa)', () => {
    expect(playoffRoundDefinite(PlayoffRound.QuarterFinal)).toBe('kvartsfinalen')
    expect(playoffRoundDefinite(PlayoffRound.SemiFinal)).toBe('semifinalen')
    expect(playoffRoundDefinite(PlayoffRound.Final)).toBe('SM-finalen')
  })
})

describe('getPlayoffRoundForFixture — enda fixture→fas-uppslaget', () => {
  const bracket = makeBracket()
  it('hittar rätt gren', () => {
    expect(getPlayoffRoundForFixture(bracket, 'f_qf_g2')).toBe(PlayoffRound.QuarterFinal)
    expect(getPlayoffRoundForFixture(bracket, 'f_sf_g1')).toBe(PlayoffRound.SemiFinal)
    expect(getPlayoffRoundForFixture(bracket, 'f_final_g1')).toBe(PlayoffRound.Final)
  })
  it('null för okänd fixture och för saknad bracket', () => {
    expect(getPlayoffRoundForFixture(bracket, 'f_okänd')).toBeNull()
    expect(getPlayoffRoundForFixture(null, 'f_qf_g1')).toBeNull()
  })
})

describe('nextPlayoffStart — roundNumber härleds som matchday, inte hårdkodas', () => {
  it('räknar vidare från högsta befintliga roundNumber/matchday', () => {
    const fixtures = [
      { roundNumber: 22, matchday: 26 },
      { roundNumber: 4, matchday: 4 },   // cupfinal — lägre roundNumber, lägre matchday
    ]
    expect(nextPlayoffStart(fixtures)).toEqual({ startRound: 23, startMatchday: 27 })
  })

  it('tom lista → 1/1 (inget NaN, ingen -Infinity)', () => {
    expect(nextPlayoffStart([])).toEqual({ startRound: 1, startMatchday: 1 })
  })

  it('monotont: kvartsfinal → semifinal → final utan hopp bakåt', () => {
    // Ligan slutar på 22/26.
    let fixtures = [{ roundNumber: 22, matchday: 26 }]
    const qf = nextPlayoffStart(fixtures)
    expect(qf.startRound).toBe(23)
    // Fyra kvartsfinalserier, bäst av 5 → roundNumber 23-27, matchday 27-31.
    fixtures = [...fixtures, ...Array.from({ length: 5 }, (_, i) => ({
      roundNumber: qf.startRound + i, matchday: qf.startMatchday + i,
    }))]
    const sf = nextPlayoffStart(fixtures)
    expect(sf.startRound).toBe(28)
    expect(sf.startMatchday).toBe(32)
    fixtures = [...fixtures, ...Array.from({ length: 5 }, (_, i) => ({
      roundNumber: sf.startRound + i, matchday: sf.startMatchday + i,
    }))]
    const fin = nextPlayoffStart(fixtures)
    expect(fin.startRound).toBe(33)
    expect(fin.startMatchday).toBe(37)
    // roundNumber är alltid > 22 för slutspel — det förutsätter
    // matchSimProcessor.ts och economyService.ts redan.
    expect(qf.startRound).toBeGreaterThan(22)
    expect(sf.startRound).toBeGreaterThan(22)
    expect(fin.startRound).toBeGreaterThan(22)
  })
})
