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
// matchStepByStep and matchSecondHalf replaced by matchCore:
export { simulateFirstHalf as simulateMatchStepByStep, simulateSecondHalf, simulateFromMidMatch } from './matchCore'
export type { MatchCoreInput } from './matchCore'
