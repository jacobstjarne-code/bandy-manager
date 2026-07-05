import { describe, it, expect } from 'vitest'
import { getCoffeeRoomQuote } from '../coffeeRoomService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Player } from '../../entities/Player'
import type { Fixture } from '../../entities/Fixture'
import { FixtureStatus, PlayerPosition, PlayerArchetype } from '../../enums'

// M67a (textaudit 2026-07-05): veteran_farewell-arcens sista hemmamatch —
// FAREWELL_MATCH_STRINGS wirad in i coffeeRoomService.getCoffeeRoomQuote.

function emptySeasonStats() {
  return {
    gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0,
    yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0,
  }
}

function emptyCareerStats() {
  return { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 0 }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Bo',
    lastName: 'Fransson',
    age: 35,
    nationality: 'svenska',
    clubId: 'managed',
    isHomegrown: true,
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    salary: 5000,
    contractUntilSeason: 1,
    marketValue: 50000,
    morale: 70,
    form: 70,
    fitness: 80,
    sharpness: 65,
    currentAbility: 50,
    potentialAbility: 50,
    developmentRate: 10,
    injuryProneness: 25,
    discipline: 70,
    attributes: {
      skating: 45, acceleration: 48, stamina: 44, ballControl: 42, passing: 38,
      shooting: 55, dribbling: 40, vision: 36, decisions: 44, workRate: 42,
      positioning: 46, defending: 30, cornerSkill: 28, goalkeeping: 15,
    },
    isInjured: false,
    injuryDaysRemaining: 0,
    suspensionGamesRemaining: 0,
    seasonStats: emptySeasonStats(),
    careerStats: emptyCareerStats(),
    ...overrides,
  } as Player
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'f1',
    leagueId: 'L',
    season: 1,
    roundNumber: 1,
    matchday: 1,
    homeClubId: 'managed',
    awayClubId: 'opp',
    status: FixtureStatus.Scheduled,
    homeScore: null,
    awayScore: null,
    events: [],
    ...overrides,
  } as Fixture
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'g1',
    managerName: 'Test',
    managedClubId: 'managed',
    currentDate: '2027-01-15',
    currentSeason: 1,
    currentMatchday: 18,
    clubs: [],
    players: [],
    fixtures: [],
    standings: [],
    inbox: [],
    league: { teamIds: [] } as never,
    transferState: { listedPlayerIds: [] } as never,
    youthIntakeHistory: [],
    matchWeathers: [],
    managedClubTraining: 'balanced' as never,
    trainingHistory: [],
    playoffBracket: null,
    cupBracket: null,
    seasonSummaries: [],
    scoutReports: {},
    activeScoutAssignment: null,
    scoutBudget: 0,
    pendingEvents: [],
    transferBids: [],
    handledContractPlayerIds: [],
    sponsors: [],
    activeTalentSearch: null,
    talentSearchResults: [],
    academyLevel: 1 as never,
    mentorships: [],
    loanDeals: [],
    version: '1.0.0',
    lastSavedAt: '2027-01-15T00:00:00Z',
    ...overrides,
  } as SaveGame
}

describe('getCoffeeRoomQuote — M67a veteran_farewell', () => {
  it('surfaces a farewell line when the next fixture is the arc-players sista hemmamatch', () => {
    const veteran = makePlayer({ id: 'vet1', lastName: 'Fransson' })
    const lastHome = makeFixture({ id: 'home_last', matchday: 20, homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Scheduled })
    const earlierHome = makeFixture({ id: 'home_early', matchday: 10, homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Completed, homeScore: 2, awayScore: 1 })
    const game = makeGame({
      players: [veteran],
      fixtures: [earlierHome, lastHome],
      activeArcs: [{
        id: 'arc_vet1',
        type: 'veteran_farewell',
        playerId: 'vet1',
        subject: 'B. Fransson',
        startedMatchday: 15,
        phase: 'peak',
        expiresMatchday: 23,
        eventsFired: [],
        decisionsMade: [],
      }],
    })

    const quote = getCoffeeRoomQuote(game)
    expect(quote).not.toBeNull()
    expect(quote?.text).toContain('Fransson')
  })

  it('does NOT surface farewell text when the next fixture is an earlier home match, not the last', () => {
    const veteran = makePlayer({ id: 'vet1', lastName: 'Fransson' })
    const nextHome = makeFixture({ id: 'home_next', matchday: 12, homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Scheduled })
    const laterHome = makeFixture({ id: 'home_later', matchday: 20, homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Scheduled })
    const game = makeGame({
      currentMatchday: 11,
      players: [veteran],
      fixtures: [nextHome, laterHome],
      activeArcs: [{
        id: 'arc_vet1',
        type: 'veteran_farewell',
        playerId: 'vet1',
        subject: 'B. Fransson',
        startedMatchday: 15,
        phase: 'peak',
        expiresMatchday: 23,
        eventsFired: [],
        decisionsMade: [],
      }],
    })

    const quote = getCoffeeRoomQuote(game)
    expect(quote?.text ?? '').not.toContain('Fransson')
  })

  it('does nothing when there is no active veteran_farewell arc', () => {
    const game = makeGame({
      fixtures: [makeFixture({ id: 'home_last', matchday: 20, status: FixtureStatus.Scheduled })],
      activeArcs: [],
    })
    // Should fall through to the normal (round===0 → null) path without throwing
    expect(() => getCoffeeRoomQuote(game)).not.toThrow()
  })
})
