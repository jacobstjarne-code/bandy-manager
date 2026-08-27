/**
 * matchCoreGoalkeeperAttribution.test.ts
 *
 * SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2 (b): "Matchkommentar tillskriver
 * målvakten fel lag."
 *
 * Rotorsak: templateVars.team/opponent i matchCore.ts sattes en gång per
 * steg utifrån isHomeAttacking (anfallssidan) och återanvändes oförändrat
 * i save-grenen. Målvakten hör dock till FÖRSVARANDE lag — save-poolens
 * "{team}"-token (t.ex. "Han höll {team} kvar i matchen där!") fylldes
 * därför med det ANFALLANDE lagets namn istället för målvaktens eget lag.
 *
 * Detta test kör en full simulering (mode: 'full', kommentar påslagen) och
 * verifierar att varje gång ett lagnamn nämns i kommentaren för ett steg med
 * en Save-händelse, är det den FÖRSVARANDE klubbens namn (= Save-eventets
 * egna clubId) — aldrig den anfallande klubbens.
 */

import { describe, it, expect } from 'vitest'
import { simulateFirstHalf, simulateSecondHalf } from '../matchCore'
import type { Player } from '../../entities/Player'
import type { Fixture, TeamSelection } from '../../entities/Fixture'
import {
  PlayerPosition, PlayerArchetype, FixtureStatus,
  TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus,
  CornerStrategy, PenaltyKillStyle, MatchEventType,
} from '../../enums'
import type { Tactic } from '../../entities/Club'

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

const HOME_CLUB_NAME = 'HEMMALAGET'
const AWAY_CLUB_NAME = 'BORTALAGET'

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

describe('matchCore — målvaktskommentar tillskriver rätt lag (SEXSÄSONGSAUDITEN SPÅR 2b)', () => {
  it('nämner aldrig anfallande lagets namn i en Save-kommentar — bara den försvarande (målvaktens egna) klubben', () => {
    const homePlayers = makeSquad('h', 'club1')
    const awayPlayers = makeSquad('a', 'club2')
    const homeLineup = makeSelection(homePlayers)
    const awayLineup = makeSelection(awayPlayers)

    let sawSaveWithTeamName = false

    for (let seed = 1; seed <= 60; seed++) {
      const fixture = makeFixture(`fixture_gk_${seed}`)
      const input = {
        fixture,
        homeLineup,
        awayLineup,
        homePlayers,
        awayPlayers,
        homeAdvantage: 0,
        seed,
        mode: 'full' as const,
        homeClubName: HOME_CLUB_NAME,
        awayClubName: AWAY_CLUB_NAME,
      }

      const firstHalfSteps = [...simulateFirstHalf(input)]
      const lastFirstHalfStep = firstHalfSteps[firstHalfSteps.length - 1]

      const secondHalfInput = {
        ...input,
        initialHomeScore: lastFirstHalfStep?.homeScore ?? 0,
        initialAwayScore: lastFirstHalfStep?.awayScore ?? 0,
        initialShotsHome: lastFirstHalfStep?.shotsHome ?? 0,
        initialShotsAway: lastFirstHalfStep?.shotsAway ?? 0,
        initialOnTargetHome: lastFirstHalfStep?.onTargetHome ?? 0,
        initialOnTargetAway: lastFirstHalfStep?.onTargetAway ?? 0,
        initialCornersHome: lastFirstHalfStep?.cornersHome ?? 0,
        initialCornersAway: lastFirstHalfStep?.cornersAway ?? 0,
        initialHomeSuspensions: lastFirstHalfStep?.activeSuspensions?.homeCount ?? 0,
        initialAwaySuspensions: lastFirstHalfStep?.activeSuspensions?.awayCount ?? 0,
      }
      const secondHalfSteps = [...simulateSecondHalf(secondHalfInput)]

      for (const step of [...firstHalfSteps, ...secondHalfSteps]) {
        const saveEvent = step.events.find(e => e.type === MatchEventType.Save)
        if (!saveEvent) continue

        // Bara den enda save-mallen som faktiskt använder {team}-token
        // ("Strålande insats av {goalkeeper}. Han höll {team} kvar i matchen
        // där!") bar buggen — övrig kommentar i samma steg kan legitimt nämna
        // båda klubbnamnen (t.ex. neutral atmosfärstext) utan att vara fel.
        if (!step.commentary.includes('kvar i matchen där')) continue

        const savingClubName = saveEvent.clubId === fixture.homeClubId ? HOME_CLUB_NAME : AWAY_CLUB_NAME
        const concedingClubName = saveEvent.clubId === fixture.homeClubId ? AWAY_CLUB_NAME : HOME_CLUB_NAME

        // Regression: kommentaren fick ALDRIG nämna det anfallande (målsläppande) lagets
        // namn i ett steg där räddningen tillskrivs den försvarande målvakten.
        expect(
          step.commentary.includes(concedingClubName),
          `Save @ minut ${step.minute} (seed ${seed}) tillskrev fel lag: "${step.commentary}"`,
        ).toBe(false)

        expect(
          step.commentary.includes(savingClubName),
          `Save @ minut ${step.minute} (seed ${seed}) saknade rätt lagnamn: "${step.commentary}"`,
        ).toBe(true)

        sawSaveWithTeamName = true
      }
    }

    // Sanity: minst en gång över 60 säsonger/matcher ska "Han höll {team} kvar
    // i matchen där!"-varianten (eller motsvarande) faktiskt ha triggats, så
    // att testet bevisligen övar den rad som bar buggen — inte bara passerar
    // för att tokenet aldrig fylldes i.
    expect(sawSaveWithTeamName).toBe(true)
  })
})
