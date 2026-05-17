import { describe, it, expect } from 'vitest'
import {
  detectSceneTrigger,
  shouldTriggerSundayTraining,
  shouldTriggerSMFinalVictory,
  shouldTriggerCupFinalVictory,
} from '../sceneTriggerService'
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

describe('sceneTriggerService — söndagsträningen', () => {
  it('triggar på säsong 1 matchday 1 när board_meeting visad och inte i shownScenes', () => {
    const g = makeGame({ currentSeason: 1, currentMatchday: 1, shownScenes: ['board_meeting'] })
    expect(shouldTriggerSundayTraining(g)).toBe(true)
    expect(detectSceneTrigger(g)).toBe('sunday_training')
  })

  it('triggar inte på matchday 3', () => {
    const g = makeGame({ currentSeason: 1, currentMatchday: 3 })
    expect(shouldTriggerSundayTraining(g)).toBe(false)
  })

  it('triggar inte när redan visad', () => {
    const g = makeGame({ shownScenes: ['sunday_training'] })
    expect(shouldTriggerSundayTraining(g)).toBe(false)
  })

})

describe('sceneTriggerService — SM-finalseger', () => {
  it('triggar när senaste managed-fixture är SM-finalen (isFinaldag=true, ej cup) och vunnen', () => {
    const finalFixture = makeFixture({
      id: 'final',
      matchday: 30,
      isFinaldag: true,
      roundNumber: 22,
      homeClubId: 'managed',
      awayClubId: 'opp',
      homeScore: 3,
      awayScore: 2,
    })
    const g = makeGame({ fixtures: [finalFixture], shownScenes: [] })
    expect(shouldTriggerSMFinalVictory(g)).toBe(true)
    expect(detectSceneTrigger(g)).toBe('sm_final_victory')
  })

  it('triggar inte när SM-finalen förlorades', () => {
    const finalFixture = makeFixture({
      id: 'final',
      matchday: 30,
      isFinaldag: true,
      roundNumber: 22,
      homeClubId: 'managed',
      awayClubId: 'opp',
      homeScore: 1,
      awayScore: 4,
    })
    const g = makeGame({ fixtures: [finalFixture] })
    expect(shouldTriggerSMFinalVictory(g)).toBe(false)
  })

  it('triggar inte när senaste matchen inte är final', () => {
    const reg = makeFixture({
      matchday: 5,
      homeClubId: 'managed',
      awayClubId: 'opp',
      homeScore: 5,
      awayScore: 0,
    })
    const g = makeGame({ fixtures: [reg] })
    expect(shouldTriggerSMFinalVictory(g)).toBe(false)
  })

  it('shownScenes blockerar re-trigger även när SM-final vunnits', () => {
    const finalFixture = makeFixture({
      id: 'final',
      matchday: 30,
      isFinaldag: true,
      roundNumber: 22,
      homeClubId: 'managed',
      awayClubId: 'opp',
      homeScore: 3,
      awayScore: 2,
    })
    const g = makeGame({
      fixtures: [finalFixture],
      shownScenes: ['sm_final_victory'],
    })
    expect(shouldTriggerSMFinalVictory(g)).toBe(false)
  })

  it('SM-final har högre prio än söndagsträningen', () => {
    const finalFixture = makeFixture({
      id: 'final',
      matchday: 30,
      isFinaldag: true,
      roundNumber: 22,
      homeClubId: 'managed',
      awayClubId: 'opp',
      homeScore: 3,
      awayScore: 2,
    })
    const g = makeGame({
      currentSeason: 1,
      currentMatchday: 1,
      fixtures: [finalFixture],
      shownScenes: [],
    })
    expect(detectSceneTrigger(g)).toBe('sm_final_victory')
  })

  it('triggas INTE vid cup-final-vinst — cup hanteras via POKALEN-anslag', () => {
    const g = makeGame({
      managedClubId: 'managed',
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          matchday: 4,
          homeClubId: 'managed',
          awayClubId: 'sandviken',
          homeScore: 4,
          awayScore: 3,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerSMFinalVictory(g)).toBe(false)
  })

  it('triggas INTE vid cup-final-förlust', () => {
    const g = makeGame({
      managedClubId: 'managed',
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          matchday: 4,
          homeClubId: 'managed',
          awayClubId: 'sandviken',
          homeScore: 2,
          awayScore: 3,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerSMFinalVictory(g)).toBe(false)
  })
})

describe('sceneTriggerService — cup-finalseger', () => {
  it('triggar cup_final_victory vid cup-final-vinst (isCup=true, roundNumber>=4)', () => {
    const g = makeGame({
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          matchday: 14,
          homeClubId: 'managed',
          awayClubId: 'sandviken',
          homeScore: 4,
          awayScore: 3,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerCupFinalVictory(g)).toBe(true)
    expect(detectSceneTrigger(g)).toBe('cup_final_victory')
  })

  it('triggar INTE cup_final_victory vid cup-final-förlust', () => {
    const g = makeGame({
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          matchday: 14,
          homeClubId: 'managed',
          awayClubId: 'sandviken',
          homeScore: 2,
          awayScore: 3,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerCupFinalVictory(g)).toBe(false)
  })

  it('shownScenes blockerar re-trigger av cup_final_victory', () => {
    const g = makeGame({
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          matchday: 14,
          homeClubId: 'managed',
          awayClubId: 'sandviken',
          homeScore: 4,
          awayScore: 3,
        }),
      ],
      shownScenes: ['cup_final_victory'],
    })
    expect(shouldTriggerCupFinalVictory(g)).toBe(false)
  })

  it('cup-final-vinst triggar INTE sm_final_victory', () => {
    const g = makeGame({
      fixtures: [
        makeFixture({
          isCup: true,
          roundNumber: 4,
          matchday: 14,
          homeClubId: 'managed',
          awayClubId: 'sandviken',
          homeScore: 4,
          awayScore: 3,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerSMFinalVictory(g)).toBe(false)
  })

  it('SM-final-vinst triggar INTE cup_final_victory', () => {
    const g = makeGame({
      fixtures: [
        makeFixture({
          isFinaldag: true,
          roundNumber: 22,
          matchday: 37,
          homeClubId: 'managed',
          awayClubId: 'opp',
          homeScore: 3,
          awayScore: 2,
        }),
      ],
      shownScenes: [],
    })
    expect(shouldTriggerCupFinalVictory(g)).toBe(false)
    expect(shouldTriggerSMFinalVictory(g)).toBe(true)
  })
})
