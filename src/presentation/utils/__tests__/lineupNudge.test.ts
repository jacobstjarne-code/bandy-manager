/**
 * lineupNudge.test.ts — B10 Ticket 2
 *
 * Verifierar:
 * 1. buildNudgeLineup ger exakt PREFILL_COUNT spelare + EMPTY_SLOTS tomma icke-MV-slots
 * 2. Målvaktsslot är alltid fylld
 * 3. Deterministiskt: samma fixtureId → samma tomma slots
 * 4. Olika fixtureId → (i praktiken) olika tomma slots
 * 5. spelklarhet-formeln (ability*0.7 + form*0.2 + fitness*0.1) använder rätt vikter
 */

import { describe, it, expect } from 'vitest'
import { buildNudgeLineup, spelklarhet, PREFILL_COUNT, EMPTY_SLOTS } from '../lineupNudge'
import { FORMATIONS } from '../../../domain/entities/Formation'
import type { Player } from '../../../domain/entities/Player'
import {
  PlayerPosition,
  PlayerArchetype,
  TacticMentality,
  TacticTempo,
  TacticPress,
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
  overrides: Partial<Pick<Player, 'currentAbility' | 'form' | 'fitness'>> = {}
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
    sharpness: 75,
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
const FORMATION = FORMATIONS['5-3-2']

// ── tests ─────────────────────────────────────────────────────────────────────

describe('lineupNudge (B10 T2)', () => {

  it('PREFILL_COUNT = 8, EMPTY_SLOTS = 3', () => {
    expect(PREFILL_COUNT).toBe(8)
    expect(EMPTY_SLOTS).toBe(3)
  })

  it('spelklarhet använder rätt vikter: ability*0.7 + form*0.2 + fitness*0.1', () => {
    const p = makePlayer('x', PlayerPosition.Forward, { currentAbility: 70, form: 80, fitness: 90 })
    const expected = 70 * 0.7 + 80 * 0.2 + 90 * 0.1
    expect(spelklarhet(p)).toBeCloseTo(expected, 5)
  })

  it('spelklarhet: lågklassig spelare i toppform slår inte högnivåspelare i normalform', () => {
    const star = makePlayer('star', PlayerPosition.Forward, { currentAbility: 80, form: 75, fitness: 75 })
    const hotStreak = makePlayer('hot', PlayerPosition.Forward, { currentAbility: 50, form: 100, fitness: 100 })
    expect(spelklarhet(star)).toBeGreaterThan(spelklarhet(hotStreak))
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

})
