import type { SaveGame } from '../entities/SaveGame'

/**
 * 4.6 (SLUTTEST_KO.md, 2026-08-17) — "dubbla kaptensevent".
 *
 * Två oberoende system triggar på samma villkor (3+ förluster i rad) och
 * kan båda producera en `captain_rallied_team`-storyline samma säsong:
 *   - postAdvanceEvents.ts: captainSpeech-eventet ("Han samlade laget")
 *   - arcService.ts: ledare_crisis-arcen (building → peak → resolving)
 *
 * De byggdes oberoende av varandra och vet inget om varandra. Denna vakt
 * är den delade sanningen om "har kaptens-samlar-laget-ögonblicket redan
 * inträffat den här säsongen, via NÅGOT av de två systemen" — kollad
 * innan ENTINGEN systemet får starta sitt eget.
 */
export function captainRallyAlreadyEngagedThisSeason(game: SaveGame): boolean {
  const season = game.currentSeason
  const speechEventId = `event_captain_speech_s${season}`

  const speechQueuedOrResolved =
    (game.pendingEvents ?? []).some(e => e.id === speechEventId) ||
    (game.resolvedEventIds ?? []).includes(speechEventId)

  const arcActiveOrResolved =
    (game.activeArcs ?? []).some(a => a.type === 'ledare_crisis') ||
    (game.storylines ?? []).some(s => s.type === 'captain_rallied_team' && s.season === season)

  return speechQueuedOrResolved || arcActiveOrResolved
}
