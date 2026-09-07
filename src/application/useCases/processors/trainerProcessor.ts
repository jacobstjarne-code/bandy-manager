import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { StandingRow } from '../../../domain/entities/Standing'
import { updateRunningBoardPatience } from '../../../domain/services/boardService'
import { updateTrainerArc } from '../../../domain/services/trainerArcService'

export interface TrainerStateResult {
  trainerArc: ReturnType<typeof updateTrainerArc>
  boardPatience: number
  boardPatienceLastCountedFixtureId?: string
}

/**
 * Updates the trainer arc and the board's running patience from the same
 * post-round snapshot. The shared snapshot is significant: patience must use
 * the loss streak produced by this trainer-arc update, not last round's state.
 */
export function processTrainerState(
  game: SaveGame,
  players: Player[],
  fixtures: Fixture[],
  standings: StandingRow[],
): TrainerStateResult {
  const postRoundGame = { ...game, players, fixtures, standings }
  const trainerArc = updateTrainerArc(postRoundGame)
  const patience = updateRunningBoardPatience(postRoundGame, trainerArc.consecutiveLosses)

  return {
    trainerArc,
    boardPatience: patience.boardPatience,
    boardPatienceLastCountedFixtureId: patience.boardPatienceLastCountedFixtureId,
  }
}
