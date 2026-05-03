import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import type { GameEvent } from '../entities/GameEvent'
import { generateInsandare } from './insandareService'
import { generatePostMatchOpponentQuote } from './opponentManagerService'
import { getRivalry } from '../data/rivalries'

/**
 * Generates post-match atmospheric events (insändare, opponent quote) and
 * pushes them into pendingEvents as low-priority events.
 *
 * These events are of type 'fanLetter' and 'opponentQuote' — they are
 * classified as REACTION_TYPES in GranskaScreen and auto-resolved in the
 * Reaktioner-kortet. No player decision required.
 *
 * generateSilentMatchReport is NOT touched — it stays in GranskaScreen.
 */
export function generatePostMatchEvents(game: SaveGame, fixture: Fixture): GameEvent[] {
  const events: GameEvent[] = []
  const isHome = fixture.homeClubId === game.managedClubId

  // ── Insändare (fanLetter) ──────────────────────────────────────────────────
  const insandare = generateInsandare(game, fixture)
  if (insandare) {
    events.push({
      id: `fanLetter_${fixture.id}`,
      type: 'fanLetter',
      title: 'Insändare',
      body: `"${insandare.text}" — ${insandare.signature}`,
      choices: [],
      resolved: false,
      priority: 'low',
    })
  }

  // ── Opponent quote (opponentQuote) ────────────────────────────────────────
  const myScore = isHome ? fixture.homeScore : fixture.awayScore
  const theirScore = isHome ? fixture.awayScore : fixture.homeScore
  const margin = (myScore ?? 0) - (theirScore ?? 0)

  // Quote only generated for decisive margins (same condition as before in GranskaScreen)
  if (Math.abs(margin) >= 3) {
    const opponentClub = isHome
      ? game.clubs.find(c => c.id === fixture.awayClubId)
      : game.clubs.find(c => c.id === fixture.homeClubId)

    if (opponentClub) {
      const theyWon = margin < 0
      const opponentScandal = (game.scandalHistory ?? []).some(s =>
        s.affectedClubId === opponentClub.id &&
        s.season === game.currentSeason &&
        s.type !== 'small_absurdity'
      )
      const quote = generatePostMatchOpponentQuote(opponentClub, theyWon, opponentScandal)
      if (quote) {
        const opponentClubName = opponentClub.shortName ?? opponentClub.name
        const isDerby = !!getRivalry(fixture.homeClubId, fixture.awayClubId)
        events.push({
          id: `opponentQuote_${fixture.id}`,
          type: 'opponentQuote',
          title: isDerby ? `🛡 ${opponentClubName} — derby` : `🛡 ${opponentClubName}`,
          body: quote,
          choices: [],
          resolved: false,
          priority: 'low',
        })
      }
    }
  }

  return events
}
