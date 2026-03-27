import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { generateCharacterPlayerEvents } from '../characterPlayerService'
import { generateCommunityActivitiesEvents } from './communityActivitiesEvents'
import { generatePatronEvents } from './patronEvents'
import { generatePoliticianEvents } from './politicianEvents'
import { generateSponsorEvents } from './sponsorEvents'
import { generateHallDebateEvents } from './hallDebateEvents'

// ── generateEvents ─────────────────────────────────────────────────────────
export function generateEvents(
  game: SaveGame,
  currentRound: number,
  rand: () => number,
): GameEvent[] {
  const alreadyQueued = new Set([
    ...(game.pendingEvents ?? []).map(e => e.id),
    ...(game.resolvedEventIds ?? []),
  ])

  return [
    ...generateCommunityActivitiesEvents(game, currentRound, alreadyQueued, rand),
    ...generatePatronEvents(game, currentRound, alreadyQueued, rand),
    ...generatePoliticianEvents(game, currentRound, alreadyQueued, rand),
    ...generateSponsorEvents(game, currentRound, alreadyQueued, rand),
    ...generateHallDebateEvents(game, currentRound, alreadyQueued, rand),
    ...generateCharacterPlayerEvents(game.players ?? [], currentRound, alreadyQueued, rand),
  ]
}
