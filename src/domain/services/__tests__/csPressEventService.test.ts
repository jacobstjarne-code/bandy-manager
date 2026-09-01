import { describe, it, expect } from 'vitest'
import { computeCSStreak, shouldTriggerCSPress, pickCSPressPlayer } from '../csPressEventService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Fixture } from '../../entities/Fixture'
import { PlayerPosition } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränaren',
    managedClubId: 'club_a',
    currentDate: '2026-11-01',
    currentSeason: 2026,
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
    lastSavedAt: '2026-11-01T00:00:00',
    deferredDecisions: [],
    phaseMarksSeen: [],
    journalist: {
      name: 'Lisa Ek',
      outlet: 'Bruksbladet',
      persona: 'analytical' as never,
      style: 'neutral',
      relationship: 50,
      memory: [],
      pressRefusals: 0,
    },
    ...overrides,
  } as SaveGame
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fix_1',
    homeClubId: 'club_a',
    awayClubId: 'club_b',
    homeScore: 1,
    awayScore: 0,
    isCup: false,
    status: 'completed',
    matchday: 5,
    roundNumber: 5,
    season: 2026,
    ...overrides,
  } as Fixture
}

describe('computeCSStreak', () => {
  it('returns 0 when opponent scored', () => {
    const game = makeGame()
    const fixture = makeFixture({ awayScore: 1 })
    expect(computeCSStreak(game, fixture)).toBe(0)
  })

  it('returns 1 for first home CS', () => {
    const game = makeGame({ fixtures: [] })
    const fixture = makeFixture({ awayScore: 0, matchday: 5 })
    expect(computeCSStreak(game, fixture)).toBe(1)
  })

  it('returns 2 for two consecutive home CS', () => {
    const prevFixture = makeFixture({
      id: 'fix_prev', matchday: 3, awayScore: 0, status: 'completed',
    })
    const game = makeGame({ fixtures: [prevFixture] })
    const fixture = makeFixture({ awayScore: 0, matchday: 5 })
    expect(computeCSStreak(game, fixture)).toBe(2)
  })

  it('resets to 1 if previous home match was not CS', () => {
    const prevFixture = makeFixture({
      id: 'fix_prev', matchday: 3, awayScore: 2, status: 'completed',
    })
    const game = makeGame({ fixtures: [prevFixture] })
    const fixture = makeFixture({ awayScore: 0, matchday: 5 })
    expect(computeCSStreak(game, fixture)).toBe(1)
  })

  it('counts only home matches in streak', () => {
    // Away match (not home) should not count in streak even if CS
    const awayFixture = makeFixture({
      id: 'fix_away', matchday: 3,
      homeClubId: 'club_b', awayClubId: 'club_a', // club_a is away
      homeScore: 0, awayScore: 1,
      status: 'completed',
    })
    const game = makeGame({ fixtures: [awayFixture] })
    const fixture = makeFixture({ awayScore: 0, matchday: 5 })
    // Streak should be 1 (no prior home CS found, away doesn't count)
    expect(computeCSStreak(game, fixture)).toBe(1)
  })
})

describe('shouldTriggerCSPress', () => {
  it('never triggers for cup matches', () => {
    const game = makeGame()
    const fixture = makeFixture({ isCup: true, awayScore: 0 })
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(false)
  })

  it('never triggers for playoff matches', () => {
    const game = makeGame()
    const fixture = makeFixture({ isKnockout: true, awayScore: 0 })
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(false)
  })

  it('never triggers for away matches', () => {
    const game = makeGame()
    const fixture = makeFixture({
      homeClubId: 'club_b', awayClubId: 'club_a',
      homeScore: 0, awayScore: 2,
    })
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(false)
  })

  it('never triggers when journalist is absent', () => {
    const game = makeGame({ journalist: undefined })
    const fixture = makeFixture({ awayScore: 0 })
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(false)
  })

  it('never triggers when opponent scored', () => {
    const game = makeGame()
    const fixture = makeFixture({ awayScore: 1 })
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(false)
  })

  it('respects cooldown of 4 rounds', () => {
    const game = makeGame({ lastCSPressMatchday: 3 })
    const fixture = makeFixture({ awayScore: 0, matchday: 5 }) // only 2 rounds later
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(false)
  })

  it('triggers after cooldown expires (4 rounds gap)', () => {
    const game = makeGame({ lastCSPressMatchday: 1 })
    const fixture = makeFixture({ awayScore: 0, matchday: 5 }) // 4 rounds later
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.1)).toBe(true)
  })

  it('streak 1 has 25% probability', () => {
    const game = makeGame()
    const fixture = makeFixture({ awayScore: 0, matchday: 10 })
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.24)).toBe(true)
    expect(shouldTriggerCSPress(game, fixture, 1, () => 0.26)).toBe(false)
  })

  it('streak 2 has 35% probability', () => {
    const game = makeGame()
    const fixture = makeFixture({ awayScore: 0, matchday: 10 })
    expect(shouldTriggerCSPress(game, fixture, 2, () => 0.34)).toBe(true)
    expect(shouldTriggerCSPress(game, fixture, 2, () => 0.36)).toBe(false)
  })

  it('streak 3+ has 60% probability', () => {
    const game = makeGame()
    const fixture = makeFixture({ awayScore: 0, matchday: 10 })
    expect(shouldTriggerCSPress(game, fixture, 3, () => 0.55)).toBe(true)
    expect(shouldTriggerCSPress(game, fixture, 3, () => 0.65)).toBe(false)
  })
})

describe('pickCSPressPlayer', () => {
  it('prefers GK when rand < 0.55', () => {
    const gk = {
      id: 'gk1', position: PlayerPosition.Goalkeeper, clubId: 'club_a',
      isInjured: false, seasonStats: { averageRating: 7.0 },
    }
    const def = {
      id: 'def1', position: PlayerPosition.Defender, clubId: 'club_a',
      isInjured: false, seasonStats: { averageRating: 6.0 },
    }
    const game = makeGame({ players: [gk, def] as never })
    const fixture = makeFixture({
      homeLineup: { startingPlayerIds: ['gk1', 'def1'] } as never,
    })
    const picked = pickCSPressPlayer(game, fixture, () => 0.3) // 0.3 < 0.55 → GK
    expect(picked?.id).toBe('gk1')
  })

  it('picks defender when 0.55 <= rand < 0.85', () => {
    const gk = {
      id: 'gk1', position: PlayerPosition.Goalkeeper, clubId: 'club_a',
      isInjured: false, seasonStats: { averageRating: 7.0 },
    }
    const def = {
      id: 'def1', position: PlayerPosition.Defender, clubId: 'club_a',
      isInjured: false, seasonStats: { averageRating: 6.0 },
    }
    const game = makeGame({ players: [gk, def] as never })
    const fixture = makeFixture({
      homeLineup: { startingPlayerIds: ['gk1', 'def1'] } as never,
    })
    const picked = pickCSPressPlayer(game, fixture, () => 0.70) // 0.55-0.85 → DEF
    expect(picked?.id).toBe('def1')
  })

  it('returns null when no matching players', () => {
    const game = makeGame({ players: [] })
    const fixture = makeFixture({
      homeLineup: { startingPlayerIds: [] } as never,
    })
    const picked = pickCSPressPlayer(game, fixture, () => 0.5)
    expect(picked).toBeNull()
  })

  it('ignores injured players', () => {
    const injuredGk = {
      id: 'gk1', position: PlayerPosition.Goalkeeper, clubId: 'club_a',
      isInjured: true, seasonStats: { averageRating: 8.0 },
    }
    const def = {
      id: 'def1', position: PlayerPosition.Defender, clubId: 'club_a',
      isInjured: false, seasonStats: { averageRating: 6.0 },
    }
    const game = makeGame({ players: [injuredGk, def] as never })
    const fixture = makeFixture({
      homeLineup: { startingPlayerIds: ['gk1', 'def1'] } as never,
    })
    // GK is injured, so even rand < 0.55 should fall back to DEF
    const picked = pickCSPressPlayer(game, fixture, () => 0.3)
    expect(picked?.id).toBe('def1')
  })
})
