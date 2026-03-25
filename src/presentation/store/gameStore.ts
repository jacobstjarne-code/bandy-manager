import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { SaveGame } from '../../domain/entities/SaveGame'
import type { Tactic } from '../../domain/entities/Club'
import type { TrainingFocus } from '../../domain/entities/Training'
import type { MatchEvent, TeamSelection, MatchReport } from '../../domain/entities/Fixture'
import { FixtureStatus, PlayoffStatus } from '../../domain/enums'
import { createNewGame } from '../../application/useCases/createNewGame'
import { startScoutAssignment } from '../../domain/services/scoutingService'
import { createOutgoingBid } from '../../domain/services/transferService'
import { resolveEvent as resolveEventFn } from '../../domain/services/eventService'
import { advanceToNextEvent, type AdvanceResult } from '../../application/useCases/advanceToNextEvent'
import { setLineup } from '../../application/useCases/setLineup'
import { calculateStandings } from '../../domain/services/standingsService'
import { loadSaveGame, listSaveGames, type SaveGameSummary } from '../../infrastructure/persistence/saveGameStorage'

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
  startScout: (playerId: string, clubId: string, sameRegion: boolean) => { success: boolean; error?: string }
  placeOutgoingBid: (playerId: string, offerAmount: number, offeredSalary: number, contractYears: number) => { success: boolean; error?: string }
  resolveEvent: (eventId: string, choiceId: string) => void
  saveLiveMatchResult: (fixtureId: string, homeScore: number, awayScore: number, events: MatchEvent[], report: MatchReport, homeLineup: TeamSelection, awayLineup: TeamSelection) => void
  clearGame: () => void
  listSaves: () => SaveGameSummary[]
  clearSeasonSummary: () => void
  clearBoardMeeting: () => void
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
        const game = loadSaveGame(id)
        if (!game) return false
        set({ game, lastAdvanceResult: null })
        return true
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

      saveLiveMatchResult: (fixtureId, homeScore, awayScore, events, report, homeLineup, awayLineup) => {
        const { game } = get()
        if (!game) return
        const updatedFixtures = game.fixtures.map(f =>
          f.id === fixtureId
            ? { ...f, homeScore, awayScore, events, report, homeLineup, awayLineup, status: FixtureStatus.Completed }
            : f
        )
        const completedFixtures = updatedFixtures.filter(f => f.status === FixtureStatus.Completed)
        const standings = calculateStandings(game.league.teamIds, completedFixtures)
        set({ game: { ...game, fixtures: updatedFixtures, lastCompletedFixtureId: fixtureId, standings } })
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

      startScout: (playerId, clubId, sameRegion) => {
        const { game } = get()
        if (!game) return { success: false, error: 'Inget spel laddat' }
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

      listSaves: () => listSaveGames(),

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
    .sort((a, b) => a.roundNumber - b.roundNumber)[0] ?? null
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
