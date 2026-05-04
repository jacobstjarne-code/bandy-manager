/**
 * counterHandler.ts — interaktiv kontringsresolution
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * Ingen logikändring — ren mekanisk split.
 */

import type { MatchStep } from '../../../../domain/services/matchSimulator'
import { MatchEventType, PlayerPosition } from '../../../../domain/enums'
import { resolveCounter } from '../../../../domain/services/counterAttackInteractionService'
import type {
  CounterChoice,
  CounterInteractionData,
  CounterOutcome,
} from '../../../../domain/services/counterAttackInteractionService'
import { mulberry32 } from '../../../../domain/utils/random'
import { playSound } from '../../../audio/soundEffects'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../domain/entities/Fixture'

export type CounterHandlerDeps = {
  activeCounter: CounterInteractionData | null
  currentStep: number
  fixture: Fixture
  game: SaveGame
  isFastForward: boolean
  isCommentaryMode: boolean
  interactiveCanScore: (homeScore: number, awayScore: number, managedIsHome: boolean) => boolean
  regenerateRemainderWithUpdatedScore: (newHome: number, newAway: number, atStep: number) => MatchStep[] | null
  setCounterOutcome: (o: CounterOutcome | null) => void
  setActiveCounter: (d: CounterInteractionData | null) => void
  setSteps: (fn: (prev: MatchStep[]) => MatchStep[]) => void
  setCurrentStep: (fn: (prev: number) => number) => void
  setHomeScoreFlash: (v: boolean) => void
  setAwayScoreFlash: (v: boolean) => void
}

export function handleCounterChoice(
  choice: CounterChoice,
  deps: CounterHandlerDeps,
  inlineData?: CounterInteractionData,
) {
  const {
    activeCounter, currentStep, fixture, game,
    isFastForward, isCommentaryMode,
    interactiveCanScore, regenerateRemainderWithUpdatedScore,
    setCounterOutcome, setActiveCounter, setSteps, setCurrentStep,
    setHomeScoreFlash, setAwayScoreFlash,
  } = deps

  const counterData = inlineData ?? activeCounter
  if (!counterData) return

  const managedIsHome = fixture.homeClubId === game.managedClubId
  const allPlayers = game.players
  const attackers = managedIsHome
    ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
    : allPlayers.filter(p => p.clubId === fixture.awayClubId)
  const defenders = managedIsHome
    ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
    : allPlayers.filter(p => p.clubId === fixture.homeClubId)

  const runner = attackers.find(p => p.id === counterData.runnerId) ?? attackers[0]
  const support = attackers.find(p => p.id === counterData.supportId) ?? attackers[1]
  const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)

  const rand = mulberry32(Date.now())
  const outcome = resolveCounter(choice, runner, support, gk, rand)
  setCounterOutcome(outcome)

  const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
  const minute = counterData.minute

  setSteps(prev => {
    const updatedCurrent = prev.map((s, idx) => {
      if (idx !== currentStep) return s
      const event = outcome.type === 'goal'
        ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: outcome.scorerId,
            description: outcome.description }
        : { type: MatchEventType.Save, minute, clubId: managedClubId,
            description: outcome.description }
      const capAllows = outcome.type !== 'goal' || interactiveCanScore(s.homeScore, s.awayScore, managedIsHome)
      const newHomeScore = capAllows && outcome.type === 'goal' && managedIsHome ? s.homeScore + 1 : s.homeScore
      const newAwayScore = capAllows && outcome.type === 'goal' && !managedIsHome ? s.awayScore + 1 : s.awayScore
      return {
        ...s, homeScore: newHomeScore, awayScore: newAwayScore,
        events: [...s.events, event as MatchStep['events'][0]],
        commentary: outcome.description,
        commentaryType: (capAllows && outcome.type === 'goal' ? 'goal' : 'situation') as MatchStep['commentaryType'],
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
    setActiveCounter(null)
    setCounterOutcome(null)
    setCurrentStep(prev => prev + 1)
  }, isFastForward || isCommentaryMode ? 50 : 1500)
}
