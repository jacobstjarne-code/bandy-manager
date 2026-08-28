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

// Framgångskurvan steg 3, del 2 (DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 3):
// investSurplus mätte tidigare bara kassasaldot (fjärde koefficientrundan,
// historik nedan i boardObjectiveService.ts) — rot: spårning av VERKLIG
// investeringsaktivitet (byggda noder, kontraktsförlängningar, netto-
// transferutgift) fanns inte förrän Part 1 (renewContract → financeLog) och
// FacilityState.builtSeasons (redan fanns, saknade konsument) kopplades ihop.
//
// FIX (2026-08-28): läste ursprungligen kontraktsförlängningar/nettotransfer
// direkt ur financeLog — trasigt, financeLog är capad till FINANCE_LOG_MAX=50
// DELAT över alla kategorier och en händelserik säsong trängde ut tidiga
// poster innan säsongsslut (empiriskt bevisat, se
// scripts/framgangskurvan-ansprak3-investsurplus-matning-2026-08-28.ts).
// Testerna nedan bygger nu game.seasonContractExtensionCount/
// seasonNetTransferSpend direkt (de dedikerade, ocappade fälten) i stället
// för financeLog, plus en explicit regressionstest som bevisar att en
// URTRÄNGD financeLog-post ändå räknas rätt.
describe('evaluateObjective — investSurplus (Framgångskurvan steg 3, del 2)', () => {
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
      managedClubId: 'c1', clubs: [club], currentSeason: 2025, currentMatchday: 10,
      financeLog: [], seasonStartFinances: SURPLUS_CEILING,
      seasonContractExtensionCount: 0, seasonNetTransferSpend: 0,
      ...overrides,
    } as unknown as SaveGame
  }

  it('met: en facility-nod byggd denna säsong (builtSeasons)', () => {
    const game = makeGame({
      facilityState: { builtNodeIds: ['x'], builtSeasons: { x: 2025 } },
    })
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('met')
    expect(result.value).toBe(1)
  })

  it('met: en kontraktsförlängning denna säsong (seasonContractExtensionCount)', () => {
    const game = makeGame({ seasonContractExtensionCount: 1 })
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('met')
    expect(result.value).toBe(1)
  })

  it('met: nettotransferutgift denna säsong (seasonNetTransferSpend negativ — köpt mer än sålt)', () => {
    const game = makeGame({ seasonNetTransferSpend: -300000 })
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('met')
    expect(result.value).toBe(1)
  })

  it('failed: ingen investeringsaktivitet och stor kassatillväxt (>1 mkr) — hamstring', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 1_200_000 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING })
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('failed')
    expect(result.value).toBe(0)
  })

  it('active: ingen investeringsaktivitet men liten/ingen kassatillväxt — inte straffat tidigt i säsongen', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 50000 })
    const game = makeGame({ clubs: [club], seasonStartFinances: SURPLUS_CEILING })
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('active')
    expect(result.value).toBe(0)
  })

  it('nettoförsäljning (sålt mer än köpt) räknas INTE som investering — inget utflöde', () => {
    const club = makeClub({ finances: SURPLUS_CEILING + 1_200_000 })
    const game = makeGame({
      clubs: [club], seasonStartFinances: SURPLUS_CEILING,
      seasonNetTransferSpend: 300000,
    })
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('failed')
    expect(result.value).toBe(0)
  })

  // REGRESSION (2026-08-28): den empiriskt bevisade buggen — en tidig
  // kontraktsförlängning/transfer i financeLog trängs ut av FINANCE_LOG_MAX
  // (50) innan säsongsslut i en händelserik säsong. Simulerar 60 orelaterade
  // 'wages'-poster (pushar en tidig extension/transfer-post ur loggen helt)
  // och bevisar att investSurplus ÄNDÅ räknar rätt via de dedikerade fälten.
  it('REGRESSION: kontraktsförlängning+transfer räknas trots att financeLog-posterna trängts ut av cappen', () => {
    const floodedLog = Array.from({ length: 60 }, (_, i) => ({
      round: i + 1, amount: -5000, reason: 'wages' as const, label: `Löner v${i + 1}`,
    }))
    // De "riktiga" investeringsposterna (matchday 6/10) skulle i en verklig
    // säsong redan vara borta ur financeLog vid det här laget — testet
    // lämnar dem HELT UTANFÖR financeLog för att bevisa att evaluateObjective
    // inte längre är beroende av att de finns kvar där.
    const game = makeGame({
      financeLog: floodedLog,
      seasonContractExtensionCount: 1,
      seasonNetTransferSpend: -150000,
    })
    expect(game.financeLog?.some(e => e.reason === 'contract_extension' || e.reason === 'transfer_in')).toBe(false)
    const result = evaluateObjective(objective, game)
    expect(result.status).toBe('met')
    expect(result.value).toBe(2)
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
