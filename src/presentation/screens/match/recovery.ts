/**
 * recovery.ts — TEMPORÄR recovery-vakt för TS-10
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * Tas bort i steg 7 efter 30-match-verifiering.
 *
 * Rotorsak (commit 9b7526a): race condition mellan timer-effekt och
 * handler-timeouts kan driva currentStep förbi steps.length.
 * Refactor B (steg 5) tar bort handler-timeouts och löser grundorsaken.
 */

import { useEffect } from 'react'

export function useRecoveryGuard(
  currentStep: number,
  stepsLength: number,
  matchDone: boolean,
  isSmFinal: boolean,
  isCupFinal: boolean,
  setMatchDone: (v: boolean) => void,
  setCeremonySlide: (v: number) => void,
) {
  useEffect(() => {
    if (currentStep >= stepsLength && stepsLength > 0 && !matchDone) {
      console.warn('[MatchLive] Recovery: currentStep passed steps.length, forcing matchDone')
      setMatchDone(true)
      if (isSmFinal || isCupFinal) setCeremonySlide(1)
    }
  }, [currentStep, stepsLength, matchDone]) // eslint-disable-line react-hooks/exhaustive-deps
}
