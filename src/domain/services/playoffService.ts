import type { StandingRow } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { PlayoffBracket, PlayoffSeries } from '../entities/Playoff'
import { PlayoffStatus, PlayoffRound, FixtureStatus } from '../enums'
import { SM_FINAL_VENUE } from '../data/specialDateStrings'

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

export function maxMatchesInSeries(round: PlayoffRound): number {
  return round === PlayoffRound.Final ? 1 : 5
}

/**
 * Vilken slutspelsfas en fixture tillhör — enda uppslaget fixture → PlayoffRound.
 *
 * PlayoffSeries har ingen fixture→fas-pekare, bara `fixtures: string[]` per
 * gren, så uppslaget måste gå åt andra hållet. Fanns tidigare duplicerat i
 * matchTypeAxes.deriveSkede, PortalScreen, MatchScreen, ChampionScreen och
 * situationService — nu ett ställe.
 */
export function getPlayoffRoundForFixture(
  bracket: PlayoffBracket | null | undefined,
  fixtureId: string,
): PlayoffRound | null {
  if (!bracket) return null
  if (bracket.final?.fixtures.includes(fixtureId)) return PlayoffRound.Final
  if (bracket.semiFinals.some(s => s.fixtures.includes(fixtureId))) return PlayoffRound.SemiFinal
  if (bracket.quarterFinals.some(s => s.fixtures.includes(fixtureId))) return PlayoffRound.QuarterFinal
  return null
}

/**
 * Nästa lediga (roundNumber, matchday) för en slutspelsomgångs fixtures.
 *
 * ROTORSAK (HIGH 5, audit 2026-08-29): `startRound` var tidigare ett HÅRDKODAT
 * tal på tre anropsställen som beskrev SAMMA övergång och inte var överens —
 * playoffTransition.ts sa 23 för kvartsfinalstarten, matchActions.ts sa
 * 26/29/32 för QF→SF→final, playoffProcessor.ts sa 28/33/36 för samma
 * övergångar. Ingen av dem härleddes ur något; det var tre gissningar.
 * `matchday` däremot härleddes redan korrekt (max+1) på alla tre ställen.
 *
 * Fixen är att härleda `roundNumber` PÅ SAMMA SÄTT: räkna vidare från där
 * ligan slutade. Två anropsställen kan då inte längre säga olika, för de
 * hårdkodar inget. Slutspelets roundNumber är fortfarande inget spelaren ska
 * SE (använd getRoundLabel), men fältet är nu monotont och > 22, vilket
 * `fixture.roundNumber > 22`-grindarna i matchSimProcessor.ts och
 * economyService.ts redan förutsätter.
 */
export function nextPlayoffStart(
  fixtures: Array<Pick<Fixture, 'roundNumber' | 'matchday'>>,
): { startRound: number; startMatchday: number } {
  return {
    startRound: Math.max(0, ...fixtures.map(f => f.roundNumber ?? 0)) + 1,
    startMatchday: Math.max(0, ...fixtures.map(f => f.matchday ?? 0)) + 1,
  }
}

export function generatePlayoffFixtures(
  series: PlayoffSeries,
  season: number,
  startRound: number,
  startMatchday: number,
): Fixture[] {
  const isFinal = series.round === PlayoffRound.Final
  if (isFinal) {
    // SM-final: one match at neutral venue
    return [{
      id: `fixture_${series.id}_g1`,
      leagueId: `league_${season}`,
      season,
      roundNumber: startRound,
      matchday: startMatchday,
      homeClubId: series.homeClubId,
      awayClubId: series.awayClubId,
      status: FixtureStatus.Scheduled,
      homeScore: 0,
      awayScore: 0,
      events: [],
      report: undefined,
      homeLineup: undefined,
      awayLineup: undefined,
      isNeutralVenue: true,
      isKnockout: true,
      isFinaldag: true,
      arenaName: SM_FINAL_VENUE.arenaName,
      venueCity: SM_FINAL_VENUE.city,
    }]
  }

  // Best-of-5: home, away, home, away, home
  const matchups = [
    { home: series.homeClubId, away: series.awayClubId },
    { home: series.awayClubId, away: series.homeClubId },
    { home: series.homeClubId, away: series.awayClubId },
    { home: series.awayClubId, away: series.homeClubId },
    { home: series.homeClubId, away: series.awayClubId },
  ]
  return matchups.map((m, i) => ({
    id: `fixture_${series.id}_g${i + 1}`,
    leagueId: `league_${season}`,
    season,
    roundNumber: startRound + i,
    matchday: startMatchday + i,
    homeClubId: m.home,
    awayClubId: m.away,
    status: FixtureStatus.Scheduled,
    homeScore: 0,
    awayScore: 0,
    events: [],
    report: undefined,
    homeLineup: undefined,
    awayLineup: undefined,
    isKnockout: true,
  }))
}

export function isSeriesDecided(series: PlayoffSeries): boolean {
  if (series.round === PlayoffRound.Final) {
    return series.homeWins >= 1 || series.awayWins >= 1
  }
  return series.homeWins >= 3 || series.awayWins >= 3
}

/**
 * VARJE anropare som skriver resultatet av denna funktion till game.playoffBracket
 * MÅSTE, i samma anrop/objekt som muterar bracketen, filtrera
 * game.pendingEvents/deferredDecisions via isPlayoffNarrativeCardStillValid
 * (playoffNarrativeService.ts) mot den NYA bracketen — direkt vid mutationsstället
 * eller ett steg upp i anropskedjan. Utan det kan ett slutspelskort som just blivit
 * inaktuellt (t.ex. det egna laget utslaget) bli kvar synligt i Portalen. Se
 * playoffBracketMutationCallers.test.ts, som failar om en ny anropare dyker upp
 * utan att listan där medvetet uppdaterats.
 */
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
    // Draw in knockout: resolved by overtime or penalties
    if (!fixture.overtimeResult && !fixture.penaltyResult) {
      // No tiebreaker recorded — skip this result to avoid silently corrupting the series
      return series
    }
    let winner: 'home' | 'away'
    if (fixture.overtimeResult) {
      winner = fixture.overtimeResult
    } else {
      winner = (fixture.penaltyResult!.home > fixture.penaltyResult!.away) ? 'home' : 'away'
    }
    if (winner === 'home') {
      if (fixture.homeClubId === series.homeClubId) homeWins++
      else awayWins++
    } else {
      if (fixture.awayClubId === series.homeClubId) homeWins++
      else awayWins++
    }
  }

  const updated: PlayoffSeries = { ...series, homeWins, awayWins }
  const winsNeeded = series.round === PlayoffRound.Final ? 1 : 3
  if (homeWins >= winsNeeded) {
    updated.winnerId = series.homeClubId
    updated.loserId = series.awayClubId
  } else if (awayWins >= winsNeeded) {
    updated.winnerId = series.awayClubId
    updated.loserId = series.homeClubId
  }
  return updated
}

/**
 * VARJE anropare som skriver resultatet av denna funktion till game.playoffBracket
 * MÅSTE, i samma anrop/objekt som muterar bracketen, filtrera
 * game.pendingEvents/deferredDecisions via isPlayoffNarrativeCardStillValid
 * (playoffNarrativeService.ts) mot den NYA bracketen — direkt vid mutationsstället
 * eller ett steg upp i anropskedjan. Utan det kan ett slutspelskort som just blivit
 * inaktuellt (t.ex. det egna laget utslaget) bli kvar synligt i Portalen. Se
 * playoffBracketMutationCallers.test.ts, som failar om en ny anropare dyker upp
 * utan att listan där medvetet uppdaterats.
 */
export function advancePlayoffRound(
  bracket: PlayoffBracket,
  season: number,
  nextRoundStart: number,
  nextMatchdayStart: number,
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
    const sf1Fixtures = generatePlayoffFixtures(sf1, season, nextRoundStart, nextMatchdayStart)
    const sf2Fixtures = generatePlayoffFixtures(sf2, season, nextRoundStart, nextMatchdayStart)
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
    const finalFixtures = generatePlayoffFixtures(final, season, nextRoundStart, nextMatchdayStart)
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

/**
 * GRANSKA DEL 4 (2026-08-11), steg 5 — slutspelets motsvarighet till
 * cupService.ts:s getManagedClubCupStatus. Ingen ny mekanik: bara en
 * derivering ur fält som redan finns (bracket.champion, series.winnerId/
 * loserId) — samma data Turneringsläge-sektionen ändå behöver läsa.
 */
export function getManagedClubPlayoffStatus(
  bracket: PlayoffBracket,
  managedClubId: string,
): { eliminated: boolean; eliminatedInRound?: PlayoffRound; isInFinal: boolean; won: boolean } {
  if (bracket.champion === managedClubId) {
    return { eliminated: false, isInFinal: false, won: true }
  }

  const allSeries = [...bracket.quarterFinals, ...bracket.semiFinals, ...(bracket.final ? [bracket.final] : [])]
    .filter(s => s.homeClubId === managedClubId || s.awayClubId === managedClubId)

  const roundsMostAdvancedFirst = [PlayoffRound.Final, PlayoffRound.SemiFinal, PlayoffRound.QuarterFinal]
  for (const round of roundsMostAdvancedFirst) {
    const series = allSeries.find(s => s.round === round)
    if (series?.loserId === managedClubId) {
      return { eliminated: true, eliminatedInRound: round, isInFinal: false, won: false }
    }
  }

  const finalSeries = allSeries.find(s => s.round === PlayoffRound.Final)
  if (finalSeries && !finalSeries.winnerId) {
    return { eliminated: false, isInFinal: true, won: false }
  }

  return { eliminated: false, isInFinal: false, won: false }
}
