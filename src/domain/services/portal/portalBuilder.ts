import type { SaveGame } from '../../entities/SaveGame'
import type { DashboardCard } from './dashboardCardBag'
import { CARD_BAG } from './dashboardCardBag'
import { getCurrentLeagueRound, getSeasonPhase, isManagedClubInPlayoff, isManagedClubSpectator } from '../../data/seasonPhases'
import { applyPhaseBias } from './seasonPhaseBias'

// B9 T2: shownCount tillagt för frekvensgolv (optional för migration-säkerhet)
type StaleEntry = { firstShownAt: number; lastShownAt: number; shownCount?: number }
type StaleTracking = Record<string, StaleEntry>

/**
 * Räknar ut stale-bias för ett kort.
 * B9 T2: Två faktorer:
 *   1. consecutive-dämpning: 0.5^(currentMatchday - firstShownAt)
 *   2. frekvensgolv: kort med högt shownCount får reducerad maxvikt
 * Returnerar min 0.1 (kort försvinner aldrig helt).
 */
function staleBias(cardId: string, tracking: StaleTracking | undefined, currentMatchday: number): number {
  const t = tracking?.[cardId]
  if (!t) return 1
  const consecutive = Math.max(0, currentMatchday - t.firstShownAt)
  // Frekvensgolv: ett kort som visats många gånger totalt återfår inte full vikt
  const frequencyPenalty = Math.min(0.5, (t.shownCount ?? 0) * 0.08)
  return Math.max(0.1, Math.pow(0.5, consecutive) * (1 - frequencyPenalty))
}

/**
 * Beräknar uppdaterad stale-tracking efter en portal-rendering.
 * - Kort i shownCardIds registreras med firstShownAt (ny eller befintlig om sekventiell).
 * - B9 T2B: Gap halverar firstShownAt istället för att nollställa — dämpning läker inte
 *   helt av ett enda missat omgång.
 * - shownCount inkrementeras varje gång kortet visas.
 */
export function computeCardStaleTracking(
  currentTracking: StaleTracking,
  shownCardIds: string[],
  currentMatchday: number,
): StaleTracking {
  const next: StaleTracking = { ...currentTracking }
  for (const id of shownCardIds) {
    const existing = next[id]
    const isSequential = existing?.lastShownAt === currentMatchday - 1
    const firstShownAt = !existing
      ? currentMatchday
      : isSequential
        ? existing.firstShownAt
        : Math.floor((existing.firstShownAt + currentMatchday) / 2)  // halvvägs, ej nollställ
    next[id] = {
      firstShownAt,
      lastShownAt: currentMatchday,
      shownCount: (existing?.shownCount ?? 0) + 1,
    }
  }
  return next
}

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
  const currentLigaRound = getCurrentLeagueRound(game)
  const isPlayoff = isManagedClubInPlayoff(game)
  const isSpectator = isManagedClubSpectator(game)
  const phase = getSeasonPhase(currentLigaRound, isPlayoff, isSpectator)

  // Steg 1: Filtrera bagen — suppress-kort för current phase + triggers
  const staleTracking = game.cardStaleTracking
  const eligible = CARD_BAG
    .filter(card => !card.suppressIn?.includes(phase))
    .filter(card => card.triggers.every(trigger => trigger(game)))
    .map(card => ({
      ...card,
      effectiveWeight:
        applyPhaseBias(card.weight, card.tier, phase) *
        staleBias(card.id, staleTracking, game.currentMatchday),
    }))

  // Steg 2: Gruppera per tier, sortera per effectiveWeight (högst först)
  // Vid tie i weight: seedad deterministisk ordning via card.id
  const sortByWeight = (a: DashboardCard & { effectiveWeight: number }, b: DashboardCard & { effectiveWeight: number }): number => {
    if (b.effectiveWeight !== a.effectiveWeight) return b.effectiveWeight - a.effectiveWeight
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
