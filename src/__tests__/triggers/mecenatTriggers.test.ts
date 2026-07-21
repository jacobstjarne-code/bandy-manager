import { describe, it, expect } from 'vitest'
import { mecenatHasPendingDemand } from '../../domain/services/portal/triggers/mecenatTriggers'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Mecenat } from '../../domain/entities/Mecenat'

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1',
    name: 'Test Mecenat',
    gender: 'male',
    business: 'AB',
    businessType: 'entrepreneur',
    wealth: 50,
    personality: 'demanding' as never,
    influence: 50,
    happiness: 80,
    patience: 80,
    contribution: 100000,
    totalContributed: 100000,
    demands: [],
    socialExpectations: [],
    isActive: true,
    arrivedSeason: 1,
    ...overrides,
  } as Mecenat
}

function makeGame(mecenater: Mecenat[] = []): SaveGame {
  return {
    id: 'test',
    managedClubId: 'club_a',
    mecenater,
    clubs: [], players: [], league: {} as never, fixtures: [], standings: [], inbox: [],
    transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [],
    playoffBracket: null, cupBracket: null, pendingEvents: [], transferBids: [],
    handledContractPlayerIds: [], sponsors: [], activeTalentSearch: null,
    talentSearchResults: [], mentorships: [], loanDeals: [],
    academyLevel: 'none' as never, scoutReports: {}, activeScoutAssignment: null,
    scoutBudget: 0, seasonSummaries: [], version: '1.0', lastSavedAt: '2026-10-15',
    currentDate: '2026-10-15', currentSeason: 2026, managerName: 'Test', currentMatchday: 10,
  } as SaveGame
}

describe('mecenatHasPendingDemand — synlighetsfix 2026-07-21', () => {
  it('returnerar false utan mecenater', () => {
    expect(mecenatHasPendingDemand(makeGame([]))).toBe(false)
  })

  it('returnerar false om ingen mecenat har ett pendingDemand', () => {
    expect(mecenatHasPendingDemand(makeGame([makeMecenat()]))).toBe(false)
  })

  it('returnerar false om mecenaten med pendingDemand är inaktiv', () => {
    const mec = makeMecenat({
      isActive: false,
      pendingDemand: { category: 'league_position', description: 'x', createdRound: 5, deadlineRound: 13 },
    })
    expect(mecenatHasPendingDemand(makeGame([mec]))).toBe(false)
  })

  it('returnerar true så fort en aktiv mecenat har ett pendingDemand — INTE bakom en patience-tröskel', () => {
    // Skillnaden mot patronDemandUnmetOver3Rounds: hög happiness/patience ska INTE dölja ett färskt krav.
    const mec = makeMecenat({
      happiness: 90,
      patience: 90,
      pendingDemand: { category: 'league_position', description: 'x', createdRound: 5, deadlineRound: 13 },
    })
    expect(mecenatHasPendingDemand(makeGame([mec]))).toBe(true)
  })
})
