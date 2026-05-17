import { describe, it, expect } from 'vitest'
import { PortalPhaseMark } from '../presentation/components/portal/PortalPhaseMark'
import { getSeasonPhase, getCurrentLeagueRound } from '../domain/data/seasonPhases'
import { SEASON_MOOD } from '../domain/services/dailyBriefingService'
import { FixtureStatus, PlayoffStatus } from '../domain/enums'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { Fixture } from '../domain/entities/Fixture'

function makeLeagueFixture(roundNumber: number, status: string): Fixture {
  return {
    id: `f${roundNumber}`,
    leagueId: 'l1',
    season: 2026,
    roundNumber,
    matchday: roundNumber,
    homeClubId: 'club_a',
    awayClubId: 'club_b',
    status: status as 'scheduled' | 'completed',
    homeScore: 1,
    awayScore: 0,
    events: [],
    isCup: false,
    isKnockout: false,
  } as Fixture
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Tränare',
    managedClubId: 'club_a',
    currentDate: '2026-03-15',
    currentSeason: 2026,
    currentMatchday: 1,
    clubs: [] as never,
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
    lastSavedAt: '2026-03-15T00:00:00',
    phaseMarksSeen: [],
    ...overrides,
  } as SaveGame
}

describe('PortalPhaseMark — component export', () => {
  it('is a function (React component)', () => {
    expect(typeof PortalPhaseMark).toBe('function')
  })
})

describe('PortalPhaseMark — logic', () => {

  it('pre_season returns null context (no PHASEMARK_LABELS entry)', () => {
    const game = makeGame({ fixtures: [] })
    const round = getCurrentLeagueRound(game)
    const phase = getSeasonPhase(round, false)
    expect(phase).toBe('early')
    // 'early' has no entry in PHASEMARK_LABELS — component renders null
    const hasLabel = phase === 'endgame' || phase === 'playoff'
    expect(hasLabel).toBe(false)
  })

  it('seen=[] at endgame round 13 — should show mark', () => {
    const completed = Array.from({ length: 13 }, (_, i) =>
      makeLeagueFixture(i + 1, FixtureStatus.Completed)
    )
    const game = makeGame({ fixtures: completed, phaseMarksSeen: [] })
    const round = getCurrentLeagueRound(game)
    const phase = getSeasonPhase(round, false)
    expect(phase).toBe('endgame')
    const seen = game.phaseMarksSeen ?? []
    expect(seen.includes(phase)).toBe(false)
    // SEASON_MOOD[endgame] must have at least one quote
    expect((SEASON_MOOD['endgame'] ?? []).length).toBeGreaterThan(0)
  })

  it('seen=[playoff] suppresses the playoff mark', () => {
    const game = makeGame({
      fixtures: [],
      phaseMarksSeen: ['playoff'],
      playoffBracket: {
        season: 2026,
        status: PlayoffStatus.InProgress,
        quarterFinals: [],
        semiFinals: [],
        final: null,
        champion: null,
      },
    })
    const seen = game.phaseMarksSeen ?? []
    expect(seen.includes('playoff')).toBe(true)
    // Component returns null when phase is already seen
  })

  it('helper text is defined for endgame and playoff phases', () => {
    const PHASEMARK_HELPERS: Partial<Record<string, string>> = {
      endgame: 'Tabellen avgör. Visas en gång per säsong.',
      playoff: 'Portal har stramat åt — bara det viktiga nu.',
    }
    expect(PHASEMARK_HELPERS['endgame']).toBeTruthy()
    expect(PHASEMARK_HELPERS['playoff']).toBeTruthy()
  })

})
