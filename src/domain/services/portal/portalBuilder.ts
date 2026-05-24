import type { SaveGame } from '../../entities/SaveGame'
import type { DashboardCard } from './dashboardCardBag'
import { CARD_BAG } from './dashboardCardBag'
import { getCurrentLeagueRound, getSeasonPhase, isManagedClubInPlayoff, isManagedClubSpectator } from '../../data/seasonPhases'
import { applyPhaseBias } from './seasonPhaseBias'
import { inboxItemToCardCandidate, FREKVENTA, SALLSYNTA } from './inboxToPortal'
import type { InboxKind } from './inboxToPortal'
import { getRoundCharacter } from '../../data/roundCharacter'
import type { RoundCharacter } from '../../data/roundCharacter'

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
  return Math.max(0.05, Math.pow(0.5, consecutive) * (1 - frequencyPenalty))
}

// Character-bias: vikt-multiplikator per karaktär × kort-id
const CHARACTER_BIAS: Record<RoundCharacter, Record<string, number>> = {
  standard:       {},
  post_loss:      { journalist_card: 1.5, coffee_room_card: 1.4, klacken: 1.3, board_objectives: 0.7, ekonomi: 0.7 },
  pre_derby:      { klacken: 1.6, next_match_derby: 1.5, opponent_form: 1.4, season_signature_card: 0.5 },
  cup_day:        { next_match: 1.5, board_objectives: 0.6, event_critical: 0.5, patron_demand_unmet: 0.5 },
  premiere:       { open_bids: 1.5, ekonomi: 1.2 },
  winning_streak: { klacken: 1.4, journalist_card: 1.3, board_objectives: 0.5 },
  losing_streak:  { coffee_room_card: 1.4, journalist_card: 1.4, board_objectives: 0.5 },
}

// Recency bonus för inbox-kandidater: +10 om skapad denna omgång, +5 om förra
function recencyBonus(itemDate: string, nowMs: number): number {
  const daysDiff = (nowMs - new Date(itemDate).getTime()) / 86_400_000
  if (daysDiff < 7) return 10
  if (daysDiff < 14) return 5
  return 0
}

// Hur många omgångar sedan ett inbox-item skapades (1 omgång ≈ 7 dagar i speltid)
function roundsAgo(itemDate: string, nowMs: number): number {
  return Math.floor((nowMs - new Date(itemDate).getTime()) / 86_400_000 / 7)
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
  storySlot: DashboardCard | null  // inbox-story mellan primary och secondary
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
  const character = getRoundCharacter(game)

  // Steg 1: Filtrera bagen — suppress-kort för current phase + triggers
  const staleTracking = game.cardStaleTracking
  const eligible = CARD_BAG
    .filter(card => !card.suppressIn?.includes(phase))
    .filter(card => card.triggers.every(trigger => trigger(game)))
    .map(card => ({
      ...card,
      effectiveWeight:
        applyPhaseBias(card.weight, card.tier, phase) *
        (CHARACTER_BIAS[character][card.id] ?? 1) *
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

  // Steg 4: Story-slot — välj EN vinnare från inbox-kandidater
  const nowMs = game.currentDate ? new Date(game.currentDate).getTime() : 0
  // Inboxen är sorterad nyast-först (roundProcessor: b.date.localeCompare(a.date)),
  // så slice(0, 20) ger de SENASTE posterna — inte slice(-N) som ger de äldsta.
  const lastWasFrekventa = !!game.lastStorySlotType && FREKVENTA.has(game.lastStorySlotType as InboxKind)
  const inboxCandidates = (game.inbox ?? [])
    .slice(0, 20)
    .map(item => ({ item, card: inboxItemToCardCandidate(item, game) }))
    .filter((x): x is { item: typeof x.item; card: NonNullable<typeof x.card> } => x.card !== null)
    .filter(x => {
      if (!x.item.date) return false
      const ra = roundsAgo(x.item.date, nowMs)
      // Tysta sällsynta kort (milstolpe/nemesis/mecenat) får längre fönster —
      // de förnyas inte varje vecka, så ett 2-omgångars-fönster låser ute dem helt.
      return SALLSYNTA.has(x.card.kind) ? ra <= 6 : ra <= 2
    })

  const scored = inboxCandidates.map(({ item, card }) => {
    let w = card.weight + (item.date ? recencyBonus(item.date, nowMs) : 0)
    if (SALLSYNTA.has(card.kind)) w += 25
    // Rotation: exakt samma typ igen straffas hårt; annan frekvent typ efter en
    // frekvent straffas mjukare — så Media→Resultat→Derby inte känns enahanda.
    if (card.kind === game.lastStorySlotType) {
      w *= 0.4
    } else if (lastWasFrekventa && FREKVENTA.has(card.kind)) {
      w *= 0.7
    }
    return { card, w }
  })
  const storySlot = scored.reduce<typeof scored[0] | undefined>(
    (best, cur) => (best === undefined || cur.w > best.w ? cur : best),
    undefined,
  )?.card ?? null

  return {
    primary: primaryCard,
    storySlot,
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
