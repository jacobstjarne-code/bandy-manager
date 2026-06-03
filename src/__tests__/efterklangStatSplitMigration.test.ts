/**
 * A5 — cup/liga stat-split migration. Före A5 adderades cupmål till seasonStats
 * (ligastatistiken förorenades). Migrationen re-summerar ur säsongens completed
 * fixtures, delat på isCup. careerStats lämnas orört (all-tävling).
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../infrastructure/persistence/saveGameMigration'

const PID = 'p_star'

function fixture(opts: { id: string; isCup: boolean; goals: number; cornerGoals?: number }) {
  const events = Array.from({ length: opts.goals }, (_, i) => ({
    type: 'goal', playerId: PID, minute: 10 + i,
    isCornerGoal: i < (opts.cornerGoals ?? 0),
  }))
  return {
    id: opts.id, season: 5, status: 'completed', isCup: opts.isCup,
    homeClubId: 'club_managed', awayClubId: 'club_x',
    homeLineup: { startingPlayerIds: [PID] },
    awayLineup: { startingPlayerIds: [] },
    events,
    report: { playerRatings: { [PID]: 7.5 } },
  }
}

describe('migrateSaveGame — A5 cup/liga split', () => {
  it('re-summerar förorenad seasonStats: cupmål exkluderas ur liga', () => {
    const raw = {
      id: 'test', version: '0.2.0', currentSeason: 5, pendingEvents: [],
      fixtures: [
        fixture({ id: 'lg1', isCup: false, goals: 2, cornerGoals: 1 }),
        fixture({ id: 'lg2', isCup: false, goals: 1 }),
        fixture({ id: 'cup1', isCup: true, goals: 4 }),  // får INTE hamna i ligastatistiken
      ],
      players: [{
        id: PID, firstName: 'Star', lastName: 'Spelare',
        // Förorenad: alla 7 mål (3 liga + 4 cup) hade adderats till seasonStats
        seasonStats: { gamesPlayed: 3, goals: 7, assists: 0, cornerGoals: 1, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 7.5, minutesPlayed: 270 },
        // seasonCupStats saknas → triggar split
        careerStats: { totalGames: 3, totalGoals: 7, totalAssists: 0, seasonsPlayed: 1 },
      }],
    }

    const migrated = migrateSaveGame(raw)
    const p = migrated.players[0]

    // Liga: 2 matcher, 3 mål, 1 hörnmål
    expect(p.seasonStats.gamesPlayed).toBe(2)
    expect(p.seasonStats.goals).toBe(3)
    expect(p.seasonStats.cornerGoals).toBe(1)
    // Cup: 1 match, 4 mål — separat hink
    expect(p.seasonCupStats?.gamesPlayed).toBe(1)
    expect(p.seasonCupStats?.goals).toBe(4)
    // careerStats orört (all-tävling)
    expect(p.careerStats.totalGoals).toBe(7)
  })

  it('rör inte saves som redan har seasonCupStats', () => {
    const clean = { gamesPlayed: 1, goals: 9, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 8, minutesPlayed: 90 }
    const raw = {
      id: 'test', version: '0.3.0', currentSeason: 5, pendingEvents: [],
      fixtures: [fixture({ id: 'lg1', isCup: false, goals: 1 })],
      players: [{
        id: PID, firstName: 'Star', lastName: 'Spelare',
        seasonStats: { ...clean }, seasonCupStats: { ...clean },
        careerStats: { totalGames: 1, totalGoals: 9, totalAssists: 0, seasonsPlayed: 1 },
      }],
    }
    const migrated = migrateSaveGame(raw)
    // Oförändrat — ingen recompute (goals 9 hade annars blivit 1)
    expect(migrated.players[0].seasonStats.goals).toBe(9)
  })
})
