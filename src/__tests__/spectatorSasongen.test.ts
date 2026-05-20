import { describe, it, expect } from 'vitest'
import { isManagedClubInPlayoff, isManagedClubSpectator } from '../domain/data/seasonPhases'
import { computeNextAnslag } from '../domain/services/anslagService'
import type { SaveGame } from '../domain/entities/SaveGame'
import { FixtureStatus, PlayoffRound } from '../domain/enums'

function makeSeries(
  id: string,
  round: PlayoffRound,
  home: string,
  away: string,
  fixtures: string[] = [],
  loserId: string | null = null,
  winnerId: string | null = null,
) {
  return { id, round, homeClubId: home, awayClubId: away, fixtures, loserId, winnerId, status: 'completed' }
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    currentSeason: 1,
    currentMatchday: 28,
    managedClubId: 'managed',
    clubs: [],
    players: [],
    fixtures: [],
    standings: [],
    currentDate: '2026-03-15',
    seenAnslag: [],
    phaseMarksSeen: [],
    ...overrides,
  } as unknown as SaveGame
}

function makeScheduledFixture(id: string, matchday: number, home: string, away: string) {
  return { id, matchday, homeClubId: home, awayClubId: away, status: FixtureStatus.Scheduled, isCup: false, roundNumber: matchday, season: 1, leagueId: 'l1', homeScore: 0, awayScore: 0, events: [] }
}

describe('isManagedClubInPlayoff + isManagedClubSpectator — invariant', () => {
  it('never both true at same time', () => {
    // Managed still active
    const activeFixtureId = 'f1'
    const game1 = makeGame({
      fixtures: [makeScheduledFixture(activeFixtureId, 27, 'managed', 'club_b')],
      playoffBracket: {
        quarterFinals: [makeSeries('s1', PlayoffRound.QuarterFinal, 'managed', 'club_b', [activeFixtureId])],
        semiFinals: [],
        final: null,
        status: 'active',
      } as unknown as SaveGame['playoffBracket'],
    })
    const inPlayoff1 = isManagedClubInPlayoff(game1)
    const spectator1 = isManagedClubSpectator(game1)
    expect(inPlayoff1 && spectator1).toBe(false)

    // Managed eliminated, others remain
    const otherFixtureId = 'f2'
    const game2 = makeGame({
      fixtures: [makeScheduledFixture(otherFixtureId, 29, 'club_c', 'club_d')],
      playoffBracket: {
        quarterFinals: [
          makeSeries('s1', PlayoffRound.QuarterFinal, 'managed', 'club_b', [], 'managed', 'club_b'),
          makeSeries('s2', PlayoffRound.QuarterFinal, 'club_c', 'club_d', [otherFixtureId]),
        ],
        semiFinals: [],
        final: null,
        status: 'active',
      } as unknown as SaveGame['playoffBracket'],
    })
    const inPlayoff2 = isManagedClubInPlayoff(game2)
    const spectator2 = isManagedClubSpectator(game2)
    expect(inPlayoff2 && spectator2).toBe(false)
    expect(spectator2).toBe(true)
    expect(inPlayoff2).toBe(false)
  })

  it('spectator returns false when no bracket', () => {
    const game = makeGame({ playoffBracket: undefined })
    expect(isManagedClubSpectator(game)).toBe(false)
  })

  it('spectator returns false when managed is still active', () => {
    const fid = 'f1'
    const game = makeGame({
      fixtures: [makeScheduledFixture(fid, 27, 'managed', 'club_b')],
      playoffBracket: {
        quarterFinals: [makeSeries('s1', PlayoffRound.QuarterFinal, 'managed', 'club_b', [fid])],
        semiFinals: [],
        final: null,
        status: 'active',
      } as unknown as SaveGame['playoffBracket'],
    })
    expect(isManagedClubSpectator(game)).toBe(false)
  })

  it('spectator returns false when all playoff done (no other matches remain)', () => {
    const game = makeGame({
      fixtures: [],
      playoffBracket: {
        quarterFinals: [
          makeSeries('s1', PlayoffRound.QuarterFinal, 'managed', 'club_b', [], 'managed', 'club_b'),
        ],
        semiFinals: [],
        final: null,
        status: 'completed',
      } as unknown as SaveGame['playoffBracket'],
    })
    expect(isManagedClubSpectator(game)).toBe(false)
  })
})

describe('computeNextAnslag — playoff elimination', () => {
  it('returns playoff_eliminated_kf when managed lost KF and others remain', () => {
    const otherFid = 'f99'
    const game = makeGame({
      fixtures: [makeScheduledFixture(otherFid, 29, 'club_c', 'club_d')],
      playoffBracket: {
        quarterFinals: [
          makeSeries('s1', PlayoffRound.QuarterFinal, 'managed', 'club_b', [], 'managed', 'club_b'),
          makeSeries('s2', PlayoffRound.QuarterFinal, 'club_c', 'club_d', [otherFid]),
        ],
        semiFinals: [],
        final: null,
        status: 'active',
      } as unknown as SaveGame['playoffBracket'],
    })
    const result = computeNextAnslag(game)
    expect(result).toBe('playoff_eliminated_kf')
  })

  it('does not return elimination anslag if already seen', () => {
    const otherFid = 'f99'
    const game = makeGame({
      seenAnslag: ['playoff_eliminated_kf'],
      fixtures: [makeScheduledFixture(otherFid, 29, 'club_c', 'club_d')],
      playoffBracket: {
        quarterFinals: [
          makeSeries('s1', PlayoffRound.QuarterFinal, 'managed', 'club_b', [], 'managed', 'club_b'),
          makeSeries('s2', PlayoffRound.QuarterFinal, 'club_c', 'club_d', [otherFid]),
        ],
        semiFinals: [],
        final: null,
        status: 'active',
      } as unknown as SaveGame['playoffBracket'],
    })
    const result = computeNextAnslag(game)
    expect(result).not.toBe('playoff_eliminated_kf')
  })
})
