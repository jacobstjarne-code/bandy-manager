import { describe, it, expect } from 'vitest'
import { patronDemandUnmetOver3Rounds } from '../../domain/services/portal/triggers/patronTriggers'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Patron } from '../../domain/entities/Community'

function makeGame(patron?: Partial<Patron>): SaveGame {
  return {
    id: 'test',
    managedClubId: 'club_a',
    patron: patron ? { name: 'Test', business: 'AB', influence: 50, happiness: 50, contribution: 100000, isActive: true, ...patron } : undefined,
    clubs: [], players: [], league: {} as never, fixtures: [], standings: [], inbox: [],
    transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [],
    playoffBracket: null, cupBracket: null, pendingEvents: [], transferBids: [],
    handledContractPlayerIds: [], sponsors: [], activeTalentSearch: null,
    talentSearchResults: [], mentorships: [], loanDeals: [],
    academyLevel: 'none' as never, scoutReports: {}, activeScoutAssignment: null,
    scoutBudget: 0, seasonSummaries: [], version: '1.0', lastSavedAt: '2026-10-15',
    currentDate: '2026-10-15', currentSeason: 2026, managerName: 'Test', id: 'test',
  } as SaveGame
}

describe('patronDemandUnmetOver3Rounds', () => {
  it('returnerar false om ingen patron', () => {
    expect(patronDemandUnmetOver3Rounds(makeGame())).toBe(false)
  })

  it('returnerar false om patron är inaktiv', () => {
    expect(patronDemandUnmetOver3Rounds(makeGame({ isActive: false }))).toBe(false)
  })

  it('returnerar false om patron saknar demands', () => {
    expect(patronDemandUnmetOver3Rounds(makeGame({ demands: [] }))).toBe(false)
  })

  it('returnerar false om patience är hög (60)', () => {
    expect(patronDemandUnmetOver3Rounds(makeGame({ demands: ['Vinn ligan'], patience: 60 }))).toBe(false)
  })

  it('returnerar true om patience < 30 och demands finns', () => {
    expect(patronDemandUnmetOver3Rounds(makeGame({ demands: ['Vinn ligan'], patience: 15 }))).toBe(true)
  })

  it('returnerar true vid patience = 0', () => {
    expect(patronDemandUnmetOver3Rounds(makeGame({ demands: ['Vinn'], patience: 0 }))).toBe(true)
  })
})
