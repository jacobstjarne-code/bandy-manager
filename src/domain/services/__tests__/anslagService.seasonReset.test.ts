import { describe, it, expect } from 'vitest'
import { computeNextAnslag } from '../anslagService'
import type { AnslagKey } from '../anslagService'
import type { SaveGame } from '../../entities/SaveGame'

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

const allKeys: AnslagKey[] = [
  'cup_start', 'cup_between', 'cup_finalweekend_pre', 'cup_done',
  'cup_done_winner', 'league_start', 'league_midwinter',
  'league_halfway', 'playoff_qualification', 'playoff_start', 'season_done',
]

describe('seenAnslag reset vid säsongs-byte', () => {
  it('seenAnslag = [] efter säsongs-byte förhindrar alla triggers', () => {
    // Simulating what seasonEndProcessor does: seenAnslag: []
    const newSeasonGame = makeGame({
      currentSeason: 2,
      currentMatchday: 1,
      seenAnslag: [],
      cupBracket: { season: 2, matches: [], byeTeamIds: [], completed: false },
    })
    expect(computeNextAnslag(newSeasonGame)).toBe('cup_start')
  })

  it('alla AnslagKey rensas vid säsongs-byte (verifiera reset-logik)', () => {
    // The seasonEndProcessor sets seenAnslag: [] — verify that with all keys present,
    // resetting to [] makes cup_start available again
    const gameWithAllSeen = makeGame({
      seenAnslag: allKeys,
      currentMatchday: 1,
      cupBracket: { season: 1, matches: [], byeTeamIds: [], completed: false },
    })
    expect(computeNextAnslag(gameWithAllSeen)).toBeNull()

    const gameAfterReset = makeGame({
      seenAnslag: [],
      currentMatchday: 1,
      cupBracket: { season: 2, matches: [], byeTeamIds: [], completed: false },
    })
    expect(computeNextAnslag(gameAfterReset)).toBe('cup_start')
  })

  it('seenAnslag: undefined defaults to [] (gamla saves utan fältet)', () => {
    const legacyGame = makeGame({
      currentMatchday: 1,
      cupBracket: { season: 1, matches: [], byeTeamIds: [], completed: false },
    })
    // Remove seenAnslag completely to simulate old save
    delete (legacyGame as Partial<SaveGame>).seenAnslag
    expect(computeNextAnslag(legacyGame)).toBe('cup_start')
  })

  it('cup_start triggas igen i ny säsong efter reset', () => {
    const season1Game = makeGame({
      currentSeason: 1,
      seenAnslag: ['cup_start'],
      currentMatchday: 1,
      cupBracket: { season: 1, matches: [], byeTeamIds: [], completed: false },
    })
    // Already seen — should not trigger
    expect(computeNextAnslag(season1Game)).not.toBe('cup_start')

    // After season reset
    const season2Game = makeGame({
      currentSeason: 2,
      seenAnslag: [],
      currentMatchday: 1,
      cupBracket: { season: 2, matches: [], byeTeamIds: [], completed: false },
    })
    expect(computeNextAnslag(season2Game)).toBe('cup_start')
  })
})
