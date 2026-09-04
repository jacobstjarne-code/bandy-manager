import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'

/**
 * Den kanoniska sanningen för om en seniorspelare tillhör en klubbs
 * matchtrupp. `player.clubId` beskriver ägarskap, medan `squadPlayerIds`
 * beskriver den aktuella registrerade truppen. En utlånad spelare ägs
 * fortfarande av klubben men får inte tas ut i match.
 */
export function isPlayerInMatchSquad(
  player: Pick<Player, 'id' | 'clubId' | 'isOnLoan'>,
  club: Pick<Club, 'id' | 'squadPlayerIds'>,
): boolean {
  return player.clubId === club.id
    && club.squadPlayerIds.includes(player.id)
    && player.isOnLoan !== true
}
