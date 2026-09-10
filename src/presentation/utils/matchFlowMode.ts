export type MatchFlowMode = 'full' | 'commentary' | 'quicksim' | 'silent'

/** Commentary is the uninterrupted radio-style mode; it must not open halftime decisions. */
export function shouldPauseAtHalftime(mode: MatchFlowMode): boolean {
  return mode !== 'commentary'
}
