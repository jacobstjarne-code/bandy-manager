import { describe, expect, it } from 'vitest'
import { migrateSaveGame } from '../saveGameMigration'

describe('migrateSaveGame — kvarvarande låneomgångar', () => {
  it('backfyller återstående faktiska tillfällen från totalen och sparade rapporter', () => {
    const migrated = migrateSaveGame({
      id: 'legacy-loan',
      version: '0.1.0',
      fixtures: [],
      pendingEvents: [],
      loanDeals: [{
        playerId: 'p1',
        destinationClubName: 'Testklubben',
        startRound: 0,
        endRound: 4,
        salaryShare: 0.5,
        matchesPlayed: 1,
        totalMatches: 4,
        averageRating: 6.5,
        reports: [{ round: 4, played: true, rating: 6.5, goals: 0, assists: 0 }],
      }],
    })

    expect(migrated.loanDeals[0].remainingRounds).toBe(3)
  })
})
