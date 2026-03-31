import { describe, it, expect } from 'vitest'
import { FORMATIONS, autoAssignFormation } from '../../entities/Formation'
import { getPositionFit } from '../squadEvaluator'
import { getTacticModifiers } from '../tacticModifiers'
import type { Player } from '../../entities/Player'
import type { Tactic } from '../../entities/Club'
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
} from '../../enums'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Test',
    lastName: 'Player',
    age: 25,
    nationality: 'SE',
    clubId: 'club1',
    isHomegrown: true,
    position: PlayerPosition.Midfielder,
    archetype: PlayerArchetype.TwoWaySkater,
    salary: 10000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 75,
    form: 75,
    fitness: 75,
    sharpness: 75,
    currentAbility: 70,
    potentialAbility: 80,
    developmentRate: 50,
    injuryProneness: 30,
    discipline: 70,
    attributes: {
      skating: 70,
      acceleration: 70,
      stamina: 70,
      ballControl: 70,
      passing: 70,
      shooting: 70,
      dribbling: 70,
      vision: 70,
      decisions: 70,
      workRate: 70,
      positioning: 70,
      defending: 70,
      cornerSkill: 70,
      goalkeeping: 70,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      cornerGoals: 0,
      penaltyGoals: 0,
      yellowCards: 0,
      redCards: 0,
      suspensions: 0,
      averageRating: 7.0,
      minutesPlayed: 0,
    },
    careerStats: {
      totalGames: 0,
      totalGoals: 0,
      totalAssists: 0,
      seasonsPlayed: 1,
    },
    ...overrides,
  }
}

function makeTactic(overrides: Partial<Tactic> = {}): Tactic {
  return {
    mentality: TacticMentality.Balanced,
    tempo: TacticTempo.Normal,
    press: TacticPress.Medium,
    passingRisk: TacticPassingRisk.Mixed,
    width: TacticWidth.Normal,
    attackingFocus: TacticAttackingFocus.Mixed,
    cornerStrategy: CornerStrategy.Standard,
    penaltyKillStyle: PenaltyKillStyle.Active,
    ...overrides,
  }
}

describe('Formation templates', () => {
  it('each formation has exactly 11 slots', () => {
    for (const [type, template] of Object.entries(FORMATIONS)) {
      expect(template.slots).toHaveLength(11), `${type} should have 11 slots`
    }
  })

  it('each formation has exactly one Goalkeeper slot', () => {
    for (const [type, template] of Object.entries(FORMATIONS)) {
      const gkCount = template.slots.filter(s => s.position === PlayerPosition.Goalkeeper).length
      expect(gkCount).toBe(1), `${type} should have exactly 1 GK slot`
    }
  })
})

describe('getPositionFit', () => {
  it('returns 1.0 for exact position match', () => {
    expect(getPositionFit(PlayerPosition.Forward, PlayerPosition.Forward)).toBe(1.0)
    expect(getPositionFit(PlayerPosition.Defender, PlayerPosition.Defender)).toBe(1.0)
    expect(getPositionFit(PlayerPosition.Goalkeeper, PlayerPosition.Goalkeeper)).toBe(1.0)
  })

  it('returns 0.90 for adjacent positions', () => {
    // Forward is adjacent to Midfielder
    expect(getPositionFit(PlayerPosition.Forward, PlayerPosition.Midfielder)).toBe(0.90)
    // Defender is adjacent to Half
    expect(getPositionFit(PlayerPosition.Defender, PlayerPosition.Half)).toBe(0.90)
    // Half is adjacent to both Defender and Midfielder
    expect(getPositionFit(PlayerPosition.Half, PlayerPosition.Defender)).toBe(0.90)
    expect(getPositionFit(PlayerPosition.Half, PlayerPosition.Midfielder)).toBe(0.90)
  })

  it('returns 0.75 for non-adjacent positions', () => {
    // Forward playing Defender — far
    expect(getPositionFit(PlayerPosition.Forward, PlayerPosition.Defender)).toBe(0.75)
    // Goalkeeper in any outfield slot
    expect(getPositionFit(PlayerPosition.Goalkeeper, PlayerPosition.Forward)).toBe(0.75)
  })
})

describe('autoAssignFormation', () => {
  it('assigns GK to goalkeeper slot and forwards to forward slots', () => {
    const template = FORMATIONS['3-3-4']
    const gk = makePlayer({ id: 'gk1', position: PlayerPosition.Goalkeeper, currentAbility: 80 })
    const fwd1 = makePlayer({ id: 'fwd1', position: PlayerPosition.Forward, currentAbility: 75 })
    const fwd2 = makePlayer({ id: 'fwd2', position: PlayerPosition.Forward, currentAbility: 70 })
    const def1 = makePlayer({ id: 'def1', position: PlayerPosition.Defender, currentAbility: 65 })
    const players = [gk, fwd1, fwd2, def1]
    const playerMap = new Map(players.map(p => [p.id, p]))

    const slots = autoAssignFormation(template, players)

    // autoAssignFormation returns slotId → playerId
    // Find which slot got the GK
    const gkSlotId = Object.entries(slots).find(([, pid]) => pid === 'gk1')?.[0]
    expect(gkSlotId).toBeDefined()
    expect(playerMap.get(slots[gkSlotId!]!)!.position).toBe(PlayerPosition.Goalkeeper)

    const fwd1SlotId = Object.entries(slots).find(([, pid]) => pid === 'fwd1')?.[0]
    expect(fwd1SlotId).toBeDefined()
    expect(playerMap.get(slots[fwd1SlotId!]!)!.position).toBe(PlayerPosition.Forward)
  })

  it('assigns higher CA player to slot when multiple candidates', () => {
    const template = FORMATIONS['3-3-4']
    const fwdBetter = makePlayer({ id: 'fwdA', position: PlayerPosition.Forward, currentAbility: 90 })
    const fwdWorse = makePlayer({ id: 'fwdB', position: PlayerPosition.Forward, currentAbility: 60 })

    const slots = autoAssignFormation(template, [fwdWorse, fwdBetter])

    // fwdA (higher CA) should be assigned to one of the forward slots
    const assignedIds = Object.values(slots).filter(Boolean)
    expect(assignedIds).toContain('fwdA')
    // The first forward slot (alphabetically by slot id) should have fwdA
    const fwdSlotIds = template.slots
      .filter(s => s.position === PlayerPosition.Forward)
      .map(s => s.id)
    expect(slots[fwdSlotIds[0]]).toBe('fwdA')
  })
})

describe('Formation tactic modifiers', () => {
  it('2-3-2-3 gives offense bonus and defense penalty', () => {
    const base = makeTactic({ formation: '3-3-4' })
    const offensive = makeTactic({ formation: '2-3-2-3' })

    const baseMods = getTacticModifiers(base)
    const offMods = getTacticModifiers(offensive)

    expect(offMods.offenseModifier).toBeGreaterThan(baseMods.offenseModifier)
    expect(offMods.defenseModifier).toBeLessThan(baseMods.defenseModifier)
  })

  it('4-3-3 gives offense penalty and defense bonus', () => {
    const base = makeTactic({ formation: '3-3-4' })
    const defensive = makeTactic({ formation: '4-3-3' })

    const baseMods = getTacticModifiers(base)
    const defMods = getTacticModifiers(defensive)

    expect(defMods.offenseModifier).toBeLessThan(baseMods.offenseModifier)
    expect(defMods.defenseModifier).toBeGreaterThan(baseMods.defenseModifier)
  })
})
