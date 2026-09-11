import type { MatchEvent } from '../../../domain/entities/Fixture'
import { MatchEventType } from '../../../domain/enums'

/** The live choice must leave the same statistical evidence as a simulated corner. */
export function interactiveCornerGoalEvent(goal: Pick<MatchEvent, 'minute' | 'clubId' | 'playerId' | 'description'>): MatchEvent {
  return { ...goal, type: MatchEventType.Goal, isCornerGoal: true, origin: 'CORNER' }
}
