export type PressChoice = 'allIn' | 'pushForward' | 'acceptResult'

export interface LastMinutePressData {
  minute: number
  scoreDiff: number      // negative (e.g. -1 means losing by 1)
  stepsLeft: number
  fatigueLevel: number   // 0-100 average team fatigue
}

export interface PressModifiers {
  goalThresholdBonus: number   // additive to goal probability
  foulProbBonus: number        // additive
  concedeProbBonus: number     // risk of conceding extra
}

export function getPressModifiers(choice: PressChoice): PressModifiers {
  if (choice === 'allIn') {
    return { goalThresholdBonus: 0.30, foulProbBonus: 0.25, concedeProbBonus: 0.15 }
  }
  if (choice === 'pushForward') {
    return { goalThresholdBonus: 0.15, foulProbBonus: 0.10, concedeProbBonus: 0.05 }
  }
  return { goalThresholdBonus: 0, foulProbBonus: 0, concedeProbBonus: 0 }
}
