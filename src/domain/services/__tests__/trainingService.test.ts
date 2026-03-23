import { describe, it, expect } from 'vitest'
import {
  getTrainingEffects,
  applyTrainingToSquad,
  selectAiTrainingFocus,
} from '../trainingService'
import type { Player } from '../../entities/Player'
import { PlayerPosition, PlayerArchetype, TrainingType, TrainingIntensity } from '../../enums'

function emptySeasonStats() {
  return {
    gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
    yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
  }
}

function emptyCareerStats() {
  return { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Erik',
    lastName: 'Karlsson',
    age: 22,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 5000,
    contractUntilSeason: 2028,
    marketValue: 100000,
    morale: 70,
    form: 70,
    fitness: 80,
    sharpness: 65,
    currentAbility: 50,
    potentialAbility: 80,
    developmentRate: 75,
    injuryProneness: 25,
    discipline: 70,
    attributes: {
      skating: 45,
      acceleration: 48,
      stamina: 44,
      ballControl: 42,
      passing: 38,
      shooting: 55,
      dribbling: 40,
      vision: 36,
      decisions: 44,
      workRate: 42,
      positioning: 46,
      defending: 30,
      cornerSkill: 28,
      goalkeeping: 15,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptySeasonStats(),
    careerStats: emptyCareerStats(),
    ...overrides,
  }
}

// ── getTrainingEffects ───────────────────────────────────────────────────────

describe('getTrainingEffects', () => {
  it('Extreme intensity gives higher attribute boosts than Light', () => {
    const extreme = getTrainingEffects({ type: TrainingType.Shooting, intensity: TrainingIntensity.Extreme })
    const light   = getTrainingEffects({ type: TrainingType.Shooting, intensity: TrainingIntensity.Light })

    expect(extreme.attributeBoosts.shooting!).toBeGreaterThan(light.attributeBoosts.shooting!)
  })

  it('Recovery gives no attribute boosts but high fitness change', () => {
    const effects = getTrainingEffects({ type: TrainingType.Recovery, intensity: TrainingIntensity.Normal })
    expect(Object.keys(effects.attributeBoosts).length).toBe(0)
    expect(effects.fitnessChange).toBeGreaterThan(0)
    expect(effects.moraleEffect).toBeGreaterThan(0)
  })

  it('MatchPrep gives no attribute boosts but high sharpness effect', () => {
    const effects = getTrainingEffects({ type: TrainingType.MatchPrep, intensity: TrainingIntensity.Normal })
    expect(Object.keys(effects.attributeBoosts).length).toBe(0)
    expect(effects.sharpnessEffect).toBeGreaterThan(0)
  })

  it('Hard intensity has higher injury risk than Light', () => {
    const hard  = getTrainingEffects({ type: TrainingType.Physical, intensity: TrainingIntensity.Hard })
    const light = getTrainingEffects({ type: TrainingType.Physical, intensity: TrainingIntensity.Light })
    expect(hard.injuryRiskModifier).toBeGreaterThan(light.injuryRiskModifier)
  })

  it('Extreme intensity has negative fitness change', () => {
    const effects = getTrainingEffects({ type: TrainingType.Physical, intensity: TrainingIntensity.Extreme })
    expect(effects.fitnessChange).toBeLessThan(0)
  })

  it('Extreme intensity has negative morale effect', () => {
    const effects = getTrainingEffects({ type: TrainingType.Physical, intensity: TrainingIntensity.Extreme })
    expect(effects.moraleEffect).toBeLessThan(0)
  })

  it('Skating boosts skating and acceleration attributes', () => {
    const effects = getTrainingEffects({ type: TrainingType.Skating, intensity: TrainingIntensity.Normal })
    expect(effects.attributeBoosts.skating).toBeDefined()
    expect(effects.attributeBoosts.acceleration).toBeDefined()
    expect(effects.attributeBoosts.skating!).toBeGreaterThan(0)
  })

  it('CornerPlay boosts cornerSkill most', () => {
    const effects = getTrainingEffects({ type: TrainingType.CornerPlay, intensity: TrainingIntensity.Normal })
    expect(effects.attributeBoosts.cornerSkill!).toBeGreaterThan(effects.attributeBoosts.passing!)
  })
})

// ── applyTrainingToSquad ─────────────────────────────────────────────────────

describe('applyTrainingToSquad', () => {
  it('Applies attribute boosts to players in the club', () => {
    const player = makePlayer({ id: 'p1', clubId: 'club_test', attributes: { ...makePlayer().attributes, shooting: 50 } })
    const { updatedPlayers } = applyTrainingToSquad(
      [player],
      'club_test',
      { type: TrainingType.Shooting, intensity: TrainingIntensity.Normal },
      80,
      42,
    )
    expect(updatedPlayers[0].attributes.shooting).toBeGreaterThan(50)
  })

  it('Does not modify players from other clubs', () => {
    const player = makePlayer({ id: 'p2', clubId: 'club_other' })
    const { updatedPlayers } = applyTrainingToSquad(
      [player],
      'club_test',
      { type: TrainingType.Shooting, intensity: TrainingIntensity.Normal },
      80,
      42,
    )
    expect(updatedPlayers[0].attributes.shooting).toBe(player.attributes.shooting)
  })

  it('Recovery raises fitness', () => {
    const player = makePlayer({ fitness: 60 })
    const { updatedPlayers } = applyTrainingToSquad(
      [player],
      'club_test',
      { type: TrainingType.Recovery, intensity: TrainingIntensity.Normal },
      80,
      42,
    )
    expect(updatedPlayers[0].fitness).toBeGreaterThan(60)
  })

  it('MatchPrep raises sharpness', () => {
    const player = makePlayer({ sharpness: 50 })
    const { updatedPlayers } = applyTrainingToSquad(
      [player],
      'club_test',
      { type: TrainingType.MatchPrep, intensity: TrainingIntensity.Normal },
      80,
      42,
    )
    expect(updatedPlayers[0].sharpness).toBeGreaterThan(50)
  })

  it('Injury risk increases with intensity (100 sessions)', () => {
    // Use a high-injury-prone player and count injuries at Light vs Extreme
    const player = makePlayer({ injuryProneness: 90, fitness: 50 })

    let lightInjuries = 0
    let extremeInjuries = 0

    for (let seed = 0; seed < 100; seed++) {
      const lightResult = applyTrainingToSquad(
        [{ ...player, isInjured: false }],
        'club_test',
        { type: TrainingType.Physical, intensity: TrainingIntensity.Light },
        80,
        seed,
      )
      if (lightResult.injuredPlayerIds.length > 0) lightInjuries++

      const extremeResult = applyTrainingToSquad(
        [{ ...player, isInjured: false }],
        'club_test',
        { type: TrainingType.Physical, intensity: TrainingIntensity.Extreme },
        80,
        seed,
      )
      if (extremeResult.injuredPlayerIds.length > 0) extremeInjuries++
    }

    expect(extremeInjuries).toBeGreaterThan(lightInjuries)
  })

  it('Young players get more attribute gain than older players', () => {
    const youngPlayer = makePlayer({ id: 'young', age: 19, fitness: 90, injuryProneness: 0 })
    const oldPlayer   = makePlayer({ id: 'old',   age: 32, fitness: 90, injuryProneness: 0 })

    const { updatedPlayers } = applyTrainingToSquad(
      [youngPlayer, oldPlayer],
      'club_test',
      { type: TrainingType.Shooting, intensity: TrainingIntensity.Normal },
      100,
      99,
    )

    const youngGain = updatedPlayers[0].attributes.shooting - youngPlayer.attributes.shooting
    const oldGain   = updatedPlayers[1].attributes.shooting - oldPlayer.attributes.shooting
    expect(youngGain).toBeGreaterThan(oldGain)
  })

  it('Better facilities give higher attribute gains', () => {
    const player = makePlayer({ fitness: 90, injuryProneness: 0 })

    const { updatedPlayers: highFacility } = applyTrainingToSquad(
      [{ ...player }],
      'club_test',
      { type: TrainingType.Shooting, intensity: TrainingIntensity.Normal },
      100,  // facilities = 100
      42,
    )
    const { updatedPlayers: lowFacility } = applyTrainingToSquad(
      [{ ...player }],
      'club_test',
      { type: TrainingType.Shooting, intensity: TrainingIntensity.Normal },
      30,   // facilities = 30
      42,
    )

    expect(highFacility[0].attributes.shooting).toBeGreaterThan(lowFacility[0].attributes.shooting)
  })

  it('Already injured players are not re-injured', () => {
    const player = makePlayer({ isInjured: true, injuryDaysRemaining: 14 })
    const { injuredPlayerIds } = applyTrainingToSquad(
      [player],
      'club_test',
      { type: TrainingType.Physical, intensity: TrainingIntensity.Extreme },
      80,
      1,
    )
    expect(injuredPlayerIds).toHaveLength(0)
  })

  it('Returns notifications array', () => {
    const player = makePlayer()
    const { notifications } = applyTrainingToSquad(
      [player],
      'club_test',
      { type: TrainingType.Physical, intensity: TrainingIntensity.Normal },
      80,
      42,
    )
    expect(notifications.length).toBeGreaterThan(0)
    expect(notifications[0]).toContain('Fysik')
  })
})

// ── selectAiTrainingFocus ────────────────────────────────────────────────────

describe('selectAiTrainingFocus', () => {
  it('Selects a valid training type and Normal intensity', () => {
    const players = [makePlayer(), makePlayer({ id: 'p2' })]
    const focus = selectAiTrainingFocus(players, 'club_test')
    expect(Object.values(TrainingType)).toContain(focus.type)
    expect(focus.intensity).toBe(TrainingIntensity.Normal)
  })

  it('Targets the weakest attribute group', () => {
    // Player with very low defending — should pick Defending
    const player = makePlayer({
      attributes: {
        ...makePlayer().attributes,
        defending: 10,
        positioning: 10,
        skating: 80,
        acceleration: 80,
        stamina: 80,
        ballControl: 80,
        passing: 80,
        shooting: 80,
        dribbling: 80,
        vision: 80,
        decisions: 80,
        workRate: 80,
        cornerSkill: 80,
        goalkeeping: 80,
      },
    })
    const focus = selectAiTrainingFocus([player], 'club_test')
    expect(focus.type).toBe(TrainingType.Defending)
  })

  it('Falls back to Physical for empty squad', () => {
    const focus = selectAiTrainingFocus([], 'club_test')
    expect(focus.type).toBe(TrainingType.Physical)
  })
})
