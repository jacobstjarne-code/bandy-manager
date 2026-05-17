import type { Player } from '../../../domain/entities/Player'

/**
 * Fallback-pipeline för feed-radens text:
 * 1. commentary (från MatchStep) — primärkällan
 * 2. event.description — spellogikens eget meddelande
 * 3. "Verb av Efternamn." — om playerId löser sig mot spelarlistan
 * 4. "Verb." — absolut fallback
 */
export function deriveEventText(
  commentary: string | undefined,
  event: { description?: string; playerId?: string },
  fallbackVerb: string,
  players: Player[] = [],
): string {
  const c = commentary?.trim()
  if (c) return c
  const d = event.description?.trim()
  if (d) return d
  if (event.playerId) {
    const p = players.find(pl => pl.id === event.playerId)
    if (p) return `${fallbackVerb} av ${p.lastName}.`
  }
  return `${fallbackVerb}.`
}
