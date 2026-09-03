import { describe, it, expect } from 'vitest'
import { getPlayoffFixtureContext, getPlayoffSeriesContext } from '../domain/services/portal/playoffSeriesContext'
import { PlayoffRound, PlayoffStatus } from '../domain/enums'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'
import type { PlayoffSeries, PlayoffBracket } from '../domain/entities/Playoff'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFixture(id: string, homeId: string, awayId: string, homeScore: number, awayScore: number): Fixture {
  return {
    id,
    leagueId: 'l1',
    season: 2026,
    roundNumber: 27,
    matchday: 27,
    homeClubId: homeId,
    awayClubId: awayId,
    status: 'completed',
    homeScore,
    awayScore,
    events: [],
    isCup: false,
    isKnockout: true,
  } as Fixture
}

function makeScheduledFixture(id: string, homeId: string, awayId: string): Fixture {
  return {
    id,
    leagueId: 'l1',
    season: 2026,
    roundNumber: 27,
    matchday: 27,
    homeClubId: homeId,
    awayClubId: awayId,
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0,
    events: [],
    isCup: false,
    isKnockout: true,
  } as Fixture
}

function makeSeries(
  id: string,
  round: PlayoffRound,
  homeClubId: string,
  awayClubId: string,
  fixtureIds: string[],
  homeWins: number,
  awayWins: number,
  winnerId: string | null = null,
  loserId: string | null = null
): PlayoffSeries {
  return { id, round, homeClubId, awayClubId, fixtures: fixtureIds, homeWins, awayWins, winnerId, loserId }
}

function makeBracket(overrides: Partial<PlayoffBracket> = {}): PlayoffBracket {
  return {
    season: 2026,
    status: PlayoffStatus.InProgress,
    quarterFinals: [],
    semiFinals: [],
    final: null,
    champion: null,
    ...overrides,
  }
}

function makeGame(
  managedClubId: string,
  bracket: PlayoffBracket | null,
  fixtures: Fixture[]
): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId,
    currentDate: '2026-03-15',
    currentSeason: 2026,
    currentMatchday: 27,
    clubs: [] as never,
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures,
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: bracket,
    cupBracket: null,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    mentorships: [],
    loanDeals: [],
    academyLevel: 'none' as never,
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    seasonSummaries: [],
    version: '1.0',
    lastSavedAt: '2026-03-15T00:00:00',
  } as SaveGame
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getPlayoffSeriesContext', () => {

  it('returns null when no playoffBracket', () => {
    const game = makeGame('club_a', null, [])
    expect(getPlayoffSeriesContext(game)).toBeNull()
  })

  it('returns null when managed club has no active series (eliminated)', () => {
    // managed club is loserId
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', [], 2, 0, 'club_a', 'club_b')
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_b', bracket, [])
    expect(getPlayoffSeriesContext(game)).toBeNull()
  })

  it('KF G1 (0-0, no completed games): weight=1, criticality=open, nextGame=1', () => {
    const f1 = makeScheduledFixture('f1', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['f1'], 0, 0)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [f1])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.round).toBe(PlayoffRound.QuarterFinal)
    expect(ctx!.criticality).toBe('open')
    expect(ctx!.weight).toBe(1)
    expect(ctx!.wins).toBe(0)
    expect(ctx!.losses).toBe(0)
    expect(ctx!.nextGame).toBe(1)
  })

  it('KF G4 (2-1, 3 completed): weight=2, criticality=matchpuck', () => {
    // club_a leads 2-1 — needs one more win (matchpuck for both sides actually,
    // but per spec: wins===2 || losses===2 → matchpuck)
    const g1 = makeFixture('g1', 'club_a', 'club_b', 5, 2) // club_a wins
    const g2 = makeFixture('g2', 'club_b', 'club_a', 4, 1) // club_a loses
    const g3 = makeFixture('g3', 'club_a', 'club_b', 3, 1) // club_a wins
    const g4 = makeScheduledFixture('g4', 'club_b', 'club_a')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1', 'g2', 'g3', 'g4'], 2, 1)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [g1, g2, g3, g4])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.criticality).toBe('matchpuck')
    expect(ctx!.weight).toBe(2) // baseWeight=1 + critBonus=1 = 2, cap=2
    expect(ctx!.wins).toBe(2)
    expect(ctx!.losses).toBe(1)
    expect(ctx!.nextGame).toBe(4)
  })

  it('KF G5 (2-2, 4 completed): weight=2 (capped at 2), criticality=decisive', () => {
    const g1 = makeFixture('g1', 'club_a', 'club_b', 5, 2) // club_a wins
    const g2 = makeFixture('g2', 'club_b', 'club_a', 4, 1) // club_a loses (away)
    const g3 = makeFixture('g3', 'club_a', 'club_b', 3, 1) // club_a wins
    const g4 = makeFixture('g4', 'club_b', 'club_a', 3, 2) // club_a loses
    const g5 = makeScheduledFixture('g5', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1', 'g2', 'g3', 'g4', 'g5'], 2, 2)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [g1, g2, g3, g4, g5])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.criticality).toBe('decisive')
    // KF: baseWeight=1 + critBonus=2 = 3, but cap=2 → weight=2
    expect(ctx!.weight).toBe(2)
    expect(ctx!.wins).toBe(2)
    expect(ctx!.losses).toBe(2)
    expect(ctx!.nextGame).toBe(5)
  })

  it('SF G4 (2-1, 3 completed): weight=2 (capped), criticality=matchpuck', () => {
    // SF: club_a leads 2-1
    const g1 = makeFixture('g1', 'club_a', 'club_b', 5, 2) // club_a wins
    const g2 = makeFixture('g2', 'club_b', 'club_a', 4, 1) // club_a loses
    const g3 = makeFixture('g3', 'club_a', 'club_b', 3, 1) // club_a wins
    const g4 = makeScheduledFixture('g4', 'club_b', 'club_a')
    const series = makeSeries('s1', PlayoffRound.SemiFinal, 'club_a', 'club_b', ['g1', 'g2', 'g3', 'g4'], 2, 1)
    const bracket = makeBracket({ semiFinals: [series] })
    const game = makeGame('club_a', bracket, [g1, g2, g3, g4])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.round).toBe(PlayoffRound.SemiFinal)
    expect(ctx!.criticality).toBe('matchpuck')
    // SF: baseWeight=2 + critBonus=1 = 3, cap=2 → weight=2
    expect(ctx!.weight).toBe(2)
  })

  it('SM-Final G1 (0-0): weight=3, criticality=open', () => {
    const g1 = makeScheduledFixture('g1', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.Final, 'club_a', 'club_b', ['g1'], 0, 0)
    const bracket = makeBracket({ final: series })
    const game = makeGame('club_a', bracket, [g1])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.round).toBe(PlayoffRound.Final)
    expect(ctx!.criticality).toBe('open')
    // Final: baseWeight=3 + critBonus=0 = 3, cap=3 → weight=3
    expect(ctx!.weight).toBe(3)
    expect(ctx!.nextGame).toBe(1)
  })

  it('SM-Final G5 (2-2): weight=3, criticality=decisive', () => {
    const g1 = makeFixture('g1', 'club_a', 'club_b', 5, 2) // club_a wins
    const g2 = makeFixture('g2', 'club_b', 'club_a', 4, 1) // club_a loses
    const g3 = makeFixture('g3', 'club_a', 'club_b', 3, 1) // club_a wins
    const g4 = makeFixture('g4', 'club_b', 'club_a', 3, 2) // club_a loses
    const g5 = makeScheduledFixture('g5', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.Final, 'club_a', 'club_b', ['g1', 'g2', 'g3', 'g4', 'g5'], 2, 2)
    const bracket = makeBracket({ final: series })
    const game = makeGame('club_a', bracket, [g1, g2, g3, g4, g5])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.round).toBe(PlayoffRound.Final)
    expect(ctx!.criticality).toBe('decisive')
    // Final: baseWeight=3 + critBonus=2 = 5, cap=3 → weight=3
    expect(ctx!.weight).toBe(3)
    expect(ctx!.wins).toBe(2)
    expect(ctx!.losses).toBe(2)
  })

  it('returns null when managed club has no active series in bracket', () => {
    // club_c not in any series
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', [], 0, 0)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_c', bracket, [])
    expect(getPlayoffSeriesContext(game)).toBeNull()
  })

  // DOMLOGG §4 (2026-08-31): rotorsak var att wins/losses räknades ur rå
  // homeScore/awayScore — en straffavgjord match har homeScore===awayScore
  // i grundtiden, så raw-jämförelsen föll alltid på förlust-grenen oavsett
  // vem som faktiskt vann på straffar. Regressionstest, en straffseger.
  it('penalty shootout win counts as a win, not homeScore===awayScore→loss', () => {
    const g1: Fixture = {
      ...makeFixture('g1', 'club_a', 'club_b', 2, 2),
      wentToPenalties: true,
      penaltyResult: { home: 3, away: 1 }, // club_a (home) wins on penalties
    }
    const g2 = makeScheduledFixture('g2', 'club_b', 'club_a')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1', 'g2'], 1, 0)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [g1, g2])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.wins).toBe(1)
    expect(ctx!.losses).toBe(0)
  })

  it('overtime win counts as a win despite homeScore===awayScore', () => {
    const g1: Fixture = {
      ...makeFixture('g1', 'club_a', 'club_b', 3, 3),
      overtimeResult: 'home', // club_a (home) wins in overtime
    }
    const g2 = makeScheduledFixture('g2', 'club_b', 'club_a')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1', 'g2'], 1, 0)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [g1, g2])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.wins).toBe(1)
    expect(ctx!.losses).toBe(0)
  })

  it('away team penalty win counts as an away loss for the managed home club', () => {
    const g1: Fixture = {
      ...makeFixture('g1', 'club_a', 'club_b', 1, 1),
      wentToPenalties: true,
      penaltyResult: { home: 2, away: 4 }, // club_b (away) wins on penalties
    }
    const g2 = makeScheduledFixture('g2', 'club_b', 'club_a')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1', 'g2'], 0, 1)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [g1, g2])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.wins).toBe(0)
    expect(ctx!.losses).toBe(1)
  })

})

describe('getPlayoffFixtureContext — retrospektiv matchidentitet', () => {
  it('returnerar den spelade matchens ordinal, inte nästa match i serien', () => {
    const g1 = makeFixture('g1', 'club_a', 'club_b', 5, 2)
    const g2 = makeScheduledFixture('g2', 'club_b', 'club_a')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1', 'g2'], 1, 0)
    const game = makeGame('club_a', makeBracket({ quarterFinals: [series] }), [g1, g2])

    expect(getPlayoffFixtureContext(game, 'g1')).toEqual({
      round: PlayoffRound.QuarterFinal,
      gameNumber: 1,
    })
  })

  it('fungerar även när serien är avgjord och därför inte längre är aktiv', () => {
    const g1 = makeFixture('g1', 'club_a', 'club_b', 5, 2)
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['g1'], 3, 0, 'club_a', 'club_b')
    const game = makeGame('club_a', makeBracket({ quarterFinals: [series] }), [g1])

    expect(getPlayoffSeriesContext(game)).toBeNull()
    expect(getPlayoffFixtureContext(game, 'g1')?.gameNumber).toBe(1)
  })
})
