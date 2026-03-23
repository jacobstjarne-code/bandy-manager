import type { TrainingType, TrainingIntensity } from '../enums'
import type { PlayerAttributes } from './Player'

export interface TrainingFocus {
  type: TrainingType
  intensity: TrainingIntensity
}

export interface TrainingEffects {
  attributeBoosts: Partial<Record<keyof PlayerAttributes, number>>
  fitnessChange: number
  injuryRiskModifier: number
  moraleEffect: number
  sharpnessEffect: number
}

export interface TrainingSession {
  season: number
  roundNumber: number
  focus: TrainingFocus
  effects: TrainingEffects
}
