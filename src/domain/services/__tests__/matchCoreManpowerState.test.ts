import { describe, it, expect } from 'vitest'
import { simulateMatch } from '../matchSimulator'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection, MatchEvent } from '../../entities/Fixture'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle, MatchEventType,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

// B12 steg 2a (DOM_B12_STEG2_2026-08-19.md) — manpowerState: ren avläsning
// av redan beräknad state, ingen ny sannolikhet. Godkännandekriteriet
// (byte-identiskt npm run stress) verifierat separat, manuellt, i samma
// leverans — det här testet verifierar FÄLTETS EGEN korrekthet: att det
// alltid finns, är strukturellt giltigt, och stämmer med den faktiska
// utvisningshistoriken i matchen.

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

function makeSelection(players: Player[]): TeamSelection {
  return { startingPlayerIds: players.map(p => p.id), benchPlayerIds: [], tactic: DEFAULT_TACTIC }
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
  const fixture = makeFixture(`fixture_${seed}`)
  const result = simulateMatch({
    fixture,
    homeLineup: makeSelection(homePlayers),
    awayLineup: makeSelection(awayPlayers),
    homePlayers, awayPlayers,
    seed, homeAdvantage: 0,
  })
  return result.fixture.events
}

describe('matchCore — manpowerState (B12 steg 2a)', () => {
  it('varje event bär ett strukturellt giltigt manpowerState', () => {
    for (let seed = 1; seed <= 8; seed++) {
      const events = runMatch(seed)
      expect(events.length).toBeGreaterThan(0)
      for (const e of events) {
        expect(e.manpowerState, `event ${e.type} @ ${e.minute} saknar manpowerState`).toBeDefined()
        expect(e.manpowerState!.ownSuspended).toBeGreaterThanOrEqual(0)
        expect(e.manpowerState!.opponentSuspended).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(e.manpowerState!.ownSuspended)).toBe(true)
        expect(Number.isInteger(e.manpowerState!.opponentSuspended)).toBe(true)
      }
    }
  })

  it('inga utvisningar tidigt i matchen — manpowerState 0/0 för det första eventet', () => {
    // Seed 1 (samma som resten av testsviten använder som "typiskt" fall) —
    // matchens allra första event kan rimligen inte ha någon redan utvisad,
    // eftersom ingen utvisning hunnit ske än.
    const events = runMatch(1)
    const first = events[0]
    expect(first.manpowerState).toEqual({ ownSuspended: 0, opponentSuspended: 0 })
  })

  it('efter en utvisning speglar senare events det numerära läget korrekt', () => {
    // Utvisningar är probabilistiska — sök över seeds tills minst en match
    // med en utvisning hittas, verifiera sedan konsistens i DEN matchen.
    let found = false
    for (let seed = 1; seed <= 60 && !found; seed++) {
      const events = runMatch(seed)
      const suspensionIdx = events.findIndex(e => e.type === MatchEventType.Suspension)
      if (suspensionIdx === -1) continue
      found = true

      const suspension = events[suspensionIdx]
      const suspendedClubId = suspension.clubId
      // Suspension-eventets EGET manpowerState är läst FÖRE dess egen
      // increment (matchCore.ts-kommentaren) — det är alltså läget precis
      // innan domaren visade utvisningen, inte efter.

      // Utvisningen varar bara 5-10 minuter — sök efter NÄSTA event inom det
      // fönstret (inte "vilket som helst senare event", som kan ligga efter
      // att den redan runnit ut och då korrekt visa 0, inte en bugg).
      const SUSPENSION_WINDOW_MIN = 4  // konservativt under kortaste (5 min)

      const laterOpponentEvent = events
        .slice(suspensionIdx + 1)
        .find(e => e.clubId !== suspendedClubId && e.minute > suspension.minute && e.minute <= suspension.minute + SUSPENSION_WINDOW_MIN)
      if (laterOpponentEvent) {
        expect(laterOpponentEvent.manpowerState!.opponentSuspended).toBeGreaterThanOrEqual(1)
      }

      const laterSameClubEvent = events
        .slice(suspensionIdx + 1)
        .find(e => e.clubId === suspendedClubId && e.minute > suspension.minute && e.minute <= suspension.minute + SUSPENSION_WINDOW_MIN)
      if (laterSameClubEvent) {
        expect(laterSameClubEvent.manpowerState!.ownSuspended).toBeGreaterThanOrEqual(1)
      }
    }
    expect(found, 'ingen utvisning hittades i 60 seeds — testet kunde inte verifiera scenariot').toBe(true)
  })
})
