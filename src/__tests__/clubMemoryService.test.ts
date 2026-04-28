import { getClubMemory, scoreEvent } from '../domain/services/clubMemoryService'
import type { MemoryEvent } from '../domain/services/clubMemoryService'
import type { SaveGame } from '../domain/entities/SaveGame'

const MANAGED_CLUB_ID = 'club_test'

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 1,
    currentMatchday: 1,
    currentDate: '2026-01-01',
    managedClubId: MANAGED_CLUB_ID,
    leagueId: 'league_test',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('getClubMemory', () => {
  it('returns empty structure for season 1, round 1', () => {
    const game = makeMinimalGame()
    const result = getClubMemory(game)
    expect(result.seasons).toHaveLength(1)
    expect(result.seasons[0].season).toBe(1)
    expect(result.seasons[0].isOngoing).toBe(true)
    expect(result.totalEventsAcrossSeasons).toBe(0)
    expect(result.legends).toEqual([])
    expect(result.records).toBeNull()
  })

  it('includes legends and records when present', () => {
    const game = makeMinimalGame({
      clubLegends: [{
        name: 'Staffan Henriksson',
        position: 'FWD',
        seasons: 8,
        totalGoals: 120,
        totalAssists: 45,
        titles: ['SM-guld 2028'],
        retiredSeason: 1,
      }],
      allTimeRecords: {
        mostGoalsSeason: { playerName: 'Staffan', goals: 22, season: 1 },
        mostAssistsSeason: null,
        highestRatingSeason: null,
        bestFinish: { position: 1, season: 1 },
        biggestWin: null,
        championSeasons: [1],
        cupWinSeasons: [],
      },
    })
    const result = getClubMemory(game)
    expect(result.legends).toHaveLength(1)
    expect(result.records).not.toBeNull()
    expect(result.records?.championSeasons).toContain(1)
  })

  it('marks ongoing season correctly', () => {
    const game = makeMinimalGame({ currentSeason: 3 })
    const result = getClubMemory(game)
    const ongoingSeasons = result.seasons.filter(s => s.isOngoing)
    expect(ongoingSeasons).toHaveLength(1)
    expect(ongoingSeasons[0].season).toBe(3)
  })

  it('sorts seasons newest first', () => {
    const game = makeMinimalGame({ currentSeason: 4 })
    const result = getClubMemory(game)
    expect(result.seasons[0].season).toBe(4)
    expect(result.seasons[result.seasons.length - 1].season).toBeLessThan(4)
  })

  it('shows at most 5 seasons', () => {
    const game = makeMinimalGame({ currentSeason: 10 })
    const result = getClubMemory(game)
    expect(result.seasons.length).toBeLessThanOrEqual(5)
    expect(result.seasons[0].season).toBe(10)
    expect(result.seasons[result.seasons.length - 1].season).toBe(6)
  })

  it('aggregates events from scandal history', () => {
    const game = makeMinimalGame({
      currentSeason: 2,
      scandalHistory: [{
        id: 'scandal_1',
        season: 2,
        triggerRound: 8,
        type: 'match_fixing',
        affectedClubId: MANAGED_CLUB_ID,
        resolutionRound: 12,
        isResolved: true,
      }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    const seasonEvents = result.seasons[0].events
    const scandalEvents = seasonEvents.filter(e => e.type === 'scandal')
    expect(scandalEvents).toHaveLength(1)
    expect(scandalEvents[0].significance).toBe(70)
  })

  it('filters events below significance threshold', () => {
    // A scandal from a different club should not appear
    const game = makeMinimalGame({
      currentSeason: 2,
      scandalHistory: [{
        id: 'scandal_other',
        season: 2,
        triggerRound: 8,
        type: 'match_fixing',
        affectedClubId: 'other_club',
        resolutionRound: 12,
        isResolved: true,
      }],
    } as Partial<SaveGame>)
    const result = getClubMemory(game)
    const allEvents = result.seasons.flatMap(s => s.events)
    expect(allEvents.filter(e => e.type === 'scandal')).toHaveLength(0)
  })
})

describe('scoreEvent', () => {
  function makeEvent(overrides: Partial<MemoryEvent>): MemoryEvent {
    return {
      type: 'player_milestone',
      season: 1,
      matchday: 10,
      text: 'Test event',
      emoji: '⭐',
      significance: 40,
      ...overrides,
    }
  }

  it('returns significance for sm_final', () => {
    const e = makeEvent({ type: 'sm_final', significance: 95 })
    expect(scoreEvent(e)).toBe(95)
  })

  it('returns significance for scandal', () => {
    const e = makeEvent({ type: 'scandal', significance: 70 })
    expect(scoreEvent(e)).toBe(70)
  })

  it('returns significance for retirement', () => {
    const e = makeEvent({ type: 'retirement', significance: 90 })
    expect(scoreEvent(e)).toBe(90)
  })
})
