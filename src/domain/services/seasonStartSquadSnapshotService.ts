import type { Player } from '../entities/Player'
import type { SeasonStartSquadSnapshot } from '../entities/SaveGame'

/**
 * Fryser exakt den hanterade trupp som finns när en säsong börjar.
 * Spelarens levande `clubId` får därefter ändras utan att kandidatgruppen
 * till årsbokens mostImproved skrivs om retroaktivt.
 */
export function buildSeasonStartSquadSnapshot(
  players: readonly Player[],
  clubId: string,
  season: number,
): SeasonStartSquadSnapshot {
  return {
    season,
    clubId,
    players: players
      .filter(player => player.clubId === clubId)
      .map(player => ({
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        startCA: player.currentAbility,
      }))
      .sort((a, b) => a.playerId.localeCompare(b.playerId)),
  }
}
