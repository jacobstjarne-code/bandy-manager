import { describe, it, expect } from 'vitest'
import { updatePlayerMatchStats } from '../statsProcessor'
import type { Player } from '../../../../domain/entities/Player'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { PlayerPosition, PlayerArchetype, FixtureStatus } from '../../../../domain/enums'

function makePlayer(id: string): Player {
  const ca = 60
  return {
    id, firstName: 'Test', lastName: 'Spelare', age: 25, nationality: 'SE', clubId: 'club_a',
    isHomegrown: true, position: PlayerPosition.Forward, archetype: PlayerArchetype.TwoWaySkater,
    salary: 10000, contractUntilSeason: 2028, marketValue: 100000,
    morale: 75, form: 75, fitness: 90, sharpness: 75,
    currentAbility: ca, potentialAbility: ca + 10, developmentRate: 50, injuryProneness: 30, discipline: 70,
    attributes: {
      skating: ca, acceleration: ca, stamina: ca, ballControl: ca, passing: ca, shooting: ca,
      dribbling: ca, vision: ca, decisions: ca, workRate: ca, positioning: ca, defending: ca,
      cornerSkill: ca, goalkeeping: Math.max(1, ca - 15), cornerRecovery: 50,
    },
    isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0,
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
    careerStats: { totalGames: 0, totalGoals: 0, totalAssists: 0, seasonsPlayed: 1 },
  }
}

/**
 * Grind 0 (SLUTTEST_KO.md, 2026-08-21) — "flygande byten"-grenen (bänkspelare
 * som INTE byttes in) ökade seasonStats.gamesPlayed men glömde
 * careerStats.totalGames, till skillnad från allStarters-grenen som alltid
 * håller de två i lockstep. Upptäckt genom en riktig flersäsongskörning
 * (scripts/grind0-truth-sim.ts) där careerStats-ökningen inte matchade
 * seasonStats hos djupbänkade spelare — inte genom isolerad unit-testning.
 */
describe('updatePlayerMatchStats — bänkspelare (ej inbytt)', () => {
  it('ökar careerStats.totalGames i lockstep med seasonStats.gamesPlayed för en oanvänd bänkspelare', () => {
    const starter = makePlayer('p_starter')
    const benchPlayer = makePlayer('p_bench')
    const players = [starter, benchPlayer]

    const fixture: Fixture = {
      id: 'fx1', leagueId: 'liga', season: 1, roundNumber: 1, matchday: 1,
      homeClubId: 'club_a', awayClubId: 'club_b',
      status: FixtureStatus.Completed,
      homeScore: 2, awayScore: 1,
      homeLineup: { startingPlayerIds: ['p_starter'], benchPlayerIds: ['p_bench'], tactic: {} as never },
      awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
      events: [],
      report: { playerRatings: { p_starter: 6.5 } } as never,
    }

    const game = { currentSeason: 1, managedClubId: 'club_a', clubs: [] } as unknown as SaveGame

    const result = updatePlayerMatchStats(players, [fixture], game, 2)
    const bench = result.finalPlayers.find(p => p.id === 'p_bench')!

    expect(bench.seasonStats.gamesPlayed, 'seasonStats.gamesPlayed ska öka för en bänkad spelare (flygande byten)').toBe(1)
    expect(bench.careerStats.totalGames, 'careerStats.totalGames ska öka i lockstep med seasonStats.gamesPlayed').toBe(1)
  })

  it('startande spelare fortsätter öka båda i lockstep (regression: befintligt beteende oförändrat)', () => {
    const starter = makePlayer('p_starter')
    const players = [starter]

    const fixture: Fixture = {
      id: 'fx1', leagueId: 'liga', season: 1, roundNumber: 1, matchday: 1,
      homeClubId: 'club_a', awayClubId: 'club_b',
      status: FixtureStatus.Completed,
      homeScore: 2, awayScore: 1,
      homeLineup: { startingPlayerIds: ['p_starter'], benchPlayerIds: [], tactic: {} as never },
      awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
      events: [],
      report: { playerRatings: { p_starter: 6.5 } } as never,
    }
    const game = { currentSeason: 1, managedClubId: 'club_a', clubs: [] } as unknown as SaveGame

    const result = updatePlayerMatchStats(players, [fixture], game, 2)
    const p = result.finalPlayers.find(pl => pl.id === 'p_starter')!
    expect(p.seasonStats.gamesPlayed).toBe(1)
    expect(p.careerStats.totalGames).toBe(1)
  })
})
