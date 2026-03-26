import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { SaveGame, TalentSearchRequest } from '../../domain/entities/SaveGame'
import type { Tactic } from '../../domain/entities/Club'
import type { TrainingFocus, TrainingProjectType } from '../../domain/entities/Training'
import { createTrainingProject } from '../../domain/services/trainingProjectService'
import type { MatchEvent, TeamSelection, MatchReport } from '../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus, InboxItemType } from '../../domain/enums'
import { createNewGame } from '../../application/useCases/createNewGame'
import { startScoutAssignment } from '../../domain/services/scoutingService'
import { createOutgoingBid } from '../../domain/services/transferService'
import { resolveEvent as resolveEventFn } from '../../domain/services/eventService'
import { updateCupBracketAfterRound } from '../../domain/services/cupService'
import { updateSeriesAfterMatch, advancePlayoffRound } from '../../domain/services/playoffService'
import { advanceToNextEvent, type AdvanceResult } from '../../application/useCases/advanceToNextEvent'
import { setLineup } from '../../application/useCases/setLineup'
import { calculateStandings } from '../../domain/services/standingsService'
export interface SaveGameSummary {
  id: string
  managerName: string
  clubName: string
  season: number
  lastSavedAt: string
}
import { generateDetailedAnalysis } from '../../domain/services/opponentAnalysisService'

interface GameState {
  game: SaveGame | null
  isLoading: boolean
  lastAdvanceResult: AdvanceResult | null

  // Actions
  newGame: (managerName: string, clubId: string) => void
  loadGame: (id: string) => boolean
  advance: () => AdvanceResult | null
  setPlayerLineup: (startingPlayerIds: string[], benchPlayerIds: string[], captainPlayerId?: string) => { success: boolean; error?: string }
  updateTactic: (tactic: Tactic) => void
  setTraining: (focus: TrainingFocus) => void
  markTutorialSeen: () => void
  markInboxRead: (itemId: string) => void
  markAllInboxRead: () => void
  startEvaluation: (playerId: string, clubId: string, sameRegion: boolean) => { success: boolean; error?: string }
  placeOutgoingBid: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => { success: boolean; error?: string }
  resolveEvent: (eventId: string, choiceId: string) => void
  saveLiveMatchResult: (fixtureId: string, homeScore: number, awayScore: number, events: MatchEvent[], report: MatchReport, homeLineup: TeamSelection, awayLineup: TeamSelection, overtimeResult?: 'home' | 'away', penaltyResult?: { home: number; away: number }) => void
  clearGame: () => void
  listSaves: () => SaveGameSummary[]
  clearSeasonSummary: () => void
  clearBoardMeeting: () => void
  requestDetailedAnalysis: (opponentClubId: string, fixtureId: string) => { success: boolean; error?: string }
  startTalentSearch: (position: string, maxAge: number, maxSalary: number, currentRound: number) => { success: boolean; error?: string }
  incrementDoctorQuestions: () => void
  talkToPlayer: (playerId: string, choice: 'encourage' | 'demand' | 'future', currentRound: number) => { moraleChange: number; formChange: number; feedback: string; inboxTriggered: boolean }
  clearPreSeason: () => void
  setBudgetPriority: (priority: 'squad' | 'balanced' | 'youth') => void
  setTransferBudget: (amount: number) => void
  buyScoutRounds: () => void
  activateCommunity: (key: string, level: string) => { success: boolean; error?: string }
  startTrainingProject: (type: string, intensity: 'normal' | 'hard') => { success: boolean; error?: string }
  cancelTrainingProject: (projectId: string) => void
}

const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const val = await idbGet<string>(name)
    return val ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name)
  },
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      game: null,
      isLoading: false,
      lastAdvanceResult: null,

      newGame: (managerName, clubId) => {
        // Clear old localStorage data that may be filling quota
        try {
          localStorage.removeItem('bandy-game-store')
          const keys = Object.keys(localStorage).filter(k => k.startsWith('bandy_save_'))
          keys.forEach(k => localStorage.removeItem(k))
        } catch {}
        const game = createNewGame({ managerName, clubId })
        set({ game, lastAdvanceResult: null })
      },

      loadGame: (id) => {
        // Game is persisted via IndexedDB through Zustand persist middleware.
        // If the already-rehydrated game matches the requested id, it's already loaded.
        const { game } = get()
        return game !== null && game.id === id
      },

      advance: () => {
        const { game } = get()
        if (!game) return null
        const result = advanceToNextEvent(game)
        set({ game: result.game, lastAdvanceResult: result })
        return result
      },

      setPlayerLineup: (startingPlayerIds, benchPlayerIds, captainPlayerId) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const result = setLineup({ game, clubId: game.managedClubId, startingPlayerIds, benchPlayerIds, captainPlayerId })
        if (result.success) {
          set({ game: result.game })
          return { success: true }
        }
        return { success: false, error: result.error }
      },

      saveLiveMatchResult: (fixtureId, homeScore, awayScore, events, report, homeLineup, awayLineup, overtimeResult, penaltyResult) => {
        const { game } = get()
        if (!game) return
        const updatedFixtures = game.fixtures.map(f =>
          f.id === fixtureId
            ? {
                ...f, homeScore, awayScore, events, report, homeLineup, awayLineup,
                status: FixtureStatus.Completed,
                wentToOvertime: (overtimeResult !== undefined || penaltyResult !== undefined) || undefined,
                wentToPenalties: penaltyResult !== undefined || undefined,
                overtimeResult,
                penaltyResult,
              }
            : f
        )
        const completedFixtures = updatedFixtures.filter(f => f.status === FixtureStatus.Completed && !f.isCup)
        const standings = calculateStandings(game.league.teamIds, completedFixtures)

        // If a cup fixture was just played live, update the bracket immediately so the
        // CupCard shows the correct result rather than waiting until advance() reaches round 103+
        const completedCupFixture = updatedFixtures.find(f => f.id === fixtureId && f.isCup)
        let updatedCupBracket = game.cupBracket ?? null
        if (completedCupFixture && updatedCupBracket && !updatedCupBracket.completed) {
          updatedCupBracket = updateCupBracketAfterRound(updatedCupBracket, [completedCupFixture])
        }

        // If a playoff fixture was just played live, update the bracket immediately
        // so ChampionScreen shows the correct result
        const completedFixture = updatedFixtures.find(f => f.id === fixtureId)!
        let updatedPlayoffBracket = game.playoffBracket
        if (completedFixture.isKnockout && !completedFixture.isCup && updatedPlayoffBracket) {
          // Update the relevant series
          updatedPlayoffBracket = {
            ...updatedPlayoffBracket,
            quarterFinals: updatedPlayoffBracket.quarterFinals.map(s =>
              s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completedFixture) : s
            ),
            semiFinals: updatedPlayoffBracket.semiFinals.map(s =>
              s.fixtures.includes(fixtureId) ? updateSeriesAfterMatch(s, completedFixture) : s
            ),
            final: updatedPlayoffBracket.final && updatedPlayoffBracket.final.fixtures.includes(fixtureId)
              ? updateSeriesAfterMatch(updatedPlayoffBracket.final, completedFixture)
              : updatedPlayoffBracket.final,
          }

          // Check if current phase is complete and advance
          const phaseComplete = (() => {
            if (updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals)
              return updatedPlayoffBracket.quarterFinals.every(s => s.winnerId !== null)
            if (updatedPlayoffBracket.status === PlayoffStatus.SemiFinals)
              return updatedPlayoffBracket.semiFinals.every(s => s.winnerId !== null)
            if (updatedPlayoffBracket.status === PlayoffStatus.Final)
              return updatedPlayoffBracket.final?.winnerId !== null
            return false
          })()

          if (phaseComplete) {
            const nextRoundStart = updatedPlayoffBracket.status === PlayoffStatus.QuarterFinals ? 26
              : updatedPlayoffBracket.status === PlayoffStatus.SemiFinals ? 29 : 32
            const { bracket: advancedBracket, newFixtures: newPlayoffFixtures } =
              advancePlayoffRound(updatedPlayoffBracket, game.currentSeason, nextRoundStart)
            updatedPlayoffBracket = advancedBracket
            // Add any new playoff fixtures (e.g. semi fixtures after all QFs decided)
            if (newPlayoffFixtures.length > 0) {
              updatedFixtures.push(...newPlayoffFixtures)
            }
          }
        }

        set({ game: { ...game, fixtures: updatedFixtures, lastCompletedFixtureId: fixtureId, standings, cupBracket: updatedCupBracket, playoffBracket: updatedPlayoffBracket } })
      },

      updateTactic: (tactic) => {
        const { game } = get()
        if (!game) return
        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, activeTactic: tactic } : c
        )
        set({ game: { ...game, clubs: updatedClubs } })
      },

      setTraining: (focus) => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, managedClubTraining: focus } })
      },

      markTutorialSeen: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, tutorialSeen: true } })
      },

      markInboxRead: (itemId) => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, inbox: game.inbox.map(i => i.id === itemId ? { ...i, isRead: true } : i) } })
      },

      markAllInboxRead: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, inbox: game.inbox.map(i => ({ ...i, isRead: true })) } })
      },

      startEvaluation: (playerId, clubId, sameRegion) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        if (game.activeTalentSearch) return { success: false, error: 'Spaning pågår — vänta tills den är klar' }
        if (game.activeScoutAssignment) return { success: false, error: 'Scout är redan utsänd' }
        if (game.scoutBudget <= 0) return { success: false, error: 'Scoutbudgeten är slut för säsongen' }
        const assignment = startScoutAssignment(playerId, clubId, game.currentDate, sameRegion)
        set({ game: { ...game, activeScoutAssignment: assignment, scoutBudget: game.scoutBudget - 1 } })
        return { success: true }
      },

      placeOutgoingBid: (playerId, offerAmount, offeredSalary, contractYears) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const currentRound = game.fixtures
          .filter(f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
          .filter(f => f.status === 'scheduled')
          .sort((a, b) => a.roundNumber - b.roundNumber)[0]?.roundNumber ?? 0
        const result = createOutgoingBid(game, playerId, offerAmount, offeredSalary, contractYears, currentRound)
        if (!result.success || !result.bid) return { success: false, error: result.error }
        set({ game: { ...game, transferBids: [...(game.transferBids ?? []), result.bid] } })
        return { success: true }
      },

      resolveEvent: (eventId, choiceId) => {
        const { game } = get()
        if (!game) return
        set({ game: resolveEventFn(game, eventId, choiceId) })
      },

      clearGame: () => set({ game: null, lastAdvanceResult: null }),

      listSaves: () => {
        const { game } = get()
        if (!game) return []
        const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? ''
        return [{ id: game.id, managerName: game.managerName, clubName, season: game.currentSeason, lastSavedAt: game.lastSavedAt }]
      },

      clearSeasonSummary: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, showSeasonSummary: false, showBoardMeeting: true } })
      },

      clearBoardMeeting: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, showBoardMeeting: false } })
      },

      requestDetailedAnalysis: (opponentClubId, fixtureId) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        if (game.scoutBudget <= 0) return { success: false, error: 'Scoutbudgeten är slut' }
        const opponent = game.clubs.find(c => c.id === opponentClubId)
        if (!opponent) return { success: false, error: 'Klubb hittades inte' }
        const opponentPlayers = game.players.filter(p => p.clubId === opponentClubId)
        const analysis = generateDetailedAnalysis(opponent, opponentPlayers, game.standings, game.fixtures, fixtureId)
        set({
          game: {
            ...game,
            scoutBudget: game.scoutBudget - 1,
            opponentAnalyses: { ...(game.opponentAnalyses ?? {}), [opponentClubId]: analysis },
          }
        })
        return { success: true }
      },

      startTalentSearch: (position, maxAge, maxSalary, currentRound) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        if (game.activeScoutAssignment) return { success: false, error: 'Utvärdering pågår — vänta tills den är klar' }
        if (game.activeTalentSearch) return { success: false, error: 'En spaning pågår redan' }
        if (game.scoutBudget < 2) return { success: false, error: 'Otillräcklig scoutbudget (kräver 2)' }
        const search: TalentSearchRequest = {
          id: `search_${game.currentSeason}_r${currentRound}`,
          position,
          maxAge,
          maxSalary,
          roundsRemaining: 2,
          createdRound: currentRound,
        }
        set({ game: { ...game, activeTalentSearch: search, scoutBudget: game.scoutBudget - 2 } })
        return { success: true }
      },

      incrementDoctorQuestions: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, doctorQuestionsUsed: (game.doctorQuestionsUsed ?? 0) + 1 } })
      },

      talkToPlayer: (playerId, choice, currentRound) => {
        const { game } = get()
        if (!game) return { moraleChange: 0, formChange: 0, feedback: '', inboxTriggered: false }
        const player = game.players.find(p => p.id === playerId)
        if (!player) return { moraleChange: 0, formChange: 0, feedback: '', inboxTriggered: false }

        let moraleChange = 0
        let formChange = 0
        let feedback = ''
        let inboxTriggered = false
        const name = player.firstName

        if (choice === 'encourage') {
          moraleChange = 5
          formChange = 2
          feedback = `${name}: "Tack, det värmer."`
        } else if (choice === 'demand') {
          if (player.form >= 50) {
            moraleChange = 3
            formChange = 5
            feedback = `${name}: "Jag ska bevisa att du har rätt."`
          } else {
            moraleChange = -5
            formChange = -2
            feedback = `${name}: "Jag vet inte om jag orkar mer..."`
          }
        } else if (choice === 'future') {
          const seasons = player.contractUntilSeason - game.currentSeason
          if (seasons > 2) {
            moraleChange = 3
            feedback = `${name}: "Jag trivs bra här, inga planer på att lämna."`
          } else if (seasons === 1) {
            moraleChange = -3
            feedback = `${name}: "Jag behöver veta vad som gäller. Kontraktet går ut snart."`
            inboxTriggered = true
          } else {
            moraleChange = -8
            feedback = `${name}: "Jag har inte hört ett ord om förlängning. Det säger mig allt."`
            inboxTriggered = true
          }
        }

        const updatedPlayers = game.players.map(p =>
          p.id === playerId
            ? {
                ...p,
                morale: Math.max(0, Math.min(100, p.morale + moraleChange)),
                form: Math.max(0, Math.min(100, p.form + formChange)),
              }
            : p
        )

        const updatedConversations = {
          ...(game.playerConversations ?? {}),
          [playerId]: currentRound,
        }

        let updatedInbox = game.inbox
        if (inboxTriggered) {
          updatedInbox = [
            {
              id: `inbox_talk_${playerId}_${Date.now()}`,
              date: game.currentDate,
              type: InboxItemType.ContractExpiring,
              title: `${player.firstName} ${player.lastName} vill ha besked`,
              body: `${player.firstName} ${player.lastName} har uttryckt oro kring sin framtid i klubben. Kontraktet löper ut om kort.`,
              relatedPlayerId: playerId,
              isRead: false,
            },
            ...updatedInbox,
          ]
        }

        set({ game: { ...game, players: updatedPlayers, playerConversations: updatedConversations, inbox: updatedInbox } })
        return { moraleChange, formChange, feedback, inboxTriggered }
      },

      clearPreSeason: () => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, showPreSeason: false } })
      },

      setBudgetPriority: (priority) => {
        const { game } = get()
        if (!game) return
        set({ game: { ...game, budgetPriority: priority } })
      },

      setTransferBudget: (amount: number) => {
        const { game } = get()
        if (!game) return
        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, transferBudget: Math.max(0, amount) } : c
        )
        set({ game: { ...game, clubs: updatedClubs } })
      },

      buyScoutRounds: () => {
        const { game } = get()
        if (!game) return
        const club = game.clubs.find(c => c.id === game.managedClubId)
        if (!club || club.finances < 15000) return
        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, finances: c.finances - 15000 } : c
        )
        set({ game: { ...game, clubs: updatedClubs, scoutBudget: (game.scoutBudget ?? 10) + 5 } })
      },

      activateCommunity: (key, level) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const club = game.clubs.find(c => c.id === game.managedClubId)
        if (!club) return { success: false, error: 'Ingen klubb hittad' }

        const costs: Record<string, Record<string, number>> = {
          kiosk:         { basic: 3000, upgraded: 8000 },
          lottery:       { basic: 1000, intensive: 5000 },
          bandyplay:     { active: 0 },
          functionaries: { active: 2000 },
          julmarknad:    { active: 2000 },
        }

        const cost = costs[key]?.[level] ?? 0
        if (club.finances < cost) {
          return { success: false, error: `Inte tillräckligt med pengar (kräver ${Math.round(cost / 1000)} tkr)` }
        }

        const ca = game.communityActivities ?? {
          kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false,
        }

        // Current league round (for time-restricted activities)
        const currentRound = Math.max(
          0,
          ...game.fixtures
            .filter(f => f.status === 'completed' && !f.isCup)
            .map(f => f.roundNumber),
        )

        if (key === 'kiosk' && !ca.functionaries && club.reputation < 50) {
          return { success: false, error: 'Kräver funktionärer eller reputation > 50' }
        }
        if (key === 'bandyplay' && club.reputation < 40) {
          return { success: false, error: 'Ingen kanal intresserad än (reputation < 40)' }
        }
        if (key === 'julmarknad' && (currentRound < 8 || currentRound > 12)) {
          return { success: false, error: 'Bara möjligt omgång 8–12 (december)' }
        }
        // Prevent downgrade
        if (key === 'kiosk' && ca.kiosk === 'upgraded') {
          return { success: false, error: 'Kiosken är redan uppgraderad' }
        }
        if (key === 'kiosk' && ca.kiosk === level) {
          return { success: false, error: 'Redan aktiv' }
        }
        if (key === 'lottery' && ca.lottery === level) {
          return { success: false, error: 'Redan aktiv' }
        }

        const updatedCA = key === 'bandyplay'
          ? { ...ca, bandyplay: true }
          : key === 'functionaries'
            ? { ...ca, functionaries: true }
            : key === 'julmarknad'
              ? { ...ca, julmarknad: true }
              : { ...ca, [key]: level }

        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, finances: c.finances - cost } : c
        )

        set({ game: { ...game, clubs: updatedClubs, communityActivities: updatedCA } })
        return { success: true }
      },

      startTrainingProject: (type, intensity) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
        const activeProjects = (game.trainingProjects ?? []).filter(p => p.status === 'active')
        if (activeProjects.length >= 3) {
          return { success: false, error: 'Max 3 aktiva projekt' }
        }
        if (activeProjects.some(p => p.type === type)) {
          return { success: false, error: 'Det projektet pågår redan' }
        }
        const newProject = createTrainingProject(type as TrainingProjectType, intensity)
        set({ game: { ...game, trainingProjects: [...(game.trainingProjects ?? []), newProject] } })
        return { success: true }
      },

      cancelTrainingProject: (projectId) => {
        const { game } = get()
        if (!game) return
        set({
          game: {
            ...game,
            trainingProjects: (game.trainingProjects ?? []).filter(p => p.id !== projectId),
          },
        })
      },
    }),
    {
      name: 'bandy-game-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ game: state.game }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('persist rehydration misslyckades, återställer till tomt spel', error)
        }
      },
    }
  )
)

// Convenience selectors
export const useManagedClub = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  return game.clubs.find(c => c.id === game.managedClubId) ?? null
}

export const useManagedPlayers = () => {
  const game = useGameStore(s => s.game)
  if (!game) return []
  return game.players.filter(p => p.clubId === game.managedClubId)
}

export const useCurrentStanding = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  return game.standings.find(s => s.clubId === game.managedClubId) ?? null
}

export const useNextFixture = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  return game.fixtures
    .filter(f =>
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
      f.status === 'scheduled'
    )
    .sort((a, b) => {
      const ra = a.isCup ? a.roundNumber - 100 : a.roundNumber
      const rb = b.isCup ? b.roundNumber - 100 : b.roundNumber
      return ra - rb
    })[0] ?? null
}

// Returns true if the managed club has a valid pending lineup (11 starters, no injured)
export const useHasPendingLineup = () => {
  const game = useGameStore(s => s.game)
  if (!game) return false
  const lineup = game.managedClubPendingLineup
  if (!lineup) return false
  const players = game.players
  const starters = lineup.startingPlayerIds.map(id => players.find(p => p.id === id)).filter(Boolean)
  if (starters.length !== 11) return false
  return !starters.some(p => p!.isInjured || p!.suspensionGamesRemaining > 0)
}

// Returns count of injured players in the pending lineup (for badge)
export const useInjuredInLineup = () => {
  const game = useGameStore(s => s.game)
  if (!game) return 0
  const lineup = game.managedClubPendingLineup
  if (!lineup) return 0
  const players = game.players
  return lineup.startingPlayerIds.filter(id => {
    const p = players.find(pl => pl.id === id)
    return p && (p.isInjured || p.suspensionGamesRemaining > 0)
  }).length
}

// Returns count of players with expiring contracts (within 1 season)
export const useExpiringContracts = () => {
  const game = useGameStore(s => s.game)
  if (!game) return 0
  return game.players.filter(p =>
    p.clubId === game.managedClubId && p.contractUntilSeason <= game.currentSeason + 1
  ).length
}

// Returns the last completed fixture for the managed club
export const useLastCompletedFixture = () => {
  const game = useGameStore(s => s.game)
  if (!game || !game.lastCompletedFixtureId) return null
  return game.fixtures.find(f => f.id === game.lastCompletedFixtureId) ?? null
}

// Returns the next scheduled fixture round number for managed club
export const useNextRoundNumber = () => {
  const game = useGameStore(s => s.game)
  if (!game) return null
  const next = game.fixtures
    .filter(f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && f.status === 'scheduled')
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]
  return next?.roundNumber ?? null
}

// Returns true when the player can press the advance button
export const useCanAdvance = () => {
  const game = useGameStore(s => s.game)
  if (!game) return false
  if (game.playoffBracket?.status === PlayoffStatus.Completed) return true
  const hasScheduled = game.fixtures.some(f => f.status === FixtureStatus.Scheduled)
  if (!hasScheduled) return true
  const hasUpcoming = game.fixtures.some(
    f => (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         f.status === FixtureStatus.Scheduled
  )
  if (!hasUpcoming) return true
  const lineup = game.managedClubPendingLineup
  if (!lineup) return false
  const starters = lineup.startingPlayerIds
    .map(id => game.players.find(p => p.id === id))
    .filter(Boolean)
  if (starters.length !== 11) return false
  return !starters.some(p => p!.isInjured || p!.suspensionGamesRemaining > 0)
}

// Returns count of unread inbox items
export const useUnreadInboxCount = () => {
  const game = useGameStore(s => s.game)
  if (!game) return 0
  return game.inbox.filter(i => !i.isRead).length
}

// Returns the current playoff bracket or null
export const usePlayoffInfo = () => {
  const game = useGameStore(s => s.game)
  if (!game || !game.playoffBracket) return null
  return game.playoffBracket
}
