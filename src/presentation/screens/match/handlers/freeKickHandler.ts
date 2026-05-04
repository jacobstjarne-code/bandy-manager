/**
 * freeKickHandler.ts — interaktiv frislags-resolution
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * Ingen logikändring — ren mekanisk split.
 */

import type { MatchStep } from '../../../../domain/services/matchSimulator'
import { MatchEventType, PlayerPosition } from '../../../../domain/enums'
import { resolveFreeKick } from '../../../../domain/services/freeKickInteractionService'
import type {
  FreeKickChoice,
  FreeKickInteractionData,
  FreeKickOutcome,
} from '../../../../domain/services/freeKickInteractionService'
import { mulberry32 } from '../../../../domain/utils/random'
import { playSound } from '../../../audio/soundEffects'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../domain/entities/Fixture'

export type FreeKickHandlerDeps = {
  activeFreeKick: FreeKickInteractionData | null
  currentStep: number
  fixture: Fixture
  game: SaveGame
  isFastForward: boolean
  isCommentaryMode: boolean
  interactiveCanScore: (homeScore: number, awayScore: number, managedIsHome: boolean) => boolean
  regenerateRemainderWithUpdatedScore: (newHome: number, newAway: number, atStep: number) => MatchStep[] | null
  setFreeKickOutcome: (o: FreeKickOutcome | null) => void
  setActiveFreeKick: (d: FreeKickInteractionData | null) => void
  setSteps: (fn: (prev: MatchStep[]) => MatchStep[]) => void
  setCurrentStep: (fn: (prev: number) => number) => void
  setHomeScoreFlash: (v: boolean) => void
  setAwayScoreFlash: (v: boolean) => void
}

export function handleFreeKickChoice(
  choice: FreeKickChoice,
  deps: FreeKickHandlerDeps,
  inlineData?: FreeKickInteractionData,
) {
  const {
    activeFreeKick, currentStep, fixture, game,
    isFastForward, isCommentaryMode,
    interactiveCanScore, regenerateRemainderWithUpdatedScore,
    setFreeKickOutcome, setActiveFreeKick, setSteps, setCurrentStep,
    setHomeScoreFlash, setAwayScoreFlash,
  } = deps

  const fkData = inlineData ?? activeFreeKick
  if (!fkData) return

  const managedIsHome = fixture.homeClubId === game.managedClubId
  const allPlayers = game.players
  const defenders = managedIsHome
    ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
    : allPlayers.filter(p => p.clubId === fixture.homeClubId)
  const attackers = managedIsHome
    ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
    : allPlayers.filter(p => p.clubId === fixture.awayClubId)

  const kicker = attackers.find(p => p.id === fkData.kickerId) ?? attackers[0]
  const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)

  const rand = mulberry32(Date.now())
  const outcome = resolveFreeKick(choice, kicker, gk, fkData, rand)
  setFreeKickOutcome(outcome)

  const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
  const minute = fkData.minute

  setSteps(prev => {
    const updatedCurrent = prev.map((s, idx) => {
      if (idx !== currentStep) return s
      const event = outcome.type === 'goal'
        ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: fkData.kickerId,
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
    setActiveFreeKick(null)
    setFreeKickOutcome(null)
    setCurrentStep(prev => prev + 1)
  }, isFastForward || isCommentaryMode ? 50 : 1500)
}
