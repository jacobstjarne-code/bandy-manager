import type { SeasonPhase } from '../../data/seasonPhases'
import type { CardTier } from './dashboardCardBag'

interface TierBias {
  primary: number    // multiplikator på weight
  secondary: number
  minimal: number
}

const PHASE_BIAS: Record<SeasonPhase, TierBias> = {
  pre_season: { primary: 1.0, secondary: 1.0, minimal: 1.0 },
  early:      { primary: 1.0, secondary: 1.0, minimal: 1.0 },
  mid:        { primary: 1.0, secondary: 1.0, minimal: 1.0 },
  endgame:    { primary: 1.0, secondary: 0.6, minimal: 1.0 },
  playoff:    { primary: 1.0, secondary: 0.4, minimal: 1.0 },
}

export function applyPhaseBias(weight: number, tier: CardTier, phase: SeasonPhase): number {
  return weight * PHASE_BIAS[phase][tier]
}
