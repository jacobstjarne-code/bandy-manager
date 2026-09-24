import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { buildDefaultLineup } from '../../../application/useCases/setupManagedClub'
import { MatchEventType } from '../../enums'
import { fixtureSeed } from '../../utils/random'
import { simulateFirstHalf } from '../matchCore'

describe('matchCore — fullägets hörnval', () => {
  it('leder även en anfallsretur till spelarens garanterade första hörnval', () => {
    const game = createNewGame({
      managerName: 'Hörnvalstest',
      clubId: 'club_skutskar',
      season: 2026,
      seed: 42,
    })
    const fixture = game.fixtures.find(candidate =>
      !candidate.isCup &&
      candidate.roundNumber === 1 &&
      (candidate.homeClubId === game.managedClubId || candidate.awayClubId === game.managedClubId)
    )!
    const homeClub = game.clubs.find(club => club.id === fixture.homeClubId)!
    const awayClub = game.clubs.find(club => club.id === fixture.awayClubId)!
    const steps = [...simulateFirstHalf({
      fixture,
      homeLineup: buildDefaultLineup(fixture.homeClubId, game.players, homeClub),
      awayLineup: buildDefaultLineup(fixture.awayClubId, game.players, awayClub),
      homePlayers: game.players.filter(player => player.clubId === fixture.homeClubId),
      awayPlayers: game.players.filter(player => player.clubId === fixture.awayClubId),
      managedIsHome: fixture.homeClubId === game.managedClubId,
      mode: 'full',
      seed: fixtureSeed(fixture.id),
    })]

    const reboundCornerStep = steps.find(step =>
      step.events.some(event => event.type === MatchEventType.Corner && event.origin === 'OPEN_PLAY')
    )

    expect(reboundCornerStep).toBeDefined()
    expect(reboundCornerStep?.cornerInteractionData).toBeDefined()
  })
})
