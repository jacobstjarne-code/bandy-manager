import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { StandingRow } from '../../../../domain/entities/Standing'
import { ClubExpectation, FixtureStatus } from '../../../../domain/enums'
import { updateRunningBoardPatience } from '../../../../domain/services/boardService'
import { updateTrainerArc } from '../../../../domain/services/trainerArcService'
import { processTrainerState } from '../trainerProcessor'

describe('processTrainerState', () => {
  it('beräknar båge och styrelsetålamod från samma post-round-snapshot', () => {
    const fixture = {
      id: 'latest',
      homeClubId: 'managed',
      awayClubId: 'away',
      matchday: 8,
      roundNumber: 8,
      status: FixtureStatus.Completed,
      homeScore: 0,
      awayScore: 2,
      events: [],
    } as Fixture
    const standings: StandingRow[] = [
      { clubId: 'managed', played: 8, wins: 2, draws: 1, losses: 5, goalsFor: 8, goalsAgainst: 15, goalDifference: -7, points: 5, position: 9 },
    ]
    const game = {
      managedClubId: 'managed',
      currentSeason: 2,
      currentMatchday: 8,
      players: [],
      fixtures: [],
      standings: [],
      clubs: [
        { id: 'managed', boardExpectation: ClubExpectation.MidTable },
        { id: 'away' },
      ],
      boardPatience: 70,
      trainerArc: {
        current: 'newcomer',
        history: [],
        seasonCount: 0,
        bestFinish: 12,
        titlesWon: 0,
        consecutiveLosses: 2,
        consecutiveWins: 0,
        boardWarningGiven: false,
      },
    } as unknown as SaveGame
    const postRoundGame = { ...game, fixtures: [fixture], standings }
    const expectedArc = updateTrainerArc(postRoundGame)
    const expectedPatience = updateRunningBoardPatience(postRoundGame, expectedArc.consecutiveLosses)

    expect(processTrainerState(game, [], [fixture], standings)).toEqual({
      trainerArc: expectedArc,
      boardPatience: expectedPatience.boardPatience,
      boardPatienceLastCountedFixtureId: expectedPatience.boardPatienceLastCountedFixtureId,
    })
  })
})
