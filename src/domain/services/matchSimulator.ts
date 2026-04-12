// Re-export everything so existing imports continue to work without changes.
export type {
  SimulateMatchInput,
  SimulateMatchResult,
  PenaltyRound,
  MatchStep,
  StepByStepInput,
  SecondHalfInput,
} from './matchUtils'
export { computeWeatherTacticInteraction } from './matchUtils'
export { simulateMatch } from './matchEngine'
export { simulateMatchStepByStep } from './matchStepByStep'
export { simulateSecondHalf } from './matchSecondHalf'
