import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { generateGalaInbox, type GalaNomination } from '../../../domain/services/bandyGalaService'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { FixtureStatus } from '../../../domain/enums'
import { seasonChampionYear } from '../../../domain/utils/seasonYear'

describe('Bandygalan — gala_winner storyline', () => {
  it('förankrar vinnaren i spelare, klubb och canonical ligarond', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
    const leagueFixture = base.fixtures.find(fixture => !fixture.isCup && !fixture.isKnockout)!
    const game = {
      ...base,
      fixtures: [{
        ...leagueFixture,
        status: FixtureStatus.Completed,
        roundNumber: 3,
        matchday: 9,
      }],
    }
    const nomination: GalaNomination = {
      award: 'arets_spelare',
      playerId: player.id,
      playerName: `${player.firstName} ${player.lastName}`,
      clubName: CLUB_TEMPLATES[0].shortName,
      stat: 'Styrka 70',
    }

    const { storylines } = generateGalaInbox([nomination], game)

    expect(storylines).toEqual([expect.objectContaining({
      id: `story_gala_arets_spelare_${game.currentSeason}`,
      type: 'gala_winner',
      season: game.currentSeason,
      matchday: 3,
      playerId: player.id,
      clubId: game.managedClubId,
      description: `${player.firstName} ${player.lastName} vann Årets spelare på Bandygalan ${seasonChampionYear(game.currentSeason)}`,
      displayText: `${player.firstName} ${player.lastName} vann Årets spelare på Bandygalan ${seasonChampionYear(game.currentSeason)}`,
      resolved: true,
    })])
  })

  it('bevarar galaposten vid rollover även när den äldre saven saknar storylines-array', () => {
    const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const winner = base.players.find(candidate => candidate.clubId === base.managedClubId)!
    const players = base.players.map(player => ({
      ...player,
      currentAbility: player.id === winner.id ? 100 : Math.min(player.currentAbility, 99),
      seasonStats: {
        ...player.seasonStats,
        gamesPlayed: player.id === winner.id ? 5 : 0,
        goals: 0,
        averageRating: 0,
      },
    }))
    const game = { ...base, players, storylines: undefined }

    const result = handleSeasonEnd(game, 123).game

    expect(game.storylines).toBeUndefined()
    expect(result.storylines?.find(story => story.type === 'gala_winner')).toMatchObject({
      id: `story_gala_arets_spelare_${game.currentSeason}`,
      season: game.currentSeason,
      playerId: winner.id,
      clubId: game.managedClubId,
      resolved: true,
    })
  })
})
