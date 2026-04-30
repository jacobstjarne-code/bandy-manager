/**
 * attentionRouter — koordinerar de tre parallella uppmärksamhets-mekanismerna.
 *
 * Prioritetsordning:
 *   1. pendingScreen  — hårda screen-skiften (board meeting, säsongsslut, etc)
 *   2. pendingScene   — narrativa nedslag som bryter tempo
 *   3. pendingEvents  — events via EventOverlay (ETT åt gången, sorterat på prio)
 *   4. idle           — inget pågår, Portal renderas
 *
 * Pure function — inga side effects, inga store-anrop.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { SceneId } from '../entities/Scene'
import type { PendingScreen } from '../enums'
import { getNextEvent } from './eventQueueService'

export type AttentionState =
  | { kind: 'screen'; screen: PendingScreen }
  | { kind: 'scene'; sceneId: SceneId }
  | { kind: 'event'; event: GameEvent }
  | { kind: 'idle' }

/**
 * Returnerar aktuellt uppmärksamhets-tillstånd för game.
 * Konsumenter (AppRouter, GameShell) använder detta för att avgöra vad som renderas.
 */
export function getCurrentAttention(game: SaveGame): AttentionState {
  if (game.pendingScreen) {
    return { kind: 'screen', screen: game.pendingScreen }
  }
  if (game.pendingScene) {
    return { kind: 'scene', sceneId: game.pendingScene.sceneId }
  }
  const next = getNextEvent(game)
  if (next) {
    return { kind: 'event', event: next }
  }
  return { kind: 'idle' }
}
