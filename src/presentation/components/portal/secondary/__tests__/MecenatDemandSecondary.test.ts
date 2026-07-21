import { describe, it, expect } from 'vitest'
import { pickMecenatDemandCard } from '../MecenatDemandSecondary'
import type { SaveGame } from '../../../../../domain/entities/SaveGame'
import type { Mecenat } from '../../../../../domain/entities/Mecenat'

function makeMecenat(overrides: Partial<Mecenat> = {}): Mecenat {
  return {
    id: 'mec1',
    name: 'Sven Almqvist',
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

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managedClubId: 'club_a',
    mecenater: [],
    clubs: [], players: [], league: {} as never, fixtures: [], standings: [], inbox: [],
    transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [],
    playoffBracket: null, cupBracket: null, pendingEvents: [], transferBids: [],
    handledContractPlayerIds: [], sponsors: [], activeTalentSearch: null,
    talentSearchResults: [], mentorships: [], loanDeals: [],
    academyLevel: 'none' as never, scoutReports: {}, activeScoutAssignment: null,
    scoutBudget: 0, seasonSummaries: [], version: '1.0', lastSavedAt: '2026-10-15',
    currentDate: '2026-10-15', currentSeason: 2026, managerName: 'Test', currentMatchday: 10,
    ...overrides,
  } as SaveGame
}

describe('pickMecenatDemandCard — synlighetsfix 2026-07-21 (Patron-paritet)', () => {
  it('returnerar null utan väntande krav', () => {
    expect(pickMecenatDemandCard(makeGame({ mecenater: [makeMecenat()] }))).toBeNull()
  })

  it('visar mecenatens beskrivning och rundor kvar', () => {
    const mec = makeMecenat({
      pendingDemand: { category: 'league_position', description: 'Vinn fler poäng', createdRound: 5, deadlineRound: 13 },
    })
    const card = pickMecenatDemandCard(makeGame({ mecenater: [mec], currentMatchday: 10 }))
    expect(card).not.toBeNull()
    expect(card!.demand.description).toBe('Vinn fler poäng')
    expect(card!.roundsLeft).toBe(3)
    expect(card!.otherCount).toBe(0)
  })

  it('plockar mecenaten vars krav går ut SNARAST när flera väntar', () => {
    const soon = makeMecenat({ id: 'soon', name: 'Snar', pendingDemand: { category: 'league_position', description: 'x', createdRound: 1, deadlineRound: 9 } })
    const later = makeMecenat({ id: 'later', name: 'Sen', pendingDemand: { category: 'youth_focus', description: 'y', createdRound: 1, deadlineRound: 20 } })
    const card = pickMecenatDemandCard(makeGame({ mecenater: [later, soon], currentMatchday: 5 }))
    expect(card!.mec.id).toBe('soon')
    expect(card!.otherCount).toBe(1)
  })

  it('ignorerar inaktiva mecenater', () => {
    const mec = makeMecenat({ isActive: false, pendingDemand: { category: 'league_position', description: 'x', createdRound: 1, deadlineRound: 9 } })
    expect(pickMecenatDemandCard(makeGame({ mecenater: [mec] }))).toBeNull()
  })

  it('roundsLeft går aldrig under 0 (deadline redan passerad utan resolve)', () => {
    const mec = makeMecenat({ pendingDemand: { category: 'league_position', description: 'x', createdRound: 1, deadlineRound: 5 } })
    const card = pickMecenatDemandCard(makeGame({ mecenater: [mec], currentMatchday: 12 }))
    expect(card!.roundsLeft).toBe(0)
  })
})
