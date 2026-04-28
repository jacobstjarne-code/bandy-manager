import { describe, it, expect } from 'vitest'
import { getCoffeeRoomScene } from '../coffeeRoomService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2026-10-04',
    currentSeason: 1,
    currentMatchday: 4,
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
    ...overrides,
  } as SaveGame
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 1,
    roundNumber: 1,
    matchday: 1,
    homeClubId: 'managed',
    awayClubId: 'opp',
    status: FixtureStatus.Completed,
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...overrides,
  } as Fixture
}

describe('getCoffeeRoomScene', () => {
  it('returnerar non-null när minst en omgång spelats', () => {
    const completed = makeFixture({ roundNumber: 1, matchday: 1 })
    const g = makeGame({ fixtures: [completed], currentMatchday: 2 })
    const scene = getCoffeeRoomScene(g)
    expect(scene).not.toBeNull()
    expect(scene!.exchanges.length).toBeGreaterThan(0)
  })

  it('returnerar null när inga omgångar spelats', () => {
    const g = makeGame({ fixtures: [], currentMatchday: 0 })
    expect(getCoffeeRoomScene(g)).toBeNull()
  })

  it('returnerar mellan 1 och 3 utbyten', () => {
    const completed = makeFixture({ roundNumber: 2, matchday: 2 })
    for (let md = 1; md <= 6; md++) {
      const g = makeGame({ fixtures: [completed], currentMatchday: md })
      const scene = getCoffeeRoomScene(g)
      expect(scene).not.toBeNull()
      expect(scene!.exchanges.length).toBeGreaterThanOrEqual(1)
      expect(scene!.exchanges.length).toBeLessThanOrEqual(3)
    }
  })

  it('inga utbyten innehåller oresolverade {youthName}-tokens när youth saknas', () => {
    const completed = makeFixture({ roundNumber: 3, matchday: 3 })
    const g = makeGame({ fixtures: [completed], currentMatchday: 3 })
    const scene = getCoffeeRoomScene(g)
    expect(scene).not.toBeNull()
    const allText = scene!.exchanges.flat().join(' ')
    expect(allText).not.toContain('{youthName}')
  })
})
