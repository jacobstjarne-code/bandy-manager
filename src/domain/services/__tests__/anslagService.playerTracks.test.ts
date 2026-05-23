import { describe, it, expect } from 'vitest'
import { computeNextAnslag } from '../anslagService'
import type { SaveGame } from '../../entities/SaveGame'
import type { CupBracket, CupMatch } from '../../entities/Cup'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus, PlayoffStatus } from '../../enums'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2026-10-04',
    currentSeason: 1,
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

function makeLeagueFixture(roundNumber: number, status: 'scheduled' | 'completed' = 'completed'): Fixture {
  return {
    id: `league-r${roundNumber}`,
    leagueId: 'L',
    season: 1,
    roundNumber,
    matchday: roundNumber + 4,
    homeClubId: 'managed',
    awayClubId: 'other',
    status: status === 'completed' ? FixtureStatus.Completed : FixtureStatus.Scheduled,
    homeScore: 3,
    awayScore: 1,
    events: [],
    isCup: false,
    isKnockout: false,
  } as Fixture
}

function makeCupMatch(round: number, winnerId: string, clubId = 'managed'): CupMatch {
  return {
    id: `cup-r${round}-m0`,
    round,
    fixtureId: `cup-r${round}-m0`,
    homeClubId: clubId,
    awayClubId: 'other',
    winnerId,
  }
}

describe('Cup-vinnare vs förlorare', () => {
  it('Cup-final-vinnare får cup_done_winner (inte cup_done)', () => {
    const match = makeCupMatch(4, 'managed')
    const game = makeGame({
      seenAnslag: ['cup_start'],
      cupBracket: {
        season: 1, matches: [match], winnerId: 'managed', completed: true,
        byeTeamIds: [],
      },
    })
    expect(computeNextAnslag(game)).toBe('cup_done_winner')
    expect(computeNextAnslag(game)).not.toBe('cup_done')
  })

  it('Cup-final-förlorare får cup_done (inte cup_done_winner)', () => {
    const match = makeCupMatch(4, 'other')
    const game = makeGame({
      seenAnslag: ['cup_start'],
      cupBracket: {
        season: 1, matches: [match], winnerId: 'other', completed: true,
        byeTeamIds: [],
      },
    })
    expect(computeNextAnslag(game)).toBe('cup_done')
  })
})

describe('Spår: utslagen i förstarunda', () => {
  it('får cup_done direkt efter cup_start, hoppar cup_between och cup_finalweekend_pre', () => {
    // Förstarunda-match spelade, managed förlorade
    const r1Loss = makeCupMatch(1, 'other')
    // Round 2 finns men managed är inte med
    const r2Other: CupMatch = {
      id: 'cup-r2-m0', round: 2, fixtureId: 'cup-r2-m0',
      homeClubId: 'a', awayClubId: 'b', winnerId: 'a',
    }
    const r2Other2: CupMatch = {
      id: 'cup-r2-m1', round: 2, fixtureId: 'cup-r2-m1',
      homeClubId: 'c', awayClubId: 'd', winnerId: 'c',
    }
    const game = makeGame({
      seenAnslag: ['cup_start'],
      cupBracket: {
        season: 1,
        matches: [r1Loss, r2Other, r2Other2],
        byeTeamIds: [],
        completed: false,
      },
    })
    const next = computeNextAnslag(game)
    expect(next).toBe('cup_done')
    expect(next).not.toBe('cup_between')
    expect(next).not.toBe('cup_finalweekend_pre')
  })
})

describe('Spår: direktkvalad → cupvinnare', () => {
  it('direktkvalad utan match i round 1 men med round 2 gets correct cup_done after winning final', () => {
    // Bye i round 1, vann round 2 (kvart), vann round 3 (semi), vann round 4 (final)
    const byeMatch: CupMatch = {
      id: 'cup-r1-bye0', round: 1, fixtureId: 'cup-r1-bye0',
      homeClubId: 'managed', awayClubId: 'BYE', winnerId: 'managed', isBye: true,
    }
    const r2Win = makeCupMatch(2, 'managed')
    const r3Win = makeCupMatch(3, 'managed')
    const r4Win = makeCupMatch(4, 'managed')
    const game = makeGame({
      seenAnslag: ['cup_start', 'cup_finalweekend_pre'],
      cupBracket: {
        season: 1,
        matches: [byeMatch, r2Win, r3Win, r4Win],
        byeTeamIds: ['managed'],
        winnerId: 'managed',
        completed: true,
      },
    })
    expect(computeNextAnslag(game)).toBe('cup_done_winner')
  })
})

describe('Liga-anslag: season_done', () => {
  it('triggas när alla fixtures är spelade och playoff-bracket är completed', () => {
    const completedFixtures = Array.from({ length: 22 }, (_, i) => makeLeagueFixture(i + 1))
    const game = makeGame({
      cupBracket: { season: 1, matches: [], byeTeamIds: [], completed: true },
      fixtures: completedFixtures,
      playoffBracket: { season: 1, status: PlayoffStatus.Completed, quarterFinals: [], semiFinals: [], final: null, champion: 'other_club' },
      seenAnslag: ['cup_start', 'cup_done', 'league_start', 'league_midwinter', 'league_halfway', 'playoff_qualification'],
    })
    expect(computeNextAnslag(game)).toBe('season_done')
  })

  it('triggas INTE om det finns scheduled fixtures kvar', () => {
    const fixtures = [
      ...Array.from({ length: 21 }, (_, i) => makeLeagueFixture(i + 1)),
      makeLeagueFixture(22, 'scheduled'),
    ]
    const game = makeGame({
      cupBracket: { season: 1, matches: [], byeTeamIds: [], completed: true },
      fixtures,
      seenAnslag: ['cup_start', 'cup_done', 'league_start', 'league_midwinter', 'league_halfway', 'playoff_qualification'],
    })
    expect(computeNextAnslag(game)).not.toBe('season_done')
  })
})

describe('Anslag visas bara en gång', () => {
  it('cup_start visas inte om den redan finns i seenAnslag', () => {
    const game = makeGame({
      currentMatchday: 1,
      cupBracket: { season: 1, matches: [], byeTeamIds: [], completed: false },
      seenAnslag: ['cup_start'],
    })
    expect(computeNextAnslag(game)).not.toBe('cup_start')
  })

  it('cup_done_winner visas inte om cup_done redan setts', () => {
    const match = makeCupMatch(4, 'managed')
    // Include league_start in seen to prevent it from triggering (cup is done, league not started)
    const game = makeGame({
      seenAnslag: ['cup_start', 'cup_done', 'league_start'],
      cupBracket: {
        season: 1, matches: [match], winnerId: 'managed', completed: true,
        byeTeamIds: [],
      },
    })
    expect(computeNextAnslag(game)).toBeNull()
  })
})
