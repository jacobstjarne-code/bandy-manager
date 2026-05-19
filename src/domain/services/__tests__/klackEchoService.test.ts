import { describe, it, expect } from 'vitest'
import { detectNotableResult, decayKlackEcho } from '../klackEchoService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'club_soderfors',
    currentDate: '2026-10-04',
    currentSeason: 1,
    currentMatchday: 5,
    clubs: [
      { id: 'club_soderfors', name: 'Söderforsen BK', shortName: 'SBK', squadPlayerIds: [] } as never,
      { id: 'club_skutskar', name: 'Skutskärs IF', shortName: 'SKU', squadPlayerIds: [] } as never,
      { id: 'club_topteam', name: 'Toppklubben BK', shortName: 'TBK', squadPlayerIds: [] } as never,
    ],
    players: [],
    fixtures: [],
    standings: [
      { clubId: 'club_topteam', position: 1, played: 5, wins: 5, draws: 0, losses: 0, goalsFor: 50, goalsAgainst: 10, points: 10 },
      { clubId: 'club_soderfors', position: 4, played: 5, wins: 2, draws: 1, losses: 2, goalsFor: 20, goalsAgainst: 22, points: 5 },
      { clubId: 'club_skutskar', position: 6, played: 5, wins: 2, draws: 0, losses: 3, goalsFor: 15, goalsAgainst: 18, points: 4 },
    ],
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
    deferredDecisions: [],
    phaseMarksSeen: [],
    ...overrides,
  } as SaveGame
}

function makeFixture(homeId: string, awayId: string, homeScore: number, awayScore: number, matchday = 5): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 1,
    roundNumber: matchday,
    matchday,
    homeClubId: homeId,
    awayClubId: awayId,
    homeScore,
    awayScore,
    status: FixtureStatus.Completed,
    isCup: false,
  } as Fixture
}

describe('detectNotableResult', () => {
  it('triggers derby_win when managed club wins a rivalry match', () => {
    const game = makeGame()
    // club_soderfors vs club_skutskar is a rivalry
    const fixture = makeFixture('club_soderfors', 'club_skutskar', 4, 2)
    const result = detectNotableResult(fixture, game)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('derby_win')
    expect(result?.initialWeight).toBe(1.0)
    expect(result?.decayPerRound).toBe(0.5)
  })

  it('triggers derby_loss when managed club loses a rivalry match', () => {
    const game = makeGame()
    const fixture = makeFixture('club_soderfors', 'club_skutskar', 1, 3)
    const result = detectNotableResult(fixture, game)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('derby_loss')
  })

  it('triggers derby_draw when managed club draws a rivalry match', () => {
    const game = makeGame()
    const fixture = makeFixture('club_soderfors', 'club_skutskar', 2, 2)
    const result = detectNotableResult(fixture, game)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('derby_draw')
  })

  it('triggers heavy_home_loss when home loss by >= 4 goals', () => {
    const game = makeGame()
    // Managed club is home and loses by 5
    const fixture = makeFixture('club_soderfors', 'club_topteam', 1, 6)
    const result = detectNotableResult(fixture, game)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('heavy_home_loss')
  })

  it('does NOT trigger heavy_home_loss when away loss by >= 4 goals', () => {
    const game = makeGame()
    // Managed club is away and loses by 5 — not home, so no trigger
    const fixture = makeFixture('club_topteam', 'club_soderfors', 6, 1)
    const result = detectNotableResult(fixture, game)
    // Could trigger storstad_loss but not heavy_home_loss
    if (result) {
      expect(result.type).not.toBe('heavy_home_loss')
    }
  })

  it('triggers top_team_win when winning against team in position <= 3', () => {
    const game = makeGame()
    // club_topteam is in position 1
    const fixture = makeFixture('club_soderfors', 'club_topteam', 3, 2)
    const result = detectNotableResult(fixture, game)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('top_team_win')
    expect(result?.decayPerRound).toBe(0.33)
  })

  it('does NOT trigger for a normal win against a mid-table opponent', () => {
    const game = makeGame({ standings: [
      { clubId: 'club_soderfors', position: 5, played: 5, wins: 2, draws: 1, losses: 2, goalsFor: 20, goalsAgainst: 22, points: 5 },
      { clubId: 'club_skutskar', position: 6, played: 5, wins: 2, draws: 0, losses: 3, goalsFor: 15, goalsAgainst: 18, points: 4 },
      { clubId: 'club_topteam', position: 7, played: 5, wins: 1, draws: 0, losses: 4, goalsFor: 10, goalsAgainst: 25, points: 2 },
    ] })
    // Both clubs are in mid-table, no rivalry between them
    const fixture = makeFixture('club_soderfors', 'club_topteam', 2, 1)
    const result = detectNotableResult(fixture, game)
    expect(result).toBeNull()
  })

  it('returns null when scores are undefined', () => {
    const game = makeGame()
    const fixture = {
      ...makeFixture('club_soderfors', 'club_skutskar', 2, 1),
      homeScore: undefined,
      awayScore: undefined,
    } as unknown as Fixture
    const result = detectNotableResult(fixture, game)
    expect(result).toBeNull()
  })
})

describe('decayKlackEcho', () => {
  it('reduces currentWeight by decayPerRound factor', () => {
    const echo = {
      type: 'derby_win' as const,
      resultMatchday: 5,
      initialWeight: 1.0,
      currentWeight: 1.0,
      decayPerRound: 0.5,
    }
    const result = decayKlackEcho(echo)
    expect(result).not.toBeUndefined()
    expect(result?.currentWeight).toBeCloseTo(0.5)
  })

  it('returns undefined when weight falls below 0.1', () => {
    const echo = {
      type: 'derby_win' as const,
      resultMatchday: 5,
      initialWeight: 1.0,
      currentWeight: 0.15,
      decayPerRound: 0.5,
    }
    // 0.15 * (1 - 0.5) = 0.075 < 0.1 → undefined
    const result = decayKlackEcho(echo)
    expect(result).toBeUndefined()
  })

  it('continues decay when weight stays above 0.1', () => {
    const echo = {
      type: 'top_team_win' as const,
      resultMatchday: 3,
      initialWeight: 1.0,
      currentWeight: 0.67,
      decayPerRound: 0.33,
    }
    // 0.67 * (1 - 0.33) = ~0.449 > 0.1 → keeps decaying
    const result = decayKlackEcho(echo)
    expect(result).not.toBeUndefined()
    expect(result?.currentWeight).toBeGreaterThan(0.1)
  })
})
