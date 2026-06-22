/**
 * portalBeats.ts
 *
 * Lättviktiga narrativa nedslag — visas en gång i portalen, kan stängas.
 * Inte fullskärmsscener. Lever inom portalen, bryter inte flödet.
 *
 * Texterna är Opus-satta och slutliga.
 */

import type { SaveGame, RippleChain } from '../entities/SaveGame'
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

const STEP_VERBS: Record<string, { up: string; down: string }> = {
  'Stämningen':   { up: 'stämningen lyfter',            down: 'stämningen sjunker' },
  'Klacken':      { up: 'klacken tänds',                down: 'klacken oroas' },
  'Orten':        { up: 'orten reser sig',               down: 'orten känner det' },
  'Styrelsen':    { up: 'styrelsen nickar',              down: 'styrelsen tappar tålamod' },
  'Sponsorerna':  { up: 'sponsorerna hör av sig',        down: 'sponsorerna drar öronen åt sig' },
}

const TRIGGER_CLAUSE: Record<RippleChain['trigger'], (name?: string) => string> = {
  star_injured:  (n) => `${n ?? 'Spelaren'} är borta ett tag.`,
  big_derby_win: () => 'Derbysegern sitter kvar.',
  mecenat_left:  (n) => `${n ?? 'Mecenaten'} drog sig ur.`,
}

function renderChain(c: RippleChain | undefined): string {
  if (!c) return ''
  const clause = TRIGGER_CLAUSE[c.trigger](c.subjectName)
  if (c.steps.length === 0) return clause
  const verbs = c.steps.slice(0, 3).map(s => {
    const pair = STEP_VERBS[s.label]
    return pair ? pair[s.dir] : s.label
  })
  return `${clause} ${verbs.join(', ')}.`
}

export const PORTAL_BEATS: PortalBeat[] = [
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
    trigger: (g) => (g.boardObjectives ?? []).some(o => o.status === 'failed'),
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
    keyFn: (g) => {
      const patience = g.boardPatience ?? 70
      const sev = patience < 30 ? 3 : patience < 50 ? 2 : 1
      return `board_fail_sev${sev}_s${g.currentSeason}`
    },
    oncePerSeason: false,
  },

  // ── Legibel konsekvens: dominokedjan i ögonblicket ───────────────────────
  {
    id: 'ripple_consequence',
    emoji: '⛓️',
    kicker: 'Konsekvens',
    severity: (g) => {
      const c = g.pendingRippleChain
      if (!c) return 0
      if (c.trigger === 'big_derby_win') return 0
      if (c.trigger === 'mecenat_left') return 2
      return c.steps.some(s => s.label === 'Styrelsen') ? 2 : 1
    },
    trigger: (g) => !!g.pendingRippleChain && g.pendingRippleChain.round === g.currentMatchday,
    text: (g) => renderChain(g.pendingRippleChain),
    keyFn: (g) => `ripple_${g.pendingRippleChain?.trigger ?? 'unknown'}_${g.pendingRippleChain?.round ?? 0}_s${g.pendingRippleChain?.season ?? 0}`,
    oncePerSeason: false,
  },

  // ── Callback: H2H-streak — inför match mot klubb med svit ─────────────────
  {
    id: 'callback_streak',
    emoji: '📊',
    severity: (g) => {
      const next = nextManagedFixture(g)
      if (!next) return 0
      const opp = next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId
      return (g.rivalryHistory?.[opp]?.currentStreak ?? 0) <= -2 ? 1 : 0
    },
    trigger: (g) => firesBeforeNextFixture(g, (_fx, opp) =>
      Math.abs(g.rivalryHistory?.[opp]?.currentStreak ?? 0) >= 2
    ),
    text: (g) => {
      const next = nextManagedFixture(g)
      const opp = next ? (next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId) : ''
      const oppClub = g.clubs.find(c => c.id === opp)
      const streak = g.rivalryHistory?.[opp]?.currentStreak ?? 0
      const n = Math.abs(streak)
      if (streak <= -2) return `${n} raka mot ${oppClub?.name ?? 'dem'} nu. Någon gång ska det vändas.`
      return `${oppClub?.name ?? 'De'} har inte tagit dig på ${n} möten. De vet om det.`
    },
    keyFn: (g) => {
      const next = nextManagedFixture(g)
      const opp = next ? (next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId) : 'unknown'
      return `callback_streak_${opp}_s${g.currentSeason}`
    },
    oncePerSeason: false,
  },

  // ── Callback: Derby-minne — senaste resultat inför derby ──────────────────
  {
    id: 'callback_derby_memory',
    emoji: '🔥',
    kicker: 'Derby',
    severity: () => 1,
    trigger: (g) => firesBeforeNextFixture(g, (_fx, opp) => {
      if (!getRivalry(g.managedClubId, opp)) return false
      return g.fixtures.some(f =>
        f.status === 'completed' && !f.isCup &&
        ((f.homeClubId === g.managedClubId && f.awayClubId === opp) ||
         (f.awayClubId === g.managedClubId && f.homeClubId === opp))
      )
    }),
    text: (g) => {
      const next = nextManagedFixture(g)
      const opp = next ? (next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId) : ''
      const oppClub = g.clubs.find(c => c.id === opp)
      const pastDerby = g.fixtures
        .filter(f =>
          f.status === 'completed' && !f.isCup &&
          ((f.homeClubId === g.managedClubId && f.awayClubId === opp) ||
           (f.awayClubId === g.managedClubId && f.homeClubId === opp))
        )
        .sort((a, b) => b.matchday - a.matchday)[0]
      if (!pastDerby) return `Derbyt mot ${oppClub?.name ?? 'rivalen'}. Klacken minns.`
      const managedHome = pastDerby.homeClubId === g.managedClubId
      const ourGoals = managedHome ? pastDerby.homeScore : pastDerby.awayScore
      const theirGoals = managedHome ? pastDerby.awayScore : pastDerby.homeScore
      return `Förra derbyt mot ${oppClub?.name ?? 'rivalen'}: ${ourGoals}–${theirGoals}. Klacken har inte glömt.`
    },
    keyFn: (g) => {
      const next = nextManagedFixture(g)
      const opp = next ? (next.homeClubId === g.managedClubId ? next.awayClubId : next.homeClubId) : 'unknown'
      return `callback_derby_${opp}_s${g.currentSeason}`
    },
    oncePerSeason: false,
  },

  // ── Callback: Landslagssnubb — spelaren med något att bevisa ─────────────
  {
    id: 'callback_snub',
    emoji: '📞',
    kicker: 'Landslaget',
    severity: () => 1,
    trigger: (g) => {
      const snub = g.lastNationalSnub
      if (!snub || snub.season !== g.currentSeason) return false
      const player = g.players.find(p => p.id === snub.playerId)
      return !!(player && player.clubId === g.managedClubId && !player.isInjured)
    },
    text: (g) => {
      const snub = g.lastNationalSnub
      const player = snub ? g.players.find(p => p.id === snub.playerId) : undefined
      const name = player ? `${player.firstName} ${player.lastName}` : 'Spelaren'
      return `${name} förbigicks i landslaget. Han har något att säga i kväll.`
    },
    keyFn: (g) => `callback_snub_${g.lastNationalSnub?.playerId ?? 'unknown'}_s${g.currentSeason}`,
    oncePerSeason: false,
  },

  // ── Callback: Rival-sale-återförening — första mötet med köparklubben ─────
  {
    id: 'callback_sale',
    emoji: '🤝',
    kicker: 'Rivalförsäljning',
    severity: () => 1,
    trigger: (g) => {
      const info = g.lastRivalSaleInfo
      if (!info?.buyerClubId) return false
      return firesBeforeNextFixture(g, (_fx, opp) => opp === info.buyerClubId)
    },
    text: (g) => {
      const info = g.lastRivalSaleInfo
      return `Första mötet med ${info?.buyerClubName ?? 'dem'} sedan ${info?.soldPlayerName ?? 'spelaren'} gick dit. Det blir laddat.`
    },
    keyFn: (g) => {
      const info = g.lastRivalSaleInfo
      return `callback_sale_s${g.currentSeason}_${info?.buyerClubId ?? 'unknown'}`
    },
    oncePerSeason: false,
  },

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
