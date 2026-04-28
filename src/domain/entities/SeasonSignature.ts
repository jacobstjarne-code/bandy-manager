export type SeasonSignatureId =
  | 'calm_season'
  | 'cold_winter'
  | 'scandal_season'
  | 'hot_transfer_market'
  | 'injury_curve'
  | 'dream_round'

export interface SeasonSignatureModifiers {
  /** Sannolikhet 0-1 för 3×30 vid extrem kyla. Default 0.05. */
  threeBy30Probability?: number

  /** Multiplikator på scandal-frekvens. Default 1.0. */
  scandalFrequencyMultiplier?: number

  /** Multiplikator på rumor-frekvens. Default 1.0. */
  rumorFrequencyMultiplier?: number

  /** Multiplikator på inkommande bud. Default 1.0. */
  incomingBidMultiplier?: number

  /** Multiplikator på skadefrekvens i mellansäsongen (omg 8-15). Default 1.0. */
  midSeasonInjuryMultiplier?: number

  /** Boost för underdog-team i matchEngine. 0 = ingen boost. */
  underdogBoost?: number
}

export interface SeasonSignature {
  id: SeasonSignatureId
  modifiers: SeasonSignatureModifiers
  startedSeason: number
  observedFacts: string[]
}

export const SEASON_SIGNATURE_DEFS: Record<SeasonSignatureId, SeasonSignatureModifiers> = {
  calm_season: {},
  cold_winter: {
    threeBy30Probability: 0.30,
  },
  scandal_season: {
    scandalFrequencyMultiplier: 1.5,
  },
  hot_transfer_market: {
    rumorFrequencyMultiplier: 1.5,
    incomingBidMultiplier: 1.3,
  },
  injury_curve: {
    midSeasonInjuryMultiplier: 1.25,
  },
  dream_round: {
    underdogBoost: 0.15,
  },
}
