import { MatchEventType } from '../../domain/enums'
import type { MatchEvent } from '../../domain/entities/Fixture'

export function computePlayerRatings(
  starterIds: string[],
  events: MatchEvent[],
): Record<string, number> {
  const ratings: Record<string, number> = {}
  for (const id of starterIds) ratings[id] = 6.5
  for (const e of events) {
    if (!e.playerId) continue
    if (e.type === MatchEventType.Goal) ratings[e.playerId] = Math.min(10, (ratings[e.playerId] ?? 6.5) + 1.5)
    if (e.type === MatchEventType.YellowCard) ratings[e.playerId] = Math.max(1, (ratings[e.playerId] ?? 6.5) - 0.5)
    if (e.type === MatchEventType.RedCard) ratings[e.playerId] = Math.max(1, (ratings[e.playerId] ?? 6.5) - 1.5)
  }
  return ratings
}
