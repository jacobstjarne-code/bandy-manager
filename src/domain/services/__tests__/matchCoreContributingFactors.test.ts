import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchSimulator'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import type { Weather } from '../../entities/Weather'
import type { Rivalry } from '../../data/rivalries'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle, WeatherCondition, IceQuality, MatchEventType,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

// B12 steg 2, fält 3/4 (DOM_B12_STEG2_2026-08-19.md) — contributingFactors:
// etiketterar de motorförhållanden som faktiskt påverkade målchansen (inte
// bara "vad var läget", som tacticalFactors/manpowerState). Känd, avsiktlig
// begränsning testad explicit nedan: OT-loopen (steg 62-75) saknar
// hot_hand/mode/equalizer-mekanik helt — bara weather kan förekomma där.

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

const KNOWN_LABELS = ['hot_hand', 'derby', 'weather', 'second_half_mode', 'equalizer_momentum']

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

function makeSelection(players: Player[], tactic: Tactic = NEUTRAL_TACTIC): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic }
}

function makeFixture(id: string, overrides: Partial<Fixture> = {}): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Scheduled,
    homeScore: 0, awayScore: 0, events: [],
    ...overrides,
  }
}

const HEAVY_SNOW: Weather = {
  temperature: -8, condition: WeatherCondition.HeavySnow, windStrength: 3,
  iceQuality: IceQuality.Poor, snowfall: true, region: 'test',
}

describe('matchCore — contributingFactors (B12 steg 2, fält 3/4)', () => {
  it('varje event bär en array (aldrig undefined), bara med kända etiketter', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    for (let seed = 1; seed <= 5; seed++) {
      const fixture = makeFixture(`fixture_cf_${seed}`)
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers),
        awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers,
        seed, homeAdvantage: 0,
      })
      const events = result.fixture.events
      expect(events.length).toBeGreaterThan(0)
      for (const e of events) {
        expect(e.contributingFactors, `event ${e.type} @ ${e.minute} saknar contributingFactors`).toBeDefined()
        for (const label of e.contributingFactors!) {
          expect(KNOWN_LABELS, `okänd etikett "${label}" på ${e.type} @ ${e.minute}`).toContain(label)
        }
      }
    }
  })

  it('hård väderlek (heavySnow) ger "weather" på minst ett event, klar väderlek ger aldrig etiketten', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    let sawWeatherLabel = false
    for (let seed = 1; seed <= 10; seed++) {
      const fixture = makeFixture(`fixture_cf_weather_${seed}`)
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers),
        awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers,
        seed, homeAdvantage: 0,
        weather: HEAVY_SNOW,
      })
      if (result.fixture.events.some(e => e.contributingFactors?.includes('weather'))) {
        sawWeatherLabel = true
        break
      }
    }
    expect(sawWeatherLabel, 'ingen "weather"-etikett hittades i 10 seeds med heavySnow').toBe(true)

    // Klar väderlek (default, ingen weather-input) ska aldrig ge etiketten.
    for (let seed = 1; seed <= 5; seed++) {
      const fixture = makeFixture(`fixture_cf_clear_${seed}`)
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers),
        awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers,
        seed, homeAdvantage: 0,
      })
      for (const e of result.fixture.events) {
        expect(e.contributingFactors).not.toContain('weather')
      }
    }
  })

  it('derby-fixture (rivalry) ger "derby" på minst ett event, icke-derby ger aldrig etiketten', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    const rivalry: Rivalry = { clubIds: ['club1', 'club2'], name: 'Testderbyt', intensity: 3 }
    let sawDerbyLabel = false
    for (let seed = 1; seed <= 10; seed++) {
      const fixture = makeFixture(`fixture_cf_derby_${seed}`)
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers),
        awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers,
        seed, homeAdvantage: 0,
        rivalry,
      })
      if (result.fixture.events.some(e => e.contributingFactors?.includes('derby'))) {
        sawDerbyLabel = true
        break
      }
    }
    expect(sawDerbyLabel, 'ingen "derby"-etikett hittades i 10 seeds med rivalry').toBe(true)

    for (let seed = 1; seed <= 5; seed++) {
      const fixture = makeFixture(`fixture_cf_noderby_${seed}`)
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers),
        awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers,
        seed, homeAdvantage: 0,
      })
      for (const e of result.fixture.events) {
        expect(e.contributingFactors).not.toContain('derby')
      }
    }
  })

  it('förlängningsmål/assist bär aldrig hot_hand/second_half_mode/equalizer_momentum (mekaniken finns inte i OT-loopen)', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    let sawOtEvent = false
    for (let seed = 1; seed <= 40; seed++) {
      const fixture = makeFixture(`fixture_cf_ot_${seed}`, { isKnockout: true })
      const result = simulateMatch({
        fixture,
        homeLineup: makeSelection(homePlayers),
        awayLineup: makeSelection(awayPlayers),
        homePlayers, awayPlayers,
        seed, homeAdvantage: 0,
      })
      // OT-mål/assist har minute > 90 (matchCore lägger OT-minuter från 91).
      const otEvents = result.fixture.events.filter(
        e => (e.type === MatchEventType.Goal || e.type === MatchEventType.Assist) && e.minute > 90
      )
      if (otEvents.length === 0) continue
      sawOtEvent = true
      for (const e of otEvents) {
        expect(e.contributingFactors).not.toContain('hot_hand')
        expect(e.contributingFactors).not.toContain('second_half_mode')
        expect(e.contributingFactors).not.toContain('equalizer_momentum')
        expect(e.contributingFactors).not.toContain('derby')
      }
      if (sawOtEvent) break
    }
    expect(sawOtEvent, 'inget OT-mål/assist hittades i 40 seeds — testet kunde inte verifiera scenariot').toBe(true)
  })
})
