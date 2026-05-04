/**
 * penaltyHandler.ts — interaktiv straff-resolution
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * Ingen logikändring — ren mekanisk split.
 */

import type { MatchStep } from '../../../../domain/services/matchSimulator'
import { MatchEventType } from '../../../../domain/enums'
import { resolvePenalty, resolveAIPenaltyKeeperDive } from '../../../../domain/services/penaltyInteractionService'
import type {
  PenaltyDirection,
  PenaltyHeight,
  PenaltyInteractionData,
  PenaltyOutcome,
} from '../../../../domain/services/penaltyInteractionService'
import { mulberry32 } from '../../../../domain/utils/random'
import { playSound } from '../../../audio/soundEffects'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../domain/entities/Fixture'

export type PenaltyHandlerDeps = {
  activePenalty: PenaltyInteractionData | null
  currentStep: number
  fixture: Fixture
  game: SaveGame
  isFastForward: boolean
  isCommentaryMode: boolean
  interactiveCanScore: (homeScore: number, awayScore: number, managedIsHome: boolean) => boolean
  regenerateRemainderWithUpdatedScore: (newHome: number, newAway: number, atStep: number) => MatchStep[] | null
  setPenaltyOutcome: (o: PenaltyOutcome | null) => void
  setActivePenalty: (d: PenaltyInteractionData | null) => void
  setSteps: (fn: (prev: MatchStep[]) => MatchStep[]) => void
  setCurrentStep: (fn: (prev: number) => number) => void
  setHomeScoreFlash: (v: boolean) => void
  setAwayScoreFlash: (v: boolean) => void
}

export function handlePenaltyChoice(
  dir: PenaltyDirection,
  height: PenaltyHeight,
  deps: PenaltyHandlerDeps,
  inlineData?: PenaltyInteractionData,
) {
  const {
    activePenalty, currentStep, fixture, game,
    isFastForward, isCommentaryMode,
    interactiveCanScore, regenerateRemainderWithUpdatedScore,
    setPenaltyOutcome, setActivePenalty, setSteps, setCurrentStep,
    setHomeScoreFlash, setAwayScoreFlash,
  } = deps

  const penData = inlineData ?? activePenalty
  if (!penData) return

  const managedIsHome = fixture.homeClubId === game.managedClubId
  const rand = mulberry32(Date.now())
  const keeperDive = resolveAIPenaltyKeeperDive('offensive', rand)
  const outcome = resolvePenalty(penData, dir, height, keeperDive, rand)
  setPenaltyOutcome(outcome)

  const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
  const oppClubId = managedIsHome ? fixture.awayClubId : fixture.homeClubId
  const shooterId = penData.shooterId
  const shooterLast = penData.shooterName.split(' ').slice(-1)[0]
  const keeperLast = penData.keeperName.split(' ').slice(-1)[0]
  const minute = penData.minute

  setSteps(prev => {
    const updatedCurrent = prev.map((s, idx) => {
      if (idx !== currentStep) return s
      const event = outcome.type === 'goal'
        ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: shooterId,
            description: `Straffmål av ${shooterLast}.`, isPenalty: true }
        : outcome.type === 'save'
        ? { type: MatchEventType.Save, minute, clubId: oppClubId,
            description: `Straffräddning! ${keeperLast} läser skottet.` }
        : { type: MatchEventType.Save, minute, clubId: managedClubId,
            description: `Straffen utanför! ${shooterLast} missade målet.` }
      const capAllows = outcome.type !== 'goal' || interactiveCanScore(s.homeScore, s.awayScore, managedIsHome)
      const newHomeScore = capAllows && outcome.type === 'goal' && managedIsHome ? s.homeScore + 1 : s.homeScore
      const newAwayScore = capAllows && outcome.type === 'goal' && !managedIsHome ? s.awayScore + 1 : s.awayScore
      return {
        ...s, homeScore: newHomeScore, awayScore: newAwayScore,
        events: [...s.events, event as MatchStep['events'][0]],
        commentary: event.description,
        commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'critical') as MatchStep['commentaryType'],
      }
    })
    if (outcome.type !== 'goal') return updatedCurrent
    const cur = updatedCurrent[currentStep]
    const newRemainder = regenerateRemainderWithUpdatedScore(cur.homeScore, cur.awayScore, currentStep)
    if (!newRemainder) return updatedCurrent
    return [...updatedCurrent.slice(0, currentStep + 1), ...newRemainder]
  })

  if (outcome.type === 'goal') {
    playSound('goal')
    playSound('goalHit')
    if (managedIsHome) {
      setHomeScoreFlash(true)
      setTimeout(() => setHomeScoreFlash(false), 2000)
    } else {
      setAwayScoreFlash(true)
      setTimeout(() => setAwayScoreFlash(false), 2000)
    }
  }

  setTimeout(() => {
    setActivePenalty(null)
    setPenaltyOutcome(null)
    setCurrentStep(prev => prev + 1)
  }, isFastForward || isCommentaryMode ? 50 : 1500)
}
