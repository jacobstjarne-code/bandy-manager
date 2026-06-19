/**
 * portalBeats.ts
 *
 * Lättviktiga narrativa nedslag — visas en gång i portalen, kan stängas.
 * Inte fullskärmsscener. Lever inom portalen, bryter inte flödet.
 *
 * Texterna är Opus-satta och slutliga.
 */

import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from './rivalries'
import { nextManagedFixture } from '../services/situationFragments'
import { FACILITY_COMPLETED_BEATS, FACILITY_COMPLETED_FALLBACK } from './facilityPortalBeats'
import { FACILITY_NODE_DEFS } from './facilityNodes'

export interface PortalBeat {
  id: string
  emoji: string
  text: string | ((game: SaveGame) => string)
  /** Returnerar true om beatet ska visas givet game-state. */
  trigger: (game: SaveGame) => boolean
  /** true = visas max en gång per säsong, false = en gång totalt */
  oncePerSeason: boolean
  /** B1: etikett-rad ovanför texten ("Bygget"). Copper-stripe variant. */
  kicker?: string
  /** B1: navigerar hit vid klick på beatet (inte dismiss-knappen). */
  route?: string
  /** B1: om satt, genereras dismiss-nyckeln av denna funktion istf statisk id/säsong-logik. */
  keyFn?: (game: SaveGame) => string
}

function nextManagedLeagueFixture(game: SaveGame) {
  const id = game.managedClubId
  return game.fixtures
    .filter(f =>
      f.status === 'scheduled' && !f.isCup &&
      (f.homeClubId === id || f.awayClubId === id)
    )
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
}

function completedLeagueCount(game: SaveGame): number {
  const id = game.managedClubId
  return game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === id || f.awayClubId === id)
  ).length
}

export const PORTAL_BEATS: PortalBeat[] = [
  // ── Ispremiär (omg 1, ingen match spelad) ─────────────────────
  {
    id: 'season_opener',
    emoji: '⛸️',
    text: 'Ispremiär. Wienerbröd på morgonen, isen är stenhård. Det är säsong nu.',
    trigger: (g) => {
      if (completedLeagueCount(g) !== 0) return false
      // Don't show during a cup week — the immediate next fixture must be a league match
      const nextAny = g.fixtures
        .filter(f => f.status === 'scheduled' &&
          (f.homeClubId === g.managedClubId || f.awayClubId === g.managedClubId))
        .sort((a, b) => a.matchday - b.matchday)[0] ?? null
      if (!nextAny || nextAny.isCup) return false
      return true
    },
    oncePerSeason: true,
  },

  // ── Första segern ───────────────────────────────────────────────
  {
    id: 'first_win',
    emoji: '✓',
    text: 'Första segern. Omklädningsrummet lät inte likadant efteråt.',
    trigger: (g) => {
      const id = g.managedClubId
      const wins = g.standings.find(s => s.clubId === id)?.wins ?? 0
      return wins === 1
    },
    oncePerSeason: true,
  },

  // ── Första derbyt ───────────────────────────────────────────────
  {
    id: 'first_derby',
    emoji: '🔥',
    text: 'Första derbyt. Det här är matcher som lever längre än säsongen.',
    trigger: (g) => {
      const next = nextManagedLeagueFixture(g)
      if (!next) return false
      // Surfa bara när derbyt är NÄSTA match överhuvudtaget — inte medan en cupmatch ligger emellan.
      const nextAny = nextManagedFixture(g)
      if (!nextAny || nextAny.id !== next.id) return false
      const oppId = next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId
      if (!getRivalry(g.managedClubId, oppId)) return false
      // Kolla att inget derby spelats den här säsongen
      const completedDerbies = g.fixtures.filter(f =>
        f.status === 'completed' && !f.isCup &&
        f.season === g.currentSeason &&
        (f.homeClubId === g.managedClubId || f.awayClubId === g.managedClubId) &&
        getRivalry(g.managedClubId, f.homeClubId === g.managedClubId ? f.awayClubId : f.homeClubId) !== null
      )
      return completedDerbies.length === 0
    },
    oncePerSeason: true,
  },

  // ── Halvtid ─────────────────────────────────────────────────────
  {
    id: 'halftime',
    emoji: '◐',
    text: 'Halvtid. Det ni gjort står — det som kommer ligger framför er.',
    trigger: (g) => completedLeagueCount(g) === 11,
    oncePerSeason: true,
  },

  // ── Transferfönster öppnar (omg 5-7) ────────────────────────────
  {
    id: 'transfer_window_open',
    emoji: '📞',
    text: 'Transferfönstret öppet. Telefonen har redan börjat ringa hos någon — bara inte hos er än.',
    trigger: (g) => {
      const played = completedLeagueCount(g)
      return played >= 5 && played <= 7
    },
    oncePerSeason: true,
  },

  // ── Sista omgången ───────────────────────────────────────────────
  {
    id: 'last_league_round',
    emoji: '◯',
    text: 'Sista omgången. Vad som än händer i dag — det är allt det blir av grundserien.',
    trigger: (g) => completedLeagueCount(g) === 21,
    oncePerSeason: true,
  },

  // ── B1: Bygge klart (per-nod, copper-stripe, navigerar till Bygget) ──────
  {
    id: 'facility_completed',
    emoji: '🏟️',
    kicker: 'Bygget',
    route: '/game/bygget',
    text: (game: SaveGame) => {
      const nodeId = game.facilityState?.lastCompleted?.nodeId ?? ''
      const label = FACILITY_NODE_DEFS.find(d => d.id === nodeId)?.label ?? nodeId
      return FACILITY_COMPLETED_BEATS[nodeId] ?? FACILITY_COMPLETED_FALLBACK(label)
    },
    // Triggar BARA den runda bygget stod klart (övergångstriggern, regel 01 "bara på state-change").
    trigger: (game: SaveGame) => {
      const last = game.facilityState?.lastCompleted
      return last != null && last.matchday === game.currentMatchday
    },
    // Unik per nod-byggnad — dismiss-nyckeln bär med nodeId så framtida byggen triggar nytt beat.
    keyFn: (game: SaveGame) => `facility_completed_${game.facilityState?.lastCompleted?.nodeId ?? 'unknown'}`,
    oncePerSeason: false,
  },
]
