/**
 * K2 — karriärstatistikens dubblering, retroaktiv rättning (SLUTTEST_KO.md,
 * 2026-08-19). Jacobs dom, alternativ (a): totalGames/totalGoals/totalAssists
 * räknas om ur seasonHistory (redan avslutade säsonger) + seasonStats
 * (innevarande säsong). Cupdelen och allt bortom tio säsonger är förlorat
 * och ska förbli det — täcks av att seasonHistory redan bara bär ligadata,
 * redan kapad till tio poster.
 */
import { describe, it, expect } from 'vitest'
import { migrateSaveGame } from '../infrastructure/persistence/saveGameMigration'

const PID = 'p_veteran'

function baseRaw(players: Record<string, unknown>[]) {
  return { id: 'test', version: '0.3.0', currentSeason: 9, pendingEvents: [], fixtures: [], players }
}

describe('migrateSaveGame — K2 karriärstatistik-rättning', () => {
  it('räknar om dubblerad careerStats ur seasonHistory + innevarande seasonStats', () => {
    const raw = baseRaw([{
      id: PID, firstName: 'Old', lastName: 'Timer',
      seasonHistory: [
        { season: 6, goals: 10, assists: 4, games: 20, rating: 6.8, clubId: 'club_x' },
        { season: 7, goals: 15, assists: 6, games: 22, rating: 7.0, clubId: 'club_x' },
        { season: 8, goals: 8, assists: 2, games: 18, rating: 6.5, clubId: 'club_x' },
      ],
      seasonStats: { gamesPlayed: 5, goals: 3, assists: 1, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.9, minutesPlayed: 450 },
      seasonCupStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
      // Dubblerad (K1-buggen): påstår 200 mål trots att sann summa (33+3=36) är mycket lägre
      careerStats: { totalGames: 300, totalGoals: 200, totalAssists: 90, seasonsPlayed: 3 },
    }])

    const migrated = migrateSaveGame(raw)
    const p = migrated.players[0]

    // Sant: 20+22+18+5 = 65 matcher, 10+15+8+3 = 36 mål, 4+6+2+1 = 13 assists
    expect(p.careerStats.totalGames).toBe(65)
    expect(p.careerStats.totalGoals).toBe(36)
    expect(p.careerStats.totalAssists).toBe(13)
    expect(p.careerStats.seasonsPlayed).toBe(4) // 3 arkiverade + innevarande (spelat 5 matcher)
  })

  it('rör aldrig careerStats när seasonHistory saknas helt — gissar inte bakåt', () => {
    const raw = baseRaw([{
      id: PID, firstName: 'Legacy', lastName: 'Save',
      // Ingen seasonHistory alls — save från innan fältet fanns
      seasonStats: { gamesPlayed: 5, goals: 3, assists: 1, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.9, minutesPlayed: 450 },
      seasonCupStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
      careerStats: { totalGames: 300, totalGoals: 200, totalAssists: 90, seasonsPlayed: 12 },
    }])

    const migrated = migrateSaveGame(raw)
    const p = migrated.players[0]

    // Oförändrat — ingen data att räkna om ur, så ingen ändring (inte nollställt)
    expect(p.careerStats.totalGames).toBe(300)
    expect(p.careerStats.totalGoals).toBe(200)
    expect(p.careerStats.totalAssists).toBe(90)
  })

  it('idempotent — en redan korrekt save räknar om till exakt samma tal', () => {
    const raw = baseRaw([{
      id: PID, firstName: 'Fresh', lastName: 'Rookie',
      seasonHistory: [{ season: 8, goals: 5, assists: 2, games: 10, rating: 6.5, clubId: 'club_x' }],
      seasonStats: { gamesPlayed: 4, goals: 2, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 6.5, minutesPlayed: 360 },
      seasonCupStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
      careerStats: { totalGames: 14, totalGoals: 7, totalAssists: 2, seasonsPlayed: 2 },
    }])

    const once = migrateSaveGame(raw)
    const twice = migrateSaveGame(once)

    expect(once.players[0].careerStats).toEqual(twice.players[0].careerStats)
    expect(once.players[0].careerStats.totalGames).toBe(14)
  })

  it('respekterar seasonHistorys egen tioårsgräns — äldre säsonger är redan borta ur arrayen', () => {
    const raw = baseRaw([{
      id: PID, firstName: 'Ancient', lastName: 'Legend',
      // Redan kapad till 10 poster (samma sätt seasonEndProcessor.ts sparar den) —
      // säsonger äldre än detta finns inte kvar att summera, per domen.
      seasonHistory: Array.from({ length: 10 }, (_, i) => ({ season: i + 1, goals: 1, assists: 0, games: 1, rating: 6, clubId: 'club_x' })),
      seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
      seasonCupStats: { gamesPlayed: 0, goals: 0, assists: 0, cornerGoals: 0, penaltyGoals: 0, yellowCards: 0, redCards: 0, suspensions: 0, averageRating: 0, minutesPlayed: 0 },
      careerStats: { totalGames: 999, totalGoals: 999, totalAssists: 999, seasonsPlayed: 20 },
    }])

    const migrated = migrateSaveGame(raw)
    const p = migrated.players[0]

    expect(p.careerStats.totalGoals).toBe(10) // bara de tio bevarade säsongerna, inte 20
    expect(p.careerStats.seasonsPlayed).toBe(10) // 0 matcher innevarande säsong → inte +1
  })
})
