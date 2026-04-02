import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { SaveGame, RoundSummaryData, Sponsor } from '../../domain/entities/SaveGame'
import type { Tactic } from '../../domain/entities/Club'
import type { TrainingFocus } from '../../domain/entities/Training'
import type { MatchEvent, TeamSelection, MatchReport } from '../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus, InboxItemType, PlayerPosition } from '../../domain/enums'
import { createNewGame } from '../../application/useCases/createNewGame'
import { buildSeasonCalendar } from '../../domain/services/scheduleGenerator'
import { resolveEvent as resolveEventFn } from '../../domain/services/eventService'
import { type AdvanceResult } from '../../application/useCases/advanceToNextEvent'
import { setLineup } from '../../application/useCases/setLineup'
import { generateDetailedAnalysis } from '../../domain/services/opponentAnalysisService'
import { loadSaveGame, listSaveGames, deleteSaveGame, migrateLocalStorageIfNeeded } from '../../infrastructure/persistence/saveGameStorage'
import { applyFinanceChange } from '../../domain/services/economyService'

export interface SaveGameSummary {
  id: string
  managerName: string
  clubName: string
  season: number
  lastSavedAt: string
}
import { matchActions } from './actions/matchActions'
import { trainingActions } from './actions/trainingActions'
import { transferActions } from './actions/transferActions'
import { academyActions } from './actions/academyActions'
import { gameFlowActions } from './actions/gameFlowActions'

interface GameState {
  game: SaveGame | null
  isLoading: boolean
  lastAdvanceResult: AdvanceResult | null
  roundSummary: RoundSummaryData | null

  // Actions
  newGame: (managerName: string, clubId: string) => void
  loadGame: (id: string) => Promise<boolean>
  advance: (suppressMatchNavigation?: boolean) => AdvanceResult | null
  setPlayerLineup: (startingPlayerIds: string[], benchPlayerIds: string[], captainPlayerId?: string) => { success: boolean; error?: string }
  updateTactic: (tactic: Tactic) => void
  setTraining: (focus: TrainingFocus) => void
  markTutorialSeen: () => void
  markInboxRead: (itemId: string) => void
  markAllInboxRead: () => void
  startEvaluation: (playerId: string, clubId: string, sameRegion: boolean, hasPlayedAgainst?: boolean) => { success: boolean; error?: string }
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
  upgradeAcademy: () => { success: boolean; error?: string }
  upgradeFacilities: () => { success: boolean; error?: string }
  promoteYouthPlayer: (youthPlayerId: string) => { success: boolean; error?: string; timing?: 'early' | 'good' | 'late' }
  assignMentor: (seniorPlayerId: string, youthPlayerId: string) => { success: boolean; error?: string }
  removeMentor: (youthPlayerId: string) => void
  loanOutPlayer: (playerId: string, destinationClubName: string, rounds: number) => { success: boolean; error?: string }
  recallLoan: (playerId: string) => void
  startTrainingProject: (type: string, intensity: 'normal' | 'hard') => { success: boolean; error?: string }
  cancelTrainingProject: (projectId: string) => void
  seekSponsor: () => { success: boolean; sponsor?: Sponsor; error?: string }
  applyPressChoice: (moraleEffect: number, mediaQuote: string) => void
  simulateRemainingStep: () => AdvanceResult | null
  clearRoundSummary: () => void
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
      roundSummary: null,

      newGame: (managerName, clubId) => {
        // Delete all existing saves from IndexedDB before starting fresh
        const existing = listSaveGames()
        existing.forEach(s => deleteSaveGame(s.id).catch(() => {}))
        // Clear old localStorage data that may be filling quota
        try {
          localStorage.removeItem('bandy-game-store')
          const keys = Object.keys(localStorage).filter(k => k.startsWith('bandy_save_'))
          keys.forEach(k => localStorage.removeItem(k))
        } catch {}
        const game = createNewGame({ managerName, clubId })
        set({ game, lastAdvanceResult: null })
      },

      loadGame: async (id) => {
        const { game } = get()
        if (game !== null && game.id === id) return true
        const loaded = await loadSaveGame(id)
        if (!loaded) return false
        // Migrate old club names — strip suffixes like BK, IF, GoIF, IK, FK
        // Migrate Midfielder position → Half (merged positions)
        // Migrate matchday field — fixtures created before this field was added
        if (loaded.fixtures.some((f: any) => f.matchday === undefined)) {
          const CUP_MATCHDAYS: Record<number, number> = { 1: 3, 2: 8, 3: 13, 4: 19 }
          const calendar = buildSeasonCalendar(loaded.currentSeason)
          loaded.fixtures = loaded.fixtures.map((f: any) => {
            if (f.matchday !== undefined) return f
            if (f.isCup) {
              const match = loaded.cupBracket?.matches.find((m: any) => m.fixtureId === f.id)
              const cupRound = match?.round ?? (f.roundNumber >= 100 ? f.roundNumber - 100 : 1)
              return { ...f, matchday: CUP_MATCHDAYS[cupRound as number] ?? f.roundNumber }
            }
            if (f.roundNumber > 22) {
              // Playoff: matchday = roundNumber + 4 (liga 22 = matchday 26, so round 23 → matchday 27)
              return { ...f, matchday: f.roundNumber + 4 }
            }
            const slot = calendar.find((s: any) => s.type === 'league' && s.leagueRound === f.roundNumber)
            return { ...f, matchday: slot?.matchday ?? f.roundNumber }
          })
        }

        const migrated = {
          ...loaded,
          clubs: loaded.clubs.map((c: any) => {
            const tactic = c.activeTactic ?? {}
            // Migrate positionAssignments (playerId → FormationSlot) → lineupSlots (slotId → playerId)
            if (tactic.positionAssignments && !tactic.lineupSlots) {
              const lineupSlots: Record<string, string | null> = {}
              for (const [pid, slot] of Object.entries(tactic.positionAssignments as Record<string, { id: string }>)) {
                lineupSlots[slot.id] = pid
              }
              tactic.lineupSlots = lineupSlots
              delete tactic.positionAssignments
            }
            return {
              ...c,
              name: c.name.replace(/\s+(BK|IF|GoIF|IK|FK|SK)$/i, '').trim(),
              shortName: c.shortName.replace(/\s+(BK|IF|GoIF|IK|FK|SK)$/i, '').trim(),
              activeTactic: tactic,
            }
          }),
          players: loaded.players.map((p: any) =>
            (p.position as string) === 'midfielder'
              ? { ...p, position: PlayerPosition.Half }
              : p
          ),
        }
        set({ game: migrated, lastAdvanceResult: null })
        return true
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

      updateTactic: (tactic) => {
        const { game } = get()
        if (!game) return
        const updatedClubs = game.clubs.map(c =>
          c.id === game.managedClubId ? { ...c, activeTactic: tactic } : c
        )
        set({ game: { ...game, clubs: updatedClubs } })
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

      resolveEvent: (eventId, choiceId) => {
        const { game } = get()
        if (!game) return
        set({ game: resolveEventFn(game, eventId, choiceId) })
      },

      clearGame: () => set({ game: null, lastAdvanceResult: null, roundSummary: null }),
      listSaves: () => {
        return listSaveGames()
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
        const updatedClubs = applyFinanceChange(game.clubs, game.managedClubId, -15000)
        set({ game: { ...game, clubs: updatedClubs, scoutBudget: (game.scoutBudget ?? 10) + 5 } })
      },

      // Action slices — override inline implementations above
      ...matchActions(get, set),
      ...trainingActions(get, set),
      ...transferActions(get, set),
      ...academyActions(get, set),
      ...gameFlowActions(get, set),
    }),
    {
      name: 'bandy-game-store',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ game: state.game }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('persist rehydration misslyckades, återställer till tomt spel', error)
        }
        // One-time migration: move old localStorage Zustand save to IndexedDB
        if (!state?.game) {
          migrateLocalStorageIfNeeded().catch(() => {})
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
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
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
