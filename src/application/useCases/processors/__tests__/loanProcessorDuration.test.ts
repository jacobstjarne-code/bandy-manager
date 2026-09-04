import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processLoans } from '../transferProcessor'

describe('processLoans — lånets omgångskontrakt', () => {
  it('ett fyraronderslån ger fyra möjliga matcher och räknar slutronden före retur', () => {
    let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const initialAbility = player.currentAbility
    game = {
      ...game,
      players: game.players.map(p => p.id === player.id ? { ...p, isOnLoan: true, loanClubName: 'Testklubben' } : p),
      clubs: game.clubs.map(c => c.id === game.managedClubId
        ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== player.id) }
        : c),
      loanDeals: [{
        playerId: player.id,
        destinationClubName: 'Testklubben',
        startRound: 0,
        endRound: 4,
        salaryShare: 0.5,
        matchesPlayed: 0,
        totalMatches: 4,
        averageRating: 0,
        reports: [],
      }],
    }

    for (let matchday = 1; matchday <= 4; matchday++) {
      const result = processLoans(game, game.players, game.clubs, matchday, `2026-01-${matchday.toString().padStart(2, '0')}`, () => 0.9)
      game = {
        ...game,
        players: result.loanUpdatedPlayers,
        clubs: result.updatedClubs,
        loanDeals: result.updatedLoanDeals,
        inbox: [...game.inbox, ...result.inboxItems],
      }

      if (matchday < 4) {
        expect(game.loanDeals[0].reports).toHaveLength(matchday)
        expect(game.loanDeals[0].matchesPlayed).toBe(matchday)
      }
    }

    expect(game.loanDeals).toHaveLength(0)
    const returned = game.players.find(p => p.id === player.id)!
    expect(returned.isOnLoan).toBe(false)
    expect(returned.seasonStats.gamesPlayed).toBe(player.seasonStats.gamesPlayed + 4)
    expect(returned.currentAbility).toBe(Math.min(player.potentialAbility, initialAbility + 5))
    expect(game.clubs.find(c => c.id === game.managedClubId)!.squadPlayerIds).toContain(player.id)
  })

  it('ett åttaronderslån behåller alla rapporter när returstatistiken summeras', () => {
    let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 2 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    game = {
      ...game,
      players: game.players.map(p => p.id === player.id ? { ...p, isOnLoan: true, loanClubName: 'Testklubben' } : p),
      clubs: game.clubs.map(c => c.id === game.managedClubId
        ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== player.id) }
        : c),
      loanDeals: [{
        playerId: player.id,
        destinationClubName: 'Testklubben',
        startRound: 9,
        endRound: 17,
        salaryShare: 0.5,
        matchesPlayed: 0,
        totalMatches: 8,
        averageRating: 0,
        reports: [],
      }],
    }

    for (let matchday = 10; matchday <= 17; matchday++) {
      const result = processLoans(game, game.players, game.clubs, matchday, `2026-02-${matchday}`, () => 0.9)
      game = {
        ...game,
        players: result.loanUpdatedPlayers,
        clubs: result.updatedClubs,
        loanDeals: result.updatedLoanDeals,
        inbox: [...game.inbox, ...result.inboxItems],
      }
      if (matchday < 17) expect(game.loanDeals[0].reports).toHaveLength(matchday - 9)
    }

    const returned = game.players.find(p => p.id === player.id)!
    expect(returned.seasonStats.gamesPlayed).toBe(player.seasonStats.gamesPlayed + 8)
    expect(returned.seasonStats.goals).toBe(player.seasonStats.goals + 8)
  })
})
