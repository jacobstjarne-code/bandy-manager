import type { SaveGame } from '../../../entities/SaveGame'

/**
 * Returnerar true om det finns minst en skadad spelare i normallägets startelvans
 * positioner (19 spelare, de som förmodligen är i startelvan).
 *
 * "Skadad i startelvan" definieras som: spelare i managed club med isInjured === true
 * och vars form + rating gör att de sannolikt är i startelvan (topp 11 i form * rating).
 */
export function hasInjuredStarters(game: SaveGame): boolean {
  const squadPlayers = game.players.filter(
    p => p.clubId === game.managedClubId
  )
  if (squadPlayers.length === 0) return false

  const injured = squadPlayers.filter(p => p.isInjured)
  if (injured.length === 0) return false

  // Räkna med att de 11 bästa spelarna (form * currentAbility) är "starters"
  const sorted = [...squadPlayers].sort(
    (a, b) => (b.form * b.currentAbility) - (a.form * a.currentAbility)
  )
  const starters = new Set(sorted.slice(0, 11).map(p => p.id))

  return injured.some(p => starters.has(p.id))
}
