import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchSimulator'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle, MatchEventType,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

// B12 steg 2, fält 4/4 (DOM_B12_STEG2_2026-08-19.md) — origin: omskrivning av
// den redan avgjorda seqType till tre värden (OPEN_PLAY/CORNER/PENALTY),
// INTE fyra ('FREE_HIT' skrivs av MatchLiveScreen, inte matchCore). Sätts
// bara på skott-/målutfall — Suspension/Substitution har inget "ursprung"
// i den bemärkelsen och ska förbli undefined.

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

const KNOWN_ORIGINS = ['OPEN_PLAY', 'CORNER', 'PENALTY']

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
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: NEUTRAL_TACTIC }
}

function makeFixture(id: string, overrides: Partial<Fixture> = {}): Fixture {
  return {
    id, leagueId: 'league_1', season: 2026, roundNumber: 5, matchday: 5,
    homeClubId: 'club1', awayClubId: 'club2', status: FixtureStatus.Scheduled,
    homeScore: 0, awayScore: 0, events: [],
    ...overrides,
  }
}

function runMatch(seed: number, overrides: Partial<Fixture> = {}) {
  const homePlayers = makeSquad('h', 'club1')
  const awayPlayers = makeSquad('a', 'club2')
  const fixture = makeFixture(`fixture_origin_${seed}`, overrides)
  const result = simulateMatch({
    fixture,
    homeLineup: makeSelection(homePlayers),
    awayLineup: makeSelection(awayPlayers),
    homePlayers, awayPlayers,
    seed, homeAdvantage: 0,
  })
  return result.fixture.events
}

describe('matchCore — origin (B12 steg 2, fält 4/4)', () => {
  it('Goal/Assist/Save/Corner bär bara kända origin-värden, aldrig FREE_HIT eller annat', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const events = runMatch(seed)
      for (const e of events) {
        const isShotOutcome = [
          MatchEventType.Goal, MatchEventType.Assist, MatchEventType.Save, MatchEventType.Corner, MatchEventType.Penalty,
        ].includes(e.type)
        if (isShotOutcome) {
          expect(e.origin, `${e.type} @ ${e.minute} saknar origin`).toBeDefined()
          expect(KNOWN_ORIGINS, `okänt origin-värde "${e.origin}" på ${e.type} @ ${e.minute}`).toContain(e.origin)
        }
      }
    }
  })

  it('Suspension och Substitution har alltid origin: undefined, aldrig ett gissat värde', () => {
    let sawSuspension = false
    let sawSubstitution = false
    for (let seed = 1; seed <= 30 && !(sawSuspension && sawSubstitution); seed++) {
      const events = runMatch(seed)
      for (const e of events) {
        if (e.type === MatchEventType.Suspension) {
          sawSuspension = true
          expect(e.origin).toBeUndefined()
        }
        if (e.type === MatchEventType.Substitution) {
          sawSubstitution = true
          expect(e.origin).toBeUndefined()
        }
      }
    }
    expect(sawSuspension, 'ingen utvisning hittades i 30 seeds').toBe(true)
  })

  it('Corner-typade events kan ha BÅDE origin CORNER (från corner-sekvensen) och OPEN_PLAY (hörna vunnen som skottutfall i en attack-sekvens) — origin särskiljer dem trots samma MatchEventType/beskrivning', () => {
    // "Hörnslag" skrivs av BÅDA grenarna (attack-branchens avslagna skott OCH
    // corner-branchens icke-mål-utfall) — exakt den tvetydighet origin finns
    // för att lösa. Ett Corner-event ska ALDRIG ha origin PENALTY, men kan
    // legitimt ha antingen CORNER eller OPEN_PLAY beroende på seqType.
    let sawCornerOrigin = false
    let sawOpenPlayOrigin = false
    for (let seed = 1; seed <= 15; seed++) {
      const events = runMatch(seed)
      for (const e of events) {
        if (e.type === MatchEventType.Corner) {
          expect(e.origin).not.toBe('PENALTY')
          if (e.origin === 'CORNER') sawCornerOrigin = true
          if (e.origin === 'OPEN_PLAY') sawOpenPlayOrigin = true
        }
      }
    }
    expect(sawCornerOrigin, 'inget Corner-event med origin CORNER hittades i 15 seeds').toBe(true)
    expect(sawOpenPlayOrigin, 'inget Corner-event med origin OPEN_PLAY hittades i 15 seeds').toBe(true)
  })

  it('Penalty-typade events har alltid origin PENALTY', () => {
    let sawPenaltyEvent = false
    for (let seed = 1; seed <= 40; seed++) {
      const events = runMatch(seed)
      for (const e of events) {
        if (e.type === MatchEventType.Penalty) {
          sawPenaltyEvent = true
          expect(e.origin).toBe('PENALTY')
        }
      }
      if (sawPenaltyEvent) break
    }
    expect(sawPenaltyEvent, 'inget Penalty-event hittades i 40 seeds').toBe(true)
  })
})
