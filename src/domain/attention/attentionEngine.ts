import type { SaveGame } from '../entities/SaveGame'
import { getNextManagedFixture } from '../services/portal/triggers/matchTriggers'
import type {
  AttentionCategory,
  AttentionEvaluation,
  AttentionImportance,
  AttentionSource,
  AttentionVoice,
  NotificationCandidate,
  OpenLoop,
} from './types'
import {
  narrativePushDrafts,
  type NarrativePushCopyResolver,
} from './narrativePushAdapter'

const FIRST_EVALUATION_DELAY_MS = 18 * 60 * 60 * 1000
const CANDIDATE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

interface CandidateDraft {
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
  narrativePost?: NotificationCandidate['narrativePost']
}

export interface AttentionEvaluationOptions {
  /** Frånvaro är den avsiktliga produktionsgrinden tills copy-registret finns. */
  narrativePushCopy?: NarrativePushCopyResolver
}

export function attentionStateVersion(game: SaveGame): string {
  return `${game.id}:${game.revision ?? 0}:${game.lastSavedAt}`
}

function opponentFor(game: SaveGame, fixture: SaveGame['fixtures'][number]) {
  const opponentId = fixture.homeClubId === game.managedClubId
    ? fixture.awayClubId
    : fixture.homeClubId
  return game.clubs.find(club => club.id === opponentId) ?? null
}

/**
 * Den enda självständiga 1A-källan. Narrativa ämnen får inte skapas här:
 * kalenderankare, säsongsläge och återkomster ska i 1B komma från
 * Berättarens redaktoren()/ledgerTold-agenda (SPEC_BERATTAREN §5 Push).
 */
function stateOpenLoopDrafts(game: SaveGame): CandidateDraft[] {
  const fixture = getNextManagedFixture(game)
  if (!fixture) return []
  const opponent = opponentFor(game, fixture)
  if (!opponent) return []

  const fixtureSource: AttentionSource = { kind: 'fixture', id: fixture.id }
  if (game.lineupConfirmedThisRound === true) return []
  return [{
    type: 'match_preparation',
    subjectId: fixture.id,
    unresolved: ['lineup_not_confirmed'],
    context: { opponentName: opponent.name },
    sources: [fixtureSource],
    voice: 'assistant',
    importance: 'normal',
    title: `En sak inför ${opponent.shortName}.`,
    body: 'Laget är ännu inte bekräftat inför nästa match.',
    deepLink: '/game/match',
    score: 68,
  }]
}

function makeOpenLoop(draft: CandidateDraft, stateVersion: string, evaluatedAt: string): OpenLoop {
  return {
    id: `${draft.type}:${draft.subjectId}`,
    type: draft.type,
    subjectId: draft.subjectId,
    stateVersion,
    createdAt: evaluatedAt,
    lastEvaluatedAt: evaluatedAt,
    unresolved: draft.unresolved,
    context: draft.context,
    sources: draft.sources,
  }
}

function makeCandidate(
  draft: CandidateDraft,
  loop: OpenLoop,
  stateVersion: string,
  evaluatedAt: string,
): NotificationCandidate {
  const evaluatedMs = new Date(evaluatedAt).getTime()
  const dedupeKey = `${draft.type}:${draft.subjectId}`
  return {
    id: `${dedupeKey}:${stateVersion}`,
    openLoopId: loop.id,
    category: draft.type,
    voice: draft.voice,
    importance: draft.importance,
    stateVersion,
    title: draft.title,
    body: draft.body,
    deepLink: draft.deepLink,
    dedupeKey,
    availableAfter: new Date(evaluatedMs + FIRST_EVALUATION_DELAY_MS).toISOString(),
    expiresAt: new Date(evaluatedMs + CANDIDATE_LIFETIME_MS).toISOString(),
    score: draft.score,
    sources: draft.sources,
    narrativePost: draft.narrativePost,
  }
}

export function evaluateAttention(
  game: SaveGame,
  now = new Date(),
  options: AttentionEvaluationOptions = {},
): AttentionEvaluation {
  const evaluatedAt = now.toISOString()
  const stateVersion = attentionStateVersion(game)
  const narrativeDrafts: CandidateDraft[] = options.narrativePushCopy
    ? narrativePushDrafts(game, options.narrativePushCopy).map(draft => ({
        ...draft,
        sources: [{ kind: 'ledger', id: draft.subjectId }],
      }))
    : []
  const drafts = [...stateOpenLoopDrafts(game), ...narrativeDrafts]
  const openLoops = drafts.map(draft => makeOpenLoop(draft, stateVersion, evaluatedAt))
  const candidates = drafts
    .map((draft, index) => makeCandidate(draft, openLoops[index], stateVersion, evaluatedAt))
    .sort((a, b) => b.score - a.score || a.dedupeKey.localeCompare(b.dedupeKey))

  return {
    stateVersion,
    evaluatedAt,
    openLoops,
    candidates,
    badgeCount: candidates.length,
  }
}

/**
 * Värdegrind för browserns egen permission-dialog. Första kompletta veckan
 * betyder här: minst en hanterad match är färdig, Granska har faktiskt
 * besökts och den nya omgångens lag är fortfarande en sann open loop.
 */
export function isNotificationPromptEligible(game: SaveGame): boolean {
  const completedManagedMatches = game.fixtures.filter(fixture =>
    fixture.status === 'completed' &&
    (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId),
  ).length
  if (completedManagedMatches < 1 || !(game.visitedScreensThisRound ?? []).includes('review')) {
    return false
  }
  return evaluateAttention(game).candidates.some(candidate =>
    candidate.category === 'match_preparation',
  )
}
