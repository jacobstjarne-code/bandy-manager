import { describe, expect, it } from 'vitest'
import { simulateFromMidMatch } from '../matchCore'
import type { PressChoice } from '../lastMinutePressService'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import type { Tactic } from '../../entities/Club'
import {
  CornerStrategy, FixtureStatus, MatchEventType, PenaltyKillStyle,
  PlayerArchetype, PlayerPosition, TacticAttackingFocus, TacticMentality,
  TacticPassingRisk, TacticPress, TacticTempo, TacticWidth,
} from '../../enums'

const tactic: Tactic = {
  mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal,
  press: TacticPress.Medium, passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard, penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '5-3-2',
}

function player(id: string, position: PlayerPosition, clubId: string): Player {
  const ca = 65
  return {
    id, firstName: 'Test', lastName: id, age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness: 75, sharpness: 75,
    currentAbility: ca, potentialAbility: ca + 10, developmentRate: 50,
    injuryProneness: 30, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca,
      passing: ca, shooting: ca, dribbling: ca, vision: ca, decisions: ca,
      workRate: ca, positioning: ca, defending: ca, cornerSkill: ca,
      goalkeeping: position === PlayerPosition.Goalkeeper ? 80 : 50,
      cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0,
      penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0,
      averageRating: 6.5, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function squad(prefix: string, clubId: string): Player[] {
  return ['gk', 'd1', 'd2', 'd3', 'h1', 'h2', 'h3', 'm1', 'm2', 'f1', 'f2']
    .map((suffix, index) => player(`${prefix}_${suffix}`,
      index === 0 ? PlayerPosition.Goalkeeper
        : index <= 3 ? PlayerPosition.Defender
          : index <= 6 ? PlayerPosition.Half
            : index <= 8 ? PlayerPosition.Midfielder : PlayerPosition.Forward,
      clubId))
}

const homePlayers = squad('h', 'managed')
const awayPlayers = squad('a', 'opponent')
const selection = (players: Player[]): TeamSelection => ({
  startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic,
})
const fixture: Fixture = {
  id: 'late_press_test', leagueId: 'league_1', season: 2026,
  roundNumber: 12, matchday: 12, homeClubId: 'managed', awayClubId: 'opponent',
  status: FixtureStatus.Scheduled, homeScore: 0, awayScore: 0, events: [],
}

function remainingSteps(seed: number, livePressChoice?: PressChoice, fromStep = 56) {
  return [...simulateFromMidMatch({
    fixture, homeLineup: selection(homePlayers), awayLineup: selection(awayPlayers),
    homePlayers, awayPlayers, seed, managedIsHome: true, mode: 'full',
    initialHomeScore: 0, initialAwayScore: 1,
    initialShotsHome: 0, initialShotsAway: 0,
    initialOnTargetHome: 0, initialOnTargetAway: 0,
    initialCornersHome: 0, initialCornersAway: 0,
    initialHomeSuspensions: 0, initialAwaySuspensions: 0,
    livePressChoice,
  }, fromStep, true)]
}

describe('live-valet i slutminuterna', () => {
  it('Håll ut är mekaniskt neutral och ger exakt samma steg som utan pressval', () => {
    const withoutDecision = remainingSteps(47).map(step => ({ ...step, lastMinutePressData: undefined }))
    expect(remainingSteps(47, 'acceptResult')).toEqual(withoutDecision)
  })

  it('ett valt pressläge avfyrar inte en ny beslutsruta efter omsimulering', () => {
    for (const choice of ['allIn', 'pushForward', 'acceptResult'] as const) {
      expect(remainingSteps(47, choice).some(step => step.lastMinutePressData)).toBe(false)
    }
  })

  it('öppnar ingen pressruta på sista spelsteget när inget finns kvar att påverka', () => {
    expect(remainingSteps(47, undefined, 59).some(step => step.lastMinutePressData)).toBe(false)
  })

  it('högre press ger fler egna mål och större risk bakåt över samma seeds', () => {
    let holdGoals = 0, pushGoals = 0, allInGoals = 0
    let holdConceded = 0, pushConceded = 0, allInConceded = 0
    let holdSuspensions = 0, allInSuspensions = 0
    for (let seed = 1; seed <= 150; seed++) {
      const hold = remainingSteps(seed, 'acceptResult')
      const push = remainingSteps(seed, 'pushForward')
      const allIn = remainingSteps(seed, 'allIn')
      holdGoals += hold.flatMap(step => step.events).filter(event => event.type === MatchEventType.Goal && event.clubId === 'managed').length
      pushGoals += push.flatMap(step => step.events).filter(event => event.type === MatchEventType.Goal && event.clubId === 'managed').length
      allInGoals += allIn.flatMap(step => step.events).filter(event => event.type === MatchEventType.Goal && event.clubId === 'managed').length
      holdConceded += hold.flatMap(step => step.events).filter(event => event.type === MatchEventType.Goal && event.clubId === 'opponent').length
      pushConceded += push.flatMap(step => step.events).filter(event => event.type === MatchEventType.Goal && event.clubId === 'opponent').length
      allInConceded += allIn.flatMap(step => step.events).filter(event => event.type === MatchEventType.Goal && event.clubId === 'opponent').length
      holdSuspensions += hold.flatMap(step => step.events).filter(event => event.type === MatchEventType.Suspension && event.clubId === 'managed').length
      allInSuspensions += allIn.flatMap(step => step.events).filter(event => event.type === MatchEventType.Suspension && event.clubId === 'managed').length
    }
    expect(pushGoals).toBeGreaterThan(holdGoals)
    expect(allInGoals).toBeGreaterThan(holdGoals)
    expect(allInGoals).toBeGreaterThan(pushGoals)
    expect(pushConceded).toBeGreaterThanOrEqual(holdConceded)
    expect(allInConceded).toBeGreaterThanOrEqual(pushConceded)
    expect(allInConceded).toBeGreaterThan(holdConceded)
    expect(allInSuspensions).toBeGreaterThan(holdSuspensions)
  })
})
