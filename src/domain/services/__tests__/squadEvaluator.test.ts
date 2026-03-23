import { describe, it, expect } from 'vitest'
import { evaluateSquad } from '../squadEvaluator'
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

const defaultTactic: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
}

function makeSquad(): Player[] {
  return [
    makePlayer({ id: 'gk1', position: PlayerPosition.Goalkeeper }),
    makePlayer({ id: 'gk2', position: PlayerPosition.Goalkeeper }),
    makePlayer({ id: 'd1', position: PlayerPosition.Defender }),
    makePlayer({ id: 'd2', position: PlayerPosition.Defender }),
    makePlayer({ id: 'd3', position: PlayerPosition.Defender }),
    makePlayer({ id: 'h1', position: PlayerPosition.Half }),
    makePlayer({ id: 'h2', position: PlayerPosition.Half }),
    makePlayer({ id: 'h3', position: PlayerPosition.Half }),
    makePlayer({ id: 'm1', position: PlayerPosition.Midfielder }),
    makePlayer({ id: 'm2', position: PlayerPosition.Midfielder }),
    makePlayer({ id: 'f1', position: PlayerPosition.Forward }),
  ]
}

describe('evaluateSquad', () => {
  it('returns all five scores as numbers between 0 and 100', () => {
    const result = evaluateSquad(makeSquad(), defaultTactic)

    expect(typeof result.offenseScore).toBe('number')
    expect(typeof result.defenseScore).toBe('number')
    expect(typeof result.cornerScore).toBe('number')
    expect(typeof result.goalkeeperScore).toBe('number')
    expect(typeof result.disciplineRisk).toBe('number')

    for (const score of Object.values(result)) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('high-skilled attackers produce higher offenseScore', () => {
    const base = makeSquad()

    const highSquad = base.map(p =>
      p.position === PlayerPosition.Forward || p.position === PlayerPosition.Midfielder
        ? makePlayer({
            ...p,
            attributes: { ...p.attributes, shooting: 90, passing: 90, vision: 90 },
          })
        : p
    )
    const lowSquad = base.map(p =>
      p.position === PlayerPosition.Forward || p.position === PlayerPosition.Midfielder
        ? makePlayer({
            ...p,
            attributes: { ...p.attributes, shooting: 40, passing: 40, vision: 40 },
          })
        : p
    )

    const high = evaluateSquad(highSquad, defaultTactic)
    const low = evaluateSquad(lowSquad, defaultTactic)

    expect(high.offenseScore).toBeGreaterThan(low.offenseScore)
  })

  it('high-skilled defenders produce higher defenseScore', () => {
    const base = makeSquad()

    const highSquad = base.map(p =>
      p.position === PlayerPosition.Defender || p.position === PlayerPosition.Half
        ? makePlayer({
            ...p,
            attributes: { ...p.attributes, defending: 90, positioning: 90 },
          })
        : p
    )
    const lowSquad = base.map(p =>
      p.position === PlayerPosition.Defender || p.position === PlayerPosition.Half
        ? makePlayer({
            ...p,
            attributes: { ...p.attributes, defending: 40, positioning: 40 },
          })
        : p
    )

    const high = evaluateSquad(highSquad, defaultTactic)
    const low = evaluateSquad(lowSquad, defaultTactic)

    expect(high.defenseScore).toBeGreaterThan(low.defenseScore)
  })

  it('goalkeeper with high goalkeeping attribute scores higher', () => {
    const base = makeSquad()

    const highSquad = base.map(p =>
      p.position === PlayerPosition.Goalkeeper
        ? makePlayer({ ...p, attributes: { ...p.attributes, goalkeeping: 90 } })
        : p
    )
    const lowSquad = base.map(p =>
      p.position === PlayerPosition.Goalkeeper
        ? makePlayer({ ...p, attributes: { ...p.attributes, goalkeeping: 30 } })
        : p
    )

    const high = evaluateSquad(highSquad, defaultTactic)
    const low = evaluateSquad(lowSquad, defaultTactic)

    expect(high.goalkeeperScore).toBeGreaterThan(low.goalkeeperScore)
  })

  it('low form/fitness reduces offenseScore and defenseScore', () => {
    const base = makeSquad()

    const highFitSquad = base.map(p => makePlayer({ ...p, form: 90, fitness: 90 }))
    const lowFitSquad = base.map(p => makePlayer({ ...p, form: 20, fitness: 20 }))

    const high = evaluateSquad(highFitSquad, defaultTactic)
    const low = evaluateSquad(lowFitSquad, defaultTactic)

    expect(high.offenseScore).toBeGreaterThan(low.offenseScore)
    expect(high.defenseScore).toBeGreaterThan(low.defenseScore)
  })

  it('disciplineRisk is the inverse of average discipline', () => {
    const highDisc = makeSquad().map(p => makePlayer({ ...p, discipline: 80 }))
    const lowDisc = makeSquad().map(p => makePlayer({ ...p, discipline: 30 }))

    const high = evaluateSquad(highDisc, defaultTactic)
    const low = evaluateSquad(lowDisc, defaultTactic)

    expect(high.disciplineRisk).toBeCloseTo(20, 0)
    expect(low.disciplineRisk).toBeCloseTo(70, 0)
  })

  it('missing goalkeeper returns goalkeeperScore of 20', () => {
    const noGkSquad = makeSquad().filter(p => p.position !== PlayerPosition.Goalkeeper)
    const result = evaluateSquad(noGkSquad, defaultTactic)
    expect(result.goalkeeperScore).toBe(20)
  })

  it('players with high cornerSkill produce a higher cornerScore', () => {
    const base = makeSquad()

    const highCorner = base.map(p =>
      p.position !== PlayerPosition.Goalkeeper
        ? makePlayer({ ...p, attributes: { ...p.attributes, cornerSkill: 95 } })
        : p
    )
    const lowCorner = base.map(p =>
      p.position !== PlayerPosition.Goalkeeper
        ? makePlayer({ ...p, attributes: { ...p.attributes, cornerSkill: 20 } })
        : p
    )

    const high = evaluateSquad(highCorner, defaultTactic)
    const low = evaluateSquad(lowCorner, defaultTactic)

    expect(high.cornerScore).toBeGreaterThan(low.cornerScore)
  })
})
