import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../createNewGame'
import { processLoans } from '../transferProcessor'

describe('processLoans — lånets omgångskontrakt', () => {
  it('ett kalenderhopp 0→4 förbrukar ett av fyra tillfällen, inte hela lånet', () => {
    let game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    game = {
      ...game,
      players: game.players.map(p => p.id === player.id ? { ...p, isOnLoan: true, loanClubName: 'Testklubben' } : p),
      clubs: game.clubs.map(c => c.id === game.managedClubId
        ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== player.id) }
        : c),
      loanDeals: [{
        playerId: player.id,
        destinationClubId: 'ext:testklubben',
        destinationClubName: 'Testklubben',
        caAtStart: player.currentAbility,
        startRound: 0,
        endRound: 4,
        remainingRounds: 4,
        salaryShare: 0.5,
        matchesPlayed: 0,
        totalMatches: 4,
        averageRating: 0,
        reports: [],
      }],
    }

    for (const matchday of [4, 5, 6]) {
      const result = processLoans(game, game.players, game.clubs, matchday, `2026-01-${matchday}`, () => 0.9)
      game = { ...game, players: result.loanUpdatedPlayers, clubs: result.updatedClubs, loanDeals: result.updatedLoanDeals }
    }

    expect(game.loanDeals).toHaveLength(1)
    expect(game.loanDeals[0].reports).toHaveLength(3)
    expect(game.loanDeals[0].remainingRounds).toBe(1)

    const result = processLoans(game, game.players, game.clubs, 7, '2026-01-07', () => 0.9)
    expect(result.updatedLoanDeals).toHaveLength(0)
    expect(result.updatedClubs.find(c => c.id === game.managedClubId)!.squadPlayerIds).toContain(player.id)
  })

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
        destinationClubId: 'ext:testklubben',
        destinationClubName: 'Testklubben',
        caAtStart: initialAbility,
        startRound: 0,
        endRound: 4,
        remainingRounds: 4,
        salaryShare: 0.5,
        matchesPlayed: 0,
        totalMatches: 4,
        averageRating: 0,
        reports: [],
      }],
    }

    let returnLedger = null as ReturnType<typeof processLoans>['ledgerEntries'][number] | null
    for (let matchday = 1; matchday <= 4; matchday++) {
      const result = processLoans(game, game.players, game.clubs, matchday, `2026-01-${matchday.toString().padStart(2, '0')}`, () => 0.9)
      returnLedger = result.ledgerEntries[0] ?? returnLedger
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
    expect(returnLedger).toMatchObject({
      type: 'loan_returned',
      clubId: game.managedClubId,
      subject: { kind: 'player', id: player.id },
      subject2: { kind: 'club', id: 'ext:testklubben' },
      subjectSnapshot: { name: `${player.firstName} ${player.lastName}` },
      subject2Snapshot: { name: 'Testklubben' },
      loan: {
        caAtStart: initialAbility,
        caAtReturn: returned.currentAbility,
        loanBonus: returned.currentAbility - initialAbility,
        matches: 4,
        goals: 4,
        avgRating: 7.7,
      },
    })
    expect(returnLedger?.significance).toBe(returned.currentAbility - initialAbility >= 5 ? 65 : 50)
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
        remainingRounds: 8,
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
