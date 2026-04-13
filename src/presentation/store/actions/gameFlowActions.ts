import type { SaveGame, RoundSummaryData } from '../../../domain/entities/SaveGame'
import { resolveWeeklyDecision as resolveWeeklyDecisionFn } from '../../../domain/services/weeklyDecisionService'
import { advanceToNextEvent, type AdvanceResult } from '../../../application/useCases/advanceToNextEvent'
import { navigateTo } from '../../navigation/globalNavigate'
import { saveSaveGame } from '../../../infrastructure/persistence/saveGameStorage'

interface GetState {
  game: SaveGame | null
  roundSummary: RoundSummaryData | null
  lastAdvanceResult: AdvanceResult | null
  resolveEvent: (eventId: string, choiceId: string) => void
  setPlayerLineup: (startingPlayerIds: string[], benchPlayerIds: string[], captainPlayerId?: string) => { success: boolean; error?: string }
  advance: (suppressMatchNavigation?: boolean) => AdvanceResult | null
  resolveWeeklyDecision: (choice: 'A' | 'B') => void
}

type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null; roundSummary: RoundSummaryData | null; lastAdvanceResult: AdvanceResult | null }>) => void

export function gameFlowActions(get: Get, set: Set) {
  return {
    advance: (suppressMatchNavigation?: boolean): AdvanceResult | null => {
      const { game } = get()
      if (!game) return null

      const managedClubBefore = game.clubs.find(c => c.id === game.managedClubId)
      const financesBefore = managedClubBefore?.finances ?? 0
      const communityStandingBefore = game.communityStanding ?? 50
      const inboxCountBefore = game.inbox.length

      const result = advanceToNextEvent(game)

      const resultGame = result.game
      const managedClubAfter = resultGame.clubs.find(c => c.id === resultGame.managedClubId)
      const financesAfter = managedClubAfter?.finances ?? 0
      const communityStandingAfter = resultGame.communityStanding ?? 50
      const newInboxCount = Math.max(0, resultGame.inbox.length - inboxCountBefore)

      const managedFixture = result.roundPlayed !== null
        ? resultGame.fixtures.find(f =>
            (f.homeClubId === resultGame.managedClubId || f.awayClubId === resultGame.managedClubId) &&
            f.status === 'completed' &&
            f.matchday === result.roundPlayed
          )
        : undefined

      let matchResult: string | undefined
      let matchScorers: string[] | undefined

      if (managedFixture) {
        const homeClub = resultGame.clubs.find(c => c.id === managedFixture.homeClubId)
        const awayClub = resultGame.clubs.find(c => c.id === managedFixture.awayClubId)
        matchResult = `${homeClub?.shortName ?? homeClub?.name ?? '?'} ${managedFixture.homeScore}–${managedFixture.awayScore} ${awayClub?.shortName ?? awayClub?.name ?? '?'}`

        const managedPlayerIds = new Set(resultGame.players.filter(p => p.clubId === resultGame.managedClubId).map(p => p.id))
        const goalsByPlayer: Record<string, number> = {}
        const assistsByPlayer: Record<string, number> = {}
        for (const evt of managedFixture.events) {
          if (evt.playerId && managedPlayerIds.has(evt.playerId)) {
            if (evt.type === 'goal') goalsByPlayer[evt.playerId] = (goalsByPlayer[evt.playerId] ?? 0) + 1
            if (evt.type === 'assist') assistsByPlayer[evt.playerId] = (assistsByPlayer[evt.playerId] ?? 0) + 1
          }
        }
        const scorerStrs: string[] = []
        for (const [pid, goals] of Object.entries(goalsByPlayer)) {
          const p = resultGame.players.find(pl => pl.id === pid)
          if (!p) continue
          const assists = assistsByPlayer[pid] ?? 0
          const name = `${p.firstName} ${p.lastName.slice(0, 1)}.`
          if (assists > 0) scorerStrs.push(`${name} ${goals}+${assists}`)
          else scorerStrs.push(`${name} ${goals} mål`)
        }
        if (scorerStrs.length > 0) matchScorers = scorerStrs
      }

      const newlyInjuredPlayers = resultGame.players.filter(p =>
        p.clubId === resultGame.managedClubId &&
        p.isInjured &&
        !game.players.find(op => op.id === p.id)?.isInjured
      )
      const injuries = newlyInjuredPlayers.map(p => {
        const weeks = Math.ceil(p.injuryDaysRemaining / 7)
        return `${p.firstName} ${p.lastName} (${weeks} v.)`
      })

      let temperature: number | undefined
      if (managedFixture) {
        const mw = resultGame.matchWeathers.find(w => w.fixtureId === managedFixture.id)
          ?? game.matchWeathers.find(w => w.fixtureId === managedFixture.id)
        if (mw) temperature = mw.weather.temperature
      }

      const csDelta = communityStandingAfter - communityStandingBefore
      const communityStandingChanges: { reason: string; delta: number }[] = csDelta !== 0
        ? [{ reason: csDelta > 0 ? 'Positiv utveckling' : 'Negativ händelse', delta: csDelta }]
        : []

      const youthInbox = resultGame.inbox.find(i =>
        i.type === 'youthP17' && !game.inbox.find(o => o.id === i.id)
      )
      const youthMatchResult = youthInbox ? youthInbox.title.replace(/^📋 /, '') : undefined

      // Determine display round: use league round number, not matchday
      // For cup-only rounds, show the most recently completed league round + context
      const displayRound = (() => {
        if (managedFixture && !managedFixture.isCup) return managedFixture.roundNumber
        // No managed fixture or it was a cup match: show latest completed league round
        const lastLeagueRound = resultGame.fixtures
          .filter(f => f.status === 'completed' && !f.isCup && f.roundNumber <= 22)
          .reduce((max, f) => Math.max(max, f.roundNumber), 0)
        return lastLeagueRound || result.roundPlayed || 0
      })()

      const summary: RoundSummaryData = {
        round: displayRound,
        date: resultGame.currentDate,
        temperature,
        matchPlayed: !!managedFixture,
        matchResult,
        matchScorers,
        communityStandingBefore,
        communityStandingAfter,
        communityStandingChanges,
        financesBefore,
        financesAfter,
        attendance: managedFixture?.attendance,
        injuries,
        newInboxCount,
        youthMatchResult,
      }

      const gameToSave = { ...result.game, lastSavedAt: new Date().toISOString() }
      set({ game: gameToSave, lastAdvanceResult: result, roundSummary: summary })
      saveSaveGame(gameToSave).catch(e => console.warn('Autosave misslyckades:', e))

      const managerFired = result.game.managerFired
      if (managerFired) {
        navigateTo('/game/game-over', { replace: true })
      } else if (result.seasonEnded) {
        if (result.game.showSeasonSummary) {
          navigateTo('/game/season-summary', { replace: true })
        } else if (result.game.showBoardMeeting) {
          navigateTo('/game/board-meeting', { replace: true })
        } else if (result.game.showPreSeason) {
          navigateTo('/game/pre-season', { replace: true })
        }
      } else if (!suppressMatchNavigation) {
        if (result.game.showHalfTimeSummary) {
          navigateTo('/game/half-time-summary', { replace: true })
        } else if (result.game.showPlayoffIntro) {
          navigateTo('/game/playoff-intro', { replace: true })
        } else if (result.game.showQFSummary) {
          navigateTo('/game/qf-summary', { replace: true })
        } else if (result.hasManagedCupMatch) {
          // Managed club has an unplayed match (cup or league) — go to dashboard
          // so user sees between-round info and clicks "Spela omgång X" themselves
          navigateTo('/game/dashboard', { replace: true })
        } else if (summary.matchPlayed) {
          navigateTo('/game/review', { replace: true })
        } else {
          navigateTo('/game/dashboard', { replace: true })
        }
      }

      return result
    },

    clearBoardMeeting: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, showBoardMeeting: false } })
    },

    clearPreSeason: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, showPreSeason: false } })
    },

    clearHalfTimeSummary: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, showHalfTimeSummary: false } })
    },

    clearPlayoffIntro: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, showPlayoffIntro: false } })
    },

    clearQFSummary: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, showQFSummary: false } })
    },

    clearSeasonSummary: () => {
      const { game } = get()
      if (!game) return
      set({ game: { ...game, showSeasonSummary: false, showBoardMeeting: true } })
    },

    clearRoundSummary: () => set({ roundSummary: null }),

    resolveWeeklyDecision: (choice: 'A' | 'B') => {
      const { game } = get()
      if (!game || !game.pendingWeeklyDecision) return
      const decision = game.pendingWeeklyDecision
      const effects = resolveWeeklyDecisionFn(game, decision, choice)
      const resolvedKey = `${decision.id}_${game.currentSeason}`

      let updatedGame: SaveGame = {
        ...game,
        pendingWeeklyDecision: undefined,
        resolvedWeeklyDecisions: [...(game.resolvedWeeklyDecisions ?? []), resolvedKey],
      }

      // Apply effects
      for (const effect of effects) {
        if (effect.type === 'finances') {
          const club = updatedGame.clubs.find(c => c.id === updatedGame.managedClubId)
          if (club) {
            updatedGame = {
              ...updatedGame,
              clubs: updatedGame.clubs.map(c =>
                c.id === updatedGame.managedClubId
                  ? { ...c, finances: c.finances + effect.delta }
                  : c
              ),
            }
          }
        } else if (effect.type === 'supporterMood') {
          if (updatedGame.supporterGroup) {
            const newMood = Math.max(0, Math.min(100, updatedGame.supporterGroup.mood + effect.delta))
            updatedGame = { ...updatedGame, supporterGroup: { ...updatedGame.supporterGroup, mood: newMood } }
          }
        } else if (effect.type === 'communityStanding') {
          updatedGame = {
            ...updatedGame,
            communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + effect.delta)),
          }
        } else if (effect.type === 'boardPatience') {
          updatedGame = {
            ...updatedGame,
            boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + effect.delta)),
          }
        } else if (effect.type === 'cornerSkill') {
          updatedGame = {
            ...updatedGame,
            players: updatedGame.players.map(p =>
              p.id === effect.playerId
                ? { ...p, attributes: { ...p.attributes, cornerSkill: Math.min(100, p.attributes.cornerSkill + effect.delta) } }
                : p
            ),
          }
        } else if (effect.type === 'morale') {
          updatedGame = {
            ...updatedGame,
            players: updatedGame.players.map(p =>
              p.id === effect.playerId
                ? { ...p, form: Math.max(0, Math.min(100, p.form + effect.delta)) }
                : p
            ),
          }
        }
      }

      set({ game: updatedGame })
      saveSaveGame(updatedGame)
    },

    markScreenVisited: (screen: string) => {
      const { game } = get()
      if (!game) return
      const visited = game.visitedScreensThisRound ?? []
      if (!visited.includes(screen)) {
        set({ game: { ...game, visitedScreensThisRound: [...visited, screen] } })
      }
    },

    simulateRemainingStep: (): AdvanceResult | null => {
      const state = get()
      const { game, resolveEvent, setPlayerLineup, advance } = state
      if (!game) return null
      if ((game.pendingEvents?.length ?? 0) > 0) {
        const event = game.pendingEvents[0]
        const neutralChoice = event.choices.find(c =>
          c.id.includes('reject') || c.id.includes('decline') || c.id.includes('no') ||
          (c.effect as { type?: string })?.type === 'noOp'
        ) ?? event.choices[0]
        resolveEvent(event.id, neutralChoice.id)
        return { game: get().game!, roundPlayed: null, seasonEnded: false }
      }
      if (!game.managedClubPendingLineup) {
        const available = game.players
          .filter(p => p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining <= 0)
          .sort((a, b) => b.currentAbility - a.currentAbility)
        setPlayerLineup(
          available.slice(0, 11).map(p => p.id),
          available.slice(11, 16).map(p => p.id),
          available[0]?.id,
        )
      }
      return advance(true) // suppress navigation — caller handles it
    },
  }
}
