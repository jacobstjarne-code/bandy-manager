/**
 * H2 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24) —
 * MomentumBar.tsx:s "{lag} trycker på. Det jagande laget får luft."-text
 * (BRYTPUNKT.postPaus, matchLiveText.ts) gates på step.postBreakUrgency > 0.
 * postBreakUrgency var tidigare en ren step-funktion, frikopplad från
 * pauseLean — texten fyrade alltså ALLTID i post-paus-fönstret (steg 31-39)
 * oavsett om spelaren valt 'calm' specifikt för att dämpa den jagande
 * sidans svall. Detta testet verifierar att postBreakUrgency nu faktiskt
 * dämpas av samma PAUSE_LEAN_FACTOR.calm som redan appliceras på
 * attackMult (matchCore.ts, oförändrad sim-logik) — en ren surfacing-fix,
 * ingen ändring av matchutfall.
 */
import { describe, it, expect } from 'vitest'
import { simulateFromMidMatch, simulateSecondHalf } from '../matchCore'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk,
  TacticWidth, TacticAttackingFocus, CornerStrategy, PenaltyKillStyle,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

const DEFAULT_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Active, formation: '5-3-2',
}

function makePlayer(id: string, position: PlayerPosition, clubId: string, ca = 65): Player {
  return {
    id, firstName: 'Test', lastName: 'Spelare', age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness: 75, sharpness: 75,
    currentAbility: ca, potentialAbility: ca + 10, developmentRate: 50, injuryProneness: 30, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: position === PlayerPosition.Goalkeeper ? ca + 15 : Math.max(1, ca - 15),
      cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeSquad(prefix: string, clubId: string): Player[] {
  return ['gk', 'd1', 'd2', 'd3', 'h1', 'h2', 'h3', 'm1', 'm2', 'f1', 'f2'].map((suf, i) =>
    makePlayer(`${prefix}_${suf}`, i === 0 ? PlayerPosition.Goalkeeper : i <= 3 ? PlayerPosition.Defender : i <= 6 ? PlayerPosition.Half : i <= 8 ? PlayerPosition.Midfielder : PlayerPosition.Forward, clubId)
  )
}

function makeSelection(players: Player[]): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: DEFAULT_TACTIC }
}

const homePlayers = makeSquad('h', 'club1')
const awayPlayers = makeSquad('a', 'club2')
const homeLineup = makeSelection(homePlayers)
const awayLineup = makeSelection(awayPlayers)
const fixture: Fixture = {
  id: 'fixture_h2_test', leagueId: 'league_1', season: 2026,
  roundNumber: 13, matchday: 13, homeClubId: 'club1', awayClubId: 'club2',
  status: FixtureStatus.Scheduled, homeScore: 0, awayScore: 0, events: [],
}

function collectUrgency(pauseLean: 'calm' | undefined, seed: number) {
  const input = {
    fixture, homeLineup, awayLineup, homePlayers, awayPlayers, seed, mode: 'fast' as const,
    // Managed (home) leder 1-0 vid halvtid — motståndaren (away, borta) är den jagande sidan.
    initialHomeScore: 1, initialAwayScore: 0,
    initialShotsHome: 5, initialShotsAway: 3, initialOnTargetHome: 2, initialOnTargetAway: 1,
    initialCornersHome: 2, initialCornersAway: 1,
    initialHomeSuspensions: 0, initialAwaySuspensions: 0,
    managedIsHome: true,
    pauseLean,
  }
  const byStep: Record<number, number> = {}
  for (const step of simulateSecondHalf(input)) {
    if (step.step >= 31 && step.step <= 39) byStep[step.step] = step.postBreakUrgency ?? 0
  }
  return byStep
}

describe('postBreakUrgency — dämpas av pauseLean=calm när motståndaren jagar (H2)', () => {
  // Stokastisk sim: calm dämpar motståndarens attackMult, vilket kan ändra
  // MATCHUTFALLET (mål) mellan de två körningarna, inte bara urgency-siffran
  // — så leder/jagar-tillståndet kan i sällsynta steg divergera. Assertionen
  // är därför robust mot enstaka steg (calm får ALDRIG vara högre; snittet
  // ska vara lägre), inte ett strikt <-krav på varje enskilt steg.
  it('calm ger aldrig HÖGRE postBreakUrgency än ingen lean, och snittet är lägre', () => {
    const seed = 4242
    const noLean = collectUrgency(undefined, seed)
    const calm = collectUrgency('calm', seed)

    const steps = Object.keys(noLean).map(Number)
    expect(steps.length).toBeGreaterThan(0)
    let calmSum = 0, noLeanSum = 0
    for (const step of steps) {
      expect(calm[step]).toBeLessThanOrEqual(noLean[step])
      calmSum += calm[step]
      noLeanSum += noLean[step]
    }
    expect(calmSum).toBeLessThan(noLeanSum)
  })

  it('utan lean matchar postBreakUrgency den gamla rena step-kurvan (regression, oförändrat baseline-beteende)', () => {
    const seed = 4242
    const noLean = collectUrgency(undefined, seed)
    for (const [stepStr, urgency] of Object.entries(noLean)) {
      const step = Number(stepStr)
      expect(urgency).toBeCloseTo((40 - step) / 10, 5)
    }
  })
})

describe('utvisningstid över halvtid och regenerering', () => {
  const baseInput = {
    fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
    seed: 7171, mode: 'fast' as const,
    initialHomeScore: 0, initialAwayScore: 0,
    initialShotsHome: 0, initialShotsAway: 0,
    initialOnTargetHome: 0, initialOnTargetAway: 0,
    initialCornersHome: 0, initialCornersAway: 0,
    managedIsHome: true,
  }

  it('pausar klockan i halvtid och fortsätter från exakt återstående steg', () => {
    const steps = [...simulateSecondHalf({
      ...baseInput,
      initialHomeSuspensions: 1,
      initialAwaySuspensions: 0,
      initialHomeSuspensionTimers: [3],
      initialAwaySuspensionTimers: [],
    })]

    expect(steps.find(step => step.step === 31)?.activeSuspensions).toMatchObject({
      homeCount: 1,
      homeTimers: [2],
    })
    expect(steps.find(step => step.step === 32)?.activeSuspensions).toMatchObject({
      homeCount: 1,
      homeTimers: [1],
    })
    expect(steps.find(step => step.step === 33)?.activeSuspensions).toMatchObject({
      homeCount: 0,
      homeTimers: [],
    })
  })

  it('ger äldre count-only-anrop en ändlig tiominutare, aldrig en evig utvisning', () => {
    const steps = [...simulateSecondHalf({
      ...baseInput,
      initialHomeSuspensions: 1,
      initialAwaySuspensions: 0,
    })]

    expect(steps.find(step => step.step === 31)?.activeSuspensions.homeCount).toBe(1)
    expect(steps.find(step => step.step === 37)?.activeSuspensions.homeCount).toBe(0)
    expect(steps.find(step => step.step === 60)?.activeSuspensions.homeCount).toBe(0)
  })

  it('fortsätter räkna ner en kvarvarande utvisning i förlängningen', () => {
    const knockoutFixture: Fixture = { ...fixture, id: 'suspension-overtime', isKnockout: true }
    const steps = [...simulateFromMidMatch({
      ...baseInput,
      fixture: knockoutFixture,
      initialHomeScore: 9,
      initialAwayScore: 9,
      initialHomeSuspensions: 1,
      initialAwaySuspensions: 0,
      initialHomeSuspensionTimers: [3],
      initialAwaySuspensionTimers: [],
    }, 60, true)]

    expect(steps.find(step => step.step === 60)?.activeSuspensions.homeTimers).toEqual([3])
    expect(steps.find(step => step.step === 61)?.activeSuspensions.homeTimers).toEqual([3])
    expect(steps.find(step => step.step === 62)?.activeSuspensions.homeTimers).toEqual([2])
    expect(steps.find(step => step.step === 63)?.activeSuspensions.homeTimers).toEqual([1])
    expect(steps.find(step => step.step === 64)?.activeSuspensions.homeTimers).toEqual([])
  })
})
