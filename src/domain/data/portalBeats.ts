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
import { deriveCoachNemesis } from '../services/managerProfileService'
import { deriveUtfall } from '../services/matchTypeAxes'
import { FACILITY_COMPLETED_BEATS, FACILITY_COMPLETED_FALLBACK } from './facilityPortalBeats'
import { FACILITY_NODE_DEFS } from './facilityNodes'
import { getFirstUnseenCompletedFacility, facilityCompletedBeatKey } from '../services/facilityService'
import { getTransferWindowStatus } from '../services/transferWindowService'

export interface PortalBeat {
  id: string
  emoji: string
  text: string | ((game: SaveGame) => string)
  /** Returnerar true om beatet ska visas givet game-state. */
  trigger: (game: SaveGame) => boolean
  /** true = visas max en gång per säsong, false = en gång totalt */
  oncePerSeason: boolean
  /** Etikett-rad ovanför texten. Visas vid severity ≥ 1. Funktion → kan tystas/variera på game-state. */
  kicker?: string | ((game: SaveGame) => string | undefined)
  /** Navigerar hit vid klick på beatet (inte dismiss-knappen). */
  route?: string
  /** Om satt, genereras dismiss-nyckeln av denna funktion istf statisk id/säsong-logik. */
  keyFn?: (game: SaveGame) => string
  /** Förbättring 3 severity-skalan. 0/undefined=plain, 1=copper (kicker), 2=danger, 3=kris-band mörk yta.
   *  Funktion → kan eskalera på game-state. Bakåtkompatibelt: beats utan severity → kicker?1:0. */
  severity?: (game: SaveGame) => 0 | 1 | 2 | 3
  /** Yta 2 (Audit-syntes, 2026-07-07): valfri stegvis nedbrytning under `text` — kedjan visas
   *  som separata rader (riktningsfärgad), inte hopplattad i löpmeningen. Beats utan `steps`
   *  renderas precis som förut, bara `text`. Texten i varje steg är oförändrad — samma
   *  STEP_VERBS-fraser som redan användes i den hopplattade meningen, ingen ny copy. */
  steps?: (game: SaveGame) => { text: string; dir: 'up' | 'down' }[]
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

function completedLeagueCount(game: SaveGame): number {
  const id = game.managedClubId
  return game.fixtures.filter(
    f => f.season === game.currentSeason &&
      f.status === 'completed' && !f.isCup && !f.isKnockout &&
      (f.homeClubId === id || f.awayClubId === id)
  ).length
}

/** Senaste verifierbara mentorskapet där senioren faktiskt blev klubbikon.
 *  Arrayordningen är skrivordningen; baklängesgång gör ommentorskap stabilt
 *  utan att tolka startRound över säsongsgränser. */
function findLegendMentor(game: SaveGame, youthPlayerId: string) {
  const history = game.mentorshipHistory ?? []
  for (let index = history.length - 1; index >= 0; index--) {
    const record = history[index]
    if (record.youthPlayerId !== youthPlayerId) continue
    const legend = (game.clubLegends ?? []).find(
      candidate => candidate.playerId === record.seniorPlayerId,
    )
    if (legend) return { record, legend }
  }
  return null
}

function findCurrentLegendDebut(game: SaveGame) {
  for (const player of game.players) {
    if (
      player.clubId !== game.managedClubId ||
      (player.careerStats?.totalGames ?? 0) !== 1
    ) continue
    const debut = (player.diary ?? []).find(entry =>
      entry.semanticKey === 'first_team_debut' &&
      entry.season === game.currentSeason &&
      entry.matchday === game.currentMatchday
    )
    if (!debut) continue
    const mentorship = findLegendMentor(game, player.id)
    if (mentorship) return { player, debut, mentorship }
  }
  return null
}

function findLegendRecordChase(game: SaveGame) {
  const recordLegend = [...(game.clubLegends ?? [])]
    .filter(legend => legend.totalGoals > 0)
    .sort((a, b) => (b.totalGoals - a.totalGoals) || a.name.localeCompare(b.name))[0]
  if (!recordLegend) return null

  const activePlayers = game.players.filter(player => player.clubId === game.managedClubId)
  if (activePlayers.some(player => (player.careerStats?.totalGoals ?? 0) > recordLegend.totalGoals)) {
    return null
  }

  const candidate = activePlayers
    .map(player => ({
      player,
      goalsDiff: recordLegend.totalGoals - (player.careerStats?.totalGoals ?? 0),
    }))
    .filter(({ goalsDiff }) => goalsDiff > 0 && goalsDiff <= 5)
    .sort((a, b) => (a.goalsDiff - b.goalsDiff) || a.player.id.localeCompare(b.player.id))[0]

  return candidate ? { ...candidate, legend: recordLegend } : null
}

/** Har transfer_window_open-beatet visats i en tidigare säsong? shownBeats
 *  nollställs aldrig mellan säsonger, så en tidigare säsongs nyckel räcker. */
function hasSeenTransferWindowBeatBefore(game: SaveGame): boolean {
  return (game.shownBeats ?? []).some(k => k.startsWith('transfer_window_open_'))
}

const STEP_VERBS: Record<string, { up: string; down: string }> = {
  'Stämningen':   { up: 'stämningen lyfter',            down: 'stämningen sjunker' },
  'Klacken':      { up: 'klacken tänds',                down: 'klacken oroas' },
  'Orten':        { up: 'orten reser sig',               down: 'orten känner det' },
  'Styrelsen':    { up: 'styrelsen nickar',              down: 'styrelsen tappar tålamod' },
  'Sponsorerna':  { up: 'sponsorerna hör av sig',        down: 'sponsorerna drar öronen åt sig' },
}

// ÖVERLÄMNING 2 steg 1-pilot (2026-08-12): Partial, inte Record — de tre nya
// transfer_bid_*-triggers (rippleEffectService.ts) har ingen klausul här
// ännu. Text är Opus/Jacobs jobb (CLAUDE.md: Code skriver aldrig svensk
// speltext) och det här är dessutom uttryckligen en rapport-pilot som INTE
// ska rendera något — pilotTransferBidRippleChain (SaveGame.ts) läses inte
// av något beat, bara av rapporten. Lägg till klausuler här när/om
// transfer-ripplen faktiskt ska visas.
const TRIGGER_CLAUSE: Partial<Record<RippleChain['trigger'], (name?: string) => string>> = {
  star_injured:  (n) => `${n ?? 'Spelaren'} är borta ett tag.`,
  big_derby_win: () => 'Derbysegern sitter kvar.',
  mecenat_left:  (n) => `${n ?? 'Mecenaten'} drog sig ur.`,
}

// Yta 2 (Audit-syntes, 2026-07-07): renderChain() plattade kedjan till EN löpmening
// ("Derbysegern sitter kvar. stämningen lyfter, klacken tänds."). Design ville se
// kedjan stegvis (label + riktning per steg) för läsbarhet — "så du förstår motorn
// du styr, inte bara utfallet". Delad i två: klausulen (oförändrad text) + en
// separat stegvis lista. STEP_VERBS-fraserna återanvänds ordagrant, ingen ny copy.
function renderClause(c: RippleChain | undefined): string {
  if (!c) return ''
  return TRIGGER_CLAUSE[c.trigger]?.(c.subjectName) ?? ''
}

function renderSteps(c: RippleChain | undefined): { text: string; dir: 'up' | 'down' }[] {
  if (!c) return []
  return c.steps.slice(0, 3).map(s => {
    const pair = STEP_VERBS[s.label]
    return { text: pair ? pair[s.dir] : s.label, dir: s.dir }
  })
}

// U5 forts (SLUTTEST_KO.md, 2026-08-19/20): isOnCooldown mot "pivotal beats".
// "Pivotal" saknar en formell klassificering i kodbasen ännu (bara ett
// storleksuppskattnings-omnämnande: "15-20 pivotal, 70-80 ambient" av
// ~90-100 narrativa former — den riktiga taxonomin väntar på O11/
// contentContract.ts). Interimsval tills dess: de sju beats nedan är de
// som läser som stora, sällsynta narrativa ögonblick snarare än rutinmässig
// matchreaktion — samma intuition som severity 3 ("kris-band") pekar mot,
// men severity beräknas dynamiskt per game-state och går inte att lista
// statiskt, så id:n används direkt istället. minSeasonsApart=2: samma
// specifika ögonblick ska inte kunna komma tillbaka säsongen efter.
export const PIVOTAL_BEAT_IDS: readonly string[] = [
  'board_failure',
  'ripple_consequence',
  'callback_nemesis',
  'callback_legend_mentor',
  'callback_legend_debut',
  'callback_legend_record',
  'facility_completed',
]
export const PIVOTAL_BEAT_COOLDOWN_SEASONS = 2

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
  // ÖVERLÄMNING 2 (2026-08-17): pendingRippleChains är nu rangordnad (index 0
  // = mest signifikant, se chainSignificance i roundProcessor.ts — väger ett
  // verkligt Styrelse-utslag, inte längre vilken trigger det var). Beat-
  // slotten här visar bara toppen — portalens beat-system har redan sin egen
  // en-i-taget-konkurrens (severity mot andra beats), det ändras inte här.
  // Övriga kedjor kastas inte längre bort, de finns kvar i arrayen för
  // framtida konsumenter (t.ex. en granska-vy) även om inget läser dem än.
  {
    id: 'ripple_consequence',
    emoji: '⛓️',
    kicker: 'Konsekvens',
    severity: (g) => {
      const c = g.pendingRippleChains?.[0]
      if (!c) return 0
      if (c.trigger === 'big_derby_win') return 0
      if (c.trigger === 'mecenat_left') return 2
      return c.steps.some(s => s.label === 'Styrelsen') ? 2 : 1
    },
    trigger: (g) => !!g.pendingRippleChains?.[0] && g.pendingRippleChains[0].round === g.currentMatchday,
    text: (g) => renderClause(g.pendingRippleChains?.[0]),
    steps: (g) => renderSteps(g.pendingRippleChains?.[0]),
    keyFn: (g) => {
      const c = g.pendingRippleChains?.[0]
      return `ripple_${c?.trigger ?? 'unknown'}_${c?.round ?? 0}_s${c?.season ?? 0}`
    },
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
      return `${oppClub?.name ?? 'De'} har inte tagit dig på ${n} möten.`
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
        f.status === 'completed' && !f.isCup && !f.isKnockout &&
        typeof f.homeScore === 'number' && typeof f.awayScore === 'number' &&
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
          f.status === 'completed' && !f.isCup && !f.isKnockout &&
          typeof f.homeScore === 'number' && typeof f.awayScore === 'number' &&
          ((f.homeClubId === g.managedClubId && f.awayClubId === opp) ||
           (f.awayClubId === g.managedClubId && f.homeClubId === opp))
        )
        .sort((a, b) => (b.season - a.season) || (b.matchday - a.matchday))[0]
      if (!pastDerby) return `Derbyt mot ${oppClub?.name ?? 'rivalen'}.`
      const managedHome = pastDerby.homeClubId === g.managedClubId
      const ourGoals = managedHome ? pastDerby.homeScore : pastDerby.awayScore
      const theirGoals = managedHome ? pastDerby.awayScore : pastDerby.homeScore
      return `Förra derbyt mot ${oppClub?.name ?? 'rivalen'}: ${ourGoals}–${theirGoals}.`
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
      return `${name} förbigicks i landslaget.`
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
      if (
        !info?.buyerClubId ||
        typeof info.saleSeason !== 'number' ||
        typeof info.saleMatchday !== 'number'
      ) return false

      const isAfterSale = (fixture: Fixture) =>
        fixture.season > info.saleSeason! ||
        (fixture.season === info.saleSeason && fixture.matchday > info.saleMatchday!)
      const isManagedBuyerMeeting = (fixture: Fixture) =>
        (fixture.homeClubId === g.managedClubId && fixture.awayClubId === info.buyerClubId) ||
        (fixture.awayClubId === g.managedClubId && fixture.homeClubId === info.buyerClubId)

      return firesBeforeNextFixture(g, (fixture, opp) =>
        opp === info.buyerClubId &&
        isAfterSale(fixture) &&
        !g.fixtures.some(candidate =>
          candidate.status === 'completed' &&
          isAfterSale(candidate) &&
          isManagedBuyerMeeting(candidate)
        )
      )
    },
    text: (g) => {
      const info = g.lastRivalSaleInfo
      return `Första mötet med ${info?.buyerClubName ?? 'dem'} sedan ${info?.soldPlayerName ?? 'spelaren'} gick dit.`
    },
    keyFn: (g) => {
      const info = g.lastRivalSaleInfo
      return `callback_sale_${info?.buyerClubId ?? 'unknown'}_s${info?.saleSeason ?? 'unknown'}_m${info?.saleMatchday ?? 'unknown'}`
    },
    oncePerSeason: false,
  },

  // ── Callback: Nemesis — inför match mot tränaren du aldrig slår ──────────
  {
    id: 'callback_nemesis',
    emoji: '🎯',
    kicker: 'Rivalen',
    severity: () => 1,
    trigger: (g) => {
      const profile = g.managerProfile
      if (!profile) return false
      const nemesis = deriveCoachNemesis(
        profile.coachRivalries.filter(rivalry => rivalry.clubId !== g.managedClubId),
      )
      if (!nemesis) return false
      return firesBeforeNextFixture(g, (_f, opp) => opp === nemesis.clubId)
    },
    text: (g) => {
      const profile = g.managerProfile
      if (!profile) return ''
      const nemesis = deriveCoachNemesis(
        profile.coachRivalries.filter(rivalry => rivalry.clubId !== g.managedClubId),
      )
      if (!nemesis) return ''
      const clubName = g.clubs.find(c => c.id === nemesis.clubId)?.name ?? 'rivalen'
      const record = `${nemesis.h2hWins}V ${nemesis.h2hDraws}O ${nemesis.h2hLosses}F`
      return `Det blir ${clubName} igen. ${record} i böckerna.`
    },
    keyFn: (g) => {
      const profile = g.managerProfile
      const nemesis = profile
        ? deriveCoachNemesis(profile.coachRivalries.filter(rivalry => rivalry.clubId !== g.managedClubId))
        : null
      return `callback_nemesis_${nemesis?.clubId ?? 'none'}_s${g.currentSeason}`
    },
    oncePerSeason: true,
  },

  // ── Legend-callback: lärlingen bär bindeln ────────────────────────────────
  {
    id: 'callback_legend_mentor',
    emoji: '🎗️',
    kicker: 'Blodslinje',
    severity: () => 1,
    trigger: (g) => {
      const captainId = g.captainPlayerId
      if (!captainId) return false
      const captain = g.players.find(
        player => player.id === captainId && player.clubId === g.managedClubId,
      )
      return !!captain && !!findLegendMentor(g, captainId)
    },
    text: (g) => {
      const captainId = g.captainPlayerId ?? ''
      const captain = g.players.find(
        player => player.id === captainId && player.clubId === g.managedClubId,
      )
      const mentorship = findLegendMentor(g, captainId)
      if (!captain || !mentorship) return ''
      return `${captain.firstName} ${captain.lastName} bär bindeln nu. Det var ${mentorship.legend.name} som visade honom hur man gör.`
    },
    keyFn: (g) => {
      const captainId = g.captainPlayerId ?? 'none'
      const mentorship = findLegendMentor(g, captainId)
      return `callback_legend_mentor_${captainId}_${mentorship?.legend.playerId ?? 'none'}_s${g.currentSeason}`
    },
    oncePerSeason: true,
  },

  // ── Legend-callback: lärlingen debuterar ─────────────────────────────────
  {
    id: 'callback_legend_debut',
    emoji: '⭐',
    kicker: 'Genombrott',
    severity: () => 0,
    trigger: (g) => !!findCurrentLegendDebut(g),
    text: (g) => {
      const context = findCurrentLegendDebut(g)
      if (!context) return ''
      return `${context.player.firstName} ${context.player.lastName} gör debut, ${context.player.age} år.`
    },
    keyFn: (g) => {
      const context = findCurrentLegendDebut(g)
      return `callback_legend_debut_${context?.player.id ?? 'none'}_${context?.mentorship.legend.playerId ?? 'none'}_s${context?.debut.season ?? 'unknown'}_m${context?.debut.matchday ?? 'unknown'}`
    },
    oncePerSeason: false,
  },

  // ── Legend-callback: legendens rekord nära ────────────────────────────────
  {
    id: 'callback_legend_record',
    emoji: '🏆',
    kicker: 'Historien väntar',
    severity: () => 1,
    trigger: (g) => !!findLegendRecordChase(g),
    text: (g) => {
      const chase = findLegendRecordChase(g)
      if (!chase) return ''
      return `${chase.player.firstName} ${chase.player.lastName} är ${chase.goalsDiff} mål från ${chase.legend.name}:s rekord.`
    },
    keyFn: (g) => {
      const chase = findLegendRecordChase(g)
      return `callback_legend_record_${chase?.player.id ?? 'none'}_${chase?.legend.playerId ?? chase?.legend.name ?? 'none'}_${chase?.legend.totalGoals ?? 'none'}`
    },
    oncePerSeason: true,
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
        .filter(f => f.season === g.currentSeason && f.status === 'scheduled' &&
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
    trigger: (g) => g.fixtures.filter(fixture =>
      fixture.season === g.currentSeason &&
      fixture.status === 'completed' &&
      (fixture.homeClubId === g.managedClubId || fixture.awayClubId === g.managedClubId) &&
      deriveUtfall(fixture, g.managedClubId) === 'vunnet'
    ).length === 1,
    oncePerSeason: true,
  },

  // ── Första derbyt ───────────────────────────────────────────────
  {
    id: 'first_derby',
    emoji: '🔥',
    text: 'Första derbyt. Det här är matcher som lever längre än säsongen.',
    trigger: (g) => {
      const nextIsDerby = firesBeforeNextFixture(g, (_fixture, opponentId) =>
        getRivalry(g.managedClubId, opponentId) !== null
      )
      if (!nextIsDerby) return false

      // "Första derbyt" gäller tävlingsoberoende: ett redan spelat cupderby
      // gör nästa ligaderby till säsongens andra derby, inte det första.
      const completedDerbies = g.fixtures.filter(f =>
        f.status === 'completed' &&
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

  // ── Vinterfönstret öppnar (januari) ─────────────────────────────
  // Drag 2 (2026-07-02): första gången i karriären förklaras fönstret
  // med transfermotorns egen beskrivning. Återkommande säsonger räcker
  // den korta formen — spelaren vet redan. shownBeats är redan den
  // persistenta "sedd"-flaggan (ingen ny SaveGame-fält behövs).
  {
    id: 'transfer_window_open',
    emoji: '📞',
    text: (game: SaveGame) => hasSeenTransferWindowBeatBefore(game)
      ? 'Transferfönstret öppet. Telefonen har redan börjat ringa hos någon — bara inte hos er än.'
      : getTransferWindowStatus(game.currentDate).description,
    kicker: (game: SaveGame) => hasSeenTransferWindowBeatBefore(game)
      ? undefined
      : getTransferWindowStatus(game.currentDate).label,
    // Savefilen börjar 1 oktober med försäsongsfönstret redan öppet. Beatets
    // säsongsögonblick är därför återöppningen i januari; samma status styr
    // TransfersScreen, navigationen, inkommande bud och utgående bud.
    trigger: (g) => getTransferWindowStatus(g.currentDate).status === 'winter',
    oncePerSeason: true,
  },

  // ── Sista omgången ───────────────────────────────────────────────
  {
    id: 'last_league_round',
    emoji: '◯',
    text: 'Sista omgången. Vad som än händer i dag — det är allt det blir av grundserien.',
    trigger: (g) => completedLeagueCount(g) === 21 && firesBeforeNextFixture(g, fixture =>
      !fixture.isCup && !fixture.isKnockout && fixture.roundNumber === 22
    ),
    oncePerSeason: true,
  },

  // ── B1: Bygge klart (per-nod, copper-stripe, navigerar till Bygget) ──────
  {
    id: 'facility_completed',
    emoji: '🏟️',
    kicker: 'Bygget',
    route: '/game/bygget',
    text: (game: SaveGame) => {
      const nodeId = game.facilityState
        ? getFirstUnseenCompletedFacility(game.facilityState, game.shownBeats ?? [])?.nodeId ?? ''
        : ''
      const label = FACILITY_NODE_DEFS.find(d => d.id === nodeId)?.label ?? nodeId
      return FACILITY_COMPLETED_BEATS[nodeId] ?? FACILITY_COMPLETED_FALLBACK(label)
    },
    // 2026-08-17 (Stickiness-audit): triggar tills spelaren FAKTISKT sett invigningen
    // (game.shownBeats, se keyFn) — inte bara den exakta omgången bygget blev klart.
    // Missade spelaren portalen den omgången (simulering, flera besök mellan visiter)
    // försvann invigningen tidigare permanent. Kön (unseenCompletedFacilities) håller
    // ALLA outnyttjade completions, inte bara den senaste — se facilityService.ts.
    trigger: (game: SaveGame) => {
      if (!game.facilityState) return false
      return getFirstUnseenCompletedFacility(game.facilityState, game.shownBeats ?? []) != null
    },
    // Unik per nod-byggnad — dismiss-nyckeln bär med nodeId så framtida byggen triggar nytt beat.
    keyFn: (game: SaveGame) => {
      const first = game.facilityState
        ? getFirstUnseenCompletedFacility(game.facilityState, game.shownBeats ?? [])
        : null
      return first
        ? facilityCompletedBeatKey(first)
        : 'facility_completed_unknown'
    },
    oncePerSeason: false,
  },
]
