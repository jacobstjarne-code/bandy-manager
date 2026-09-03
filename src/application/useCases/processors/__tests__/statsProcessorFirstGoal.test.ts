import { describe, it, expect } from 'vitest'
import { updatePlayerMatchStats } from '../statsProcessor'
import type { Player } from '../../../../domain/entities/Player'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import { PlayerPosition, PlayerArchetype, FixtureStatus, MatchEventType } from '../../../../domain/enums'

function makePlayer(id: string, totalGoals: number): Player {
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
    careerStats: { totalGames: 5, totalGoals, totalAssists: 0, seasonsPlayed: 1 },
  }
}

function makeFixture(scorerId: string): Fixture {
  return {
    id: 'fx1', leagueId: 'liga', season: 1, roundNumber: 1, matchday: 1,
    homeClubId: 'club_a', awayClubId: 'club_b',
    status: FixtureStatus.Completed,
    homeScore: 1, awayScore: 0,
    homeLineup: { startingPlayerIds: [scorerId], benchPlayerIds: [], tactic: {} as never },
    awayLineup: { startingPlayerIds: [], benchPlayerIds: [], tactic: {} as never },
    events: [{ type: MatchEventType.Goal, playerId: scorerId, minute: 30 } as never],
    report: { playerRatings: { [scorerId]: 6.5 } } as never,
  }
}

const game = { currentSeason: 1, managedClubId: 'club_a', clubs: [{ id: 'club_b', name: 'Motstånd', shortName: 'MOT' }] } as unknown as SaveGame

/**
 * PÅSTÅENDEKARTAN omsvep (2026-08-24), MISSING-GATE + ÅTKOMST-FANNS-
 * ANVÄNDES-INTE: generateFirstGoalEntry hade noll anropsställen — texten
 * fanns, prevCareerGoals fanns redan i scope, ingenting wire:ade dem ihop.
 */
describe('updatePlayerMatchStats — första A-lagsmålet (MISSING-GATE-fix)', () => {
  it('skriver en diary-post när en spelare gör sitt första karriärmål', () => {
    const player = makePlayer('p1', 0)
    const result = updatePlayerMatchStats([player], [makeFixture('p1')], game, 2)
    const p = result.finalPlayers.find(pl => pl.id === 'p1')!
    const firstGoalEntry = (p.diary ?? []).find(d => d.text.includes('första A-lagsmål'))
    expect(firstGoalEntry, JSON.stringify(p.diary)).toBeDefined()
    expect(result.ledgerEntries).toContainEqual(expect.objectContaining({
      type: 'player_milestone',
      season: 1,
      matchday: 2,
      subject: { kind: 'player', id: 'p1' },
      subject2: { kind: 'club', id: 'club_a' },
    }))
  })

  it('skriver INGEN "första mål"-post för en spelare som redan har karriärmål sedan tidigare', () => {
    const player = makePlayer('p2', 12)
    const result = updatePlayerMatchStats([player], [makeFixture('p2')], game, 2)
    const p = result.finalPlayers.find(pl => pl.id === 'p2')!
    const firstGoalEntry = (p.diary ?? []).find(d => d.text.includes('första A-lagsmål'))
    expect(firstGoalEntry).toBeUndefined()
    expect(result.ledgerEntries).toEqual([])
  })
})
