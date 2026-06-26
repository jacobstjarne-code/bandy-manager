import type { SaveGame } from '../entities/SaveGame'
import { currentLeagueRound } from '../services/anslagService'

/**
 * Klubbpärmen — kapitel-registry med unlock-predikat mot riktig game-state.
 * Instruktion: docs/CODE_INSTRUKTION_TILLTRADET_KLUBBPARMEN_2026-06-26.md
 *
 * ⚠️ OPUS: kapiteltexten väntar. Alla sex `content`-fält är tomma (`[Opus]`-stub).
 * Fyll `paragraphs` (+ valfri `tumregel`) i bruksortens protokoll-röst — se mockens
 * Hörnor-kapitel + "Tumregel"-callout för ton. Code lägger ingen egen prosa här.
 *
 * Code äger registry + unlock-logik + rendering. Code äger INTE texten.
 */

export interface KlubbparmChapterContent {
  /** Brödtext-stycken i protokoll-röst (Opus fyller). Tom array = väntar text. */
  paragraphs: string[]
  /** Valfri "Tumregel"-callout sist i kapitlet. */
  tumregel?: string
}

export interface KlubbparmChapter {
  id: string
  label: string
  /** Predikat mot game-state — kapitlet växer fram när systemet låses upp. */
  isUnlocked: (game: SaveGame) => boolean
  content: KlubbparmChapterContent
}

const EMPTY: KlubbparmChapterContent = { paragraphs: [] }

export const KLUBBPARM_CHAPTERS: KlubbparmChapter[] = [
  // Hörnor + Matchen + Orten: alltid öppna (grunden, lärs i Tillträdet).
  { id: 'hornor',  label: 'Hörnor',  isUnlocked: () => true, content: EMPTY },
  { id: 'matchen', label: 'Matchen', isUnlocked: () => true, content: EMPTY },
  { id: 'orten',   label: 'Orten',   isUnlocked: () => true, content: EMPTY },
  // Klacken: när klack-systemet är aktivt (supporterGroup finns).
  { id: 'klacken', label: 'Klacken', isUnlocked: g => g.supporterGroup != null, content: EMPTY },
  // Ekonomi: när B1 Klubbutveckling är upplåst (facilityState-markören).
  { id: 'ekonomi', label: 'Ekonomi', isUnlocked: g => g.facilityState != null, content: EMPTY },
  // Slutspel: bracket finns ELLER grundserien är slut (omgång ≥ 22).
  { id: 'slutspel', label: 'Slutspel', isUnlocked: g => g.playoffBracket != null || currentLeagueRound(g) >= 22, content: EMPTY },
]

/** True tills Opus fyllt kapitlet — driver `[Opus]`-stubben i UI:t. */
export function chapterAwaitsText(ch: KlubbparmChapter): boolean {
  return ch.content.paragraphs.length === 0
}
