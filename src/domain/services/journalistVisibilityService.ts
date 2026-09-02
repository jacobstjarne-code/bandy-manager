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

type JournalistStoryContext = Pick<SaveGame, 'journalist'> &
  Partial<Pick<SaveGame, 'storylines' | 'currentSeason' | 'managedClubId'>>

export function detectRelationshipEvent(game: SaveGame): RelationshipEventType {
  const j = game.journalist
  if (!j) return null
  const last = j.lastTriggeredRelationship ?? 50
  if (j.relationship <= 20 && last > 20) return 'broken_under_20'
  if (j.relationship >= 75 && last < 75) return 'recovered_above_75'
  return null
}

function hasPreviousSeasonRelationshipStory(
  game: Partial<Pick<SaveGame, 'storylines' | 'currentSeason' | 'managedClubId'>>,
  type: 'journalist_feud' | 'journalist_redemption',
): boolean {
  const currentSeason = game.currentSeason
  const managedClubId = game.managedClubId
  if (currentSeason === undefined || !managedClubId) return false
  return (game.storylines ?? []).some(storyline =>
    storyline.type === type &&
    storyline.season < currentSeason &&
    storyline.clubId === managedClubId,
  )
}

/**
 * A fresh threshold crossing is a feud relapse only when permanent storyline
 * history proves that the same rupture happened in an earlier season.
 */
export function isJournalistFeudRelapse(
  game: Partial<Pick<SaveGame, 'storylines' | 'currentSeason' | 'managedClubId'>>,
): boolean {
  return hasPreviousSeasonRelationshipStory(game, 'journalist_feud')
}

/** Same historical read for a renewed reconciliation after an earlier season. */
export function isJournalistRedemptionRelapse(
  game: Partial<Pick<SaveGame, 'storylines' | 'currentSeason' | 'managedClubId'>>,
): boolean {
  return hasPreviousSeasonRelationshipStory(game, 'journalist_redemption')
}

/** Existing relationship-scene copy, shared with the frozen storyline memory. */
export function getJournalistRelationshipStoryText(
  game: JournalistStoryContext,
  eventType: Exclude<RelationshipEventType, null>,
): string | null {
  const journalist = game.journalist
  if (!journalist) return null
  const lastName = journalist.name.split(' ').pop() ?? journalist.name
  if (eventType === 'broken_under_20') {
    if (isJournalistFeudRelapse(game)) {
      return `Bruten igen. ${lastName} har sett det förr, och den här gången sitter det djupare.`
    }
    return 'Relationen är bruten. Det krävs tid och ärlighet för att vända.'
  }
  if (isJournalistRedemptionRelapse(game)) {
    return `${lastName} kommer tillbaka, men inte hela vägen. En relation som brustit en gång läks aldrig riktigt blint igen.`
  }
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
