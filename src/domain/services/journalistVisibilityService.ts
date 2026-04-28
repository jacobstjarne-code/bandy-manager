import type { SaveGame } from '../entities/SaveGame'

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
