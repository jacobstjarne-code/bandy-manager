import type { ScoutReport } from '../entities/Scouting'
import type { TalentSearchResult } from '../entities/SaveGame'
import type { PlayerAttributes } from '../entities/Player'

export type VisibilityLevel = 'full' | 'evaluated' | 'scouted' | 'hidden'

export interface VisibleAttributes {
  level: VisibilityLevel
  attributes?: Partial<Record<keyof PlayerAttributes, number>>
  accuracy?: number
  estimatedCA?: number
  estimatedPA?: number
}

/**
 * Determines what attribute data is visible for a given player.
 *
 * - Own club → full visibility
 * - Has scout report → evaluated (attributes with ±accuracy)
 * - Found via talent search → scouted (only estimated CA)
 * - Otherwise → hidden (show "?" everywhere)
 */
export function getVisibleAttributes(
  playerId: string,
  playerClubId: string,
  myClubId: string,
  scoutReports: Record<string, ScoutReport>,
  talentResults: TalentSearchResult[],
): VisibleAttributes {
  // Own club → full visibility (managed daily)
  if (playerClubId === myClubId) {
    return { level: 'full' }
  }

  // Scout report exists → evaluated
  const report = scoutReports[playerId]
  if (report) {
    return {
      level: 'evaluated',
      attributes: report.revealedAttributes,
      accuracy: Math.round((100 - report.accuracy) / 10),
      estimatedCA: report.estimatedCA,
      estimatedPA: report.estimatedPA,
    }
  }

  // Found in talent search results → scouted (only CA estimate)
  for (const result of talentResults) {
    const suggestion = result.players.find(p => p.playerId === playerId)
    if (suggestion) {
      return {
        level: 'scouted',
        estimatedCA: suggestion.estimatedCA,
      }
    }
  }

  // No info
  return { level: 'hidden' }
}

/**
 * Format an attribute value for display.
 * Returns the number string or "?" based on visibility level.
 */
export function formatAttribute(
  value: number,
  visibility: VisibleAttributes,
  attrKey: keyof PlayerAttributes,
): string {
  if (visibility.level === 'full') return String(Math.round(value))
  if (visibility.level === 'evaluated' && visibility.attributes?.[attrKey] != null) {
    return String(visibility.attributes[attrKey])
  }
  return '?'
}

/**
 * CA display string based on visibility.
 */
export function formatCA(
  actualCA: number,
  visibility: VisibleAttributes,
): string {
  if (visibility.level === 'full') return String(Math.round(actualCA))
  if (visibility.level === 'evaluated' && visibility.estimatedCA != null) {
    return `~${visibility.estimatedCA}`
  }
  if (visibility.level === 'scouted' && visibility.estimatedCA != null) {
    return `~${visibility.estimatedCA}`
  }
  return '?'
}
