// O5 kraft 3 (Jacobs dom 2026-08-17, byggd 2026-08-23): styrelsens
// investeringskrav. Ingen tidigare testfil fanns för boardObjectiveService —
// denna täcker bara den nya investSurplus-objectiven, inte hela filen.
import { describe, it, expect } from 'vitest'
import { generateBoardObjectives, evaluateObjective, SURPLUS_CEILING, isRepeatedObjectiveFailure } from '../boardObjectiveService'
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

  it('active: fortfarande över taket, kassan minskande sen säsongsstart (aldrig sämre än active, fjärde koefficientrundan 2026-08-23)', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 200000 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING + 500000 })
    expect(evaluateObjective(objective, game).status).toBe('active')
  })

  it('active (INTE at_risk): fortfarande över taket och kassan växer — får aldrig faila bara för att ha pengar', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 500000 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING + 200000 })
    expect(evaluateObjective(objective, game).status).toBe('active')
  })
})

// Femte koefficientrundan (Jacobs dom 2026-08-23, O5_FEMTE_PASSET_AVSKEDSDIAGNOS_
// 2026-08-23.md): meritbufferten skyddar inte upprepade objektivmissar.
describe('isRepeatedObjectiveFailure', () => {
  it('false om kostnaden inte är negativ (met eller active) — oavsett historik', () => {
    expect(isRepeatedObjectiveFailure('cupRun', 3, [{ objectiveId: 'cupRun', result: 'failed' }])).toBe(false)
    expect(isRepeatedObjectiveFailure('cupRun', 0, [{ objectiveId: 'cupRun', result: 'failed' }])).toBe(false)
  })

  it('false om ingen tidigare historik finns för objectiveId — en FÄRSK miss, buffer-skyddad', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [])).toBe(false)
    expect(isRepeatedObjectiveFailure('cupRun', -5, [{ objectiveId: 'topHalf', result: 'failed' }])).toBe(false)
  })

  it('false om SENASTE förekomsten av samma objectiveId var met — strecket bröts, ny chans', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [
      { objectiveId: 'cupRun', result: 'failed' },
      { objectiveId: 'cupRun', result: 'met' },
    ])).toBe(false)
  })

  it('true om SENASTE förekomsten av samma objectiveId också var failed — upprepad, oskyddad', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [
      { objectiveId: 'cupRun', result: 'met' },
      { objectiveId: 'cupRun', result: 'failed' },
    ])).toBe(true)
  })

  it('läser SENASTE posten, inte första — flera förekomster i historiken', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [
      { objectiveId: 'cupRun', result: 'failed' },
      { objectiveId: 'cupRun', result: 'met' },
      { objectiveId: 'cupRun', result: 'failed' },
    ])).toBe(true)
    expect(isRepeatedObjectiveFailure('cupRun', -5, [
      { objectiveId: 'cupRun', result: 'failed' },
      { objectiveId: 'cupRun', result: 'failed' },
      { objectiveId: 'cupRun', result: 'met' },
    ])).toBe(false)
  })

  it('andra objectiveId:s historik påverkar inte — filtrerar korrekt per id', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [
      { objectiveId: 'topHalf', result: 'failed' },
      { objectiveId: 'topHalf', result: 'failed' },
    ])).toBe(false)
  })
})
