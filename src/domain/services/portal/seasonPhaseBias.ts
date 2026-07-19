import type { PortalPhase } from '../../data/seasonPhases'
import type { CardTier } from './dashboardCardBag'

interface TierBias {
  primary: number    // multiplikator på weight
  secondary: number
  minimal: number
}

/**
 * B1 (2026-07-19): PortalPhase ersätter SeasonPhase här — sju funktionärsfaser
 * + playoff/spectator, istf tre (early/mid/endgame). höststart/höst/annandagen
 * hålls neutrala (matchar gamla early/mid, som aldrig hade bias). vinter höjs
 * lätt på secondary — diagnosens poäng är att platsens/karaktärens röst (kafferum,
 * journalist) ska väga MER i djupvintern, inte mindre, trots att inget "stort"
 * händer matchmässigt. vinterkris/våroffensiv/slutspurt trappar ner secondary
 * stegvis mot playoffs 0.4 (matchar gamla endgames enda bias, nu uppdelad på tre
 * distinkta faser istf en platt "12+"-klump). playoff/spectator oförändrade.
 */
const PHASE_BIAS: Record<PortalPhase, TierBias> = {
  höststart:   { primary: 1.0, secondary: 1.0,  minimal: 1.0 },
  höst:        { primary: 1.0, secondary: 1.0,  minimal: 1.0 },
  annandagen:  { primary: 1.0, secondary: 1.0,  minimal: 1.0 },
  vinter:      { primary: 1.0, secondary: 1.15, minimal: 1.0 },
  vinterkris:  { primary: 1.3, secondary: 0.7,  minimal: 0.9 },
  våroffensiv: { primary: 1.0, secondary: 0.6,  minimal: 1.0 },
  slutspurt:   { primary: 1.0, secondary: 0.4,  minimal: 0.8 },
  playoff:     { primary: 1.0, secondary: 0.4,  minimal: 1.0 },
  spectator:   { primary: 1.0, secondary: 0.9,  minimal: 1.0 },
}

/**
 * Per-kort lyft/dämpning specifikt för vinterkris (samma mönster som
 * CHARACTER_BIAS i portalBuilder.ts, men keyad på fas istf rundkaraktär).
 * Krisen ska smalna av fokus till tabellkampen OCH till platsens reaktion på
 * den — inte till rutinadministration. Speglar hur losing_streak redan lyfter
 * coffee_room/journalist och dämpar board_objectives i CHARACTER_BIAS; samma
 * princip, men bundet till tabellplacering (vinterkris-villkoret) istf en
 * matchsvit.
 */
export const PHASE_CARD_BIAS: Partial<Record<PortalPhase, Record<string, number>>> = {
  vinterkris: {
    coffee_room_card: 1.3,
    journalist_card: 1.3,
    board_objectives: 1.4,
    tabell: 1.3,
    ekonomi: 0.6,
    watch_others: 0.5,
    season_signature_card: 0.5,
  },
}

export function applyPhaseBias(weight: number, tier: CardTier, phase: PortalPhase): number {
  return weight * PHASE_BIAS[phase][tier]
}

export function applyPhaseCardBias(weight: number, cardId: string, phase: PortalPhase): number {
  return weight * (PHASE_CARD_BIAS[phase]?.[cardId] ?? 1)
}
