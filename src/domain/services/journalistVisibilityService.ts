import type { SaveGame } from '../entities/SaveGame'
import { getCurrentLeagueRound } from '../data/seasonPhases'

export type JournalistCardSeverity = 'cold' | 'warm' | 'hidden'

export function getJournalistCardSeverity(game: SaveGame): JournalistCardSeverity {
  const j = game.journalist
  if (!j) return 'hidden'
  if (j.relationship <= 30) return 'cold'
  if (j.relationship >= 70) return 'warm'
  return 'hidden'
}

export function shouldShowJournalistCard(game: SaveGame): boolean {
  return getJournalistCardSeverity(game) !== 'hidden'
}

export type RelationshipEventType = 'broken_under_20' | 'recovered_above_75' | null

export function detectRelationshipEvent(game: SaveGame): RelationshipEventType {
  const j = game.journalist
  if (!j) return null
  const last = j.lastTriggeredRelationship ?? 50
  if (j.relationship <= 20 && last > 20) return 'broken_under_20'
  if (j.relationship >= 75 && last < 75) return 'recovered_above_75'
  return null
}

/** Existing relationship-scene copy, shared with the frozen storyline memory. */
export function getJournalistRelationshipStoryText(
  game: Pick<SaveGame, 'journalist'>,
  eventType: Exclude<RelationshipEventType, null>,
): string | null {
  const journalist = game.journalist
  if (!journalist) return null
  if (eventType === 'broken_under_20') {
    return 'Relationen är bruten. Det krävs tid och ärlighet för att vända.'
  }
  const lastName = journalist.name.split(' ').pop() ?? journalist.name
  return `${lastName} är på er sida nu. Det håller så länge du är lika öppen tillbaka.`
}

/**
 * Freeze a relationship threshold as history only when the canonical detector
 * confirms a fresh crossing. The relationship itself remains the source of
 * all live tone/attendance/community effects; the storyline is not a parallel
 * relationship state.
 */
export function appendJournalistRelationshipStoryline(
  game: SaveGame,
  eventType: Exclude<RelationshipEventType, null>,
): SaveGame {
  if (detectRelationshipEvent(game) !== eventType) return game
  const displayText = getJournalistRelationshipStoryText(game, eventType)
  if (!displayText) return game

  const type = eventType === 'broken_under_20' ? 'journalist_feud' as const : 'journalist_redemption' as const
  const id = `story_${type}_${game.currentSeason}_${game.currentMatchday}`
  if ((game.storylines ?? []).some(story => story.id === id)) return game

  return {
    ...game,
    storylines: [
      ...(game.storylines ?? []),
      {
        id,
        type,
        season: game.currentSeason,
        matchday: getCurrentLeagueRound(game),
        clubId: game.managedClubId,
        description: displayText,
        displayText,
        resolved: true,
      },
    ],
  }
}

export function getJournalistAttendanceModifier(game: SaveGame): number {
  const j = game.journalist
  if (!j) return 1.0
  if (j.relationship >= 70) return 1.10
  if (j.relationship <= 30) return 0.95
  return 1.0
}

export function getJournalistCommunityModifier(game: SaveGame): number {
  const j = game.journalist
  if (!j) return 0
  if (j.relationship >= 70) return 1
  if (j.relationship <= 30) return -1
  return 0
}
