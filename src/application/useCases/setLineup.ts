import type { SaveGame } from '../../domain/entities/SaveGame'
import type { TeamSelection } from '../../domain/entities/Fixture'

export interface SetLineupInput {
  game: SaveGame
  clubId: string
  startingPlayerIds: string[]
  benchPlayerIds: string[]
  captainPlayerId?: string
  autoSelected?: boolean
}

export type SetLineupResult =
  | { success: true; game: SaveGame }
  | { success: false; error: string }

export function setLineup(input: SetLineupInput): SetLineupResult {
  const { game, clubId, startingPlayerIds, benchPlayerIds, captainPlayerId, autoSelected } = input

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

    // A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md), ben 2: vilande/överbelastad
    // efter att ha förlorat sannolikhetskastet (playerStateProcessor.ts) om han
    // startade förra matchen under FATIGUE_AVAILABILITY_FLOOR. SKILD kontroll
    // från isInjured — han är inte skadad, texten får aldrig säga det.
    // SVENSK TEXT — CODE SKRIVER ALDRIG: '[Opus]' är en medveten placeholder,
    // inte färdig text. Opus skriver den riktiga raden.
    if ((player.restGamesRemaining ?? 0) > 0) {
      return {
        success: false,
        error: `${player.firstName} ${player.lastName} — [Opus]`,
      }
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
    ...(autoSelected !== undefined && { autoSelected }),
  }

  const updatedGame: SaveGame = {
    ...game,
    managedClubPendingLineup: lineup,
    lineupConfirmedThisRound: true,
  }

  return { success: true, game: updatedGame }
}
