import type { SaveGame } from '../../entities/SaveGame'

/**
 * 3.2 (SLUTTEST_KO.md, 2026-08-17) — kvalitativa zoner för boardPatience,
 * inte råtal. Trösklarna (50/30) matchar redan kalibrerade gränser i
 * PORTAL_BEATS' board_failure-beat (portalBeats.ts) — inte nya siffror,
 * återanvänder en befintlig, redan sedd severity-gräns.
 *
 * Verklig avsked-gräns är boardPatience <= 15 (seasonEndProcessor.ts) —
 * 'ultimatum' (< 30) ger en varningsmarginal innan tröskeln nås, inte en
 * exakt matchning mot avskedsgränsen.
 */
export type BoardPatienceZone = 'stabilt' | 'under_press' | 'ultimatum'

export interface BoardPatienceZoneInfo {
  zone: BoardPatienceZone
  /** Ordet Jacob gav i SLUTTEST_KO.md — inte Code-författad speltext. */
  label: 'Stabilt' | 'Under press' | 'Ultimatum'
}

export function getBoardPatienceZone(game: SaveGame): BoardPatienceZoneInfo {
  const patience = game.boardPatience ?? 70
  if (patience < 30) return { zone: 'ultimatum', label: 'Ultimatum' }
  if (patience < 50) return { zone: 'under_press', label: 'Under press' }
  return { zone: 'stabilt', label: 'Stabilt' }
}
