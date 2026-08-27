// O5 kraft 3 (Jacobs dom 2026-08-17, byggd 2026-08-23): styrelsens
// investeringskrav. Ingen tidigare testfil fanns för boardObjectiveService —
// denna täcker bara den nya investSurplus-objectiven, inte hela filen.
import { describe, it, expect } from 'vitest'
import { generateBoardObjectives, evaluateObjective, SURPLUS_CEILING, isRepeatedObjectiveFailure } from '../boardObjectiveService'
import type { BoardMember } from '../../entities/Club'
import type { Club } from '../../entities/Club'
import type { SaveGame } from '../../entities/SaveGame'
import type { SupporterGroup } from '../../entities/Community'
import { ClubExpectation, ClubStyle } from '../../enums'

function makeSupporterGroup(mood: number): SupporterGroup {
  return {
    name: 'Testkurvan', founded: 1, members: 40, mood,
    leader: { name: 'L', role: 'leader' },
    veteran: { name: 'V', role: 'veteran' },
    youth: { name: 'Y', role: 'youth' },
    family: { name: 'F', role: 'family' },
  }
}

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

// Styrelseobjektiv-tiern (Jacobs dom 2026-08-25): "objektiven HÄRLEDS ur
// ClubExpectation. Skala inte kostnaden — byt uppsättningen." investSurplus
// var tidigare finance-gated för VILKEN klubb som helst (O5 kraft 3,
// 2026-08-23) — nu bara tilldelad ChallengeTop-tiern, oavsett kassa. Testerna
// nedan uppdaterade till att spegla detta: finances-nivån avgör inte längre
// OM investSurplus erbjuds, bara evaluateObjectives status GIVET att den
// redan är tilldelad (de testerna, längre ner i filen, är oförändrade).
describe('generateBoardObjectives — investSurplus tilldelas av tier, inte finances (styrelseobjektiv-tiern 2026-08-25)', () => {
  const kassör = makeKassor()

  it('ChallengeTop-klubb får investSurplus oavsett kassans nivå', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.ChallengeTop, finances: 1_000 })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, [kassör], () => 0.9)
    expect(objectives.some(o => o.id === 'investSurplus')).toBe(true)
  })

  it('MidTable-klubb får INTE investSurplus, även med kassa långt över taket — tier styr, inte finances', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.MidTable, finances: SURPLUS_CEILING + 500000 })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, [kassör], () => 0.9)
    expect(objectives.some(o => o.id === 'investSurplus')).toBe(false)
  })

  it('Survive-klubb får balanceBudget oavsett kassans faktiska saldo — identitet, inte varningströskel', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.Survive, finances: 1_000_000 })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, [kassör], () => 0.9)
    expect(objectives.some(o => o.id === 'balanceBudget')).toBe(true)
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

// PÅSTÅENDEKARTAN (2026-08-24): growFanbase-objektivet ("Publikens humör ska
// nå 70") mättes tidigare mot game.fanMood — ett annat fält (matchmotor/
// attendance) än det klackhumör objektivets egen text talar om.
// game.supporterGroup.mood är den nedskrivna sanningen nu, både i
// genereringsgaten och i measureObjectiveProgress.
describe('generateBoardObjectives / evaluateObjective — growFanbase (PÅSTÅENDEKARTAN)', () => {
  const kassör = makeKassor()
  const modernist: BoardMember = { id: 'mod-0', firstName: 'Kjell', lastName: 'Ek', age: 50, gender: 'm', role: 'ledamot', personality: 'modernist' }
  const objective = {
    id: 'growFanbase', type: 'community' as const, label: 'Publikens humör ska nå 70', description: '',
    ownerId: 'Kjell Ek', ownerPersonality: 'modernist' as const,
    targetValue: 70, currentValue: 0, measureFn: 'growFanbase',
    status: 'active' as const, assignedSeason: 2025,
    successReward: '', failureConsequence: '', carryOver: false,
  }

  // Styrelseobjektiv-tiern (2026-08-25): growFanbase är nu en FAST identitets-
  // objektiv för MidTable-tiern, tilldelad oavsett aktuellt mood-läge (samma
  // skifte som investSurplus ovan) — det gamla "bara om mood<60"-villkoret är
  // borta. Kvarstående sanning: evaluateObjective läser fortfarande
  // supporterGroup.mood, inte fanMood, för att AVGÖRA status — det testas
  // separat nedan, oförändrat.
  it('MidTable-klubb får growFanbase oavsett aktuellt mood — identitet, inte tröskel', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.MidTable })
    const objectives = generateBoardObjectives(
      club,
      { currentSeason: 2025, players: [], clubs: [club], fanMood: 10, supporterGroup: makeSupporterGroup(80) },
      [kassör, modernist], () => 0.9
    )
    expect(objectives.some(o => o.id === 'growFanbase')).toBe(true)
  })

  it('ChallengeTop-klubb får INTE growFanbase — inte i den tierns uppsättning', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.ChallengeTop })
    const objectives = generateBoardObjectives(
      club,
      { currentSeason: 2025, players: [], clubs: [club], fanMood: 10, supporterGroup: makeSupporterGroup(30) },
      [kassör, modernist], () => 0.9
    )
    expect(objectives.some(o => o.id === 'growFanbase')).toBe(false)
  })

  it('evaluateObjective: "met" när supporterGroup.mood når 70, oavsett fanMood', () => {
    const club = makeClub()
    const game = { managedClubId: 'c1', clubs: [club], currentSeason: 2025, fanMood: 20, supporterGroup: makeSupporterGroup(75) } as unknown as SaveGame
    expect(evaluateObjective(objective, game).status).toBe('met')
  })

  it('evaluateObjective: "at_risk" när supporterGroup.mood är lågt, trots högt fanMood', () => {
    const club = makeClub()
    const game = { managedClubId: 'c1', clubs: [club], currentSeason: 2025, fanMood: 95, supporterGroup: makeSupporterGroup(40) } as unknown as SaveGame
    expect(evaluateObjective(objective, game).status).toBe('at_risk')
  })
})

/**
 * Styrelseobjektiv-tiern (Jacobs dom 2026-08-25): "En Survive-klubb ska inte
 * få lättare krav, den ska få ANDRA krav... En WinLeague-klubb får topHalf
 * och cupRun." Verifierar den fullständiga femtierstege-uppsättningen
 * exakt, plus den nya avoidRelegation-objektivtypen.
 */
describe('generateBoardObjectives — tier-uppsättningarna (styrelseobjektiv-tiern 2026-08-25)', () => {
  const kassör = makeKassor()
  const traditionalist: BoardMember = { id: 't-0', firstName: 'A', lastName: 'B', age: 50, gender: 'm', role: 'ledamot', personality: 'traditionalist' }
  const modernist: BoardMember = { id: 'm-0', firstName: 'C', lastName: 'D', age: 50, gender: 'f', role: 'ledamot', personality: 'modernist' }
  const supporter: BoardMember = { id: 's-0', firstName: 'E', lastName: 'F', age: 50, gender: 'm', role: 'ledamot', personality: 'supporter' }
  const allMembers = [kassör, traditionalist, modernist, supporter]

  function idsFor(expectation: ClubExpectation): string[] {
    const club = makeClub({ boardExpectation: expectation })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, allMembers, () => 0.5)
    return objectives.map(o => o.id).sort()
  }

  it('Survive: avoidRelegation, balanceBudget, improveYouth — Jacobs egna exempel, ordagrant', () => {
    expect(idsFor(ClubExpectation.Survive)).toEqual(['avoidRelegation', 'balanceBudget', 'improveYouth'].sort())
  })

  it('AvoidBottom: avoidRelegation (delat med Survive), reduceInjuries, growFinances', () => {
    expect(idsFor(ClubExpectation.AvoidBottom)).toEqual(['avoidRelegation', 'growFinances', 'reduceInjuries'].sort())
  })

  it('MidTable: topHalf, growFanbase, improveYouth (improveYouth delat med Survive)', () => {
    expect(idsFor(ClubExpectation.MidTable)).toEqual(['growFanbase', 'improveYouth', 'topHalf'].sort())
  })

  // beatRival kräver en riktig rival-mappning (RIVALRIES, rivalries.ts) —
  // testklubben 'c1' är inte en riktig klubb-id, så idsFor()-härledningen
  // ovan innehåller aldrig beatRival (getRivalClubId('c1') → null, korrekt
  // gracefully-hoppad). ChallengeTop/WinLeague testas här mot BARA de två
  // rival-oberoende objektiven; en riktig rival-klubb testas separat nedan.
  it('ChallengeTop: cupRun + investSurplus (beatRival kräver en riktig rival, se separat test)', () => {
    expect(idsFor(ClubExpectation.ChallengeTop)).toEqual(['cupRun', 'investSurplus'].sort())
  })

  it('WinLeague: topHalf + cupRun — Jacobs egna exempel, ordagrant (beatRival kräver en riktig rival, se separat test)', () => {
    expect(idsFor(ClubExpectation.WinLeague)).toEqual(['cupRun', 'topHalf'].sort())
  })

  it('beatRival tilldelas när klubben har en riktig, definierad rival (club_soderfors ↔ club_skutskar)', () => {
    const club = makeClub({ id: 'club_soderfors', boardExpectation: ClubExpectation.WinLeague })
    const rival = makeClub({ id: 'club_skutskar' })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club, rival] }, allMembers, () => 0.5)
    expect(objectives.some(o => o.id === 'beatRival')).toBe(true)
  })

  it('avoidRelegation-målet är golv+2 (RELEGATION_ZONE_SIZE) under totalTeams — inte en gissad siffra', () => {
    const club = makeClub({ boardExpectation: ClubExpectation.Survive })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: Array.from({ length: 12 }, (_, i) => makeClub({ id: `c${i}` })) }, allMembers, () => 0.5)
    const obj = objectives.find(o => o.id === 'avoidRelegation')
    expect(obj?.targetValue).toBe(10) // 12 - RELEGATION_ZONE_SIZE(2)
  })

  it('beatRival hoppas över (inte kraschar) om klubben saknar en definierad rival', () => {
    const club = makeClub({ id: 'club_utan_rival', boardExpectation: ClubExpectation.WinLeague })
    const objectives = generateBoardObjectives(club, { currentSeason: 2025, players: [], clubs: [club] }, allMembers, () => 0.5)
    expect(objectives.some(o => o.id === 'beatRival')).toBe(false)
    expect(objectives.length).toBeGreaterThan(0) // topHalf/cupRun tilldelas ändå
  })
})

describe('avoidRelegation — evaluateObjective (styrelseobjektiv-tiern 2026-08-25)', () => {
  const objective = {
    id: 'avoidRelegation', type: 'sporting' as const, label: '[Opus]', description: '',
    ownerId: 'E F', ownerPersonality: 'supporter' as const,
    targetValue: 10, currentValue: 0, measureFn: 'avoidRelegation',
    status: 'active' as const, assignedSeason: 2025,
    successReward: '', failureConsequence: '', carryOver: false,
  }

  function gameAtPosition(pos: number): SaveGame {
    const club = makeClub()
    return {
      managedClubId: 'c1', clubs: [club], currentSeason: 2025,
      standings: [{ clubId: 'c1', position: pos, points: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }],
    } as unknown as SaveGame
  }

  it('met: säkert över nedflyttningszonen (plats 10 av 12)', () => {
    expect(evaluateObjective(objective, gameAtPosition(10)).status).toBe('met')
  })

  it('at_risk: precis i zonens övre kant (plats 11)', () => {
    expect(evaluateObjective(objective, gameAtPosition(11)).status).toBe('at_risk')
  })

  it('failed: botten av zonen (plats 12)', () => {
    expect(evaluateObjective(objective, gameAtPosition(12)).status).toBe('failed')
  })
})

// Femte koefficientrundan (Jacobs dom 2026-08-23, O5_FEMTE_PASSET_AVSKEDSDIAGNOS_
// 2026-08-23.md): meritbufferten skyddar inte upprepade objektivmissar.
describe('isRepeatedObjectiveFailure', () => {
  it('false om kostnaden inte är negativ (met eller active) — oavsett historik', () => {
    expect(isRepeatedObjectiveFailure('cupRun', 3, [{ objectiveId: 'cupRun', result: 'failed' }])).toBe(false)
    expect(isRepeatedObjectiveFailure('cupRun', 0, [{ objectiveId: 'cupRun', result: 'failed' }])).toBe(false)
  })

  it('false om ingen tidigare historik finns för objectiveId — en FÄRSK miss, helt buffer-berättigad', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [])).toBe(false)
    expect(isRepeatedObjectiveFailure('cupRun', -5, [{ objectiveId: 'topHalf', result: 'failed' }])).toBe(false)
  })

  it('false om SENASTE förekomsten av samma objectiveId var met — strecket bröts, ny chans', () => {
    expect(isRepeatedObjectiveFailure('cupRun', -5, [
      { objectiveId: 'cupRun', result: 'failed' },
      { objectiveId: 'cupRun', result: 'met' },
    ])).toBe(false)
  })

  it('true om SENASTE förekomsten av samma objectiveId också var failed — upprepad (seasonEndProcessor.ts ger den bara halvt buffer-skydd, se REPEATED_FAILURE_BUFFER_PROTECTION)', () => {
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
