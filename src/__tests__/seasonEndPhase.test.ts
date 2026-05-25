import { describe, it, expect } from 'vitest'
import { getSeasonEndPhase } from '../domain/data/seasonEndPhase'
import type { SaveGame } from '../domain/entities/SaveGame'
import { FixtureStatus, PlayoffStatus, PlayoffRound } from '../domain/enums'
import type { PlayoffBracket, PlayoffSeries } from '../domain/entities/Playoff'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_a',
    currentDate: '2026-10-15',
    currentSeason: 2,
    currentMatchday: 5,
    clubs: [],
    players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never,
    fixtures: [],
    standings: [],
    inbox: [],
    transferState: {} as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    pendingEvents: [],
    deferredDecisions: [],
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
    lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

function makeLeagueFixture(roundNumber: number, homeId = 'club_a', awayId = 'club_b', status: FixtureStatus = FixtureStatus.Completed) {
  return {
    id: `f_${roundNumber}_${homeId}`,
    season: 2,
    matchday: roundNumber,
    roundNumber,
    homeClubId: homeId,
    awayClubId: awayId,
    homeScore: 3,
    awayScore: 2,
    status,
    isCup: false,
  } as never
}

function makePlayoffBracket(overrides: Partial<PlayoffBracket> = {}): PlayoffBracket {
  return {
    season: 2,
    status: PlayoffStatus.QuarterFinals,
    quarterFinals: [],
    semiFinals: [],
    final: null,
    champion: null,
    ...overrides,
  }
}

function makePlayoffSeries(homeId: string, awayId: string, overrides: Partial<PlayoffSeries> = {}): PlayoffSeries {
  return {
    id: `series_${homeId}_${awayId}`,
    round: PlayoffRound.QuarterFinal,
    homeClubId: homeId,
    awayClubId: awayId,
    fixtures: ['f_qf_1'],
    homeWins: 0,
    awayWins: 0,
    winnerId: null,
    loserId: null,
    ...overrides,
  }
}

describe('getSeasonEndPhase', () => {
  it('pre_season: inga matcher spelade', () => {
    const game = makeGame({ fixtures: [] })
    expect(getSeasonEndPhase(game)).toBe('pre_season')
  })

  it('regular_active: omgång 1 spelad', () => {
    const game = makeGame({
      fixtures: [makeLeagueFixture(1)],
    })
    expect(getSeasonEndPhase(game)).toBe('regular_active')
  })

  it('regular_active: omgång 11 spelad', () => {
    const fixtures = Array.from({ length: 11 }, (_, i) => makeLeagueFixture(i + 1))
    const game = makeGame({ fixtures })
    expect(getSeasonEndPhase(game)).toBe('regular_active')
  })

  it('regular_done: omgång 22 spelad, ingen bracket', () => {
    const fixtures = Array.from({ length: 22 }, (_, i) => makeLeagueFixture(i + 1))
    const game = makeGame({ fixtures, playoffBracket: null })
    expect(getSeasonEndPhase(game)).toBe('regular_done')
  })

  it('playoff_active: bracket finns, managed club i aktiv serie', () => {
    const series = makePlayoffSeries('club_a', 'club_b', {
      fixtures: ['f_qf_1'],
    })
    const scheduledFixture = {
      id: 'f_qf_1',
      status: FixtureStatus.Scheduled,
      isCup: false,
      homeClubId: 'club_a',
      awayClubId: 'club_b',
    } as never

    const bracket = makePlayoffBracket({
      quarterFinals: [series],
      status: PlayoffStatus.QuarterFinals,
    })
    const game = makeGame({
      fixtures: [scheduledFixture],
      playoffBracket: bracket,
    })
    expect(getSeasonEndPhase(game)).toBe('playoff_active')
  })

  it('playoff_spectator: bracket finns, managed eliminerad', () => {
    const managedSeries = makePlayoffSeries('club_a', 'club_b', {
      loserId: 'club_a',
      winnerId: 'club_b',
    })
    const otherSeries = makePlayoffSeries('club_c', 'club_d', {
      fixtures: ['f_qf_2'],
    })
    const otherScheduled = {
      id: 'f_qf_2',
      status: FixtureStatus.Scheduled,
      isCup: false,
      homeClubId: 'club_c',
      awayClubId: 'club_d',
    } as never

    const bracket = makePlayoffBracket({
      quarterFinals: [managedSeries, otherSeries],
      status: PlayoffStatus.QuarterFinals,
    })
    const game = makeGame({
      fixtures: [otherScheduled],
      playoffBracket: bracket,
    })
    expect(getSeasonEndPhase(game)).toBe('playoff_spectator')
  })

  it('season_done: bracket status Completed', () => {
    const bracket = makePlayoffBracket({
      status: PlayoffStatus.Completed,
      champion: 'club_b',
    })
    const game = makeGame({ playoffBracket: bracket })
    expect(getSeasonEndPhase(game)).toBe('season_done')
  })

  it('playoff_spectator: managed aldrig i bracket (position 9+)', () => {
    const series1 = makePlayoffSeries('club_b', 'club_c', { fixtures: ['f1'] })
    const series2 = makePlayoffSeries('club_d', 'club_e', { fixtures: ['f2'] })
    const s1 = { id: 'f1', status: FixtureStatus.Scheduled, isCup: false, homeClubId: 'club_b', awayClubId: 'club_c' } as never
    const s2 = { id: 'f2', status: FixtureStatus.Scheduled, isCup: false, homeClubId: 'club_d', awayClubId: 'club_e' } as never

    const bracket = makePlayoffBracket({
      quarterFinals: [series1, series2],
      status: PlayoffStatus.QuarterFinals,
    })
    const game = makeGame({
      fixtures: [s1, s2],
      playoffBracket: bracket,
    })
    expect(getSeasonEndPhase(game)).toBe('playoff_spectator')
  })
})
