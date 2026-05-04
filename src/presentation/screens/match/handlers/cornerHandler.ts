/**
 * cornerHandler.ts — interaktiv hörn-resolution
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * Ingen logikändring — ren mekanisk split.
 */

import type { MatchStep } from '../../../../domain/services/matchSimulator'
import { MatchEventType } from '../../../../domain/enums'
import { PlayerPosition } from '../../../../domain/enums'
import { resolveCorner } from '../../../../domain/services/cornerInteractionService'
import type {
  CornerZone,
  CornerDelivery,
  CornerInteractionData,
  CornerOutcome,
} from '../../../../domain/services/cornerInteractionService'
import { mulberry32 } from '../../../../domain/utils/random'
import { playSound } from '../../../audio/soundEffects'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../domain/entities/Fixture'

export type CornerHandlerDeps = {
  activeCorner: CornerInteractionData | null
  currentStep: number
  fixture: Fixture
  game: SaveGame
  isFastForward: boolean
  isCommentaryMode: boolean
  interactiveCanScore: (homeScore: number, awayScore: number, managedIsHome: boolean) => boolean
  regenerateRemainderWithUpdatedScore: (newHome: number, newAway: number, atStep: number) => MatchStep[] | null
  setCornerOutcome: (o: CornerOutcome | null) => void
  setActiveCorner: (d: CornerInteractionData | null) => void
  setSteps: (fn: (prev: MatchStep[]) => MatchStep[]) => void
  setCurrentStep: (fn: (prev: number) => number) => void
  setHomeScoreFlash: (v: boolean) => void
  setAwayScoreFlash: (v: boolean) => void
}

export function handleCornerChoice(
  zone: CornerZone,
  delivery: CornerDelivery,
  deps: CornerHandlerDeps,
  inlineData?: CornerInteractionData,
) {
  const {
    activeCorner, currentStep, fixture, game,
    isFastForward, isCommentaryMode,
    interactiveCanScore, regenerateRemainderWithUpdatedScore,
    setCornerOutcome, setActiveCorner, setSteps, setCurrentStep,
    setHomeScoreFlash, setAwayScoreFlash,
  } = deps

  const cornerData = inlineData ?? activeCorner
  if (!cornerData) return

  const managedIsHome = fixture.homeClubId === game.managedClubId
  const allPlayers = game.players
  const attackers = managedIsHome
    ? allPlayers.filter(p => p.clubId === fixture.homeClubId)
    : allPlayers.filter(p => p.clubId === fixture.awayClubId)
  const defenders = managedIsHome
    ? allPlayers.filter(p => p.clubId === fixture.awayClubId)
    : allPlayers.filter(p => p.clubId === fixture.homeClubId)

  const cornerTaker = attackers.find(p => p.id === cornerData.cornerTakerId) ?? attackers[0]
  const rushers = cornerData.rusherIds
    .map(id => attackers.find(p => p.id === id))
    .filter(Boolean) as typeof attackers
  const gk = defenders.find(p => p.position === PlayerPosition.Goalkeeper)
  const defOutfield = defenders.filter(p => p.position !== PlayerPosition.Goalkeeper)

  const rand = mulberry32(Date.now())
  const sgMood = game.supporterGroup?.mood ?? 50
  const outcome = resolveCorner(
    { zone, delivery },
    cornerTaker,
    rushers,
    defOutfield,
    gk,
    cornerData.opponentPenaltyKill,
    cornerData.isHome,
    sgMood,
    rand,
  )

  setCornerOutcome(outcome)

  const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
  const minute = cornerData.minute

  setSteps(prev => {
    const updatedCurrent = prev.map((s, idx) => {
      if (idx !== currentStep) return s
      const event = outcome.type === 'goal'
        ? { type: MatchEventType.Goal, minute, clubId: managedClubId, playerId: outcome.scorerId,
            description: outcome.description, isCorner: true }
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
    setActiveCorner(null)
    setCornerOutcome(null)
    setCurrentStep(prev => prev + 1)
  }, isFastForward || isCommentaryMode ? 50 : 1500)
}
