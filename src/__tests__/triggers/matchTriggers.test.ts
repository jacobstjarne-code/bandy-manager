import { describe, it, expect } from 'vitest'
import {
  nextMatchIsDerby,
  nextMatchIsSMFinal,
  nextMatchIsHome,
  nextMatchIsBigGame,
  alwaysTrue,
} from '../../domain/services/portal/triggers/matchTriggers'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Fixture } from '../../domain/entities/Fixture'

function makeGame(fixtures: Partial<Fixture>[] = [], overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    managerName: 'Test',
    managedClubId: 'club_forsbacka',
    currentDate: '2026-10-15',
    currentSeason: 2026,
    clubs: [
      { id: 'club_forsbacka', name: 'Forsbacka IF' } as never,
      { id: 'club_gagnef', name: 'Gagnef' } as never,
      { id: 'club_heros', name: 'Heros' } as never,
      { id: 'club_soderfors', name: 'Söderfors' } as never,
    ],
    players: [],
    league: {} as never,
    fixtures: fixtures.map((f, i) => ({
      id: `f${i}`,
      homeClubId: 'club_forsbacka',
      awayClubId: 'club_heros',
      matchday: i + 1,
      roundNumber: i + 1,
      date: '2026-10-20',
      status: 'scheduled',
      isCup: false,
      ...f,
    })) as Fixture[],
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
    rivalryHistory: {},
    version: '1.0',
    lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

describe('nextMatchIsDerby', () => {
  it('returnerar false om ingen fixture', () => {
    const game = makeGame([])
    expect(nextMatchIsDerby(game)).toBe(false)
  })

  it('returnerar false om nästa match inte är derby', () => {
    // Forsbacka vs Heros är inte ett rivalry
    const game = makeGame([{ homeClubId: 'club_forsbacka', awayClubId: 'club_heros', status: 'scheduled' }])
    expect(nextMatchIsDerby(game)).toBe(false)
  })

  it('returnerar true om nästa match är derby (Gagnef-Forsbacka)', () => {
    // Gagnefsderbyt: club_gagnef vs club_forsbacka
    const game = makeGame([{ homeClubId: 'club_gagnef', awayClubId: 'club_forsbacka', status: 'scheduled' }])
    expect(nextMatchIsDerby(game)).toBe(true)
  })

  it('returnerar false om nästa fixture är completed', () => {
    const game = makeGame([{ homeClubId: 'club_gagnef', awayClubId: 'club_forsbacka', status: 'completed' }])
    expect(nextMatchIsDerby(game)).toBe(false)
  })
})

describe('nextMatchIsSMFinal', () => {
  it('returnerar false om ingen fixture', () => {
    const game = makeGame([])
    expect(nextMatchIsSMFinal(game)).toBe(false)
  })

  it('returnerar false för vanlig match', () => {
    const game = makeGame([{ status: 'scheduled', isFinaldag: false }])
    expect(nextMatchIsSMFinal(game)).toBe(false)
  })

  it('returnerar true om nextFixture.isFinaldag är true', () => {
    const game = makeGame([{ status: 'scheduled', isFinaldag: true }])
    expect(nextMatchIsSMFinal(game)).toBe(true)
  })
})

describe('nextMatchIsHome', () => {
  it('returnerar true om nästa match är hemma', () => {
    const game = makeGame([{ homeClubId: 'club_forsbacka', awayClubId: 'club_heros', status: 'scheduled' }])
    expect(nextMatchIsHome(game)).toBe(true)
  })

  it('returnerar false om nästa match är borta', () => {
    const game = makeGame([{ homeClubId: 'club_heros', awayClubId: 'club_forsbacka', status: 'scheduled' }])
    expect(nextMatchIsHome(game)).toBe(false)
  })

  it('returnerar false om ingen fixture', () => {
    const game = makeGame([])
    expect(nextMatchIsHome(game)).toBe(false)
  })
})

describe('nextMatchIsBigGame', () => {
  it('returnerar false för vanlig borta-match', () => {
    const game = makeGame([{ homeClubId: 'club_heros', awayClubId: 'club_forsbacka', status: 'scheduled' }])
    expect(nextMatchIsBigGame(game)).toBe(false)
  })

  it('returnerar true om derby', () => {
    const game = makeGame([{ homeClubId: 'club_gagnef', awayClubId: 'club_forsbacka', status: 'scheduled' }])
    expect(nextMatchIsBigGame(game)).toBe(true)
  })

  it('returnerar true om SM-final', () => {
    const game = makeGame([{ status: 'scheduled', isFinaldag: true }])
    expect(nextMatchIsBigGame(game)).toBe(true)
  })
})

describe('alwaysTrue', () => {
  it('returnerar alltid true', () => {
    expect(alwaysTrue(makeGame([]))).toBe(true)
  })
})
