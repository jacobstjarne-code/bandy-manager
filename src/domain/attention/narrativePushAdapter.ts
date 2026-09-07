import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { currentChronology } from '../services/currentChronology'
import {
  agendaForSurface,
  redaktoren,
  type AgendaItem,
} from '../services/redaktorenService'
import {
  getNextManagedFixture,
  nextMatchIsDerby,
  nextMatchIsCupFinal,
  nextMatchIsSMFinal,
  daysUntilNextMatch,
} from '../services/portal/triggers/matchTriggers'
import { RELEGATION_ZONE_SIZE } from '../services/boardService'
import type {
  AttentionCategory,
  AttentionImportance,
  AttentionSource,
  AttentionVoice,
  NarrativePostReference,
} from './types'

const SINCE_LAST_THRESHOLD = 60
const ANNIVERSARY_THRESHOLD = 70
// stickiness-categoryfor-tre-kallor: kalenderankarets fönster i DAGAR
// (push-tajming), samma storleksordning som calendarLookahead.ts:s
// LOOKAHEAD_MATCHDAYS (5) men inte samma enhet — den filen letar omgångar
// framåt i seasonCalendar, den här bara nästa managed fixture.
const CALENDAR_ANCHOR_WINDOW_DAYS = 5
// Samma åtta-lags-cutoff som playoffService.ts använder rått (ingen
// namngiven konstant där heller) — hålls i synk manuellt.
const PLAYOFF_QUALIFY_COUNT = 8
// Beslutsrelevant = inom fyra poäng (två segrars marginal) från endera
// linjen. Provisoriskt Code-vald tröskel, ingen dom — copyn skrivs inte
// än (se createNarrativePushCopyResolver), så ingen spelare ser effekten
// av var gränsen exakt går förrän dess.
const SEASON_CONTEXT_MARGIN_WINDOW = 4

/** Copy-registret äger röst och formulering. Null håller kandidaten stängd. */
export interface NarrativePushCopy {
  title: string
  body: string
  voice: AttentionVoice
}

export interface SeasonMargin {
  /** Poäng över(+)/under(−) platsen som ger slutspel. */
  toPlayoff: number
  /** Poäng över(+)/under(−) nedflyttningszonens sista säkra plats. */
  toRelegation: number
}

/**
 * stickiness-categoryfor-tre-kallor (DOM Opus 2026-09-06): tre kategorier,
 * tre källor — inte en klassificerare över en källa den inte kan se.
 * `narrative_return` är agenda-driven (AgendaItem, bakåtblickande
 * liggarhistorik). `calendar_anchor`/`season_context` är framåtblickande
 * (kommande fixture, aktuell tabell) — ingen AgendaItem finns för dem,
 * payloaden bär sin egen råa data så varje familjs copy skrivs mot sin
 * verkliga sanning, inte mot en gissad AgendaItem-form.
 */
export type ForwardPushPayload =
  | { category: 'narrative_return'; item: AgendaItem }
  | { category: 'calendar_anchor'; fixture: Fixture; opponentClubId: string; kind: 'derby' | 'cup' | 'final' }
  | { category: 'season_context'; position: number; margin: SeasonMargin }

export type NarrativePushCopyResolver = (payload: ForwardPushPayload) => NarrativePushCopy | null

export interface NarrativePushDraft {
  type: AttentionCategory
  subjectId: string
  unresolved: string[]
  context: Record<string, string | number | boolean>
  sources: AttentionSource[]
  voice: AttentionVoice
  importance: AttentionImportance
  title: string
  body: string
  deepLink: string
  score: number
  /** Bara satt för `narrative_return` — de två andra kategorierna har ingen liggarpost. */
  narrativePost?: NarrativePostReference
}

interface ForwardCandidate {
  payload: ForwardPushPayload
  subjectId: string
  sources: AttentionSource[]
  unresolved: string[]
  context: Record<string, string | number | boolean>
  importance: AttentionImportance
  deepLink: string
  score: number
  narrativePost?: NarrativePostReference
}

function passesThreshold(item: AgendaItem): boolean {
  const score = item.scoresBySurface.push.total
  if (item.freshnessQueue === 'anniversary') return score >= ANNIVERSARY_THRESHOLD
  if (item.freshnessQueue === 'since_last') return score >= SINCE_LAST_THRESHOLD
  return false
}

/** Familj 1 (Klubbminne) — oförändrad, agenda-driven. */
function narrativeReturnCandidate(game: SaveGame): ForwardCandidate | null {
  const chronology = currentChronology(game)
  const item = agendaForSurface(redaktoren(game, chronology), 'push').find(passesThreshold)
  if (!item) return null

  return {
    payload: { category: 'narrative_return', item },
    subjectId: item.postKey,
    sources: [{ kind: 'ledger', id: item.postKey }],
    unresolved: ['ledger_post_untold_on_push'],
    context: {
      family: item.family,
      freshnessQueue: item.freshnessQueue,
      ledgerType: item.post.type,
    },
    importance: item.post.significance >= 90 ? 'major' : 'normal',
    deepLink: '/game/match',
    score: item.scoresBySurface.push.total,
    narrativePost: {
      post: {
        type: item.post.type,
        semanticKey: item.post.semanticKey,
        season: item.post.season,
        matchday: item.post.matchday,
      },
      chronology: { season: chronology.season, matchday: chronology.matchday },
    },
  }
}

/**
 * Familj 2 (Kalenderankare) — nästa managed fixture, klassad derby/cup-
 * final/SM-final via samma bracket-sanning portalens egna triggers redan
 * använder (matchTriggers.ts), inte en egen roundNumber-gissning. Inom ett
 * kort fönster; för långt fram är inte push-värt.
 */
function calendarAnchorCandidate(game: SaveGame): ForwardCandidate | null {
  const fixture = getNextManagedFixture(game)
  if (!fixture) return null
  const daysUntil = daysUntilNextMatch(game)
  if (daysUntil < 0 || daysUntil > CALENDAR_ANCHOR_WINDOW_DAYS) return null

  const kind = nextMatchIsSMFinal(game) ? 'final' : nextMatchIsCupFinal(game) ? 'cup' : nextMatchIsDerby(game) ? 'derby' : null
  if (!kind) return null

  const opponentClubId = fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
  const score = kind === 'final' ? 95 : kind === 'cup' ? 85 : 75

  return {
    payload: { category: 'calendar_anchor', fixture, opponentClubId, kind },
    subjectId: fixture.id,
    sources: [{ kind: 'fixture', id: fixture.id }],
    unresolved: ['upcoming_fixture_not_yet_played'],
    context: { kind, opponentClubId, daysUntil },
    importance: kind === 'final' ? 'major' : 'normal',
    deepLink: '/game/match',
    score,
  }
}

/**
 * Familj 3 (Säsongsläge) — aktuell placering + marginal till slutspel/
 * nedflyttning ur game.standings. En trygg mittenplacering ger ingen
 * kandidat — bara när läget faktiskt är beslutsrelevant.
 */
function seasonContextCandidate(game: SaveGame): ForwardCandidate | null {
  const own = game.standings.find(s => s.clubId === game.managedClubId)
  if (!own || own.played === 0) return null

  const sorted = [...game.standings].sort((a, b) => a.position - b.position)
  const totalTeams = sorted.length
  const playoffBoundary = sorted[PLAYOFF_QUALIFY_COUNT - 1]
  const relegationSafeRank = totalTeams - RELEGATION_ZONE_SIZE
  const relegationBoundary = sorted[relegationSafeRank - 1]
  if (!playoffBoundary || !relegationBoundary) return null

  const margin: SeasonMargin = {
    toPlayoff: own.points - playoffBoundary.points,
    toRelegation: own.points - relegationBoundary.points,
  }
  const closest = Math.min(Math.abs(margin.toPlayoff), Math.abs(margin.toRelegation))
  if (closest > SEASON_CONTEXT_MARGIN_WINDOW) return null

  return {
    payload: { category: 'season_context', position: own.position, margin },
    subjectId: `standing_${game.managedClubId}_s${game.currentSeason}`,
    sources: [{ kind: 'standing', id: game.managedClubId }],
    unresolved: ['season_margin_undecided'],
    context: { position: own.position, toPlayoff: margin.toPlayoff, toRelegation: margin.toRelegation },
    importance: 'normal',
    deepLink: '/game/tabell',
    score: 70 - closest,
  }
}

/**
 * Berättarens pushadapter: tre källor (en agenda-driven, två framåtblickande),
 * samma budget/rankning, högst ETT ämne. Kandidaterna provas i poängordning
 * och den första som får ett godkänt copy-resolverresultat vinner — utan
 * copy produceras ingenting, så calendar_anchor/season_context kan landa
 * innan deras copy skrivs (registret §-avsnitten), utan dold produktionscopy.
 */
export function narrativePushDrafts(
  game: SaveGame,
  resolveCopy: NarrativePushCopyResolver,
): NarrativePushDraft[] {
  const candidates = [
    narrativeReturnCandidate(game),
    calendarAnchorCandidate(game),
    seasonContextCandidate(game),
  ]
    .filter((c): c is ForwardCandidate => c !== null)
    .sort((a, b) => b.score - a.score)

  for (const candidate of candidates) {
    const copy = resolveCopy(candidate.payload)
    if (!copy) continue
    return [{
      type: candidate.payload.category,
      subjectId: candidate.subjectId,
      unresolved: candidate.unresolved,
      context: candidate.context,
      sources: candidate.sources,
      voice: copy.voice,
      importance: candidate.importance,
      title: copy.title,
      body: copy.body,
      deepLink: candidate.deepLink,
      score: candidate.score,
      narrativePost: candidate.narrativePost,
    }]
  }
  return []
}
