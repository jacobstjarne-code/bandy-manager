import type { Fixture } from '../../../domain/entities/Fixture'
import type { ClubEra, SaveGame } from '../../../domain/entities/SaveGame'
import { BURNOUT_MARK, BURNOUT_MARK_RELAPSE } from '../../../domain/data/managerKaraktarText'
import { getFatigueState } from '../../../domain/services/decisionFatigueService'
import { logEvent } from '../../../domain/services/eventLedgerService'
import {
  BURNOUT_CLOSE_FIRED_KEY,
  BURNOUT_MARK_FIRED_KEY,
  BURNOUT_RELIEF_FIRED_KEY,
  deriveCoachNemesis,
  getBurnoutZone,
  isBurnoutRelapse,
  shouldShowBurnoutClose,
  shouldShowBurnoutMark,
  shouldShowBurnoutRelief,
  updateH2HRecord,
  updateManagerBurnout,
} from '../../../domain/services/managerProfileService'
import {
  BURNOUT_HELPER_PREFIX,
  BURNOUT_QUOTE_PREFIX,
  BURNOUT_RELAPSE_HELPER_PREFIX,
  BURNOUT_RELAPSE_QUOTE_PREFIX,
  buildBurnoutBeatLedgerEntry,
  pickBurnoutHelperIndex,
  pickBurnoutQuoteIndex,
  pickBurnoutRelapseHelperIndex,
  pickBurnoutRelapseQuoteIndex,
} from '../../../domain/services/burnoutReliefService'
import { logNarrativeBeat } from '../../../domain/services/narrativeLogService'
import { deriveUtfall } from '../../../domain/services/matchTypeAxes'
import { PEPTALK_QUOTE_PREFIX, selectPepTalk } from '../../../domain/services/pepTalkService'

export interface ManagerRoundContext {
  previousGame: SaveGame
  game: SaveGame
  justCompletedManagedFixture: Fixture | null | undefined
  nextMatchday: number
  newClubEra: ClubEra
  burnoutCeilingQueuedThisRound: boolean
  skipSideEffects: boolean
}

/**
 * Commits the manager-facing record of a completed round: decision fatigue,
 * burnout arc and recall, coach rivalry, shown pep talk and squad pulse.
 */
export function processManagerRoundState(context: ManagerRoundContext): SaveGame {
  const {
    previousGame,
    justCompletedManagedFixture,
    nextMatchday,
    newClubEra,
    burnoutCeilingQueuedThisRound,
    skipSideEffects,
  } = context
  let updatedGame = context.game
  if (skipSideEffects) return updatedGame

  const { meter, pressure } = getFatigueState(updatedGame)
  const newHistory = [...(updatedGame.fatigueHistory ?? []), meter].slice(-7)
  const prevStreak = updatedGame.fatigueHotStreak ?? 0
  const newStreak = pressure === 'hot' ? prevStreak + 1 : 0
  updatedGame = { ...updatedGame, fatigueHistory: newHistory, fatigueHotStreak: newStreak }

  // Manager burnout sampling + narrative log (burnout_peak, era_shift).
  const eraChanged = !!(previousGame.currentEra && previousGame.currentEra !== newClubEra)
  const updatedManagerProfile = updateManagerBurnout(updatedGame)
  if (updatedManagerProfile) {
    let enrichedProfile = updatedManagerProfile
    const newBurnoutZone = getBurnoutZone(enrichedProfile.burnoutScore)
    if (eraChanged) {
      const alreadyLogged = (enrichedProfile.diary ?? []).some(
        entry => entry.type === 'era_shift' && entry.season === previousGame.currentSeason,
      )
      if (!alreadyLogged) {
        enrichedProfile = {
          ...enrichedProfile,
          diary: [
            ...(enrichedProfile.diary ?? []),
            {
              season: previousGame.currentSeason,
              matchday: nextMatchday,
              type: 'era_shift' as const,
              text: newClubEra === 'establishment'
                ? 'Klubben reste sig under dig. Orten började tro igen.'
                : newClubEra === 'legacy'
                  ? 'Det blev mer än bandy under dig. Det blev ortens identitet.'
                  : 'Tunga tider kom. Det var nu det gällde.',
            },
          ],
        }
      }
    }

    // The profile stamp is the sole guard against offering the same ceiling
    // choice repeatedly while the burnout score remains at the ceiling.
    if (burnoutCeilingQueuedThisRound) {
      enrichedProfile = { ...enrichedProfile, burnoutCeilingChoiceOffered: true }
    }

    // The three arc beats are mutually exclusive in close → relief → mark order.
    const showBurnoutClose = shouldShowBurnoutClose(enrichedProfile)
    const showBurnoutRelief = !showBurnoutClose && shouldShowBurnoutRelief(enrichedProfile)
    const showBurnoutMark = !showBurnoutClose && !showBurnoutRelief &&
      shouldShowBurnoutMark(enrichedProfile) && newBurnoutZone !== 'frisk'
    if (showBurnoutClose || showBurnoutRelief || showBurnoutMark) {
      enrichedProfile = { ...enrichedProfile, lastShownBurnoutZone: newBurnoutZone }
    }

    updatedGame = { ...updatedGame, managerProfile: enrichedProfile }

    // Log the exact visible copy keys when the beat fires. The fixed fired key
    // lets presentation read the transition after lastShownBurnoutZone changed.
    if (showBurnoutMark) {
      const relapse = isBurnoutRelapse(
        enrichedProfile,
        updatedGame.currentSeason,
        updatedGame.eventLedger,
      )
      const relapseQuotePool = BURNOUT_MARK_RELAPSE.quotesByZone[newBurnoutZone]
      const relapseHelperPool = BURNOUT_MARK_RELAPSE.helpersByZone[newBurnoutZone]
      const useRelapse = relapse && relapseQuotePool.length > 0 && relapseHelperPool.length > 0

      const quoteIdx = useRelapse
        ? pickBurnoutRelapseQuoteIndex(updatedGame, newBurnoutZone, relapseQuotePool.length)
        : pickBurnoutQuoteIndex(
            updatedGame,
            newBurnoutZone,
            BURNOUT_MARK.quotesByZone[newBurnoutZone].length,
          )
      const helperIdx = useRelapse
        ? pickBurnoutRelapseHelperIndex(updatedGame, newBurnoutZone, relapseHelperPool.length)
        : pickBurnoutHelperIndex(
            updatedGame,
            newBurnoutZone,
            BURNOUT_MARK.helpersByZone[newBurnoutZone].length,
          )
      const quoteKey = useRelapse
        ? `${BURNOUT_RELAPSE_QUOTE_PREFIX}${newBurnoutZone}_${quoteIdx}`
        : `${BURNOUT_QUOTE_PREFIX}${newBurnoutZone}_${quoteIdx}`
      const helperKey = useRelapse
        ? `${BURNOUT_RELAPSE_HELPER_PREFIX}${newBurnoutZone}_${helperIdx}`
        : `${BURNOUT_HELPER_PREFIX}${newBurnoutZone}_${helperIdx}`

      let burnoutLog = logNarrativeBeat(
        updatedGame,
        quoteKey,
        updatedGame.currentSeason,
        nextMatchday,
      )
      burnoutLog = logNarrativeBeat(
        { ...updatedGame, narrativeBeatLog: burnoutLog },
        helperKey,
        updatedGame.currentSeason,
        nextMatchday,
      )
      burnoutLog = logNarrativeBeat(
        { ...updatedGame, narrativeBeatLog: burnoutLog },
        BURNOUT_MARK_FIRED_KEY,
        updatedGame.currentSeason,
        nextMatchday,
      )
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: burnoutLog,
        eventLedger: logEvent(
          updatedGame,
          buildBurnoutBeatLedgerEntry(
            'mark',
            newBurnoutZone,
            updatedGame.currentSeason,
            nextMatchday,
          ),
        ),
      }
    } else if (showBurnoutRelief) {
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: logNarrativeBeat(
          updatedGame,
          BURNOUT_RELIEF_FIRED_KEY,
          updatedGame.currentSeason,
          nextMatchday,
        ),
        eventLedger: logEvent(
          updatedGame,
          buildBurnoutBeatLedgerEntry(
            'relief',
            newBurnoutZone,
            updatedGame.currentSeason,
            nextMatchday,
          ),
        ),
      }
    } else if (showBurnoutClose) {
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: logNarrativeBeat(
          updatedGame,
          BURNOUT_CLOSE_FIRED_KEY,
          updatedGame.currentSeason,
          nextMatchday,
        ),
        eventLedger: logEvent(
          updatedGame,
          buildBurnoutBeatLedgerEntry(
            'close',
            newBurnoutZone,
            updatedGame.currentSeason,
            nextMatchday,
          ),
        ),
      }
    }
  }

  // H2H rivalry update after the managed match result, including the one-time
  // diary promotion when the opponent becomes a clear coach nemesis.
  if (
    justCompletedManagedFixture &&
    justCompletedManagedFixture.homeScore !== undefined &&
    justCompletedManagedFixture.awayScore !== undefined &&
    updatedGame.managerProfile?.coachRivalries?.length
  ) {
    const isHome = justCompletedManagedFixture.homeClubId === updatedGame.managedClubId
    const opponentClubId = isHome
      ? justCompletedManagedFixture.awayClubId
      : justCompletedManagedFixture.homeClubId
    const h2hOutcome = deriveUtfall(justCompletedManagedFixture, updatedGame.managedClubId)
    let profileWithH2H = updateH2HRecord(
      updatedGame.managerProfile,
      opponentClubId,
      h2hOutcome === 'vunnet' ? 1 : 0,
      h2hOutcome === 'forlorat' ? 1 : 0,
    )
    const existingRivalryLog = (profileWithH2H.diary ?? []).some(entry => entry.type === 'rivalry')
    if (!existingRivalryLog) {
      const nemesisCandidate = deriveCoachNemesis(
        (profileWithH2H.coachRivalries ?? []).filter(rivalry => rivalry.h2hLosses >= 3),
      )
      if (nemesisCandidate) {
        profileWithH2H = {
          ...profileWithH2H,
          diary: [
            ...(profileWithH2H.diary ?? []),
            {
              season: previousGame.currentSeason,
              matchday: nextMatchday,
              type: 'rivalry' as const,
              text: `${previousGame.clubs.find(club => club.id === nemesisCandidate.clubId)?.name ?? 'rivalen'} blev din nemesis.`,
            },
          ],
        }
      }
    }
    updatedGame = { ...updatedGame, managerProfile: profileWithH2H }
  }

  // Log the displayed pep-talk copy only when a match actually completed.
  if (justCompletedManagedFixture) {
    const pepSelection = selectPepTalk(updatedGame)
    if (pepSelection) {
      const pepKey = `${PEPTALK_QUOTE_PREFIX}${pepSelection.category}_${pepSelection.index}`
      updatedGame = {
        ...updatedGame,
        narrativeBeatLog: logNarrativeBeat(
          updatedGame,
          pepKey,
          updatedGame.currentSeason,
          nextMatchday,
        ),
      }
    }
  }

  // Squad pulse is sampled in the same post-round record as decision fatigue.
  const squadPlayers = updatedGame.players.filter(
    player => player.clubId === updatedGame.managedClubId,
  )
  if (squadPlayers.length > 0) {
    const avgFitness = Math.round(
      squadPlayers.reduce((sum, player) => sum + player.fitness, 0) / squadPlayers.length,
    )
    const avgMorale = Math.round(
      squadPlayers.reduce((sum, player) => sum + player.morale, 0) / squadPlayers.length,
    )
    const avgSeasonForm = Math.round(
      squadPlayers.reduce((sum, player) => sum + (player.seasonForm ?? 60), 0) / squadPlayers.length,
    )
    const avgSharpness = Math.round(
      squadPlayers.reduce((sum, player) => sum + player.sharpness, 0) / squadPlayers.length,
    )
    const injuryCount = squadPlayers.filter(player => player.isInjured).length
    const newTeamFitnessHistory = [
      ...(updatedGame.teamFitnessHistory ?? []),
      { matchday: nextMatchday, avgFitness, avgMorale, avgSeasonForm, avgSharpness, injuryCount },
    ].slice(-12)
    updatedGame = { ...updatedGame, teamFitnessHistory: newTeamFitnessHistory }
  }

  return updatedGame
}
