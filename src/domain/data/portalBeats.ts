/**
 * portalBeats.ts
 *
 * Lättviktiga narrativa nedslag — visas en gång i portalen, kan stängas.
 * Inte fullskärmsscener. Lever inom portalen, bryter inte flödet.
 *
 * Texterna är placeholder — Opus fyller dem med slutliga meningar.
 */

import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from './rivalries'

export interface PortalBeat {
  id: string
  emoji: string
  text: string
  /** Returnerar true om beatet ska visas givet game-state. */
  trigger: (game: SaveGame) => boolean
  /** true = visas max en gång per säsong, false = en gång totalt */
  oncePerSeason: boolean
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
    emoji: '🏒',
    text: 'Ispremiär. Wienerbröd på morgonen, isen är stenhård. Det är säsong nu.',
    trigger: (g) => {
      if (completedLeagueCount(g) !== 0) return false
      const next = nextManagedLeagueFixture(g)
      return next !== null
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
    text: 'Fönstret öppet. Telefonen har redan börjat ringa hos någon — bara inte hos er än.',
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
    text: 'Sista omgången. Vad som än händer idag — det är allt det blir av grundserien.',
    trigger: (g) => completedLeagueCount(g) === 21,
    oncePerSeason: true,
  },
]
