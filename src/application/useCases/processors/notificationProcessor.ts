import type { EventLedgerEntry } from '../../../domain/entities/Narrative'
import type { Moment } from '../../../domain/entities/Moment'
import type { Player } from '../../../domain/entities/Player'
import type { InboxItem, RippleChain, SaveGame } from '../../../domain/entities/SaveGame'
import {
  createInjuryItem,
  createPlayThroughAftermathItem,
  createRecoveryItem,
  createSuspensionItem,
} from '../../../domain/services/inboxService'
import { buildSystemRippleLedgerEntry } from '../../../domain/services/orsakVerkanService'
import { applyRipples, describeRippleChain } from '../../../domain/services/rippleEffectService'

interface RoundNotificationsInput {
  game: SaveGame
  updatedPlayers: Player[]
  injuredBeforeRound: Set<string>
  newlyInjured: Array<{ player: Player; days: number }>
  newlySuspended: Array<{ player: Player }>
  playThroughResolutions: Array<{ player: Player; relapsed: boolean; aftermathLine: string }>
  nextMatchday: number
  initialLedgerEntries: EventLedgerEntry[]
}

export interface RoundNotificationsResult {
  gameAfterRipples: SaveGame
  rippleChains: RippleChain[]
  ledgerEntries: EventLedgerEntry[]
  inboxItems: InboxItem[]
  moments: Moment[]
}

export function processRoundNotifications(input: RoundNotificationsInput): RoundNotificationsResult {
  const { game, updatedPlayers, injuredBeforeRound, newlyInjured, newlySuspended, playThroughResolutions, nextMatchday } = input
  let gameAfterRipples = game
  const rippleChains: RippleChain[] = []
  const ledgerEntries = [...input.initialLedgerEntries]
  const inboxItems: InboxItem[] = []
  const moments: Moment[] = []

  for (const { player, days } of newlyInjured) {
    if (player.clubId !== game.managedClubId) continue
    inboxItems.push(createInjuryItem(player, days, game.currentDate, game.doctor))
    const before = gameAfterRipples
    gameAfterRipples = applyRipples(gameAfterRipples, { type: 'star_injured', playerId: player.id })
    const chain = describeRippleChain(
      before,
      gameAfterRipples,
      'star_injured',
      `${player.firstName} ${player.lastName}`,
      nextMatchday,
      game.currentSeason,
    )
    rippleChains.push(chain)
    const ledgerEntry = buildSystemRippleLedgerEntry(chain, 'star_injury', { kind: 'player', id: player.id })
    if (ledgerEntry) ledgerEntries.push(ledgerEntry)
    if (player.currentAbility >= 65) {
      moments.push({
        id: `moment_injury_${player.id}_${nextMatchday}`,
        source: 'star_injury',
        matchday: nextMatchday,
        season: game.currentSeason,
        title: `${player.firstName} ${player.lastName} är borta`,
        body: `Sidan han spelade på blir tunnare. Klacken vet det. ${days} dagar minst.`,
        subjectPlayerId: player.id,
      })
    }
  }

  for (const { player } of newlySuspended) {
    if (player.clubId === game.managedClubId) {
      inboxItems.push(createSuspensionItem(player, player.suspensionGamesRemaining, game.currentDate, game.currentSeason))
    }
  }
  for (const player of updatedPlayers) {
    if (player.clubId === game.managedClubId && injuredBeforeRound.has(player.id) && !player.isInjured) {
      inboxItems.push(createRecoveryItem(player, game.currentDate))
    }
  }
  for (const { player, aftermathLine } of playThroughResolutions) {
    if (player.clubId === game.managedClubId) {
      inboxItems.push(createPlayThroughAftermathItem(player, aftermathLine, game.currentDate))
    }
  }

  return { gameAfterRipples, rippleChains, ledgerEntries, inboxItems, moments }
}
