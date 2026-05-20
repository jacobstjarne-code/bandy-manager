/**
 * anniversaryMemoryRowText.ts — Eko-label för ClubMemoryEventRow
 *
 * Opus levererar ~10 korta strängar.
 * Visas som liten label under event-texten: "Eko · S3 omg 8"
 * Bandysvensk understatement — subtil markering, inte utropstecken.
 */

import type { ActiveAnniversary } from '../services/clubMemoryService'

// Opus levererar
const ANNIVERSARY_ROW_LABELS: string[] = [
  // Opus levererar
]

const FALLBACK_LABEL = (anniversary: ActiveAnniversary): string =>
  `Eko · S${anniversary.originalSeason} omg ${anniversary.matchday}`

export function pickAnniversaryMemoryRowLabel(anniversary: ActiveAnniversary): string {
  if (ANNIVERSARY_ROW_LABELS.length === 0) return FALLBACK_LABEL(anniversary)
  const seed = anniversary.eventId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return ANNIVERSARY_ROW_LABELS[Math.abs(seed) % ANNIVERSARY_ROW_LABELS.length]
}
