import type { StandingRow } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { PlayoffBracket, PlayoffSeries } from '../entities/Playoff'
import { PlayoffStatus, PlayoffRound, FixtureStatus } from '../enums'

export function generatePlayoffBracket(standings: StandingRow[], season: number): PlayoffBracket {
  const top8 = standings
    .filter(s => s.position <= 8)
    .sort((a, b) => a.position - b.position)

  // #1 vs #8, #2 vs #7, #3 vs #6, #4 vs #5
  const matchups: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4]]

  const quarterFinals: PlayoffSeries[] = matchups.map(([seedH, seedA], i) => ({
    id: `playoff_qf${i + 1}_s${season}`,
    round: PlayoffRound.QuarterFinal,
    homeClubId: top8[seedH].clubId,
    awayClubId: top8[seedA].clubId,
    fixtures: [],
    homeWins: 0,
    awayWins: 0,
    winnerId: null,
    loserId: null,
  }))

  return {
    season,
    status: PlayoffStatus.QuarterFinals,
    quarterFinals,
    semiFinals: [],
    final: null,
    champion: null,
  }
}

export function generatePlayoffFixtures(
  series: PlayoffSeries,
  season: number,
  startRound: number,
): Fixture[] {
  // Best-of-3: home, away, home (for highest seeded)
  const matchups = [
    { home: series.homeClubId, away: series.awayClubId },
    { home: series.awayClubId, away: series.homeClubId },
    { home: series.homeClubId, away: series.awayClubId },
  ]
  return matchups.map((m, i) => ({
    id: `fixture_${series.id}_g${i + 1}`,
    leagueId: `league_${season}`,
    season,
    roundNumber: startRound + i,
    homeClubId: m.home,
    awayClubId: m.away,
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    report: undefined,
    homeLineup: undefined,
    awayLineup: undefined,
  }))
}

export function isSeriesDecided(series: PlayoffSeries): boolean {
  return series.homeWins >= 2 || series.awayWins >= 2
}

export function updateSeriesAfterMatch(
  series: PlayoffSeries,
  fixture: Fixture,
): PlayoffSeries {
  if (!series.fixtures.includes(fixture.id)) return series
  if (fixture.status !== FixtureStatus.Completed) return series

  let { homeWins, awayWins } = series

  if (fixture.homeScore > fixture.awayScore) {
    if (fixture.homeClubId === series.homeClubId) homeWins++
    else awayWins++
  } else if (fixture.awayScore > fixture.homeScore) {
    if (fixture.awayClubId === series.homeClubId) homeWins++
    else awayWins++
  } else {
    // Draw: home team of fixture wins (overtime, simplified)
    if (fixture.homeClubId === series.homeClubId) homeWins++
    else awayWins++
  }

  const updated: PlayoffSeries = { ...series, homeWins, awayWins }
  if (homeWins >= 2) {
    updated.winnerId = series.homeClubId
    updated.loserId = series.awayClubId
  } else if (awayWins >= 2) {
    updated.winnerId = series.awayClubId
    updated.loserId = series.homeClubId
  }
  return updated
}

export function advancePlayoffRound(
  bracket: PlayoffBracket,
  season: number,
  nextRoundStart: number,
): { bracket: PlayoffBracket; newFixtures: Fixture[] } {
  if (bracket.status === PlayoffStatus.QuarterFinals) {
    if (!bracket.quarterFinals.every(s => isSeriesDecided(s))) {
      return { bracket, newFixtures: [] }
    }
    const qfWinners = bracket.quarterFinals.map(s => s.winnerId!)
    const sf1: PlayoffSeries = {
      id: `playoff_sf1_s${season}`,
      round: PlayoffRound.SemiFinal,
      homeClubId: qfWinners[0],
      awayClubId: qfWinners[3],
      fixtures: [],
      homeWins: 0,
      awayWins: 0,
      winnerId: null,
      loserId: null,
    }
    const sf2: PlayoffSeries = {
      id: `playoff_sf2_s${season}`,
      round: PlayoffRound.SemiFinal,
      homeClubId: qfWinners[1],
      awayClubId: qfWinners[2],
      fixtures: [],
      homeWins: 0,
      awayWins: 0,
      winnerId: null,
      loserId: null,
    }
    const sf1Fixtures = generatePlayoffFixtures(sf1, season, nextRoundStart)
    const sf2Fixtures = generatePlayoffFixtures(sf2, season, nextRoundStart)
    sf1.fixtures = sf1Fixtures.map(f => f.id)
    sf2.fixtures = sf2Fixtures.map(f => f.id)
    return {
      bracket: { ...bracket, status: PlayoffStatus.SemiFinals, semiFinals: [sf1, sf2] },
      newFixtures: [...sf1Fixtures, ...sf2Fixtures],
    }
  }

  if (bracket.status === PlayoffStatus.SemiFinals) {
    if (!bracket.semiFinals.every(s => isSeriesDecided(s))) {
      return { bracket, newFixtures: [] }
    }
    const final: PlayoffSeries = {
      id: `playoff_final_s${season}`,
      round: PlayoffRound.Final,
      homeClubId: bracket.semiFinals[0].winnerId!,
      awayClubId: bracket.semiFinals[1].winnerId!,
      fixtures: [],
      homeWins: 0,
      awayWins: 0,
      winnerId: null,
      loserId: null,
    }
    const finalFixtures = generatePlayoffFixtures(final, season, nextRoundStart)
    final.fixtures = finalFixtures.map(f => f.id)
    return {
      bracket: { ...bracket, status: PlayoffStatus.Final, final },
      newFixtures: finalFixtures,
    }
  }

  if (bracket.status === PlayoffStatus.Final && bracket.final) {
    if (!isSeriesDecided(bracket.final)) {
      return { bracket, newFixtures: [] }
    }
    return {
      bracket: {
        ...bracket,
        status: PlayoffStatus.Completed,
        champion: bracket.final.winnerId,
      },
      newFixtures: [],
    }
  }

  return { bracket, newFixtures: [] }
}
