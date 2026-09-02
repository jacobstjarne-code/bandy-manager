import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { didEscapeRelegationOnFinalMatchday, handleSeasonEnd } from '../seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { ClubExpectation, FixtureStatus } from '../../../domain/enums'

function completedWinningSeason(expectation: ClubExpectation) {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  return {
    ...game,
    seasonStartBoardExpectation: expectation,
    clubs: game.clubs.map(club => club.id === game.managedClubId ? { ...club, boardExpectation: expectation } : club),
    fixtures: game.fixtures.map(fixture => {
      if (fixture.isCup || fixture.isKnockout) return fixture
      const managedHome = fixture.homeClubId === game.managedClubId
      const managedAway = fixture.awayClubId === game.managedClubId
      return {
        ...fixture,
        status: FixtureStatus.Completed,
        homeScore: managedHome ? 5 : managedAway ? 0 : 1,
        awayScore: managedAway ? 5 : 0,
      }
    }),
  }
}

describe('seasonEndProcessor — underdog_season', () => {
  it('fryser en lågförväntad klubbs canonical exceeded-säsong', () => {
    const game = completedWinningSeason(ClubExpectation.Survive)
    const result = handleSeasonEnd(game, 123).game
    const story = result.storylines?.find(item => item.type === 'underdog_season')

    expect(story).toMatchObject({
      id: `story_underdog_${game.managedClubId}_${game.currentSeason}`,
      season: game.currentSeason,
      clubId: game.managedClubId,
      description: 'Styrelsen hade inte väntat sig det här.',
      displayText: 'Styrelsen hade inte väntat sig det här.',
      resolved: true,
    })
  })

  it('skapar ingen underdog-storyline för en WinLeague-klubb med samma förstaplats', () => {
    const game = completedWinningSeason(ClubExpectation.WinLeague)
    const result = handleSeasonEnd(game, 123).game

    expect(result.storylines?.some(item => item.type === 'underdog_season') ?? false).toBe(false)
  })
})

function lastDayEscapeGame(escape: boolean) {
  const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  const opponents = game.league.teamIds.filter(id => id !== game.managedClubId)
  const fixtureTemplate = game.fixtures.find(fixture => !fixture.isCup && !fixture.isKnockout)!
  const losses = opponents.slice(0, 10).map((opponentId, index) => ({
    ...fixtureTemplate,
    id: `escape_loss_${index}`,
    roundNumber: index + 1,
    matchday: index + 1,
    homeClubId: opponentId,
    awayClubId: game.managedClubId,
    status: FixtureStatus.Completed,
    homeScore: 1,
    awayScore: 0,
  }))
  const lowOpponent = opponents[10]
  const lowDraw = {
    ...fixtureTemplate,
    id: 'escape_low_draw',
    roundNumber: 10,
    matchday: 10,
    homeClubId: lowOpponent,
    awayClubId: opponents[0],
    status: FixtureStatus.Completed,
    homeScore: 0,
    awayScore: 0,
  }
  const final = {
    ...fixtureTemplate,
    id: 'escape_final',
    roundNumber: 11,
    matchday: 11,
    homeClubId: game.managedClubId,
    awayClubId: opponents[1],
    status: FixtureStatus.Completed,
    homeScore: escape ? 10 : 0,
    awayScore: 0,
  }
  return { ...game, fixtures: [...losses, lowDraw, final] }
}

describe('seasonEndProcessor — relegation_escape', () => {
  it('kräver en verklig tabellpassering ut ur kvalzonen i sista ligamatchen', () => {
    expect(didEscapeRelegationOnFinalMatchday(lastDayEscapeGame(true))).toBe(true)
    expect(didEscapeRelegationOnFinalMatchday(lastDayEscapeGame(false))).toBe(false)
  })

  it('fryser den bevisade sista-dagen-räddningen i samma säsongsrollover', () => {
    const game = lastDayEscapeGame(true)
    const result = handleSeasonEnd(game, 123).game

    expect(result.storylines?.find(item => item.type === 'relegation_escape')).toMatchObject({
      id: `story_relegation_escape_${game.managedClubId}_${game.currentSeason}`,
      season: game.currentSeason,
      matchday: 11,
      clubId: game.managedClubId,
      description: 'Räddade sig kvar i sista stund',
      displayText: 'Räddade sig kvar i sista stund',
      resolved: true,
    })
  })
})
