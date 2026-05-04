/**
 * useMatchTimer.ts — steg-progressionshook (STEG 3)
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * I steg 3 bevaras nuvarande timer-logik (inkl. handler-timeouts).
 * Refactor B (steg 5) tar bort handler-timeouts.
 */

import { useEffect } from 'react'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { MatchEventType } from '../../../domain/enums'
import type { CornerInteractionData } from '../../../domain/services/cornerInteractionService'
import type { PenaltyInteractionData } from '../../../domain/services/penaltyInteractionService'
import type { CounterInteractionData } from '../../../domain/services/counterAttackInteractionService'
import type { FreeKickInteractionData } from '../../../domain/services/freeKickInteractionService'
import type { LastMinutePressData } from '../../../domain/services/lastMinutePressService'

export type MatchTimerDeps = {
  currentStep: number
  steps: MatchStep[]
  isPaused: boolean
  isFastForward: boolean
  isCommentaryMode: boolean
  matchDone: boolean
  isSmFinal: boolean
  isCupFinal: boolean
  activeCorner: CornerInteractionData | null
  activePenalty: PenaltyInteractionData | null
  activeCounter: CounterInteractionData | null
  activeFreeKick: FreeKickInteractionData | null
  activeLastMinutePress: LastMinutePressData | null
  lastMinutePressResolved: React.MutableRefObject<boolean>
  prevPhase: React.MutableRefObject<string | undefined>
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  setMatchDone: (v: boolean) => void
  setShowHalftime: (v: boolean) => void
  setShowOvertimeOverlay: (v: boolean) => void
  setShowPenaltiesOverlay: (v: boolean) => void
  setCeremonySlide: (v: number) => void
  setIsFastForward: (v: boolean) => void
  setActiveCorner: (d: CornerInteractionData | null) => void
  setCornerOutcome: (o: unknown) => void
  setActivePenalty: (d: PenaltyInteractionData | null) => void
  setPenaltyOutcome: (o: unknown) => void
  setActiveCounter: (d: CounterInteractionData | null) => void
  setCounterOutcome: (o: unknown) => void
  setActiveFreeKick: (d: FreeKickInteractionData | null) => void
  setFreeKickOutcome: (o: unknown) => void
  setActiveLastMinutePress: (d: LastMinutePressData | null) => void
  handleCornerChoiceAuto: (data: CornerInteractionData) => void
  handlePenaltyChoiceAuto: (data: PenaltyInteractionData) => void
  handleCounterChoiceAuto: (data: CounterInteractionData) => void
  handleFreeKickChoiceAuto: (data: FreeKickInteractionData) => void
}

export function useMatchTimer(deps: MatchTimerDeps) {
  const {
    currentStep, steps, isPaused, isFastForward, isCommentaryMode,
    isSmFinal, isCupFinal,
    activeCorner, activePenalty, activeCounter, activeFreeKick,
    activeLastMinutePress, lastMinutePressResolved, prevPhase,
    setCurrentStep, setMatchDone, setShowHalftime,
    setShowOvertimeOverlay, setShowPenaltiesOverlay, setCeremonySlide,
    setIsFastForward,
    setActiveCorner, setCornerOutcome,
    setActivePenalty, setPenaltyOutcome,
    setActiveCounter, setCounterOutcome,
    setActiveFreeKick, setFreeKickOutcome,
    setActiveLastMinutePress,
    handleCornerChoiceAuto, handlePenaltyChoiceAuto,
    handleCounterChoiceAuto, handleFreeKickChoiceAuto,
  } = deps

  useEffect(() => {
    if (currentStep < 0 || currentStep >= steps.length) return
    if (isPaused && !isFastForward) return

    const step = steps[currentStep]

    if (step.step === 30) {
      const hasSecondHalf = steps.length > 31
      if (!hasSecondHalf) {
        setIsFastForward(false)
        setShowHalftime(true)
        return
      }
    }

    if (step.cornerInteractionData && !activeCorner) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveCorner(step.cornerInteractionData)
        setCornerOutcome(null)
        return
      }
      handleCornerChoiceAuto(step.cornerInteractionData)
      return
    }

    if (step.penaltyInteractionData && !activePenalty) {
      if (!isFastForward && !isCommentaryMode) {
        setActivePenalty(step.penaltyInteractionData)
        setPenaltyOutcome(null)
        return
      }
      handlePenaltyChoiceAuto(step.penaltyInteractionData)
      return
    }

    if (step.counterInteractionData && !activeCounter) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveCounter(step.counterInteractionData)
        setCounterOutcome(null)
        return
      }
      handleCounterChoiceAuto(step.counterInteractionData)
      return
    }

    if (step.freeKickInteractionData && !activeFreeKick) {
      if (!isFastForward && !isCommentaryMode) {
        setActiveFreeKick(step.freeKickInteractionData)
        setFreeKickOutcome(null)
        return
      }
      handleFreeKickChoiceAuto(step.freeKickInteractionData)
      return
    }

    if (
      step.lastMinutePressData &&
      !isFastForward &&
      !activeLastMinutePress &&
      !lastMinutePressResolved.current &&
      !isCommentaryMode
    ) {
      setActiveLastMinutePress(step.lastMinutePressData)
      return
    }

    if (step.phase === 'overtime' && prevPhase.current !== 'overtime' && !isFastForward) {
      prevPhase.current = 'overtime'
      setShowOvertimeOverlay(true)
      return
    }
    if (step.phase === 'overtime') prevPhase.current = 'overtime'

    if (step.phase === 'penalties' && prevPhase.current !== 'penalties' && !isFastForward) {
      prevPhase.current = 'penalties'
      setShowPenaltiesOverlay(true)
      return
    }
    if (step.phase === 'penalties') prevPhase.current = 'penalties'

    const hasGoal = step.events.some(e => e.type === MatchEventType.Goal)
    const hasSave = step.events.some(e => e.type === MatchEventType.Save)
    const hasSuspension = step.events.some(e => e.type === MatchEventType.RedCard)
    const isLate = step.step >= 55
    const isTight = step.step >= 50 && step.homeScore === step.awayScore
    const baseDelay = isFastForward
      ? 50
      : step.phase === 'penalties'
      ? 2000
      : hasGoal
      ? 3500
      : hasSuspension
      ? 2000
      : hasSave
      ? 1800
      : isTight
      ? 1000
      : isLate
      ? 1100
      : step.intensity === 'high'
      ? 2200
      : step.intensity === 'medium'
      ? 1200
      : 1400
    const delay = isCommentaryMode && !isFastForward ? Math.round(baseDelay * 0.5) : baseDelay

    const timer = setTimeout(() => {
      if (currentStep + 1 >= steps.length) {
        setMatchDone(true)
        if (isSmFinal || isCupFinal) setCeremonySlide(1)
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [currentStep, isPaused, isFastForward, steps]) // eslint-disable-line react-hooks/exhaustive-deps
}
