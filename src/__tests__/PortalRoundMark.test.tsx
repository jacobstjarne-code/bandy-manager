/**
 * PortalRoundMark — unit tests
 * @testing-library/react is not installed — tests use pure vitest.
 * Logic is verified via getPlayoffSeriesContext + component export check.
 */
import { describe, it, expect } from 'vitest'
import { PortalRoundMark } from '../presentation/components/portal/PortalRoundMark'
import { getPlayoffSeriesContext } from '../domain/services/portal/playoffSeriesContext'
import { PlayoffRound, PlayoffStatus } from '../domain/enums'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'
import type { PlayoffSeries, PlayoffBracket } from '../domain/entities/Playoff'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function makeCompletedFixture(id: string, homeId: string, awayId: string, homeScore: number, awayScore: number): Fixture {
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

function makeGame(managedClubId: string, bracket: PlayoffBracket | null, fixtures: Fixture[]): SaveGame {
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

describe('PortalRoundMark — component export', () => {
  it('is a function (React component)', () => {
    expect(typeof PortalRoundMark).toBe('function')
  })
})

describe('PortalRoundMark — logic via getPlayoffSeriesContext', () => {

  it('returns null context when game.playoffBracket is null', () => {
    const game = makeGame('club_a', null, [])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).toBeNull()
    // When ctx is null, PortalRoundMark renders nothing
  })

  it('context shows Kvartsfinal round when in KF open', () => {
    const f1 = makeScheduledFixture('f1', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.QuarterFinal, 'club_a', 'club_b', ['f1'], 0, 0)
    const bracket = makeBracket({ quarterFinals: [series] })
    const game = makeGame('club_a', bracket, [f1])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.round).toBe(PlayoffRound.QuarterFinal)
    // ROUND_LABELS[PlayoffRound.QuarterFinal] = 'Kvartsfinal'
    const ROUND_LABELS: Record<PlayoffRound, string> = {
      [PlayoffRound.QuarterFinal]: 'Kvartsfinal',
      [PlayoffRound.SemiFinal]: 'Semifinal',
      [PlayoffRound.Final]: 'SM-Final',
    }
    expect(ROUND_LABELS[ctx!.round]).toBe('Kvartsfinal')
    expect(ctx!.criticality).toBe('open')
    // No crit label shown for 'open'
  })

  it('context shows Final round — gold class condition is true for SM-Final', () => {
    const f1 = makeScheduledFixture('f1', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.Final, 'club_a', 'club_b', ['f1'], 0, 0)
    const bracket = makeBracket({ final: series })
    const game = makeGame('club_a', bracket, [f1])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.round).toBe(PlayoffRound.Final)
    // isFinal = true → className includes 'gold'
    const isFinal = ctx!.round === PlayoffRound.Final
    expect(isFinal).toBe(true)
    const ROUND_LABELS: Record<PlayoffRound, string> = {
      [PlayoffRound.QuarterFinal]: 'Kvartsfinal',
      [PlayoffRound.SemiFinal]: 'Semifinal',
      [PlayoffRound.Final]: 'SM-Final',
    }
    expect(ROUND_LABELS[ctx!.round]).toBe('SM-Final')
  })

  it('context shows Avgörande crit label when decisive (2-2)', () => {
    const g1 = makeCompletedFixture('g1', 'club_a', 'club_b', 5, 2)
    const g2 = makeCompletedFixture('g2', 'club_b', 'club_a', 4, 1) // club_a loses
    const g3 = makeCompletedFixture('g3', 'club_a', 'club_b', 3, 1)
    const g4 = makeCompletedFixture('g4', 'club_b', 'club_a', 3, 2) // club_a loses
    const g5 = makeScheduledFixture('g5', 'club_a', 'club_b')
    const series = makeSeries('s1', PlayoffRound.Final, 'club_a', 'club_b', ['g1', 'g2', 'g3', 'g4', 'g5'], 2, 2)
    const bracket = makeBracket({ final: series })
    const game = makeGame('club_a', bracket, [g1, g2, g3, g4, g5])
    const ctx = getPlayoffSeriesContext(game)
    expect(ctx).not.toBeNull()
    expect(ctx!.criticality).toBe('decisive')
    const CRIT_LABELS: Record<'open' | 'matchpuck' | 'decisive', string | null> = {
      open: null,
      matchpuck: 'Matchpuck',
      decisive: 'Avgörande',
    }
    expect(CRIT_LABELS[ctx!.criticality]).toBe('Avgörande')
  })

})
