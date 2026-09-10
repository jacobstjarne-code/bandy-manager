import { describe, expect, it } from 'vitest'
import { FixtureStatus } from '../../../../domain/enums'
import { VICTORY_ECHO_PLAYOFF_WIN_KEY } from '../../../../domain/services/postVictoryNarrativeService'
import { createNewGame } from '../../createNewGame'
import { processNarrative, processUpcomingDerbyNotification } from '../narrativeProcessor'

describe('narrativeProcessor — derbyförhandsnotis', () => {
  it('nämner inte en undefined gammal klackfavorit efter klubbbyte', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_skutskar', season: 2036, seed: 42 })
    const result = processNarrative({
      ...game,
      supporterGroup: {
        ...game.supporterGroup!,
        favoritePlayerId: 'player_from_former_club',
      },
    }, null, 5, game.currentDate, () => 0.5)

    const shift = result.inboxItems.find(item => item.title === 'Klacken har en ny favorit')
    expect(shift).toBeDefined()
    expect(shift?.body).not.toContain('undefined')
    expect(shift?.body).toMatch(/har tagit över kören\.$/)
  })

  it('köar inte samma fasta kafferumsrad efter ännu en slutspelsseger på cooldown', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_halleforsnas', season: 2025, seed: 42 })
    const opponent = game.clubs.find(club => club.id !== game.managedClubId)!
    const playoffWin = {
      ...game.fixtures[0],
      id: 'playoff-cooldown',
      homeClubId: game.managedClubId,
      awayClubId: opponent.id,
      status: FixtureStatus.Completed,
      isCup: false,
      isKnockout: true,
      homeScore: 4,
      awayScore: 2,
      events: [],
    }

    const result = processNarrative({
      ...game,
      narrativeBeatLog: [{
        semanticKey: VICTORY_ECHO_PLAYOFF_WIN_KEY,
        season: game.currentSeason,
        round: playoffWin.matchday - 2,
      }],
    }, playoffWin, playoffWin.matchday, game.currentDate, () => 0.5)

    expect(result.pendingVictoryEcho).toBeUndefined()
    expect(result.victoryEchoExpires).toBeUndefined()
  })

  it('skapar inte längre en parallell notis från den gamla fixture-snapshoten', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_halleforsnas', season: 2025, seed: 42 })
    const completed = game.fixtures.find(fixture =>
      fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId
    )!
    const staleGame = {
      ...game,
      fixtures: game.fixtures.map(fixture => fixture.id === completed.id
        ? { ...fixture, status: FixtureStatus.Scheduled }
        : fixture),
    }

    const result = processNarrative(
      staleGame,
      { ...completed, status: FixtureStatus.Completed, homeScore: 1, awayScore: 1, events: [] },
      completed.matchday + 1,
      game.currentDate,
      () => 0.5,
    )

    expect(result.inboxItems.some(item => item.id.startsWith('inbox_derby_preview_'))).toBe(false)
  })

  it('använder den uppdaterade fixture-listan för nästa derby', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_halleforsnas', season: 2025, seed: 42 })
    const derby = game.fixtures.find(fixture => {
      const clubs = [fixture.homeClubId, fixture.awayClubId]
      return clubs.includes('club_halleforsnas') && clubs.includes('club_lesjofors')
    })!
    const finalFixtures = game.fixtures.map(fixture => ({
      ...fixture,
      status: fixture.id === derby.id ? FixtureStatus.Scheduled : FixtureStatus.Completed,
    }))

    const result = processUpcomingDerbyNotification(finalFixtures, game)

    expect(result[0]?.id).toBe(`inbox_derby_${derby.id}`)
    expect(result[0]?.body).toContain('Lesjöfors')
  })
})
