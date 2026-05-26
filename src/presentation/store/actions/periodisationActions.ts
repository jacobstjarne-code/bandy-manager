import type { SaveGame } from '../../../domain/entities/SaveGame'

type PeriodisationMode = 'bygg' | 'hall' | 'toppa' | 'vila'

interface GetState { game: SaveGame | null }
type Get = () => GetState
type Set = (partial: Partial<{ game: SaveGame | null }>) => void

export function periodisationActions(get: Get, set: Set) {
  return {
    setPeriodisation: (mode: PeriodisationMode) => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          managedClubPeriodisation: mode,
          managedClubPeriodisationSince: game.currentMatchday,
        },
      })
    },

    setPlayerPeriodisationOverride: (playerId: string, mode: 'hall' | 'vila' | null) => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          players: game.players.map(p =>
            p.id === playerId ? { ...p, periodisationOverride: mode } : p
          ),
        },
      })
    },
  }
}
