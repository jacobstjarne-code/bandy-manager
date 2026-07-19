import { describe, it, expect } from 'vitest'
import {
  nextMatchIsDerby,
  nextMatchIsSMFinal,
  nextMatchIsCupFinal,
  nextMatchIsFarewellMatch,
  nextMatchIsHome,
  nextMatchIsBigGame,
  alwaysTrue,
} from '../../domain/services/portal/triggers/matchTriggers'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Fixture } from '../../domain/entities/Fixture'
import type { ActiveArc } from '../../domain/entities/Narrative'

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

describe('nextMatchIsCupFinal — B2 (2026-07-19)', () => {
  it('returnerar false om ingen fixture', () => {
    expect(nextMatchIsCupFinal(makeGame([]))).toBe(false)
  })

  it('returnerar false för en vanlig cupmatch (inte round 4)', () => {
    const game = makeGame(
      [{ status: 'scheduled', isCup: true }],
      { cupBracket: { matches: [{ round: 1, fixtureId: 'f0' }] } as never },
    )
    expect(nextMatchIsCupFinal(game)).toBe(false)
  })

  it('returnerar true när nästa fixture är cupbrackets round-4-match', () => {
    const game = makeGame(
      [{ status: 'scheduled', isCup: true }],
      { cupBracket: { matches: [{ round: 4, fixtureId: 'f0' }] } as never },
    )
    expect(nextMatchIsCupFinal(game)).toBe(true)
  })

  it('returnerar false om nästa fixture inte är cup, även om round-4 matchar en annan fixture', () => {
    const game = makeGame(
      [{ status: 'scheduled', isCup: false }],
      { cupBracket: { matches: [{ round: 4, fixtureId: 'f0' }] } as never },
    )
    expect(nextMatchIsCupFinal(game)).toBe(false)
  })
})

describe('nextMatchIsFarewellMatch — B2 (2026-07-19)', () => {
  it('returnerar false utan aktiv veteran_farewell-arc', () => {
    const game = makeGame([{ status: 'scheduled', isCup: false }])
    expect(nextMatchIsFarewellMatch(game)).toBe(false)
  })

  it('returnerar true när nästa fixture är den sista hemmamatchen för en veteran_farewell-spelare', () => {
    const arc: ActiveArc = {
      id: 'arc1', type: 'veteran_farewell', playerId: 'p1',
      startedMatchday: 1, phase: 'peak', expiresMatchday: 22,
    }
    const game = makeGame(
      [{ id: 'f0', homeClubId: 'club_forsbacka', awayClubId: 'club_heros', status: 'scheduled', isCup: false, matchday: 1, season: 2026 }],
      {
        players: [{ id: 'p1', clubId: 'club_forsbacka' } as never],
        activeArcs: [arc],
      },
    )
    expect(nextMatchIsFarewellMatch(game)).toBe(true)
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
