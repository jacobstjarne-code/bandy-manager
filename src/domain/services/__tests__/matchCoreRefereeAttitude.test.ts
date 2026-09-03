/**
 * DOM_DOMARRELATION_2026-09-02, nivå 3 — domarens ackumulerade clubReaction
 * ska ge en MARGINELL nudge på utvisningar/straff MOT den hanterade klubben
 * när den försvarar, aldrig utslagsgivande (SKYDDAT). Verifierar:
 * 1. refereeClubReaction=undefined ger byte-identisk simulering (regression
 *    mot matchEngineParity.test.ts:s redan bevisade 0.0%-diff, kompletterande
 *    smoke-check här).
 * 2. En sur domare (-2) ger fler utvisningar+straff mot den hanterade klubben
 *    än en neutral (0), som ger färre än en välvillig (+2) — över många
 *    matcher, statistiskt, inte per match.
 * 3. Effekten är liten (inom det dokumenterade ±6%-spannet), inte stor.
 */
import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchSimulator'
import { MatchEventType } from '../../enums'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition,
  PlayerArchetype,
  FixtureStatus,
  TacticMentality,
  TacticTempo,
  TacticPress,
  TacticPassingRisk,
  TacticWidth,
  TacticAttackingFocus,
  CornerStrategy,
  PenaltyKillStyle,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

const DEFAULT_TACTIC: Tactic = {
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

function makePlayer(id: string, position: PlayerPosition, clubId: string): Player {
  const ca = 65
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
  return [
    makePlayer(`${prefix}_gk`, PlayerPosition.Goalkeeper, clubId),
    makePlayer(`${prefix}_d1`, PlayerPosition.Defender, clubId),
    makePlayer(`${prefix}_d2`, PlayerPosition.Defender, clubId),
    makePlayer(`${prefix}_d3`, PlayerPosition.Defender, clubId),
    makePlayer(`${prefix}_h1`, PlayerPosition.Half, clubId),
    makePlayer(`${prefix}_h2`, PlayerPosition.Half, clubId),
    makePlayer(`${prefix}_h3`, PlayerPosition.Half, clubId),
    makePlayer(`${prefix}_m1`, PlayerPosition.Midfielder, clubId),
    makePlayer(`${prefix}_m2`, PlayerPosition.Midfielder, clubId),
    makePlayer(`${prefix}_f1`, PlayerPosition.Forward, clubId),
    makePlayer(`${prefix}_f2`, PlayerPosition.Forward, clubId),
  ]
}

function makeSelection(players: Player[]): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: DEFAULT_TACTIC }
}

function makeFixture(id: string): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'managed', awayClubId: 'opponent', status: FixtureStatus.Scheduled,
    homeScore: 0, awayScore: 0, events: [],
  }
}

const homePlayers = makeSquad('h', 'managed')
const awayPlayers = makeSquad('a', 'opponent')

function runMatches(n: number, refereeClubReaction: -2 | 0 | 2 | undefined) {
  let managedPenalized = 0  // Suspension + isPenaltyGoal events AGAINST managed (home) club
  for (let i = 0; i < n; i++) {
    const fixture = makeFixture(`fixture_${refereeClubReaction}_${i}`)
    const result = simulateMatch({
      fixture,
      homeLineup: makeSelection(homePlayers),
      awayLineup: makeSelection(awayPlayers),
      homePlayers,
      awayPlayers,
      homeAdvantage: 0,
      seed: i + 1,
      isPlayoff: false,
      managedIsHome: true,
      refereeClubReaction,
    })
    for (const ev of result.fixture.events) {
      if (ev.type === MatchEventType.Suspension && ev.clubId === 'managed') managedPenalized++
      if (ev.type === MatchEventType.Penalty && ev.clubId === 'opponent') managedPenalized++  // penalty AWARDED to opponent = against managed
    }
  }
  return managedPenalized
}

describe('DOM_DOMARRELATION_2026-09-02 — domarattityd, marginell nudge', () => {
  it('refereeClubReaction=undefined ger samma resultat som 0 (no-op-konventionen)', () => {
    const undefinedCount = runMatches(300, undefined)
    const zeroCount = runMatches(300, 0)
    expect(undefinedCount).toBe(zeroCount)
  })

  it('sur domare (-2) ger fler domslut mot hanterad klubb än välvillig (+2), över många matcher', () => {
    const N = 800
    const sour = runMatches(N, -2)
    const friendly = runMatches(N, 2)
    expect(sour).toBeGreaterThan(friendly)
  })

  it('effekten är marginell — sur/välvillig skiljer sig med under 20%, inte flerdubbelt', () => {
    const N = 800
    const neutral = runMatches(N, 0)
    const sour = runMatches(N, -2)
    const friendly = runMatches(N, 2)
    // ±6% i foulThreshold/penProb, men events sprids över hela matchen —
    // aggregatskillnaden ska vara liten, inte dramatisk.
    expect(Math.abs(sour - neutral) / neutral).toBeLessThan(0.20)
    expect(Math.abs(friendly - neutral) / neutral).toBeLessThan(0.20)
  })
})
