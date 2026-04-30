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
    text: 'Ispremiär. Laget samlades på morgonen — någon hade köpt wienerbröd. Det är säsong nu.',
    trigger: (g) => completedLeagueCount(g) === 0,
    oncePerSeason: true,
  },

  // ── Första segern ───────────────────────────────────────────────
  {
    id: 'first_win',
    emoji: '🎯',
    text: 'Första segern på boken. Omklädningsrummet lät annorlunda efter matchen.',
    trigger: (g) => {
      const id = g.managedClubId
      const wins = g.standings.find(s => s.clubId === id)?.wins ?? 0
      return wins === 1 && completedLeagueCount(g) <= 5
    },
    oncePerSeason: true,
  },

  // ── Första derbyt ───────────────────────────────────────────────
  {
    id: 'first_derby',
    emoji: '⚡',
    text: 'Ert första derby den här säsongen. Matcherna man pratar om i mars.',
    trigger: (g) => {
      const next = nextManagedLeagueFixture(g)
      if (!next) return false
      const oppId = next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId
      return getRivalry(g.managedClubId, oppId) !== null
    },
    oncePerSeason: true,
  },

  // ── Halvtid ─────────────────────────────────────────────────────
  {
    id: 'halftime',
    emoji: '📍',
    text: 'Halva grundserien spelad. Det ni gjort hittills är gjort — resten är fortfarande öppet.',
    trigger: (g) => completedLeagueCount(g) === 11,
    oncePerSeason: true,
  },

  // ── Transferfönster öppnar (omg 5-7) ────────────────────────────
  {
    id: 'transfer_window_open',
    emoji: '📞',
    text: 'Fönstret är öppet. Det är nu agenter ringer och spelarfrågor avgörs.',
    trigger: (g) => {
      const played = completedLeagueCount(g)
      return played >= 5 && played <= 7
    },
    oncePerSeason: true,
  },

  // ── Sista omgången ───────────────────────────────────────────────
  {
    id: 'last_league_round',
    emoji: '🏁',
    text: 'Sista omgången av grundserien. Vad än som händer idag — det är sista gången den här säsongen.',
    trigger: (g) => completedLeagueCount(g) === 21,
    oncePerSeason: true,
  },
]
