/**
 * anniversaryMarkText.ts — Textpool för PortalAnniversaryMark
 *
 * Opus levererar ~15 strängar per variant (outcome × yearsAgo-kontext).
 * Principen: ekot ska peka tillbaka på den specifika händelsen — konkret datum,
 * konkret namn, konkret scen. Inte "Det är ett år sedan något viktigt hände."
 */

import type { ActiveAnniversary } from '../services/clubMemoryService'
import type { SaveGame } from '../entities/SaveGame'

export interface AnniversaryMarkCopy {
  eyebrow: string
  quote: string
  helper: string
}

// Opus levererar
const ANNIVERSARY_MARK_WON_1Y: AnniversaryMarkCopy[] = [
  // Opus levererar
]

// Opus levererar
const ANNIVERSARY_MARK_LOST_1Y: AnniversaryMarkCopy[] = [
  // Opus levererar
]

// Opus levererar
const ANNIVERSARY_MARK_WON_MULTI: AnniversaryMarkCopy[] = [
  // Opus levererar
]

// Opus levererar
const ANNIVERSARY_MARK_LOST_MULTI: AnniversaryMarkCopy[] = [
  // Opus levererar
]

// Opus levererar
const ANNIVERSARY_MARK_NEUTRAL: AnniversaryMarkCopy[] = [
  // Opus levererar
]

const FALLBACK: AnniversaryMarkCopy = {
  eyebrow: '⬩ Eko ⬩',
  quote: '',
  helper: '',
}

export function pickAnniversaryMarkCopy(
  anniversary: ActiveAnniversary,
  _game: SaveGame,
): AnniversaryMarkCopy {
  const { outcome, yearsAgo, eventId } = anniversary
  // Seed baserat på eventId för konsekvent val
  const seed = eventId.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)

  let pool: AnniversaryMarkCopy[]
  if (outcome === 'won') {
    pool = yearsAgo === 1 ? ANNIVERSARY_MARK_WON_1Y : ANNIVERSARY_MARK_WON_MULTI
  } else if (outcome === 'lost') {
    pool = yearsAgo === 1 ? ANNIVERSARY_MARK_LOST_1Y : ANNIVERSARY_MARK_LOST_MULTI
  } else {
    pool = ANNIVERSARY_MARK_NEUTRAL
  }

  if (pool.length === 0) return FALLBACK
  return pool[Math.abs(seed) % pool.length]
}
