import type { SaveGame } from '../../domain/entities/SaveGame'
import type { TeamSelection } from '../../domain/entities/Fixture'
import { isPlayerInMatchSquad } from '../../domain/services/matchSquadService'

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

  const club = game.clubs.find(c => c.id === clubId)
  if (!club) {
    return {
      success: false,
      error: `Klubb ${clubId} hittades inte.`,
    }
  }

  // 2. Validate every selected player. Bänken är lika mycket del av den
  // sparade matchtruppen som startelvan och får inte bära en utlånad spelare.
  for (const playerId of [...startingPlayerIds, ...benchPlayerIds]) {
    const player = game.players.find(p => p.id === playerId)

    if (!player) {
      return {
        success: false,
        error: `Spelare ${playerId} hittades inte.`,
      }
    }

    // Ägarskap räcker inte: spelaren måste också vara registrerad i den
    // aktuella matchtruppen och inte vara utlånad.
    if (!isPlayerInMatchSquad(player, club)) {
      return {
        success: false,
        error: player.clubId !== clubId
          ? `Spelare ${playerId} tillhör inte klubben.`
          : `${player.firstName} ${player.lastName} ingår inte i den tillgängliga matchtruppen.`,
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
    if ((player.restGamesRemaining ?? 0) > 0) {
      return {
        success: false,
        error: `${player.firstName} ${player.lastName} vilar efter förra matchen.`,
      }
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
