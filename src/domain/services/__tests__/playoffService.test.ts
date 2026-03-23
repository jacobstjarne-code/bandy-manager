import { describe, it, expect } from 'vitest'
import {
  generatePlayoffBracket,
  generatePlayoffFixtures,
  isSeriesDecided,
  updateSeriesAfterMatch,
  advancePlayoffRound,
} from '../playoffService'
import { PlayoffStatus, PlayoffRound, FixtureStatus } from '../../enums'
import type { StandingRow } from '../../entities/SaveGame'
import type { PlayoffSeries } from '../../entities/Playoff'
import type { Fixture } from '../../entities/Fixture'

function makeStandings(): StandingRow[] {
  return Array.from({ length: 12 }, (_, i) => ({
    clubId: `club_${i + 1}`,
    played: 22,
    wins: 12 - i,
    draws: 0,
    losses: 10 + i,
    goalsFor: 50 - i * 2,
    goalsAgainst: 20 + i * 2,
    goalDifference: 30 - i * 4,
    points: (12 - i) * 3,
    position: i + 1,
  }))
}

function makeSeries(homeClubId = 'club_1', awayClubId = 'club_8', season = 2025): PlayoffSeries {
  return {
    id: `playoff_qf1_s${season}`,
    round: PlayoffRound.QuarterFinal,
    homeClubId,
    awayClubId,
    fixtures: [],
    homeWins: 0,
    awayWins: 0,
    winnerId: null,
    loserId: null,
  }
}

function makeFixture(seriesId: string, homeClubId: string, awayClubId: string, homeScore: number, awayScore: number, gameNum = 1): Fixture {
  return {
    id: `fixture_${seriesId}_g${gameNum}`,
    leagueId: 'league_2025',
    season: 2025,
    roundNumber: 23,
    homeClubId,
    awayClubId,
    status: FixtureStatus.Completed,
    homeScore,
    awayScore,
    events: [],
    report: undefined,
    homeLineup: undefined,
    awayLineup: undefined,
  }
}

describe('generatePlayoffBracket', () => {
  it('creates 4 quarter-final series from top 8 standings', () => {
    const standings = makeStandings()
    const bracket = generatePlayoffBracket(standings, 2025)

    expect(bracket.status).toBe(PlayoffStatus.QuarterFinals)
    expect(bracket.quarterFinals).toHaveLength(4)
    expect(bracket.semiFinals).toHaveLength(0)
    expect(bracket.final).toBeNull()
    expect(bracket.champion).toBeNull()
  })

  it('seeds correctly: #1 vs #8, #2 vs #7, #3 vs #6, #4 vs #5', () => {
    const standings = makeStandings()
    const bracket = generatePlayoffBracket(standings, 2025)

    expect(bracket.quarterFinals[0].homeClubId).toBe('club_1')
    expect(bracket.quarterFinals[0].awayClubId).toBe('club_8')
    expect(bracket.quarterFinals[1].homeClubId).toBe('club_2')
    expect(bracket.quarterFinals[1].awayClubId).toBe('club_7')
    expect(bracket.quarterFinals[2].homeClubId).toBe('club_3')
    expect(bracket.quarterFinals[2].awayClubId).toBe('club_6')
    expect(bracket.quarterFinals[3].homeClubId).toBe('club_4')
    expect(bracket.quarterFinals[3].awayClubId).toBe('club_5')
  })
})

describe('generatePlayoffFixtures', () => {
  it('creates 3 fixtures for a series (best of 3)', () => {
    const series = makeSeries()
    const fixtures = generatePlayoffFixtures(series, 2025, 23)

    expect(fixtures).toHaveLength(3)
    expect(fixtures[0].roundNumber).toBe(23)
    expect(fixtures[1].roundNumber).toBe(24)
    expect(fixtures[2].roundNumber).toBe(25)
  })

  it('alternates home/away correctly: home, away, home', () => {
    const series = makeSeries('club_1', 'club_8')
    const fixtures = generatePlayoffFixtures(series, 2025, 23)

    expect(fixtures[0].homeClubId).toBe('club_1')
    expect(fixtures[0].awayClubId).toBe('club_8')
    expect(fixtures[1].homeClubId).toBe('club_8')
    expect(fixtures[1].awayClubId).toBe('club_1')
    expect(fixtures[2].homeClubId).toBe('club_1')
    expect(fixtures[2].awayClubId).toBe('club_8')
  })

  it('all fixtures are Scheduled status', () => {
    const series = makeSeries()
    const fixtures = generatePlayoffFixtures(series, 2025, 23)
    expect(fixtures.every(f => f.status === FixtureStatus.Scheduled)).toBe(true)
  })
})

describe('isSeriesDecided', () => {
  it('returns false when no wins yet', () => {
    const series = makeSeries()
    expect(isSeriesDecided(series)).toBe(false)
  })

  it('returns true when homeWins >= 2', () => {
    const series = { ...makeSeries(), homeWins: 2 }
    expect(isSeriesDecided(series)).toBe(true)
  })

  it('returns true when awayWins >= 2', () => {
    const series = { ...makeSeries(), awayWins: 2 }
    expect(isSeriesDecided(series)).toBe(true)
  })

  it('returns false with 1-1', () => {
    const series = { ...makeSeries(), homeWins: 1, awayWins: 1 }
    expect(isSeriesDecided(series)).toBe(false)
  })
})

describe('updateSeriesAfterMatch', () => {
  it('returns unchanged series if fixture not in series', () => {
    const series = makeSeries('club_1', 'club_8')
    const fixture = makeFixture('other_series', 'club_1', 'club_8', 3, 1)
    const updated = updateSeriesAfterMatch(series, fixture)
    expect(updated).toEqual(series)
  })

  it('returns unchanged series if fixture not completed', () => {
    const series = { ...makeSeries('club_1', 'club_8'), fixtures: ['fixture_playoff_qf1_s2025_g1'] }
    const fixture = makeFixture('playoff_qf1_s2025', 'club_1', 'club_8', 3, 1)
    const scheduledFixture = { ...fixture, status: FixtureStatus.Scheduled }
    const updated = updateSeriesAfterMatch(series, scheduledFixture)
    expect(updated.homeWins).toBe(0)
  })

  it('increments homeWins when home team (= series home) wins', () => {
    const series = { ...makeSeries('club_1', 'club_8'), fixtures: ['fixture_playoff_qf1_s2025_g1'] }
    const fixture = makeFixture('playoff_qf1_s2025', 'club_1', 'club_8', 3, 1)
    const updated = updateSeriesAfterMatch(series, fixture)
    expect(updated.homeWins).toBe(1)
    expect(updated.awayWins).toBe(0)
  })

  it('increments awayWins when away team (= series home, away fixture) wins', () => {
    const series = { ...makeSeries('club_1', 'club_8'), fixtures: ['fixture_playoff_qf1_s2025_g2'] }
    // Game 2: away fixture so club_8 is home, club_1 is away
    const fixture = makeFixture('playoff_qf1_s2025', 'club_8', 'club_1', 2, 1, 2)
    // club_8 wins the fixture, but club_8 is the series away team, so awayWins++
    const updated = updateSeriesAfterMatch(series, fixture)
    expect(updated.awayWins).toBe(1)
    expect(updated.homeWins).toBe(0)
  })

  it('sets winnerId/loserId when series is decided', () => {
    const series = {
      ...makeSeries('club_1', 'club_8'),
      homeWins: 1,
      fixtures: ['fixture_playoff_qf1_s2025_g2'],
    }
    const fixture = makeFixture('playoff_qf1_s2025', 'club_1', 'club_8', 2, 0, 2)
    const updated = updateSeriesAfterMatch(series, fixture)
    expect(updated.homeWins).toBe(2)
    expect(updated.winnerId).toBe('club_1')
    expect(updated.loserId).toBe('club_8')
  })
})

describe('advancePlayoffRound', () => {
  it('does not advance if QF series not all decided', () => {
    const standings = makeStandings()
    const bracket = generatePlayoffBracket(standings, 2025)
    const { bracket: newBracket, newFixtures } = advancePlayoffRound(bracket, 2025, 26)
    expect(newBracket.status).toBe(PlayoffStatus.QuarterFinals)
    expect(newFixtures).toHaveLength(0)
  })

  it('advances from QF to SF when all QF decided', () => {
    const standings = makeStandings()
    const bracket = generatePlayoffBracket(standings, 2025)

    // Decide all quarter finals
    const decidedBracket = {
      ...bracket,
      quarterFinals: bracket.quarterFinals.map((s, i) => ({
        ...s,
        homeWins: 2,
        awayWins: 0,
        winnerId: s.homeClubId,
        loserId: s.awayClubId,
      })),
    }

    const { bracket: newBracket, newFixtures } = advancePlayoffRound(decidedBracket, 2025, 26)
    expect(newBracket.status).toBe(PlayoffStatus.SemiFinals)
    expect(newBracket.semiFinals).toHaveLength(2)
    expect(newFixtures).toHaveLength(6) // 3 fixtures per SF series
  })

  it('advances from SF to Final when all SF decided', () => {
    const standings = makeStandings()
    const bracket = {
      ...generatePlayoffBracket(standings, 2025),
      status: PlayoffStatus.SemiFinals as const,
      semiFinals: [
        {
          id: 'playoff_sf1_s2025',
          round: PlayoffRound.SemiFinal,
          homeClubId: 'club_1',
          awayClubId: 'club_5',
          fixtures: [],
          homeWins: 2,
          awayWins: 1,
          winnerId: 'club_1',
          loserId: 'club_5',
        },
        {
          id: 'playoff_sf2_s2025',
          round: PlayoffRound.SemiFinal,
          homeClubId: 'club_2',
          awayClubId: 'club_6',
          fixtures: [],
          homeWins: 2,
          awayWins: 0,
          winnerId: 'club_2',
          loserId: 'club_6',
        },
      ],
    }

    const { bracket: newBracket, newFixtures } = advancePlayoffRound(bracket, 2025, 29)
    expect(newBracket.status).toBe(PlayoffStatus.Final)
    expect(newBracket.final).not.toBeNull()
    expect(newBracket.final?.homeClubId).toBe('club_1')
    expect(newBracket.final?.awayClubId).toBe('club_2')
    expect(newFixtures).toHaveLength(3)
  })

  it('marks bracket as Completed when final is decided', () => {
    const bracket = {
      season: 2025,
      status: PlayoffStatus.Final as const,
      quarterFinals: [],
      semiFinals: [],
      final: {
        id: 'playoff_final_s2025',
        round: PlayoffRound.Final,
        homeClubId: 'club_1',
        awayClubId: 'club_2',
        fixtures: [],
        homeWins: 2,
        awayWins: 1,
        winnerId: 'club_1',
        loserId: 'club_2',
      },
      champion: null,
    }

    const { bracket: newBracket, newFixtures } = advancePlayoffRound(bracket, 2025, 32)
    expect(newBracket.status).toBe(PlayoffStatus.Completed)
    expect(newBracket.champion).toBe('club_1')
    expect(newFixtures).toHaveLength(0)
  })
})
