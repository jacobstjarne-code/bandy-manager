import { describe, expect, it } from 'vitest'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import type { Tactic } from '../../entities/Club'
import {
  CornerStrategy, FixtureStatus, PenaltyKillStyle, PlayerArchetype, PlayerPosition,
  TacticAttackingFocus, TacticMentality, TacticPassingRisk, TacticPress, TacticTempo, TacticWidth,
} from '../../enums'
import { simulateFromMidMatch } from '../matchCore'

const TACTIC: Tactic = {
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

function makePlayer(id: string, clubId: string, position: PlayerPosition): Player {
  const ca = 65
  return {
    id, firstName: 'Test', lastName: id, age: 25, nationality: 'SE', clubId,
    isHomegrown: true, position,
    archetype: position === PlayerPosition.Goalkeeper ? PlayerArchetype.ReflexGoalkeeper : PlayerArchetype.TwoWaySkater,
    salary: 10_000, contractUntilSeason: 2029, marketValue: 100_000,
    morale: 75, form: 75, fitness: 75, sharpness: 75,
    currentAbility: ca, potentialAbility: 75, developmentRate: 50, injuryProneness: 30, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: position === PlayerPosition.Goalkeeper ? 80 : 50, cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeSquad(prefix: string, clubId: string): Player[] {
  const positions = [
    PlayerPosition.Goalkeeper,
    PlayerPosition.Defender, PlayerPosition.Defender, PlayerPosition.Defender,
    PlayerPosition.Half, PlayerPosition.Half, PlayerPosition.Half,
    PlayerPosition.Midfielder, PlayerPosition.Midfielder,
    PlayerPosition.Forward, PlayerPosition.Forward,
  ]
  return positions.map((position, index) => makePlayer(`${prefix}-${index}`, clubId, position))
}

describe('matchCore — oavgjord cupmatch vid 90 minuter', () => {
  it('påstår inte att 5–5 är färdigspelat innan förlängningen', () => {
    const homePlayers = makeSquad('home', 'home')
    const awayPlayers = makeSquad('away', 'away')
    const selection = (players: Player[]): TeamSelection => ({
      startingPlayerIds: players.map(player => player.id),
      benchPlayerIds: [],
      tactic: TACTIC,
    })
    const fixture: Fixture = {
      id: 'cup-tie', leagueId: 'league', season: 2027, roundNumber: 2, matchday: 2,
      homeClubId: 'home', awayClubId: 'away', homeScore: 0, awayScore: 0,
      status: FixtureStatus.Scheduled, events: [], isCup: true, isKnockout: true,
    }
    const generator = simulateFromMidMatch({
      fixture,
      homePlayers,
      awayPlayers,
      homeLineup: selection(homePlayers),
      awayLineup: selection(awayPlayers),
      homeClubName: 'Hemma',
      awayClubName: 'Borta',
      seed: 42,
      mode: 'full',
      initialHomeScore: 5,
      initialAwayScore: 5,
      initialShotsHome: 10,
      initialShotsAway: 10,
      initialOnTargetHome: 7,
      initialOnTargetAway: 7,
      initialCornersHome: 5,
      initialCornersAway: 5,
      initialHomeSuspensions: 0,
      initialAwaySuspensions: 0,
    }, 60, true)

    const fullTime = generator.next().value
    expect(fullTime?.step).toBe(60)
    expect(fullTime?.commentary).toBe('5–5')
    expect(fullTime?.commentary).not.toMatch(/slut|över|vidare|åker ur/i)

    const overtime = generator.next().value
    expect(overtime?.phase).toBe('overtime')
  })
})
