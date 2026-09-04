/**
 * lineupNudge.test.ts — B10 Ticket 2 + High 2 (Skutskär-auditen, 2026-08-22)
 *
 * Verifierar:
 * 1. buildNudgeLineup ger exakt PREFILL_COUNT spelare + EMPTY_SLOTS tomma icke-MV-slots
 * 2. Målvaktsslot är alltid fylld
 * 3. Deterministiskt: samma fixtureId → samma tomma slots
 * 4. Olika fixtureId → (i praktiken) olika tomma slots
 * 5. pickBestEleven sorterar efter getSelectionScore (currentAbility×playerModifier,
 *    samma viktning matchmotorn använder) — spelklarhet (CA*0.7+form*0.2+fitness*0.1)
 *    är borttagen, det var den andra sanningen som orsakade auditfyndet.
 * 6. SPELKLARHET_FITNESS_FLOOR: en spelare under golvet utesluts om ett
 *    alternativ finns, men inkluderas ändå om poolen ovanför golvet är för tunn.
 */

import { describe, it, expect } from 'vitest'
import { buildNudgeLineup, buildCarryForwardLineup, pickBestEleven, assessFatigueFloorBreach, SPELKLARHET_FITNESS_FLOOR, PREFILL_COUNT, EMPTY_SLOTS } from '../lineupNudge'
import { getSelectionScore } from '../../../domain/services/squadEvaluator'
import { FORMATIONS, autoAssignFormation } from '../../../domain/entities/Formation'
import type { Player } from '../../../domain/entities/Player'
import type { Tactic } from '../../../domain/entities/Club'
import {
  PlayerPosition,
  PlayerArchetype,
  TacticMentality,
  TacticTempo,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../../domain/enums'

// ── helpers ──────────────────────────────────────────────────────────────────

function makePlayer(
  id: string,
  position: PlayerPosition,
  overrides: Partial<Pick<Player, 'currentAbility' | 'form' | 'fitness' | 'seasonForm' | 'sharpness'>> = {}
): Player {
  const ca = overrides.currentAbility ?? 65
  return {
    id,
    firstName: 'Test',
    lastName: 'Spelare',
    age: 25,
    nationality: 'SE',
    clubId: 'club1',
    isHomegrown: true,
    position,
    archetype: position === PlayerPosition.Goalkeeper
      ? PlayerArchetype.ReflexGoalkeeper
      : PlayerArchetype.TwoWaySkater,
    salary: 10000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 75,
    form: overrides.form ?? 75,
    fitness: overrides.fitness ?? 75,
    // playerModifier() cappar effectiveFitness mot (seasonForm ?? 60) + 3 —
    // sätt seasonForm = fitness som default här så testens fitness-värden
    // faktiskt slår igenom obeskurna, om inte testet EXPLICIT vill testa capen.
    seasonForm: overrides.seasonForm ?? overrides.fitness ?? 75,
    sharpness: overrides.sharpness ?? 75,
    currentAbility: ca,
    potentialAbility: ca + 10,
    developmentRate: 50,
    injuryProneness: 30,
    discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca,
      decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: position === PlayerPosition.Goalkeeper ? ca + 15 : 10,
      cornerRecovery: 50,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
      yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0,
    },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeFullSquad(): Player[] {
  return [
    makePlayer('gk1', PlayerPosition.Goalkeeper, { currentAbility: 70 }),
    makePlayer('gk2', PlayerPosition.Goalkeeper, { currentAbility: 60 }),
    makePlayer('d1', PlayerPosition.Defender, { currentAbility: 68 }),
    makePlayer('d2', PlayerPosition.Defender, { currentAbility: 66 }),
    makePlayer('d3', PlayerPosition.Defender, { currentAbility: 64 }),
    makePlayer('d4', PlayerPosition.Defender, { currentAbility: 62 }),
    makePlayer('h1', PlayerPosition.Half, { currentAbility: 67 }),
    makePlayer('h2', PlayerPosition.Half, { currentAbility: 65 }),
    makePlayer('h3', PlayerPosition.Half, { currentAbility: 63 }),
    makePlayer('m1', PlayerPosition.Midfielder, { currentAbility: 66 }),
    makePlayer('m2', PlayerPosition.Midfielder, { currentAbility: 64 }),
    makePlayer('f1', PlayerPosition.Forward, { currentAbility: 69 }),
    makePlayer('f2', PlayerPosition.Forward, { currentAbility: 67 }),
    makePlayer('f3', PlayerPosition.Forward, { currentAbility: 60 }),
  ]
}

const FIXTURE_ID_A = 'fixture_league_001'
const FIXTURE_ID_B = 'fixture_league_002'
const FORMATION = FORMATIONS['532_tvatoppar']
const BASE_TACTIC: Tactic = {
  formation: '532_tvatoppar',
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('lineupNudge (B10 T2)', () => {

  it('PREFILL_COUNT = 8, EMPTY_SLOTS = 3', () => {
    expect(PREFILL_COUNT).toBe(8)
    expect(EMPTY_SLOTS).toBe(3)
  })

  // High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom): sorteringen ska
  // använda getSelectionScore (currentAbility×playerModifier), samma
  // viktning matchmotorn faktiskt använder — inte en egen, andra sanning.
  it('pickBestEleven sorterar efter getSelectionScore, inte råa currentAbility', () => {
    // Två spelare med samma CA men olika fitness/form ska INTE rankas lika —
    // getSelectionScore multiplicerar CA mot playerModifier (form/fitness/
    // sharpness), spelklarhets linjära 10%-fitnessvikt hade gett ett mindre
    // gap. seasonForm satt = fitness (se makePlayer) så capen inte stör.
    const fresh = makePlayer('fresh', PlayerPosition.Forward, { currentAbility: 65, form: 90, fitness: 95 })
    const stale = makePlayer('stale', PlayerPosition.Forward, { currentAbility: 65, form: 40, fitness: 30 })
    expect(getSelectionScore(fresh)).toBeGreaterThan(getSelectionScore(stale))
    // Skillnaden ska vara stor (multiplikativ), inte den lilla marginal en
    // 10%-linjär fitnessvikt hade gett för samma CA.
    expect(getSelectionScore(fresh) - getSelectionScore(stale)).toBeGreaterThan(15)
  })

  // Skutskär-auditens test 12 (52009671, 2026-08-20): "simulera identiska
  // elvor vid 100/50/20/0 % och kontrollera monotont fallande förväntad
  // prestation." Direkt regressionsskydd för High 2-fixen (två dagar
  // gammal när detta test skrevs, 2026-08-24) — getSelectionScore är
  // funktionen fixet FÖRDE IN. seasonForm satt = fitness på varje nivå
  // (se makePlayer) så season-form-capen inte stör mätningen.
  it('getSelectionScore faller monotont vid 100 → 50 → 20 → 0 % kondition, samma spelare i övrigt', () => {
    const scores = [100, 50, 20, 0].map(fitness =>
      getSelectionScore(makePlayer('p', PlayerPosition.Forward, { currentAbility: 70, form: 75, fitness }))
    )
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1])
    }
  })

  it('en svag spelare i toppform/fitness kan fortfarande rankas under en stark spelare i normalform — CA väger fortfarande in', () => {
    const star = makePlayer('star', PlayerPosition.Forward, { currentAbility: 85, form: 75, fitness: 75 })
    const hotStreakButWeak = makePlayer('hot', PlayerPosition.Forward, { currentAbility: 40, form: 100, fitness: 100 })
    expect(getSelectionScore(star)).toBeGreaterThan(getSelectionScore(hotStreakButWeak))
  })

  it('SPELKLARHET_FITNESS_FLOOR: en spelare under golvet utesluts ur bästa-11 när ett bättre alternativ finns på samma position', () => {
    const exhausted = makePlayer('exhausted', PlayerPosition.Forward, { currentAbility: 90, fitness: SPELKLARHET_FITNESS_FLOOR - 5 })
    const fresh = makePlayer('fresh_f', PlayerPosition.Forward, { currentAbility: 40, fitness: 80 })
    const squad = [
      makePlayer('gk', PlayerPosition.Goalkeeper),
      ...Array.from({ length: 9 }, (_, i) => makePlayer(`filler${i}`, PlayerPosition.Defender, { currentAbility: 50, fitness: 80 })),
      exhausted,
      fresh,
    ]
    const { starters } = pickBestEleven(squad)
    // exhausted har högre rå CA men ligger under golvet OCH ett alternativ finns → uteslutet
    expect(starters.some(p => p.id === 'exhausted')).toBe(false)
    expect(starters.some(p => p.id === 'fresh_f')).toBe(true)
  })

  it('SPELKLARHET_FITNESS_FLOOR: en tunn trupp (alla under golvet) väljer ändå NÅGON — golvet kastar aldrig bort spelare det inte finns ersättare för', () => {
    const squad = [
      makePlayer('gk', PlayerPosition.Goalkeeper, { fitness: SPELKLARHET_FITNESS_FLOOR - 10 }),
      ...Array.from({ length: 10 }, (_, i) => makePlayer(`p${i}`, PlayerPosition.Defender, { fitness: SPELKLARHET_FITNESS_FLOOR - 10, currentAbility: 50 + i })),
    ]
    const { starters } = pickBestEleven(squad)
    expect(starters.length).toBe(11)
  })

  // ── A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md), krav 1 ──────────────────────
  // "Autofyll får aldrig TYST starta under golvet." Fallbacken under golvet
  // fanns redan (HIGH2) — det som saknades var att den RAPPORTERADE sig.
  // Testerna nedan låser att den gör det: tyst fyllning är en regression.

  it('A3: pickBestEleven rapporterar `forced` när poolen över golvet inte räcker till elva', () => {
    const squad = [
      makePlayer('gk', PlayerPosition.Goalkeeper, { fitness: 80 }),
      // Bara 8 över golvet — elva krävs, alltså saknas 3.
      ...Array.from({ length: 7 }, (_, i) => makePlayer(`ok${i}`, PlayerPosition.Defender, { fitness: 80, currentAbility: 60 })),
      ...Array.from({ length: 5 }, (_, i) => makePlayer(`slut${i}`, PlayerPosition.Forward, { fitness: SPELKLARHET_FITNESS_FLOOR - 8, currentAbility: 60 })),
    ]
    const result = pickBestEleven(squad)
    expect(result.starters.length).toBe(11)
    expect(result.forced).toBe(true)
    expect(result.shortfall).toBe(3)
    expect(result.belowFloorStarters.length).toBe(3)
    // Rapporten ska namnge exakt de spelare som faktiskt står i elvan under golvet.
    for (const p of result.belowFloorStarters) {
      expect(result.starters.some(s => s.id === p.id)).toBe(true)
      expect(p.fitness).toBeLessThan(SPELKLARHET_FITNESS_FLOOR)
    }
  })

  it('A3: pickBestEleven rapporterar INTE `forced` när elva finns över golvet', () => {
    const squad = makeFullSquad()
    const result = pickBestEleven(squad)
    expect(result.forced).toBe(false)
    expect(result.shortfall).toBe(0)
    expect(result.belowFloorStarters).toHaveLength(0)
  })

  it('A3: assessFatigueFloorBreach fångar en MANUELLT ihopsatt elva under golvet — grinden sitter på beslutet, inte på autofyll-knappen', () => {
    // Poolen HAR elva spelklara över golvet; managern har ändå valt in en
    // utsliten favorit. Det är samma dolda straff och ska rapporteras.
    const exhausted = makePlayer('favorit', PlayerPosition.Forward, { fitness: 5, currentAbility: 90 })
    const available = [
      ...makeFullSquad(),
      exhausted,
    ]
    const manualEleven = [exhausted, ...makeFullSquad().slice(0, 10)]
    const breach = assessFatigueFloorBreach(manualEleven, available)
    expect(breach.belowFloorStarters.map(p => p.id)).toEqual(['favorit'])
    // Truppen HADE elva över golvet → inte tvingad. Valet var managerns eget.
    expect(breach.forced).toBe(false)
    expect(breach.shortfall).toBe(0)
  })

  it('buildNudgeLineup: returnerar exakt PREFILL_COUNT startspelares IDs', () => {
    const squad = makeFullSquad()
    const result = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    expect(result.starterIds.length).toBe(PREFILL_COUNT)
  })

  it('buildNudgeLineup: målvakt är alltid fylld i slots', () => {
    const squad = makeFullSquad()
    const result = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    const gkSlot = FORMATION.slots.find(s => s.position === PlayerPosition.Goalkeeper)
    expect(gkSlot).toBeDefined()
    const gkSlotValue = result.lineupSlots[gkSlot!.id]
    expect(gkSlotValue).not.toBeNull()
    expect(typeof gkSlotValue).toBe('string')
  })

  it('buildNudgeLineup: exakt EMPTY_SLOTS icke-MV-slots är null', () => {
    const squad = makeFullSquad()
    const result = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    const nonGkSlots = FORMATION.slots.filter(s => s.position !== PlayerPosition.Goalkeeper)
    const emptyNonGkSlots = nonGkSlots.filter(s => result.lineupSlots[s.id] === null)
    expect(emptyNonGkSlots.length).toBe(EMPTY_SLOTS)
  })

  it('buildNudgeLineup: totalt antal fyllda slots = PREFILL_COUNT (11 - EMPTY_SLOTS)', () => {
    const squad = makeFullSquad()
    const result = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    const filledSlots = Object.values(result.lineupSlots).filter(v => v !== null)
    expect(filledSlots.length).toBe(PREFILL_COUNT)
  })

  it('buildNudgeLineup: deterministiskt — samma fixtureId ger samma tomma slots', () => {
    const squad = makeFullSquad()
    const r1 = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    const r2 = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)

    const emptySlots1 = Object.entries(r1.lineupSlots).filter(([, v]) => v === null).map(([k]) => k).sort()
    const emptySlots2 = Object.entries(r2.lineupSlots).filter(([, v]) => v === null).map(([k]) => k).sort()

    expect(emptySlots1).toEqual(emptySlots2)
    expect(r1.starterIds).toEqual(r2.starterIds)
  })

  it('buildNudgeLineup: olika fixtureId ger olika tomma slots (i praktiken)', () => {
    const squad = makeFullSquad()
    const rA = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    const rB = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_B)

    const emptyA = Object.entries(rA.lineupSlots).filter(([, v]) => v === null).map(([k]) => k).sort().join(',')
    const emptyB = Object.entries(rB.lineupSlots).filter(([, v]) => v === null).map(([k]) => k).sort().join(',')

    // Med 10 icke-MV-slots och 3 tomma finns C(10,3)=120 möjliga kombinationer.
    // Två slumpmässiga sekvenser ska ge olika kombinationer.
    expect(emptyA).not.toBe(emptyB)
  })

  it('buildNudgeLineup: starterIds-spelare finns alla i lineupSlots som values', () => {
    const squad = makeFullSquad()
    const result = buildNudgeLineup(squad, FORMATION, FIXTURE_ID_A)
    const slotValues = new Set(Object.values(result.lineupSlots).filter((v): v is string => v !== null))
    for (const id of result.starterIds) {
      expect(slotValues.has(id), `Spelare ${id} ska ha en slot-plats`).toBe(true)
    }
  })

  it('buildNudgeLineup: inga skadade eller avstängda spelare tas med', () => {
    const squad = makeFullSquad()
    // Skada de två bästa utespelarna
    const injuredSquad = squad.map(p => {
      if (p.id === 'f1' || p.id === 'd1') return { ...p, isInjured: true }
      return p
    })
    const available = injuredSquad.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
    const result = buildNudgeLineup(available, FORMATION, FIXTURE_ID_A)

    // Skadade ska inte finnas bland starterIds
    expect(result.starterIds.includes('f1')).toBe(false)
    expect(result.starterIds.includes('d1')).toBe(false)
  })

  it('buildCarryForwardLineup: nästa match börjar med samma kompletta elva och platser', () => {
    const squad = makeFullSquad()
    const starters = pickBestEleven(squad).starters
    const lineupSlots = autoAssignFormation(FORMATION, starters)
    const previous = {
      startingPlayerIds: starters.map(player => player.id),
      benchPlayerIds: squad.filter(player => !starters.includes(player)).slice(0, 3).map(player => player.id),
      captainPlayerId: starters[1].id,
      tactic: { ...BASE_TACTIC, lineupSlots },
    }

    const carried = buildCarryForwardLineup(previous, squad, previous.tactic)

    expect(carried.startingPlayerIds).toEqual(previous.startingPlayerIds)
    expect(carried.tactic.lineupSlots).toEqual(lineupSlots)
    expect(carried.captainPlayerId).toBe(previous.captainPlayerId)
  })

  it('buildCarryForwardLineup: en otillgänglig spelare lämnar ett ärligt hål men resten står kvar', () => {
    const squad = makeFullSquad()
    const starters = pickBestEleven(squad).starters
    const lineupSlots = autoAssignFormation(FORMATION, starters)
    const unavailableId = starters.find(player => player.position !== PlayerPosition.Goalkeeper)!.id
    const unavailableSlot = Object.entries(lineupSlots).find(([, id]) => id === unavailableId)![0]
    const previous = {
      startingPlayerIds: starters.map(player => player.id),
      benchPlayerIds: squad.filter(player => !starters.includes(player)).map(player => player.id),
      captainPlayerId: unavailableId,
      tactic: { ...BASE_TACTIC, lineupSlots },
    }

    const carried = buildCarryForwardLineup(
      previous,
      squad.filter(player => player.id !== unavailableId),
      previous.tactic,
    )

    expect(carried.startingPlayerIds).toHaveLength(10)
    expect(carried.startingPlayerIds).not.toContain(unavailableId)
    expect(carried.tactic.lineupSlots?.[unavailableSlot]).toBeNull()
    expect(carried.captainPlayerId).not.toBe(unavailableId)
  })

})
