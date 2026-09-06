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

  // Skutskär-auditens test 12 (52009671, 2026-08-20), High 2: "0 % är för
  // spelbart" — spelare på 0 % kunde fortfarande göra flera mål eller bli
  // bäst på plan. Skyddar getSelectionScore/playerModifier-fixet
  // (BACKLOG.md "Spelklarhet vs playerModifier", 2026-08-22) mot regression:
  // en fixerad elva utvärderad vid fyra konditionsnivåer ska ge MONOTONT
  // fallande förväntad prestation, aldrig platt eller vändande. seasonForm
  // satt till 100 på varje nivå så effectiveFitness (playerModifier)
  // aldrig clampas av season-form-taket (SEASON_FORM_FITNESS_SLACK=3) —
  // testet isolerar fitness-effekten rent, rör inte form/attribut.
  describe('0 %-matchkonsekvens — monoton nedgång (Skutskär-audit test 12)', () => {
    const FITNESS_LEVELS = [100, 50, 20, 0]

    function squadAtFitness(fitness: number): Player[] {
      return makeSquad().map(p => makePlayer({ ...p, fitness, seasonForm: 100 }))
    }

    it('offenseScore faller monotont vid 100 → 50 → 20 → 0 % kondition', () => {
      const scores = FITNESS_LEVELS.map(f => evaluateSquad(squadAtFitness(f), defaultTactic).offenseScore)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1])
      }
    })

    it('defenseScore faller monotont vid 100 → 50 → 20 → 0 % kondition', () => {
      const scores = FITNESS_LEVELS.map(f => evaluateSquad(squadAtFitness(f), defaultTactic).defenseScore)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1])
      }
    })

    it('cornerScore faller monotont vid 100 → 50 → 20 → 0 % kondition', () => {
      const scores = FITNESS_LEVELS.map(f => evaluateSquad(squadAtFitness(f), defaultTactic).cornerScore)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1])
      }
    })

    it('goalkeeperScore faller monotont vid 100 → 50 → 20 → 0 % kondition', () => {
      const scores = FITNESS_LEVELS.map(f => evaluateSquad(squadAtFitness(f), defaultTactic).goalkeeperScore)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThan(scores[i - 1])
      }
    })

    it('24–39 % är en gradvis prestationskurva, inte en platå före 22 %-spärren', () => {
      const levels = [39, 32, 24]
      const evaluations = levels.map(fitness => evaluateSquad(squadAtFitness(fitness), defaultTactic))

      for (let i = 1; i < evaluations.length; i++) {
        expect(evaluations[i].offenseScore).toBeLessThan(evaluations[i - 1].offenseScore)
        expect(evaluations[i].defenseScore).toBeLessThan(evaluations[i - 1].defenseScore)
        expect(evaluations[i].cornerScore).toBeLessThan(evaluations[i - 1].cornerScore)
        expect(evaluations[i].goalkeeperScore).toBeLessThan(evaluations[i - 1].goalkeeperScore)
      }
    })

    it('0 % är en verklig, betydande nedgång mot 100 % — inte "för spelbart" (auditens ord)', () => {
      const full = evaluateSquad(squadAtFitness(100), defaultTactic)
      const zero = evaluateSquad(squadAtFitness(0), defaultTactic)
      // playerModifier vid 0% kondition (form 75, sharpness 75): base = 0.75*0.4 = 0.30
      // vid 100%: base = 0.75*0.4 + 1.0*0.6 = 0.90 — mindre än en tredjedel kvar.
      expect(zero.offenseScore).toBeLessThan(full.offenseScore * 0.4)
      expect(zero.defenseScore).toBeLessThan(full.defenseScore * 0.4)
    })
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

  it('applies the non-adjacent position discount to every affected squad score', () => {
    const starters = [
      makePlayer({ id: 'gk', position: PlayerPosition.Goalkeeper }),
      makePlayer({ id: 'd1', position: PlayerPosition.Defender }),
      makePlayer({ id: 'd2', position: PlayerPosition.Defender }),
      makePlayer({ id: 'd3', position: PlayerPosition.Defender }),
      makePlayer({ id: 'h1', position: PlayerPosition.Half }),
      makePlayer({ id: 'h2', position: PlayerPosition.Half }),
      makePlayer({ id: 'm1', position: PlayerPosition.Midfielder }),
      makePlayer({ id: 'm2', position: PlayerPosition.Midfielder }),
      makePlayer({ id: 'm3', position: PlayerPosition.Midfielder }),
      makePlayer({ id: 'f1', position: PlayerPosition.Forward }),
      makePlayer({ id: 'f2', position: PlayerPosition.Forward }),
    ]
    const correctSlots = {
      gk: 'gk',
      'half-l': 'h1',
      'def-l': 'd1',
      'def-c': 'd2',
      'def-r': 'd3',
      'half-r': 'h2',
      'mid-l': 'm1',
      'mid-c': 'm2',
      'mid-r': 'm3',
      'fwd-l': 'f1',
      'fwd-r': 'f2',
    }
    const misplacedSlots = {
      gk: 'gk',
      'half-l': 'f1',
      'def-l': 'm1',
      'def-c': 'm2',
      'def-r': 'm3',
      'half-r': 'f2',
      'mid-l': 'd1',
      'mid-c': 'd2',
      'mid-r': 'd3',
      'fwd-l': 'h1',
      'fwd-r': 'h2',
    }
    const correctlyPlaced = evaluateSquad(starters, {
      ...defaultTactic,
      formation: '532_tvatoppar',
      lineupSlots: correctSlots,
    })
    const misplaced = evaluateSquad(starters, {
      ...defaultTactic,
      formation: '532_tvatoppar',
      lineupSlots: misplacedSlots,
    })

    expect(misplaced.offenseScore).toBeLessThan(correctlyPlaced.offenseScore)
    expect(misplaced.defenseScore).toBeLessThan(correctlyPlaced.defenseScore)
    expect(misplaced.cornerScore).toBeLessThan(correctlyPlaced.cornerScore)
    expect(misplaced.offenseScore).toBeCloseTo(correctlyPlaced.offenseScore * 0.75, 1)
    expect(misplaced.defenseScore).toBeCloseTo(correctlyPlaced.defenseScore * 0.75, 1)
    expect(misplaced.cornerScore).toBeCloseTo(correctlyPlaced.cornerScore * 0.75, 1)
  })
})
