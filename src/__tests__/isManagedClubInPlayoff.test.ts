import { describe, it, expect } from 'vitest'
import { isManagedClubInPlayoff } from '../domain/data/seasonPhases'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { PlayoffBracket, PlayoffSeries } from '../domain/entities/Playoff'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: 'club_a',
    currentDate: '2027-03-01',
    currentSeason: 2026,
    currentMatchday: 28,
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
    lastSavedAt: '2027-03-01T00:00:00',
    phaseMarksSeen: [],
    ...overrides,
  } as SaveGame
}

function makeSeries(overrides: Partial<PlayoffSeries>): PlayoffSeries {
  return {
    id: 'series_1',
    round: 'quarterFinal' as never,
    homeClubId: 'club_a',
    awayClubId: 'club_b',
    fixtures: [],
    homeWins: 0,
    awayWins: 0,
    winnerId: null,
    loserId: null,
    ...overrides,
  }
}

describe('isManagedClubInPlayoff', () => {
  it('returnerar false när playoffBracket är null', () => {
    const game = makeGame({ playoffBracket: null })
    expect(isManagedClubInPlayoff(game)).toBe(false)
  })

  it('returnerar false när managed club är eliminerad (loserId satt)', () => {
    const series = makeSeries({
      homeClubId: 'club_a',
      awayClubId: 'club_b',
      loserId: 'club_a',  // vi förlorade
      fixtures: ['f1'],
    })
    const game = makeGame({
      fixtures: [{ id: 'f1', status: 'scheduled' } as never],
      playoffBracket: {
        season: 2026,
        status: 'active' as never,
        quarterFinals: [series],
        semiFinals: [],
        final: null,
        champion: null,
      } as PlayoffBracket,
    })
    expect(isManagedClubInPlayoff(game)).toBe(false)
  })

  it('returnerar true när managed club har aktiv serie med scheduled fixture', () => {
    const series = makeSeries({
      homeClubId: 'club_a',
      awayClubId: 'club_b',
      loserId: null,
      fixtures: ['f1', 'f2'],
    })
    const game = makeGame({
      fixtures: [
        { id: 'f1', status: 'completed' } as never,
        { id: 'f2', status: 'scheduled' } as never,
      ],
      playoffBracket: {
        season: 2026,
        status: 'active' as never,
        quarterFinals: [series],
        semiFinals: [],
        final: null,
        champion: null,
      } as PlayoffBracket,
    })
    expect(isManagedClubInPlayoff(game)).toBe(true)
  })

  it('returnerar false när managed club inte finns i någon serie', () => {
    const series = makeSeries({
      homeClubId: 'club_x',
      awayClubId: 'club_y',
      loserId: null,
      fixtures: ['f1'],
    })
    const game = makeGame({
      managedClubId: 'club_a',
      fixtures: [{ id: 'f1', status: 'scheduled' } as never],
      playoffBracket: {
        season: 2026,
        status: 'active' as never,
        quarterFinals: [series],
        semiFinals: [],
        final: null,
        champion: null,
      } as PlayoffBracket,
    })
    expect(isManagedClubInPlayoff(game)).toBe(false)
  })

  it('snapshottest — spelare ur slutspelet men ligan har playoff-fixturer kvar → isManagedClubInPlayoff false', () => {
    // Managed club är eliminerad, men andra lag har fortfarande scheduled fixtures med matchday > 26
    const managedSeries = makeSeries({
      homeClubId: 'club_a',
      awayClubId: 'club_b',
      loserId: 'club_a',  // eliminerad
      fixtures: ['f1'],
    })
    const otherSeries = makeSeries({
      id: 'series_2',
      homeClubId: 'club_x',
      awayClubId: 'club_y',
      loserId: null,
      fixtures: ['f2'],
    })
    const game = makeGame({
      managedClubId: 'club_a',
      fixtures: [
        { id: 'f1', status: 'completed', matchday: 27 } as never,
        { id: 'f2', status: 'scheduled', matchday: 28 } as never,
      ],
      playoffBracket: {
        season: 2026,
        status: 'active' as never,
        quarterFinals: [managedSeries, otherSeries],
        semiFinals: [],
        final: null,
        champion: null,
      } as PlayoffBracket,
    })
    expect(isManagedClubInPlayoff(game)).toBe(false)
  })
})
