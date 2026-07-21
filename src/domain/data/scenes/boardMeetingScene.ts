/**
 * Styrelsemötet — trigger-villkor för intro-scenen vid säsongsstart från och
 * med säsong 2 (säsong 1 = ArrivalScene).
 *
 * 2026-07-21: getBoardMeetingBeats + BOARD_MEETING_EXPECTATION_LINE
 * raderade — superseterat förstautkast. Den levande scenen är
 * BoardMeetingScene.tsx (A/B/C-tillstånd, boardMeetingCopy.ts). De fyra
 * ceremoniella förväntansraderna migrerade oförändrade till
 * boardService.ts:s BOARD_EXPECTATION_CEREMONIAL innan raderingen —
 * inget textinnehåll gick förlorat.
 */

import type { SaveGame } from '../../entities/SaveGame'

export function shouldTriggerBoardMeeting(game: SaveGame): boolean {
  // Triggar vid säsongsstart från och med andra säsongen. Första säsongen
  // hanteras av ArrivalScene. currentSeason är ett kalenderår (2026, 2027, …),
  // inte ett ordningstal — "första säsongen" = inga avslutade säsonger än.
  if ((game.seasonSummaries?.length ?? 0) === 0) return false
  if ((game.shownScenes ?? []).includes('board_meeting')) return false
  // Guard: scenen är redan aktiv — undviker re-trigger om onComplete aldrig kallades
  if (game.pendingScene?.sceneId === 'board_meeting') return false
  if (game.currentMatchday !== 0) return false
  const anyMatchPlayed = game.fixtures.some(f => f.status === 'completed')
  if (anyMatchPlayed) return false
  return true
}
