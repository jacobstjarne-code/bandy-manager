import type { SaveGame } from '../../domain/entities/SaveGame'
import type { TeamSelection } from '../../domain/entities/Fixture'
import { PlayerPosition } from '../../domain/enums'

export interface SetLineupInput {
  game: SaveGame
  clubId: string
  startingPlayerIds: string[]
  benchPlayerIds: string[]
  captainPlayerId?: string
}

export type SetLineupResult =
  | { success: true; game: SaveGame }
  | { success: false; error: string }

export function setLineup(input: SetLineupInput): SetLineupResult {
  const { game, clubId, startingPlayerIds, benchPlayerIds, captainPlayerId } = input

  // 1. Must have exactly 11 starters
  if (startingPlayerIds.length !== 11) {
    return {
      success: false,
      error: 'Startelvan måste innehålla exakt 11 spelare.',
    }
  }

  // 2. Validate each starter
  for (const playerId of startingPlayerIds) {
    const player = game.players.find(p => p.id === playerId)

    if (!player) {
      return {
        success: false,
        error: `Spelare ${playerId} hittades inte.`,
      }
    }

    // Check club membership
    if (player.clubId !== clubId) {
      return {
        success: false,
        error: `Spelare ${playerId} tillhör inte klubben.`,
      }
    }

    // Check injury
    if (player.isInjured) {
      return {
        success: false,
        error: `${player.firstName} ${player.lastName} är skadad och kan inte spela.`,
      }
    }

    // Check suspension
    if (player.suspensionGamesRemaining > 0) {
      return {
        success: false,
        error: `${player.firstName} ${player.lastName} är avstängd.`,
      }
    }
  }

  // 3. At least one goalkeeper in starters
  const hasGoalkeeper = startingPlayerIds.some(id => {
    const player = game.players.find(p => p.id === id)
    return player?.position === PlayerPosition.Goalkeeper
  })

  if (!hasGoalkeeper) {
    return {
      success: false,
      error: 'Startelvan måste innehålla minst en målvakt.',
    }
  }

  const club = game.clubs.find(c => c.id === clubId)
  if (!club) {
    return {
      success: false,
      error: `Klubb ${clubId} hittades inte.`,
    }
  }

  const lineup: TeamSelection = {
    startingPlayerIds,
    benchPlayerIds,
    captainPlayerId,
    tactic: club.activeTactic,
  }

  const updatedGame: SaveGame = {
    ...game,
    managedClubPendingLineup: lineup,
  }

  return { success: true, game: updatedGame }
}
