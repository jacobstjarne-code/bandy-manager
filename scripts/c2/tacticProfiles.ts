import type { Tactic } from '../../src/domain/entities/Club'
import type { FormationType } from '../../src/domain/entities/Formation'
import {
  CornerStrategy,
  PenaltyKillStyle,
  TacticAttackingFocus,
  TacticMentality,
  TacticPassingRisk,
  TacticTempo,
  TacticWidth,
} from '../../src/domain/enums'

export type C2TacticProfileId = 'balanced' | 'stacked'

/** Exakta profiler som DOM_KALIBRERING_AVSKED_HEROS C2 jämför. */
export function c2Tactic(profile: C2TacticProfileId): Tactic {
  if (profile === 'stacked') {
    return {
      mentality: TacticMentality.Offensive,
      tempo: TacticTempo.High,
      passingRisk: TacticPassingRisk.Direct,
      // Speltestets rapporterade paket var smalt. Detta är avsiktligt inte
      // den högsta möjliga offenseModifier-kombinationen i motorn.
      width: TacticWidth.Narrow,
      attackingFocus: TacticAttackingFocus.Wings,
      cornerStrategy: CornerStrategy.Aggressive,
      penaltyKillStyle: PenaltyKillStyle.Aggressive,
      formation: '523_hog',
    }
  }

  return {
    mentality: TacticMentality.Balanced,
    tempo: TacticTempo.Normal,
    passingRisk: TacticPassingRisk.Mixed,
    width: TacticWidth.Normal,
    attackingFocus: TacticAttackingFocus.Mixed,
    cornerStrategy: CornerStrategy.Standard,
    penaltyKillStyle: PenaltyKillStyle.Active,
    formation: '532_tvatoppar',
  }
}

export function c2Formation(profile: C2TacticProfileId): FormationType {
  return c2Tactic(profile).formation ?? '532_tvatoppar'
}
