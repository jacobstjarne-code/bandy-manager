import type { SaveGame } from '../entities/SaveGame'
import { getManagedClubCupStatus } from './cupService'
import { getManagedClubPlayoffStatus } from './playoffService'
import { PlayoffRound } from '../enums'
import type { Tavlingstyp } from './matchTypeAxes'

/**
 * GRANSKA DEL 4 (2026-08-11), steg 5 — Turneringsläge. Live-lucka ordern
 * beskrev: "jag förlorade en cupsemifinal 4–8 och därmed hela cupen, och
 * ordet 'cup' förekom inte en enda gång på skärmen... Elva sektioner om
 * matchen, noll om vad matchen betydde." Sex lägen, ur data som redan
 * räknas (cupService.getManagedClubCupStatus / playoffService.
 * getManagedClubPlayoffStatus) — ingen ny mekanik.
 */
export type TurneringslageMode =
  | 'ut_forstarunda' | 'ut_kvart' | 'ut_semi' | 'vidare_final' | 'vunnen_final' | 'forlorad_final'

/** Bara cup och slutspel har ett turneringsläge att rapportera. */
export function deriveTurneringslageMode(game: SaveGame, tavlingstyp: Tavlingstyp): TurneringslageMode | null {
  if (tavlingstyp === 'cup') {
    if (!game.cupBracket) return null
    const status = getManagedClubCupStatus(game.cupBracket, game.managedClubId)
    if (status.won) return 'vunnen_final'
    if (status.eliminated) {
      if (status.eliminatedInRound === 4) return 'forlorad_final'
      if (status.eliminatedInRound === 1) return 'ut_forstarunda'
      if (status.eliminatedInRound === 2) return 'ut_kvart'
      if (status.eliminatedInRound === 3) return 'ut_semi'
      return null
    }
    return status.isInFinal ? 'vidare_final' : null
  }

  if (tavlingstyp === 'slutspel') {
    if (!game.playoffBracket) return null
    const status = getManagedClubPlayoffStatus(game.playoffBracket, game.managedClubId)
    if (status.won) return 'vunnen_final'
    if (status.eliminated) {
      if (status.eliminatedInRound === PlayoffRound.Final) return 'forlorad_final'
      if (status.eliminatedInRound === PlayoffRound.QuarterFinal) return 'ut_kvart'
      if (status.eliminatedInRound === PlayoffRound.SemiFinal) return 'ut_semi'
      return null
    }
    return status.isInFinal ? 'vidare_final' : null
  }

  return null
}

/**
 * Texten är Opus's (CLAUDE.md: "Code skriver ALDRIG svensk speltext").
 * Sex rader rapporterade — se commit-meddelandet / SPRINT_GRANSKADEL4_STEG5_AUDIT.md.
 * '[Opus]' är den enda tillåtna platshållarsträngen, ingen utkastprosa.
 */
export const TURNERINGSLAGE_TEXT: Record<TurneringslageMode, string> = {
  ut_forstarunda: '[Opus]',
  ut_kvart: '[Opus]',
  ut_semi: '[Opus]',
  vidare_final: '[Opus]',
  vunnen_final: '[Opus]',
  forlorad_final: '[Opus]',
}
