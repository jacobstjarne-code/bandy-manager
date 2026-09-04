import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchSimulator'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

// B12 steg 2, fält 2/4 (DOM_B12_STEG2_2026-08-19.md) — tacticalFactors: ren
// etikettering av EXAKT de sex (nu sex, oförändrat antal — press_high bytt
// mot formation_523) villkor buildSequenceWeights redan förgrenar på
// (matchCore.ts). DOM_FORMATIONER_V2_2026-09-04.md: press_high → formation_523.
// Testar att egna labels dyker upp för det lag som satt dem, och ALDRIG för
// motståndaren som kör standardtaktik.

const NEUTRAL_TACTIC: Tactic = {
  mentality: TacticMentality.Balanced,
  tempo: TacticTempo.Normal,
  passingRisk: TacticPassingRisk.Mixed,
  width: TacticWidth.Normal,
  attackingFocus: TacticAttackingFocus.Mixed,
  cornerStrategy: CornerStrategy.Standard,
  penaltyKillStyle: PenaltyKillStyle.Active,
  formation: '532_tvatoppar',
}

const LOADED_TACTIC: Tactic = {
  ...NEUTRAL_TACTIC,
  tempo: TacticTempo.High,
  formation: '523_hog',
  width: TacticWidth.Wide,
  cornerStrategy: CornerStrategy.Aggressive,
  passingRisk: TacticPassingRisk.Direct,
  mentality: TacticMentality.Offensive,
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

function makeSquad(prefix: string, clubId: string, ca = 65): Player[] {
  return [
    makePlayer(`${prefix}_gk`, PlayerPosition.Goalkeeper, clubId, ca),
    makePlayer(`${prefix}_d1`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_d2`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_d3`, PlayerPosition.Defender, clubId, ca),
    makePlayer(`${prefix}_h1`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_h2`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_h3`, PlayerPosition.Half, clubId, ca),
    makePlayer(`${prefix}_m1`, PlayerPosition.Midfielder, clubId, ca),
    makePlayer(`${prefix}_m2`, PlayerPosition.Midfielder, clubId, ca),
    makePlayer(`${prefix}_f1`, PlayerPosition.Forward, clubId, ca),
    makePlayer(`${prefix}_f2`, PlayerPosition.Forward, clubId, ca),
  ]
}

function makeSelection(players: Player[], tactic: Tactic): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic }
}

function makeFixture(id: string): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Scheduled,
    homeScore: 0, awayScore: 0, events: [],
  }
}

function runMatch(seed: number) {
  const homePlayers = makeSquad('h', 'club1')
  const awayPlayers = makeSquad('a', 'club2')
  const fixture = makeFixture(`fixture_tf_${seed}`)
  const result = simulateMatch({
    fixture,
    // Hemmalaget kör "laddad" taktik (alla sex avvikande värden), bortalaget
    // kör neutral — asymmetrin är hela testets poäng.
    homeLineup: makeSelection(homePlayers, LOADED_TACTIC),
    awayLineup: makeSelection(awayPlayers, NEUTRAL_TACTIC),
    homePlayers, awayPlayers,
    seed, homeAdvantage: 0,
  })
  return result.fixture.events
}

describe('matchCore — tacticalFactors (B12 steg 2, fält 2/4)', () => {
  it('hemmalagets events bär alla sex etiketter, bortalagets bär inga', () => {
    let sawHomeEvent = false
    let sawAwayEvent = false
    for (let seed = 1; seed <= 15; seed++) {
      const events = runMatch(seed)
      for (const e of events) {
        expect(e.tacticalFactors, `event ${e.type} @ ${e.minute} saknar tacticalFactors`).toBeDefined()
        if (e.clubId === 'club1') {
          sawHomeEvent = true
          expect(e.tacticalFactors).toEqual(
            expect.arrayContaining(['tempo_high', 'formation_523', 'width_wide', 'cornerStrategy_aggressive', 'passingRisk_direct', 'mentality_offensive'])
          )
          expect(e.tacticalFactors).toHaveLength(6)
        } else if (e.clubId === 'club2') {
          sawAwayEvent = true
          expect(e.tacticalFactors).toEqual([])
        }
      }
      if (sawHomeEvent && sawAwayEvent) break
    }
    expect(sawHomeEvent, 'inget hemmalags-event hittades i 15 seeds').toBe(true)
    expect(sawAwayEvent, 'inget bortalags-event hittades i 15 seeds').toBe(true)
  })

  it('neutral taktik (bägge lag) ger tom array, inte undefined', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    const fixture = makeFixture('fixture_tf_neutral')
    const result = simulateMatch({
      fixture,
      homeLineup: makeSelection(homePlayers, NEUTRAL_TACTIC),
      awayLineup: makeSelection(awayPlayers, NEUTRAL_TACTIC),
      homePlayers, awayPlayers,
      seed: 1, homeAdvantage: 0,
    })
    const events = result.fixture.events
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) {
      expect(e.tacticalFactors).toEqual([])
    }
  })
})
