// O5 kraft 3 (Jacobs dom 2026-08-17, byggd 2026-08-23): styrelsens
// investeringskrav. Ingen tidigare testfil fanns för boardObjectiveService —
// denna täcker bara den nya investSurplus-objectiven, inte hela filen.
import { describe, it, expect } from 'vitest'
import { generateBoardObjectives, evaluateObjective, SURPLUS_CEILING } from '../boardObjectiveService'
import type { BoardMember } from '../../entities/Club'
import type { Club } from '../../entities/Club'
import type { SaveGame } from '../../entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../enums'

function makeKassor(): BoardMember {
  return { id: 'kassor-0', firstName: 'Britt', lastName: 'Nord', age: 55, gender: 'f', role: 'kassör', personality: 'ekonom' }
}

function makeClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'c1', name: 'Test FK', shortName: 'TFK', region: 'Test',
    reputation: 60, finances: 100000, wageBudget: 200000, transferBudget: 300000,
    youthQuality: 50, youthRecruitment: 50, youthDevelopment: 50, facilities: 60,
    boardExpectation: ClubExpectation.MidTable, fanExpectation: ClubExpectation.MidTable,
    preferredStyle: ClubStyle.Balanced, hasArtificialIce: false,
    squadPlayerIds: [],
    ...overrides,
  } as Club
}

describe('generateBoardObjectives — investSurplus (O5 kraft 3)', () => {
  const kassör = makeKassor()

  it('erbjuds INTE när kassan är under taket', () => {
    const club = makeClub({ finances: 1_000_000 })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, [kassör], () => 0.9)
    expect(objectives.some(o => o.id === 'investSurplus')).toBe(false)
  })

  it('erbjuds när kassan når taket', () => {
    const club = makeClub({ finances: SURPLUS_CEILING })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, [kassör], () => 0.9)
    expect(objectives.some(o => o.id === 'investSurplus')).toBe(true)
  })

  it('erbjuds inte samtidigt som growFinances/balanceBudget (samma type "economic", bara en väljs)', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 500000 })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, [kassör], () => 0.9)
    const economicObjectives = objectives.filter(o => o.type === 'economic')
    expect(economicObjectives.length).toBeLessThanOrEqual(1)
    expect(economicObjectives[0]?.id).toBe('investSurplus')
  })
})

describe('evaluateObjective — investSurplus (O5 kraft 3)', () => {
  const objective = {
    id: 'investSurplus', type: 'economic' as const, label: 'Investera överskottet', description: '',
    ownerId: 'Britt Nord', ownerPersonality: 'ekonom' as const,
    targetValue: SURPLUS_CEILING, currentValue: 0, measureFn: 'investSurplus',
    status: 'active' as const, assignedSeason: 2025,
    successReward: '', failureConsequence: '', carryOver: false,
  }

  function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
    const club = makeClub({ finances: SURPLUS_CEILING })
    return {
      managedClubId: 'c1', clubs: [club], currentSeason: 2025,
      ...overrides,
    } as unknown as SaveGame
  }

  it('met: kassan tillbaka under taket', () => {
    const club = makeClub({ finances: SURPLUS_CEILING - 1 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING + 500000 })
    expect(evaluateObjective(objective, game).status).toBe('met')
  })

  it('active: fortfarande över taket men minskande sen säsongsstart', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 200000 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING + 500000 })
    expect(evaluateObjective(objective, game).status).toBe('active')
  })

  it('at_risk: fortfarande över taket och INTE minskande', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 500000 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING + 200000 })
    expect(evaluateObjective(objective, game).status).toBe('at_risk')
  })
})
