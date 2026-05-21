import { findActiveAnniversaries, buildEventId } from '../domain/services/clubMemoryService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'
import { FixtureStatus } from '../domain/enums'

const MANAGED_CLUB_ID = 'club_test'

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 2,
    currentMatchday: 8,
    currentDate: '2026-01-01',
    managedClubId: MANAGED_CLUB_ID,
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    ...overrides,
  } as unknown as SaveGame
}

function makeCompletedFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'fix_1',
    leagueId: 'league_1',
    season: 1,
    roundNumber: 8,
    matchday: 8,
    homeClubId: MANAGED_CLUB_ID,
    awayClubId: 'club_opp',
    status: FixtureStatus.Completed,
    homeScore: 5,
    awayScore: 1,
    events: [],
    ...overrides,
  }
}

describe('findActiveAnniversaries', () => {
  it('returns a 1-year-ago event on matching matchday', () => {
    // SM-final win from last season (season 1), significance 95
    const fixture = makeCompletedFixture({
      isFinaldag: true,
      season: 1,
      matchday: 8,
      homeScore: 4,
      awayScore: 2,
    })
    const game = makeMinimalGame({
      currentSeason: 2,
      currentMatchday: 8,
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    expect(result.length).toBeGreaterThanOrEqual(1)
    const smFinalAnniv = result.find(a => a.type === 'sm_final')
    expect(smFinalAnniv).toBeDefined()
    expect(smFinalAnniv?.yearsAgo).toBe(1)
    expect(smFinalAnniv?.echoSize).toBe('big')
  })

  it('filters out events with significance below 30 (1 year ago)', () => {
    // Small big_win from last season — significance 40 — should appear
    // but low-significance event should not
    const fixture = makeCompletedFixture({
      season: 1,
      matchday: 8,
      homeScore: 3,
      awayScore: 2,  // small margin — returns null from buildEventFromFixture
    })
    const game = makeMinimalGame({
      currentSeason: 2,
      currentMatchday: 8,
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    // A 1-goal margin fixture doesn't produce a memory event
    expect(result.filter(a => a.originalSeason === 1 && a.matchday === 8)).toHaveLength(0)
  })

  it('returns 3-year-old event with significance >= 95', () => {
    // SM-guld från 3 säsonger sedan — ska returneras
    const fixture = makeCompletedFixture({
      isFinaldag: true,
      season: 1,
      matchday: 8,
      homeScore: 4,
      awayScore: 2,
    })
    const game = makeMinimalGame({
      currentSeason: 4,  // 3 år senare
      currentMatchday: 8,
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    const smFinalAnniv = result.find(a => a.type === 'sm_final')
    expect(smFinalAnniv).toBeDefined()
    expect(smFinalAnniv?.yearsAgo).toBe(3)
    expect(smFinalAnniv?.significance).toBe(95)
  })

  it('does NOT return 3-year-old event with significance 80', () => {
    // Cup-final win — significance 80 — 3 år bakåt ska filtreras
    const fixture = makeCompletedFixture({
      isCup: true,
      isCupFinalhelgen: true,
      season: 1,
      matchday: 8,
      homeScore: 3,
      awayScore: 1,
    })
    const game = makeMinimalGame({
      currentSeason: 4,  // 3 år senare
      currentMatchday: 8,
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    expect(result.filter(a => a.type === 'cup_final')).toHaveLength(0)
  })

  it('respects matchday tolerance of +/- 1', () => {
    const fixture = makeCompletedFixture({
      isFinaldag: true,
      season: 1,
      matchday: 8,
      homeScore: 4,
      awayScore: 2,
    })
    const game = makeMinimalGame({
      currentSeason: 2,
      currentMatchday: 9,  // ett steg framåt — inom toleransen
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    expect(result.find(a => a.type === 'sm_final')).toBeDefined()
  })

  it('does NOT return event when matchday difference > 1', () => {
    const fixture = makeCompletedFixture({
      isFinaldag: true,
      season: 1,
      matchday: 8,
      homeScore: 4,
      awayScore: 2,
    })
    const game = makeMinimalGame({
      currentSeason: 2,
      currentMatchday: 11,  // 3 steg framåt — utanför toleransen
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    expect(result.find(a => a.type === 'sm_final')).toBeUndefined()
  })

  it('outcome won → echoSize big for significance 95', () => {
    const fixture = makeCompletedFixture({
      isFinaldag: true,
      season: 1,
      matchday: 8,
      homeScore: 4,
      awayScore: 2,
    })
    const game = makeMinimalGame({
      currentSeason: 2,
      currentMatchday: 8,
      fixtures: [fixture],
    })
    const result = findActiveAnniversaries(game)
    const anniv = result.find(a => a.type === 'sm_final')
    expect(anniv?.outcome).toBe('won')
    expect(anniv?.echoSize).toBe('big')
  })
})

describe('buildEventId', () => {
  it('constructs deterministic id from event fields', () => {
    const event = {
      type: 'sm_final' as const,
      season: 1,
      matchday: 8,
      text: '',
      emoji: '',
      significance: 95,
      subjectClubId: 'club_opp',
    }
    const id = buildEventId(event)
    expect(id).toBe('1-8-sm_final-club_opp')
  })

  it('falls back to x when no subject', () => {
    const event = {
      type: 'scandal' as const,
      season: 2,
      matchday: 5,
      text: '',
      emoji: '',
      significance: 70,
    }
    const id = buildEventId(event)
    expect(id).toBe('2-5-scandal-x')
  })
})
