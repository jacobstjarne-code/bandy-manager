import type { Player } from '../entities/Player'
import type { PlayerAvailability } from '../entities/Player'
import type { SaveGame } from '../entities/SaveGame'

/**
 * Update availability flags for all non-managed players.
 * Called each matchday in roundProcessor.
 */
export function updatePlayerAvailability(game: SaveGame): Player[] {
  return game.players.map(p => {
    // Managed club players — never auto-flagged
    if (p.clubId === game.managedClubId) return p
    // Free agents — always available
    if (p.clubId === 'free_agent' || !p.clubId) return { ...p, availability: 'contract_expiring' as PlayerAvailability }

    // Priority order
    if (p.contractUntilSeason <= game.currentSeason) {
      return { ...p, availability: 'contract_expiring' as PlayerAvailability }
    }

    if (p.morale < 30 && (p.lowMoraleDays ?? 0) >= 3) {
      return { ...p, availability: 'unhappy' as PlayerAvailability }
    }

    if (isPositionOverstocked(game, p)) {
      return { ...p, availability: 'surplus' as PlayerAvailability }
    }

    const club = game.clubs.find(c => c.id === p.clubId)
    if (club && club.finances < -50000) {
      return { ...p, availability: 'financial' as PlayerAvailability }
    }

    return { ...p, availability: 'unavailable' as PlayerAvailability }
  })
}

function isPositionOverstocked(game: SaveGame, player: Player): boolean {
  const samePos = game.players.filter(
    p => p.clubId === player.clubId && p.position === player.position && !p.isInjured
  )
  if (samePos.length < 4) return false
  const sorted = [...samePos].sort((a, b) => a.currentAbility - b.currentAbility)
  return sorted[0].id === player.id || sorted[1]?.id === player.id
}

/**
 * Update lowMoraleDays counter. Called each matchday.
 */
export function updateLowMoraleDays(players: Player[]): Player[] {
  return players.map(p => ({
    ...p,
    lowMoraleDays: p.morale < 30 ? (p.lowMoraleDays ?? 0) + 1 : 0,
  }))
}

/**
 * Evaluate an incoming bid based on player availability.
 */
export function evaluateIncomingBid(
  player: Player,
  bidAmount: number,
): 'accept' | 'reject' | 'counter' {
  const mv = player.marketValue || 50000
  const ratio = bidAmount / mv

  switch (player.availability ?? 'unavailable') {
    case 'contract_expiring':
      if (ratio >= 0.3) return 'accept'
      if (ratio >= 0.15) return 'counter'
      return 'reject'
    case 'unhappy':
      if (ratio >= 0.5) return 'accept'
      if (ratio >= 0.3) return 'counter'
      return 'reject'
    case 'surplus':
      if (ratio >= 0.6) return 'accept'
      if (ratio >= 0.4) return 'counter'
      return 'reject'
    case 'financial':
      if (ratio >= 0.25) return 'accept'
      if (ratio >= 0.1) return 'counter'
      return 'reject'
    case 'unavailable':
    default:
      if (ratio >= 1.5) return 'accept'
      if (ratio >= 1.2) return 'counter'
      return 'reject'
  }
}
