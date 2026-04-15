// matchSecondHalf.ts — thin wrapper around matchStepByStep.
// The single simulation engine lives in matchStepByStep.ts.
// SecondHalfInput extends StepByStepInput with initial state fields,
// which matchStepByStep reads via input.startStep / input.initialHomeScore etc.
import { simulateMatchStepByStep } from './matchStepByStep'
import type { MatchStep, SecondHalfInput } from './matchUtils'

export function* simulateSecondHalf(input: SecondHalfInput): Generator<MatchStep> {
  yield* simulateMatchStepByStep({ ...input, startStep: 31 })
}
