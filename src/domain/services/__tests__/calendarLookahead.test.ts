import { describe, it, expect } from 'vitest'
import { getUpcomingAnchor } from '../calendarLookahead'
import type { MatchdaySlot } from '../scheduleGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'club_soderfors',
    currentDate: '2026-10-04',
    currentSeason: 2026,
    currentMatchday: 1,
    clubs: [],
    players: [],
    fixtures: [],
    standings: [],
    inbox: [],
    league: { teamIds: [] } as never,
    transferState: { listedPlayerIds: [] } as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    seasonSummaries: [],
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    academyLevel: 1 as never,
    mentorships: [],
    loanDeals: [],
    version: '1.0.0',
    lastSavedAt: '2026-10-04T00:00:00Z',
    seenAnslag: [],
    ...overrides,
  } as SaveGame
}

function makeFixture(matchday: number, overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: `f-${matchday}`,
    leagueId: 'L',
    season: 2026,
    roundNumber: matchday,
    matchday,
    homeClubId: 'club_soderfors',
    awayClubId: 'other',
    status: FixtureStatus.Scheduled,
    events: [],
    isCup: false,
    isKnockout: false,
    ...overrides,
  } as Fixture
}

function makeSlot(matchday: number, overrides: Partial<MatchdaySlot> = {}): MatchdaySlot {
  return {
    matchday,
    type: 'league',
    date: '2026-11-01',
    weekday: 0,
    tipoffHour: 13,
    ...overrides,
  }
}

describe('getUpcomingAnchor', () => {
  it('returns null when no anchor is within 5 matchdays and no derby upcoming', () => {
    const game = makeGame({
      currentMatchday: 5,
      seasonCalendar: [makeSlot(15, { isAnnandagen: true })],
      fixtures: [makeFixture(6, { awayClubId: 'club_lesjofors' })],
    })
    expect(getUpcomingAnchor(game)).toBeNull()
  })

  it('detects annandagen within the lookahead window with correct matchdaysUntil', () => {
    const game = makeGame({
      currentMatchday: 10,
      seasonCalendar: [makeSlot(13, { isAnnandagen: true })],
      fixtures: [makeFixture(13, { awayClubId: 'club_lesjofors' })],
    })
    expect(getUpcomingAnchor(game)).toEqual({ kind: 'annandag', matchdaysUntil: 3 })
  })

  it('does not detect an anchor exactly outside the 5-matchday window', () => {
    const game = makeGame({
      currentMatchday: 10,
      seasonCalendar: [makeSlot(16, { isAnnandagen: true })],
      fixtures: [makeFixture(16, { awayClubId: 'club_lesjofors' })],
    })
    expect(getUpcomingAnchor(game)).toBeNull()
  })

  it('detects nyarsbandy within window', () => {
    const game = makeGame({
      currentMatchday: 18,
      seasonCalendar: [makeSlot(20, { isNyarsbandy: true })],
      fixtures: [makeFixture(20, { awayClubId: 'club_lesjofors' })],
    })
    expect(getUpcomingAnchor(game)).toEqual({ kind: 'nyar', matchdaysUntil: 2 })
  })

  it('detects cupfinalhelgen within window', () => {
    const game = makeGame({
      currentMatchday: 1,
      seasonCalendar: [makeSlot(5, { type: 'cup', isCupFinalhelgen: true })],
      fixtures: [makeFixture(5, { awayClubId: 'club_lesjofors', isCup: true })],
    })
    expect(getUpcomingAnchor(game)).toEqual({ kind: 'cupfinalhelg', matchdaysUntil: 4 })
  })

  it('detects a derby via the next managed fixture (real rivalry pair), not the most recent one', () => {
    const currentMatchday = 20
    const game = makeGame({
      currentMatchday,
      seasonCalendar: [],
      fixtures: [
        // Senaste (redan spelad) fixture — INTE derby. Om lookup läste denna skulle testet falla.
        makeFixture(currentMatchday - 1, { awayClubId: 'club_lesjofors', status: FixtureStatus.Completed, homeScore: 2, awayScore: 1 }),
        // Nästa fixture — riktigt rivalpar (club_soderfors / club_skutskar, Upplandsderbyt)
        makeFixture(currentMatchday + 2, { awayClubId: 'club_skutskar' }),
      ],
    })
    expect(getUpcomingAnchor(game)).toEqual({ kind: 'derby', matchdaysUntil: 2 })
  })

  it('nearest wins when both a calendar anchor and a derby exist at different distances', () => {
    const currentMatchday = 10
    const game = makeGame({
      currentMatchday,
      seasonCalendar: [makeSlot(currentMatchday + 4, { isAnnandagen: true })],
      fixtures: [
        // Derby närmare (matchdaysUntil 1) än annandagen (matchdaysUntil 4)
        makeFixture(currentMatchday + 1, { awayClubId: 'club_skutskar' }),
        makeFixture(currentMatchday + 4, { awayClubId: 'club_lesjofors' }),
      ],
    })
    expect(getUpcomingAnchor(game)).toEqual({ kind: 'derby', matchdaysUntil: 1 })
  })

  it('on a same-day collision, the calendar anchor wins over the derby (culturally stronger)', () => {
    const currentMatchday = 10
    const game = makeGame({
      currentMatchday,
      seasonCalendar: [makeSlot(currentMatchday + 3, { isAnnandagen: true })],
      // Derby-fixture SAMMA matchday som annandagen
      fixtures: [makeFixture(currentMatchday + 3, { awayClubId: 'club_skutskar' })],
    })
    expect(getUpcomingAnchor(game)).toEqual({ kind: 'annandag', matchdaysUntil: 3 })
  })
})
