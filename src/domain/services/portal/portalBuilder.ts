import type { SaveGame } from '../../entities/SaveGame'
import type { DashboardCard } from './dashboardCardBag'
import { CARD_BAG } from './dashboardCardBag'

export interface PortalLayout {
  primary: DashboardCard           // alltid exakt 1
  secondary: DashboardCard[]       // 0-3
  minimal: DashboardCard[]         // 0-4
}

/**
 * Beräknar vilka kort som ska renderas just nu baserat på game state.
 *
 * Algoritm:
 *   1. Filtrera bagen — bara kort vars triggers alla returnerar true
 *   2. Gruppera per tier
 *   3. Sortera per weight (högst först)
 *   4. Vid tie i weight, använd seed för deterministisk ordning
 *   5. Plocka ut topp N från varje tier
 */
export function buildPortal(game: SaveGame, seed: number): PortalLayout {
  // Steg 1: Filtrera bagen — bara kort vars triggers alla returnerar true
  const eligible = CARD_BAG.filter(card =>
    card.triggers.every(trigger => trigger(game))
  )

  // Steg 2: Gruppera per tier, sortera per weight (högst först)
  // Vid tie i weight: seedad deterministisk ordning via card.id
  const sortByWeight = (a: DashboardCard, b: DashboardCard): number => {
    if (b.weight !== a.weight) return b.weight - a.weight
    // Tie-breaking: seedad pseudo-slump baserat på id + seed
    const hashA = simpleHash(a.id + seed)
    const hashB = simpleHash(b.id + seed)
    return hashB - hashA
  }

  const primary = eligible.filter(c => c.tier === 'primary').sort(sortByWeight)
  const secondary = eligible.filter(c => c.tier === 'secondary').sort(sortByWeight)
  const minimal = eligible.filter(c => c.tier === 'minimal').sort(sortByWeight)

  // Steg 3: Plocka ut topp N från varje tier
  // primary[0] är alltid definerad om CARD_BAG innehåller minst ett kort med alwaysTrue
  const primaryCard = primary[0]
  if (!primaryCard) {
    throw new Error('CARD_BAG saknar fallback primary-kort med alwaysTrue trigger')
  }

  return {
    primary: primaryCard,
    secondary: secondary.slice(0, 3),
    minimal: minimal.slice(0, 4),
  }
}

/**
 * Hjälpfunktion för deterministisk seed.
 * Kombinerar season + matchday för stabil ordning som ändras vid omgångsövergång.
 */
export function makeSeed(game: SaveGame): number {
  return game.currentSeason * 100 + (game.currentMatchday ?? 0)
}

/** Enkel deterministisk hash av en sträng + nummer. */
function simpleHash(input: string | number): number {
  const str = String(input)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}
