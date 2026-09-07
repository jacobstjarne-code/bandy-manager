import type { Player } from '../../../domain/entities/Player'
import type { InboxItem, SaveGame } from '../../../domain/entities/SaveGame'
import { InboxItemType } from '../../../domain/enums'
import { updateAllMarketValues } from '../../../domain/services/marketValueService'
import { updateLowMoraleDays, updatePlayerAvailability } from '../../../domain/services/playerAvailabilityService'

export function processMarketValues(
  game: SaveGame,
  players: Player[],
  nextMatchday: number,
): { players: Player[]; previousMarketValues: Record<string, number>; inboxItems: InboxItem[] } {
  const marketPlayers = updateAllMarketValues(updateLowMoraleDays(players), game.currentSeason)
  const availablePlayers = updatePlayerAvailability({ ...game, players: marketPlayers })
  const previous = game.previousMarketValues ?? {}
  const previousMarketValues: Record<string, number> = {}
  const inboxItems: InboxItem[] = []

  for (const player of availablePlayers.filter(candidate => candidate.clubId === game.managedClubId)) {
    const oldValue = previous[player.id] ?? player.marketValue
    previousMarketValues[player.id] = player.marketValue
    const delta = player.marketValue - oldValue
    const percentage = oldValue > 0 ? Math.abs(delta) / oldValue : 0
    if (percentage >= 0.15 && Math.abs(delta) >= 10_000) {
      const arrow = delta > 0 ? '↑' : '↓'
      const sign = delta > 0 ? '+' : ''
      inboxItems.push({
        id: `mv_${player.id}_${nextMatchday}`,
        date: game.currentDate,
        type: InboxItemType.PlayerDevelopment,
        title: `${arrow} ${player.firstName} ${player.lastName} — marknadsvärde ${sign}${Math.round(delta / 1000)} tkr`,
        body: `Nytt värde: ${Math.round(player.marketValue / 1000)} tkr (${sign}${Math.round(percentage * 100)}%)`,
        isRead: false,
      })
    }
  }

  return { players: availablePlayers, previousMarketValues, inboxItems }
}
