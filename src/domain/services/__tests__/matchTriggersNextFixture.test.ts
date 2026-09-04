import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { FixtureStatus, PlayoffRound, PlayoffStatus } from '../../enums'
import { getNextManagedFixture } from '../portal/triggers/matchTriggers'

describe('getNextManagedFixture — efter slutspelsuttag', () => {
  it.each([PlayoffRound.QuarterFinal, PlayoffRound.SemiFinal])(
    'returnerar ingen kvarvarande %s-fixture när klubben är utslagen',
    round => {
      const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', seed: 1 })
      const opponentId = game.clubs.find(club => club.id !== game.managedClubId)!.id
      const cancelledId = `cancelled_${round}`
      const scheduledId = `scheduled_${round}`
      game.fixtures = [
        {
          ...game.fixtures[0],
          id: cancelledId,
          matchday: 27,
          homeClubId: game.managedClubId,
          awayClubId: opponentId,
          status: FixtureStatus.Cancelled,
          isKnockout: true,
        },
        {
          ...game.fixtures[0],
          id: scheduledId,
          matchday: 28,
          homeClubId: opponentId,
          awayClubId: game.managedClubId,
          status: FixtureStatus.Scheduled,
          isKnockout: true,
        },
      ]
      const series = {
        id: `series_${round}`,
        round,
        homeClubId: game.managedClubId,
        awayClubId: opponentId,
        fixtures: [cancelledId, scheduledId],
        homeWins: 0,
        awayWins: 3,
        winnerId: opponentId,
        loserId: game.managedClubId,
      }
      game.playoffBracket = {
        season: game.currentSeason,
        status: PlayoffStatus.Completed,
        quarterFinals: round === PlayoffRound.QuarterFinal ? [series] : [],
        semiFinals: round === PlayoffRound.SemiFinal ? [series] : [],
        final: null,
        champion: opponentId,
      }

      expect(getNextManagedFixture(game)).toBeNull()
    },
  )
})
