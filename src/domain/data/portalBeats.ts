/**
 * portalBeats.ts
 *
 * Lättviktiga narrativa nedslag — visas en gång i portalen, kan stängas.
 * Inte fullskärmsscener. Lever inom portalen, bryter inte flödet.
 *
 * Texterna är Opus-satta och slutliga.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
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
  /** Etikett-rad ovanför texten. Visas vid severity ≥ 1. */
  kicker?: string
  /** Navigerar hit vid klick på beatet (inte dismiss-knappen). */
  route?: string
  /** Om satt, genereras dismiss-nyckeln av denna funktion istf statisk id/säsong-logik. */
  keyFn?: (game: SaveGame) => string
  /** Förbättring 3 severity-skalan. 0/undefined=plain, 1=copper (kicker), 2=danger, 3=kris-band mörk yta.
   *  Funktion → kan eskalera på game-state. Bakåtkompatibelt: beats utan severity → kicker?1:0. */
  severity?: (game: SaveGame) => 0 | 1 | 2 | 3
}

/**
 * Returnerar true om nästa managed-fixture (cup ELLER liga) matchar predikatet.
 * Garanterar att beatet surfar FÖRE den relevanta matchen och inte medan en annan match ligger emellan.
 */
export function firesBeforeNextFixture(
  game: SaveGame,
  predicate: (fixture: Fixture, opponentId: string) => boolean,
): boolean {
  const next = nextManagedFixture(game)
  if (!next) return false
  const opponentId = next.homeClubId === game.managedClubId ? next.awayClubId : next.homeClubId
  return predicate(next, opponentId)
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

  // ── Board-rewards: misslyckande-ultimatum (eskalerande sev 1→2→3) ──────────
  {
    id: 'board_failure',
    emoji: '📋',
    kicker: 'Styrelsen',
    severity: (g) => {
      const hasFailed = (g.boardObjectives ?? []).some(o => o.status === 'failed')
      if (!hasFailed) return 0
      const patience = g.boardPatience ?? 70
      if (patience < 30) return 3
      if (patience < 50) return 2
      return 1
    },
    trigger: (g) => {
      const hasFailed = (g.boardObjectives ?? []).some(o => o.status === 'failed')
      if (!hasFailed) return false
      const patience = g.boardPatience ?? 70
      return patience < 30 || patience < 50 || hasFailed
    },
    text: (g) => {
      const patience = g.boardPatience ?? 70
      const sev = patience < 30 ? 3 : patience < 50 ? 2 : 1
      const failedObj = (g.boardObjectives ?? []).find(
        o => o.status === 'failed' && (o.type === 'sporting' || o.type === 'economic')
      ) ?? (g.boardObjectives ?? []).find(o => o.status === 'failed')
      const owner = failedObj?.ownerId ?? 'Styrelsen'
      const mål = failedObj?.label ?? 'målet'
      if (sev === 3) return `${owner}: "Jag har försvarat dig så länge jag kan. Nästa gång gör jag det inte."`
      if (sev === 2) return `${owner}: "Det är andra gången nu. Jag börjar få frågor jag inte vill ha på årsmötet."`
      return `${owner}: "Vi nådde inte ${mål}. Jag säger inget mer om det. Den här gången."`
    },
    // Varje severity-steg surfar en gång; en vänd säsong nollställer streaken → trigger false
    keyFn: (g) => {
      const patience = g.boardPatience ?? 70
      const sev = patience < 30 ? 3 : patience < 50 ? 2 : 1
      return `board_fail_sev${sev}_s${g.currentSeason}`
    },
    oncePerSeason: false,
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
