import { describe, it, expect } from 'vitest'
import { applyPlayerStateUpdates, restOutRiskProbability, FATIGUE_RESTOUT_MAX_PROB } from '../playerStateProcessor'
import { FATIGUE_AVAILABILITY_FLOOR } from '../../../../domain/services/squadEvaluator'
import type { Player } from '../../../../domain/entities/Player'
import type { Fixture, TeamSelection } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle,
} from '../../../../domain/enums'
import type { Tactic } from '../../../../domain/entities/Club'

/**
 * A-H3 ben 2 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md) — sannolikhetskastet om
 * vila/överbelastning för spelare som startade under FATIGUE_AVAILABILITY_FLOOR.
 * Samma test-harness som playerStateProcessorFatigue.test.ts (B9).
 */

const NEUTRAL_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  press: TacticPress.Medium,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '5-3-2',
}

function makePlayer(id: string, position: PlayerPosition, clubId: string, fitness = 90, injuryProneness = 0): Player {
  const ca = 65
  return {
    id, firstName: 'Test', lastName: id, age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness, sharpness: 75,
    currentAbility: ca, potentialAbility: ca + 10, developmentRate: 50, injuryProneness, discipline: 70,
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

function makeSelection(players: Player[]): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: NEUTRAL_TACTIC }
}

function makeFixture(id: string, home: Player[], away: Player[]): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Completed,
    homeScore: 3, awayScore: 2, events: [],
    homeLineup: makeSelection(home), awayLineup: makeSelection(away),
  }
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test', managerName: 'Tränare', managedClubId: 'club1', currentDate: '2026-10-15',
    currentSeason: 2, currentMatchday: 5, clubs: [], players: [],
    league: { id: 'l1', name: 'Test', clubs: [] } as never, fixtures: [], standings: [], inbox: [],
    transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [], playoffBracket: null, cupBracket: null,
    pendingEvents: [], deferredDecisions: [], transferBids: [], handledContractPlayerIds: [],
    sponsors: [], activeTalentSearch: null, talentSearchResults: [], mentorships: [], loanDeals: [],
    academyLevel: 'none' as never, scoutReports: {}, activeScoutAssignment: null, scoutBudget: 0,
    seasonSummaries: [], version: '1.0', lastSavedAt: '2026-10-15T00:00:00',
    ...overrides,
  } as SaveGame
}

describe('A-H3 ben 2 — restOutRiskProbability (ren funktion)', () => {
  it('0 vid och över golvet, aldrig negativ', () => {
    expect(restOutRiskProbability(FATIGUE_AVAILABILITY_FLOOR)).toBe(0)
    expect(restOutRiskProbability(FATIGUE_AVAILABILITY_FLOOR + 10)).toBe(0)
    expect(restOutRiskProbability(100)).toBe(0)
  })

  it('exakt FATIGUE_RESTOUT_MAX_PROB vid 0% fitness', () => {
    expect(restOutRiskProbability(0)).toBeCloseTo(FATIGUE_RESTOUT_MAX_PROB, 10)
  })

  it('monoton — lägre fitness under golvet ger aldrig lägre risk', () => {
    const samples = [FATIGUE_AVAILABILITY_FLOOR, 18, 14, 10, 6, 2, 0]
    for (let i = 1; i < samples.length; i++) {
      expect(restOutRiskProbability(samples[i])).toBeGreaterThanOrEqual(restOutRiskProbability(samples[i - 1]))
    }
  })
})

describe('A-H3 ben 2 — applyPlayerStateUpdates sätter/rullar restGamesRemaining', () => {
  it('spelare som startar UNDER golvet (fitness=0) flaggas restGamesRemaining=1 med frekvens nära FATIGUE_RESTOUT_MAX_PROB', () => {
    const TRIALS = 3000
    let flagged = 0
    for (let seed = 1; seed <= TRIALS; seed++) {
      const player = makePlayer('p1', PlayerPosition.Forward, 'club1', 0)
      const fixture = makeFixture(`f_${seed}`, [player], [])
      const game = makeGame()
      const result = applyPlayerStateUpdates(
        [player], new Set([player.id]), new Set(), game, null, undefined, undefined,
        seed, 6, [fixture],
      )
      const updated = result.updatedPlayers.find(p => p.id === 'p1')!
      if ((updated.restGamesRemaining ?? 0) > 0) flagged++
    }
    const observedRate = flagged / TRIALS
    // Bred marginal (±0.1) runt FATIGUE_RESTOUT_MAX_PROB (0.5) — statistiskt
    // test, inte en exakt räknare.
    expect(observedRate).toBeGreaterThan(FATIGUE_RESTOUT_MAX_PROB - 0.1)
    expect(observedRate).toBeLessThan(FATIGUE_RESTOUT_MAX_PROB + 0.1)
  })

  it('spelare som startar PÅ ELLER ÖVER golvet flaggas ALDRIG, oavsett seed', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const player = makePlayer('p1', PlayerPosition.Forward, 'club1', FATIGUE_AVAILABILITY_FLOOR)
      const fixture = makeFixture(`f_${seed}`, [player], [])
      const game = makeGame()
      const result = applyPlayerStateUpdates(
        [player], new Set([player.id]), new Set(), game, null, undefined, undefined,
        seed, 6, [fixture],
      )
      const updated = result.updatedPlayers.find(p => p.id === 'p1')!
      expect(updated.restGamesRemaining ?? 0).toBe(0)
    }
  })

  it('en spelare som INTE startar denna runda riskeras aldrig, oavsett hur låg fitness han bär in i rundan', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const player = makePlayer('p1', PlayerPosition.Forward, 'club1', 0)
      const fixture = makeFixture(`f_${seed}`, [], [])
      const game = makeGame()
      const result = applyPlayerStateUpdates(
        [player], new Set(), new Set(), game, null, undefined, undefined,
        seed, 6, [fixture],
      )
      const updated = result.updatedPlayers.find(p => p.id === 'p1')!
      expect(updated.restGamesRemaining ?? 0).toBe(0)
    }
  })

  it('kostar exakt EN match — restGamesRemaining=1 vid ingång decrementeras till 0 nästa körning', () => {
    const player = { ...makePlayer('p1', PlayerPosition.Forward, 'club1', 90), restGamesRemaining: 1 }
    const fixture = makeFixture('f1', [], []) // spelar inte denna runda
    const game = makeGame()
    const result = applyPlayerStateUpdates(
      [player], new Set(), new Set(), game, null, undefined, undefined,
      1, 6, [fixture],
    )
    const updated = result.updatedPlayers.find(p => p.id === 'p1')!
    expect(updated.restGamesRemaining ?? 0).toBe(0)
  })

  it('en redan skadad spelare flaggas ALDRIG som vilande också (isInjured täcker redan otillgängligheten)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const player = { ...makePlayer('p1', PlayerPosition.Forward, 'club1', 0), isInjured: true, injuryDaysRemaining: 14 }
      const fixture = makeFixture(`f_${seed}`, [player], [])
      const game = makeGame()
      const result = applyPlayerStateUpdates(
        [player], new Set([player.id]), new Set(), game, null, undefined, undefined,
        seed, 6, [fixture],
      )
      const updated = result.updatedPlayers.find(p => p.id === 'p1')!
      expect(updated.restGamesRemaining ?? 0).toBe(0)
    }
  })
})

describe('A-H3 ben 2 — en trupp på 16 blir inte ospelbar i ett NORMALT rotationsscenario', () => {
  /**
   * "Normalt" = de flesta spelare i god form (70-90% fitness), tre av elva
   * startande under golvet (en tuff vecka, inte hela laget kört i botten —
   * det senare vore ett MEDVETET domen-avsett extremfall, inte "normalt").
   * Fem bänkspelare deltar inte denna runda och är därför ALDRIG i riskzonen
   * för ben 2 (bara startersThisRound rullas) — de utgör ett golv på 5 extra
   * tillgängliga oavsett utfall för de elva som spelade.
   */
  function buildSquad(): Player[] {
    const starters = [
      makePlayer('gk', PlayerPosition.Goalkeeper, 'club1', 85),
      makePlayer('d1', PlayerPosition.Defender, 'club1', 80),
      makePlayer('d2', PlayerPosition.Defender, 'club1', 75),
      makePlayer('d3', PlayerPosition.Defender, 'club1', 15), // under golvet
      makePlayer('h1', PlayerPosition.Half, 'club1', 82),
      makePlayer('h2', PlayerPosition.Half, 'club1', 18), // under golvet
      makePlayer('h3', PlayerPosition.Half, 'club1', 70),
      makePlayer('m1', PlayerPosition.Midfielder, 'club1', 88),
      makePlayer('m2', PlayerPosition.Midfielder, 'club1', 20), // under golvet
      makePlayer('f1', PlayerPosition.Forward, 'club1', 90),
      makePlayer('f2', PlayerPosition.Forward, 'club1', 77),
    ]
    const bench = [
      makePlayer('b_gk', PlayerPosition.Goalkeeper, 'club1', 90),
      makePlayer('b_d1', PlayerPosition.Defender, 'club1', 90),
      makePlayer('b_h1', PlayerPosition.Half, 'club1', 90),
      makePlayer('b_m1', PlayerPosition.Midfielder, 'club1', 90),
      makePlayer('b_f1', PlayerPosition.Forward, 'club1', 90),
    ]
    return [...starters, ...bench]
  }

  it('minst 11 spelklara (ej skadad/avstängd/vilande) kvarstår i truppen efter rundan, över 500 seeds', () => {
    const TRIALS = 500
    let minAvailable = Infinity
    for (let seed = 1; seed <= TRIALS; seed++) {
      const squad = buildSquad()
      const starters = squad.slice(0, 11)
      const fixture = makeFixture(`f_${seed}`, starters, [])
      const game = makeGame()
      const result = applyPlayerStateUpdates(
        squad, new Set(starters.map(p => p.id)), new Set(squad.slice(11).map(p => p.id)), game, null, undefined, undefined,
        seed, 6, [fixture],
      )
      const available = result.updatedPlayers.filter(
        p => !p.isInjured && p.suspensionGamesRemaining <= 0 && (p.restGamesRemaining ?? 0) === 0,
      ).length
      if (available < minAvailable) minAvailable = available
    }
    expect(minAvailable).toBeGreaterThanOrEqual(11)
  })
})
