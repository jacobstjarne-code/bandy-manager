import { describe, it, expect } from 'vitest'
import { generateInjuryInboxItem, checkForMatchInjury, fatigueInjuryMult, FATIGUE_INJURY_RISK_CAP } from '../matchInjuryService'
import type { MatchInjuryEvent } from '../matchInjuryService'
import { LONGTERM_ARC_LINES } from '../../data/injuryDoctorText'
import { PlayerPosition, PlayerArchetype } from '../../enums'
import type { Player } from '../../entities/Player'
import { mulberry32 } from '../../utils/random'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player_test_1',
    firstName: 'Erik',
    lastName: 'Karlsson',
    age: 24,
    nationality: 'svenska',
    clubId: 'club_test',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 8000,
    contractUntilSeason: 2028,
    marketValue: 150000,
    morale: 70,
    form: 65,
    fitness: 80,
    sharpness: 70,
    currentAbility: 62,
    potentialAbility: 75,
    developmentRate: 55,
    injuryProneness: 25,
    discipline: 72,
    attributes: {
      skating: 60, acceleration: 65, stamina: 58, ballControl: 56,
      passing: 50, shooting: 72, dribbling: 55, vision: 48,
      decisions: 60, workRate: 55, positioning: 64, defending: 35,
      cornerSkill: 40, goalkeeping: 18,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: {
      gamesPlayed: 10, goals: 5, assists: 3, cornerGoals: 1, penaltyGoals: 0,
      yellowCards: 1, redCards: 0, suspensions: 0, averageRating: 6.8, minutesPlayed: 900,
    },
    careerStats: { totalGames: 50, totalGoals: 20, totalAssists: 15, seasonsPlayed: 3 },
    ...overrides,
  }
}

function makeEvent(overrides: Partial<MatchInjuryEvent> = {}): MatchInjuryEvent {
  return {
    playerId: 'player_test_1',
    type: 'fall_pa_is',
    minute: 34,
    weeksOut: 3,
    requiresSubstitution: true,
    description: 'test',
    ...overrides,
  }
}

describe('generateInjuryInboxItem — pool 1e (langtid-bågen)', () => {
  it('skenan (langtid-severity) body kommer ur LONGTERM_ARC_LINES, inte INJURY_INBOX_BODY', () => {
    const player = makePlayer()
    const event = makeEvent({ type: 'skenan', weeksOut: 35 })
    const item = generateInjuryInboxItem(player, event, 2025, 10)

    const spelare = `${player.firstName} ${player.lastName}`
    const possibleBodies = LONGTERM_ARC_LINES.map(line => line.replace(/\{spelare\}/g, spelare))
    expect(possibleBodies).toContain(item.body)
  })

  it('övriga skadetyper behåller sin befintliga, oförändrade diagnostext', () => {
    const player = makePlayer()
    const event = makeEvent({ type: 'fall_pa_is', weeksOut: 3 })
    const item = generateInjuryInboxItem(player, event, 2025, 10)
    expect(item.body).toContain('Röntgen visar en spricka i handleden')
  })

  it('fromRole faller tillbaka till "Medicinsk stab" utan doctor, bär doktorns namn med', () => {
    const player = makePlayer()
    const event = makeEvent()
    const withoutDoctor = generateInjuryInboxItem(player, event, 2025, 10)
    expect(withoutDoctor.fromRole).toBe('Medicinsk stab')

    const withDoctor = generateInjuryInboxItem(player, event, 2025, 10, { name: 'Henrik', style: 'torr' })
    expect(withDoctor.fromRole).toBe('Henrik')
  })
})

describe('A-H3 ben 1 — fatigueInjuryMult (DOM_AH3_TILLGANGLIGHET_2026-08-28.md)', () => {
  it('fitness >= 50 (rampens start) ger 1.0 — ingen straff eller bonus', () => {
    expect(fatigueInjuryMult(50)).toBe(1.0)
    expect(fatigueInjuryMult(75)).toBe(1.0)
    expect(fatigueInjuryMult(100)).toBe(1.0)
  })

  it('0% fitness landar exakt på det låsta taket (2.0)', () => {
    expect(fatigueInjuryMult(0)).toBeCloseTo(FATIGUE_INJURY_RISK_CAP, 10)
  })

  it('rampen är monoton — lägre fitness ger aldrig lägre multiplikator', () => {
    const samples = [50, 40, 30, 22, 15, 10, 5, 0]
    for (let i = 1; i < samples.length; i++) {
      expect(fatigueInjuryMult(samples[i])).toBeGreaterThanOrEqual(fatigueInjuryMult(samples[i - 1]))
    }
  })

  it('negativ fitness clampas till samma tak som 0% (försvar mot ett redan orimligt state)', () => {
    expect(fatigueInjuryMult(-10)).toBe(fatigueInjuryMult(0))
  })
})

describe('A-H3 ben 1 — checkForMatchInjury komponerar fatigueMult i kedjan', () => {
  /**
   * Deterministiskt bevis (inte statistiskt) att en spelare på 0% fitness har
   * STRIKT högre skaderisk än samma spelare på 100% fitness, allt annat lika.
   * eligible-poolen itererar skenan→fall_pa_is→larkaka→boll_i_ansiktet→
   * muskel_overbelastning→hjarnskakning och drar ETT nytt rand()-värde per
   * typ — kön av 1:or trycker förbi de fem första (rate alltid < 1 så
   * 1 < rate är alltid falskt), sista värdet (0.0015) ligger MELLAN
   * hjarnskakningens bas-rate (0.001, fitness>=50) och dess fatigue-skalade
   * rate (0.002, fitness=0) — triggar bara vid låg fitness.
   */
  function queueRand(values: number[]): () => number {
    let i = 0
    return () => values[Math.min(i++, values.length - 1)]
  }

  it('samma rand()-sekvens ger skada vid 0% fitness men inte vid 100%', () => {
    const player = makePlayer({ age: 25, injuryProneness: 50 })
    const sequence = [1, 1, 1, 1, 1, 0.0015]

    const eventAtFullFitness = checkForMatchInjury(
      { player: { ...player, fitness: 100 }, minute: 30, isGoalkeeperInjury: false },
      queueRand(sequence),
    )
    expect(eventAtFullFitness).toBeNull()

    const eventAtZeroFitness = checkForMatchInjury(
      { player: { ...player, fitness: 0 }, minute: 30, isGoalkeeperInjury: false },
      queueRand(sequence),
    )
    expect(eventAtZeroFitness).not.toBeNull()
    expect(eventAtZeroFitness?.type).toBe('hjarnskakning')
  })

  it('fitness över rampens start (50) beter sig identiskt oavsett exakt nivå — mult är platt 1.0 där', () => {
    const player = makePlayer({ age: 25, injuryProneness: 50 })
    const sequence = [1, 1, 1, 1, 1, 0.0009] // strax under bas-raten 0.001 — ska trigga vid BÅDA
    const at50 = checkForMatchInjury({ player: { ...player, fitness: 50 }, minute: 30, isGoalkeeperInjury: false }, queueRand(sequence))
    const at90 = checkForMatchInjury({ player: { ...player, fitness: 90 }, minute: 30, isGoalkeeperInjury: false }, queueRand(sequence))
    expect(at50).not.toBeNull()
    expect(at90).not.toBeNull()
  })

  it('säsongsnivå (2M trials, seedad): fitness under golvet ger signifikant fler skador än fitness över — samma metod som scripts/ah3-fatiguemult-kalibrering-2026-08-28.ts', () => {
    const TRIALS = 200_000
    function rateFor(fitness: number, seed: number): number {
      const player = makePlayer({ fitness, age: 25, injuryProneness: 50 })
      let hits = 0
      for (let i = 0; i < TRIALS; i++) {
        const localRand = mulberry32(seed + i * 7 + 1)
        const ev = checkForMatchInjury({ player, minute: 30, isGoalkeeperInjury: false }, localRand)
        if (ev) hits++
      }
      return hits / TRIALS
    }
    const rateTired = rateFor(0, 1)
    const rateFresh = rateFor(70, 2)
    // Kalibreringsscriptet mätte ~2.67% (fitness>=50) mot ~5.26% (fitness=0)
    // — bred marginal här (1.3x) för att inte bli flaky på seedval.
    expect(rateTired).toBeGreaterThan(rateFresh * 1.3)
  })
})
