/**
 * TEXTLEVERANS §D5 (2026-09-20) — stoppens faktarader och D2 omskriven.
 *
 * Två fel fanns i den tidigare versionen: `{Resultat}` i D2 fylldes med
 * seriesiffran (1–0), som läses som ett matchresultat trots att SM-finalen är
 * EN match — och "SM-guld: X. Tvåa: Y." sa "tvåa" om en förlorad final, fel
 * register (det heter silver). Den generiska slutplaceringsraden i Veckan
 * efter ("Serien slutade på plats N") skilde inte heller på klubben som
 * MISSADE slutspelet och klubben som ÅKTE UT i det.
 *
 * Ett test per villkor i weekAfterFactLine (sex stycken), plus D2:s tre pooler
 * och guldraden.
 */
import { describe, it, expect } from 'vitest'
import {
  weekAfterFactLine,
  buildFinalDayStop,
  buildWeekAfterStop,
} from '../corridorService'
import { PlayoffRound, PlayoffStatus } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'
import type { StandingRow } from '../../entities/Standing'
import type { PlayoffSeries } from '../../entities/Playoff'
import type { Club } from '../../entities/Club'

const MANAGED = 'club_us'
const RIVAL = 'club_rival'
const OTHER_A = 'club_a'
const OTHER_B = 'club_b'

function makeClub(id: string, name: string): Club {
  return { id, name, shortName: name.slice(0, 3).toUpperCase() } as unknown as Club
}

function makeStandings(order: string[]): StandingRow[] {
  return order.map((clubId, i) => ({
    clubId, position: i + 1, points: (order.length - i) * 10,
    played: 22, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
  }))
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: MANAGED,
    currentSeason: 3,
    players: [],
    clubs: [makeClub(MANAGED, 'Vårt Lag'), makeClub(RIVAL, 'Rivalen'), makeClub(OTHER_A, 'A-laget'), makeClub(OTHER_B, 'B-laget')],
    standings: makeStandings([OTHER_A, OTHER_B, MANAGED]),
    ...overrides,
  } as unknown as SaveGame
}

function makeSeries(over: Partial<PlayoffSeries>): PlayoffSeries {
  return {
    id: 'series', round: PlayoffRound.QuarterFinal,
    homeClubId: MANAGED, awayClubId: OTHER_A,
    fixtures: [], homeWins: 3, awayWins: 1,
    winnerId: OTHER_A, loserId: MANAGED,
    ...over,
  }
}

describe('§D5 — weekAfterFactLine, sex villkor', () => {
  it('1. plats nio, poängskillnad till åttan > 0', () => {
    const standings: StandingRow[] = [
      ...makeStandings(['a', 'b', 'c', 'd', 'e', 'f', 'g']),
      { clubId: 'eighth', position: 8, points: 30, played: 22, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
      { clubId: MANAGED, position: 9, points: 26, played: 22, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
    ]
    const game = makeGame({ standings })
    expect(weekAfterFactLine(game)).toBe(
      'Plats nio. En plats från slutspel, 4 poäng ifrån. Det kommer att nämnas i kafferummet till mars.',
    )
  })

  it('1b. plats nio, samma poäng som åttan — "på sämre målskillnad", inte "0 poäng ifrån"', () => {
    const standings: StandingRow[] = [
      { clubId: 'eighth', position: 8, points: 30, played: 22, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
      { clubId: MANAGED, position: 9, points: 30, played: 22, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 },
    ]
    const game = makeGame({ standings })
    expect(weekAfterFactLine(game)).toBe(
      'Plats nio. En plats från slutspel, på sämre målskillnad. Det kommer att nämnas i kafferummet till mars.',
    )
  })

  it('2. plats tio–elva — tabellen stängd', () => {
    const standings = makeStandings(Array.from({ length: 11 }, (_, i) => `c${i}`)).map(r =>
      r.clubId === 'c10' ? { ...r, clubId: MANAGED, position: 11, points: 14 } : r,
    )
    const game = makeGame({ standings })
    expect(weekAfterFactLine(game)).toBe('Tabellen är stängd. Plats 11 av 11, 14 poäng. Slutspelet går utan oss.')
  })

  it('3. sist', () => {
    const standings = makeStandings(Array.from({ length: 12 }, (_, i) => `c${i}`)).map(r =>
      r.clubId === 'c11' ? { ...r, clubId: MANAGED, position: 12, points: 8 } : r,
    )
    const game = makeGame({ standings })
    expect(weekAfterFactLine(game)).toBe('Sist. 8 poäng. Ingen säger något om det, vilket är värre än om de gjorde det.')
  })

  it('4. ute i kvartsfinalen mot namngiven motståndare', () => {
    const qf = makeSeries({ round: PlayoffRound.QuarterFinal, homeClubId: MANAGED, awayClubId: OTHER_A, winnerId: OTHER_A, loserId: MANAGED })
    const game = makeGame({
      standings: makeStandings([OTHER_A, MANAGED, OTHER_B]).map(r => r.clubId === MANAGED ? { ...r, position: 5 } : r),
      playoffBracket: { season: 3, status: PlayoffStatus.SemiFinals, quarterFinals: [qf], semiFinals: [], final: null, champion: null },
    })
    expect(weekAfterFactLine(game)).toBe('Ute i kvartsfinalen mot A-laget. I serien blev det plats 5. Det ena förklarar inte det andra.')
  })

  it('5. ute i semifinalen', () => {
    const sf = makeSeries({ round: PlayoffRound.SemiFinal, homeClubId: OTHER_B, awayClubId: MANAGED, winnerId: OTHER_B, loserId: MANAGED })
    const game = makeGame({
      standings: makeStandings([OTHER_A, OTHER_B, MANAGED]).map(r => r.clubId === MANAGED ? { ...r, position: 3 } : r),
      playoffBracket: { season: 3, status: PlayoffStatus.Final, quarterFinals: [], semiFinals: [sf], final: null, champion: null },
    })
    expect(weekAfterFactLine(game)).toBe('Semifinal. B-laget var bättre de dagar det gällde. Plats 3 i serien, och en vår som tog slut en vecka för tidigt.')
  })

  it('6. förlorad final — Silver', () => {
    const final = makeSeries({ round: PlayoffRound.Final, homeClubId: MANAGED, awayClubId: OTHER_A, winnerId: OTHER_A, loserId: MANAGED })
    const game = makeGame({
      playoffBracket: { season: 3, status: PlayoffStatus.Completed, quarterFinals: [], semiFinals: [], final, champion: OTHER_A },
    })
    expect(weekAfterFactLine(game)).toBe('Silver. A-laget vann finalen. Det får stå ett tag innan det känns som något.')
  })

  it('ingen standingsrad för klubben → null, ingen krasch', () => {
    const game = makeGame({ standings: makeStandings([OTHER_A, OTHER_B]) })
    expect(weekAfterFactLine(game)).toBeNull()
  })
})

describe('§D5 — D2 omskriven, ingen {Resultat}', () => {
  function finalGame(winnerId: string, loserId: string, rivalryHistory: SaveGame['rivalryHistory'] = {}): SaveGame {
    const final = makeSeries({ round: PlayoffRound.Final, homeClubId: winnerId, awayClubId: loserId, winnerId, loserId })
    return makeGame({
      managedClubId: MANAGED,
      playoffBracket: { season: 3, status: PlayoffStatus.Completed, quarterFinals: [], semiFinals: [], final, champion: winnerId },
      rivalryHistory,
    })
  }

  it('guldraden ersätter "SM-guld: X. Tvåa: Y." — det heter silver', () => {
    const stop = buildFinalDayStop(finalGame(OTHER_A, OTHER_B))
    expect(stop).not.toBeNull()
    expect(stop!.lines[0].text).toBe('A-laget är svenska mästare. B-laget tog silver.')
    expect(stop!.lines[0].text).not.toMatch(/tvåa/i)
  })

  it('ingen rad innehåller en oersatt {Resultat}-platshållare', () => {
    const stop = buildFinalDayStop(finalGame(OTHER_A, OTHER_B))
    for (const line of stop!.lines) expect(line.text).not.toMatch(/\{Resultat\}/)
  })

  it('neutral pool när ingen rival är inblandad', () => {
    const stop = buildFinalDayStop(finalGame(OTHER_A, OTHER_B))
    // D2-raden (andra raden, efter guldraden) ska komma ur den neutrala poolen.
    expect(stop!.lines[1].text).toMatch(/soffan|chanserna|kafferummet|Studenternas/)
  })

  it('rival vann guldet → CORRIDOR_OTHERS_RIVAL_ALIVE-registret', () => {
    const stop = buildFinalDayStop(finalGame(RIVAL, OTHER_B, { [RIVAL]: { dominanceEstablished: true } }))
    expect(stop!.lines[1].text).toMatch(/svenska mästare\. Vi slog dem|Konsum|domarens fel/)
  })

  it('rival förlorade finalen → CORRIDOR_OTHERS_RIVAL_OUT-registret', () => {
    const stop = buildFinalDayStop(finalGame(OTHER_A, RIVAL, { [RIVAL]: { dominanceEstablished: true } }))
    expect(stop!.lines[1].text).toMatch(/tog silver\. Det var första gången|I kafferummet var man överens/)
  })

  it('varken vinnare eller förlorare är vår egen klubb — defensiv grind', () => {
    expect(buildFinalDayStop(finalGame(MANAGED, OTHER_A))).toBeNull()
    expect(buildFinalDayStop(finalGame(OTHER_A, MANAGED))).toBeNull()
  })
})

describe('§D5 — Veckan efter använder den nya faktaraden', () => {
  it('en klubb som missade slutspelet får sin faktarad sist bland raderna', () => {
    const standings = makeStandings(Array.from({ length: 12 }, (_, i) => `c${i}`)).map(r =>
      r.clubId === 'c11' ? { ...r, clubId: MANAGED, position: 12, points: 6 } : r,
    )
    // Bracketen finns (top 8 kvalar alltid in ett bracket), vår klubb är
    // bara inte med i någon serie — isOutOfEverything kräver ett bracket för
    // DENNA säsong för att avgöra att vi missat, inte bara avsaknad av ett.
    const game = makeGame({
      standings,
      playoffBracket: {
        season: 3, status: PlayoffStatus.QuarterFinals,
        quarterFinals: [makeSeries({ homeClubId: 'c0', awayClubId: 'c1', winnerId: null, loserId: null })],
        semiFinals: [], final: null, champion: null,
      },
    })
    const stop = buildWeekAfterStop(game)
    expect(stop).not.toBeNull()
    const last = stop!.lines[stop!.lines.length - 1]
    expect(last.text).toBe('Sist. 6 poäng. Ingen säger något om det, vilket är värre än om de gjorde det.')
    // Faktan är inte en Fable-poolrad — ingen dedup-nyckel.
    expect(last.usedKey).toBeNull()
  })
})
