/**
 * useMatchGenerator.ts — generator-loop som producerar match-steg
 *
 * Extraherad ur MatchLiveScreen.tsx (steg 3, SPEC_LIVEMATCH_REFACTOR.md).
 * Ingen logikändring — ren mekanisk split.
 *
 * Ansvarar för:
 * - simulateMatchStepByStep vid matchstart
 * - regenerateRemainderWithUpdatedScore vid interaktiv mål
 * - simulateSecondHalf vid halvtid
 */

import { useRef } from 'react'
import { simulateMatchStepByStep, simulateFromMidMatch } from '../../../domain/services/matchSimulator'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { buildSeasonCalendar } from '../../../domain/services/scheduleGenerator'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture, TeamSelection } from '../../../domain/entities/Fixture'
import type { MatchWeather } from '../../../domain/entities/Weather'
import type { MatchPhaseContext } from '../../../domain/services/matchUtils'

type GeneratorSetup = {
  fixture: Fixture
  homeLineup: TeamSelection
  awayLineup: TeamSelection
  game: SaveGame
  homeClubName: string
  awayClubName: string
  matchWeather: MatchWeather | undefined
  matchPhase: MatchPhaseContext
  rivalry: ReturnType<typeof import('../../../domain/data/rivalries').getRivalry>
  isSmFinal: boolean
  isCupFinal: boolean
  markMatchStarted: (fixtureId: string, home: TeamSelection, away: TeamSelection) => void
  setSteps: (steps: MatchStep[]) => void
  setCurrentStep: (n: number) => void
}

export function useMatchGenerator(setup: GeneratorSetup) {
  const hasSimulated = useRef(false)

  function runInitialGeneration() {
    if (hasSimulated.current) return
    const {
      fixture, homeLineup, awayLineup, game,
      homeClubName, awayClubName, matchWeather,
      matchPhase, rivalry, isSmFinal, isCupFinal,
      markMatchStarted, setSteps, setCurrentStep,
    } = setup

    hasSimulated.current = true
    markMatchStarted(fixture.id, homeLineup, awayLineup)

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const homeClubObj = game.clubs.find(c => c.id === fixture.homeClubId)
    const seasonCal = buildSeasonCalendar(fixture.season)
    const liveSlot = seasonCal.find(s => s.matchday === fixture.matchday)

    const gen = simulateMatchStepByStep({
      fixture, homeLineup, awayLineup, homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      seed: Date.now(),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      isPlayoff: matchPhase !== 'regular',
      matchPhase,
      rivalry: rivalry ?? undefined,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
      managedIsHome: fixture.homeClubId === game.managedClubId,
      captainPlayerId: game.captainPlayerId,
      fanFavoritePlayerId: game.supporterGroup?.favoritePlayerId,
      supporterContext: game.supporterGroup ? {
        mood: game.supporterGroup.mood,
        members: game.supporterGroup.members,
        leaderName: game.supporterGroup.leader.name,
      } : undefined,
      ownScandalThisSeason: (game.scandalHistory ?? []).some(s =>
        s.season === game.currentSeason &&
        s.affectedClubId === game.managedClubId &&
        s.type !== 'small_absurdity'
      ),
      arenaName: homeClubObj?.arenaName,
      isAnnandagen: !!liveSlot?.isAnnandagen,
      isNyarsbandy: !!liveSlot?.isNyarsbandy,
      isCupFinalhelgen: !!liveSlot?.isCupFinalhelgen,
    })

    const allSteps: MatchStep[] = []
    for (const step of gen) allSteps.push(step)
    setSteps(allSteps)
    if (!isSmFinal && !isCupFinal) {
      setCurrentStep(0)
    }
  }

  function regenerateRemainderWithUpdatedScore(
    newHomeScore: number,
    newAwayScore: number,
    atStep: number,
    steps: MatchStep[],
  ): MatchStep[] | null {
    const { fixture, homeLineup, awayLineup, game, homeClubName, awayClubName, matchWeather, rivalry } = setup

    const currentStepData = steps[atStep]
    if (!currentStepData) return null

    const fromStep = atStep + 1
    const inSecondHalf = fromStep >= 31

    const homePlayers = game.players.filter(p => p.clubId === fixture.homeClubId)
    const awayPlayers = game.players.filter(p => p.clubId === fixture.awayClubId)
    const managedIsHome = fixture.homeClubId === game.managedClubId

    const gen = simulateFromMidMatch({
      fixture, homeLineup, awayLineup,
      homePlayers, awayPlayers,
      homeAdvantage: fixture.isNeutralVenue ? 0 : undefined,
      seed: Date.now(),
      weather: matchWeather?.weather,
      homeClubName: homeClubName || undefined,
      awayClubName: awayClubName || undefined,
      rivalry: rivalry ?? undefined,
      initialHomeScore: newHomeScore,
      initialAwayScore: newAwayScore,
      initialShotsHome: currentStepData.shotsHome,
      initialShotsAway: currentStepData.shotsAway,
      initialCornersHome: currentStepData.cornersHome,
      initialCornersAway: currentStepData.cornersAway,
      initialHomeSuspensions: currentStepData.activeSuspensions.homeCount,
      initialAwaySuspensions: currentStepData.activeSuspensions.awayCount,
      managedIsHome,
      storylines: game.storylines?.map(s => ({ playerId: s.playerId, type: s.type, displayText: s.displayText })),
    }, fromStep, inSecondHalf)

    const newRemainder: MatchStep[] = []
    for (const s of gen) newRemainder.push(s)
    return newRemainder
  }

  return { runInitialGeneration, regenerateRemainderWithUpdatedScore }
}
