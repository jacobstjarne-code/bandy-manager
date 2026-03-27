import type { SaveGame } from '../../domain/entities/SaveGame'
import type { GameEvent } from '../../domain/entities/GameEvent'

export interface AdvanceResult {
  game: SaveGame
  roundPlayed: number | null
  seasonEnded: boolean
  playoffStarted?: boolean
  pendingEvents?: GameEvent[]
}
