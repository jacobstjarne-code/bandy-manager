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
 * Text från Opus (2026-08-12), levererad mot den rapporterade listan i
 * SPRINT_GRANSKADEL4_STEG345_AUDIT.md. Cup och slutspel har olika text för
 * samma läge (t.ex. "Cupen är över för den här gången" mot "Säsongen är
 * slut") — därför två separata kartor, inte en delad.
 */
const CUP_TEXT: Record<TurneringslageMode, string> = {
  ut_forstarunda: 'Ut i förstarundan. Cupen blev kort i år.',
  ut_kvart: 'Kvartsfinal, och inte längre. Cupen är över för den här gången.',
  ut_semi: 'En match från final. Cupen slutar här.',
  vidare_final: 'Final. Ni är en match från att ta hem den.',
  vunnen_final: 'Cupen är er.',
  forlorad_final: 'Final och silver. Det tar ett tag innan man ser det som något annat än en förlust.',
}

/** Slutspel har ingen förstarunda (PlayoffRound: kvartsfinal/semifinal/final). */
const SLUTSPEL_TEXT: Record<Exclude<TurneringslageMode, 'ut_forstarunda'>, string> = {
  ut_kvart: 'Kvartsfinal, och inte längre. Säsongen är slut.',
  ut_semi: 'En match från SM-final. Så nära kom ni.',
  vidare_final: 'SM-final. Studenternas väntar.',
  vunnen_final: 'Svenska mästare.',
  forlorad_final: 'SM-final och silver. Ingen tröst i dag. Kanske i mars.',
}

export function getTurneringslageText(mode: TurneringslageMode, tavlingstyp: Tavlingstyp): string {
  if (tavlingstyp === 'cup') return CUP_TEXT[mode]
  if (tavlingstyp === 'slutspel' && mode !== 'ut_forstarunda') return SLUTSPEL_TEXT[mode]
  // Strukturellt onåbart — deriveTurneringslageMode returnerar aldrig
  // 'ut_forstarunda' för slutspel eller något läge alls för liga/avsked.
  return '[Opus]'
}
