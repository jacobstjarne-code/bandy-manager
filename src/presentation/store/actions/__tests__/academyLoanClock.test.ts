import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { academyActions } from '../academyActions'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

describe('academyActions.loanOutPlayer — kanonisk matchday-klocka', () => {
  it('startar från currentMatchday även när ingen ligafixtur är färdigspelad', () => {
    let game: SaveGame | null = {
      ...createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 3 }),
      currentMatchday: 9,
    }
    const player = game.players.find(item => item.clubId === game!.managedClubId && item.age <= 23)!
    const get = () => ({ game })
    const set = (partial: Partial<{ game: SaveGame | null }>) => {
      if ('game' in partial) game = partial.game ?? null
    }

    const result = academyActions(get, set).loanOutPlayer(player.id, 'ext:testklubben', 'Testklubben', 4)

    expect(result.success).toBe(true)
    expect(game?.loanDeals?.[0]).toMatchObject({
      destinationClubId: 'ext:testklubben',
      destinationClubName: 'Testklubben',
      caAtStart: player.currentAbility,
      startRound: 9,
      endRound: 13,
      totalMatches: 4,
    })
    expect(game?.eventLedger?.at(-1)).toMatchObject({
      type: 'loan_started',
      clubId: game.managedClubId,
      subject: { kind: 'player', id: player.id },
      subject2: { kind: 'club', id: 'ext:testklubben' },
      subject2Snapshot: { name: 'Testklubben' },
      significance: 30,
      loan: { toClubId: 'ext:testklubben', occasions: 4, caAtStart: player.currentAbility },
    })
  })

  it('avvisar managerklubben även om ett felaktigt UI skulle skicka dess id', () => {
    let game: SaveGame | null = createNewGame({ managerName: 'Test', clubId: 'club_skutskar', season: 2025, seed: 3 })
    const player = game.players.find(item => item.clubId === game!.managedClubId && item.age <= 23)!
    const get = () => ({ game })
    const set = (partial: Partial<{ game: SaveGame | null }>) => {
      if ('game' in partial) game = partial.game ?? null
    }

    const result = academyActions(get, set).loanOutPlayer(player.id, game.managedClubId, game.clubs.find(club => club.id === game!.managedClubId)!.name, 4)

    expect(result).toEqual({ success: false, error: 'Du kan inte låna ut till den egna klubben' })
    expect(game.loanDeals).toEqual([])
  })

  it('skriver en sann returpost även när managern återkallar lånet', () => {
    let game: SaveGame | null = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 4 })
    const player = game.players.find(item => item.clubId === game!.managedClubId && item.age <= 23)!
    const get = () => ({ game })
    const set = (partial: Partial<{ game: SaveGame | null }>) => {
      if ('game' in partial) game = partial.game ?? null
    }
    const actions = academyActions(get, set)

    actions.loanOutPlayer(player.id, 'ext:testklubben', 'Testklubben', 4)
    game = {
      ...game!,
      loanDeals: game!.loanDeals.map(deal => deal.playerId === player.id
        ? { ...deal, matchesPlayed: 1, averageRating: 6.4, reports: [{ round: 10, played: true, rating: 6.4, goals: 1, assists: 0 }] }
        : deal),
    }
    actions.recallLoan(player.id)

    expect(game?.loanDeals).toHaveLength(0)
    expect(game?.eventLedger?.at(-1)).toMatchObject({
      type: 'loan_returned',
      subject: { kind: 'player', id: player.id },
      subject2: { kind: 'club', id: 'ext:testklubben' },
      subject2Snapshot: { name: 'Testklubben' },
      loan: {
        caAtStart: player.currentAbility,
        caAtReturn: player.currentAbility,
        loanBonus: 0,
        matches: 1,
        goals: 1,
        avgRating: 6.4,
      },
    })
  })
})
