import type { SaveGame } from '../entities/SaveGame'
import { currentChronology } from '../services/currentChronology'
import {
  agendaForSurface,
  redaktoren,
  type AgendaItem,
} from '../services/redaktorenService'
import type {
  AttentionCategory,
  AttentionImportance,
  AttentionVoice,
  NarrativePostReference,
} from './types'

const SINCE_LAST_THRESHOLD = 60
const ANNIVERSARY_THRESHOLD = 70

/** Copy-registret äger röst och formulering. Null håller kandidaten stängd. */
export interface NarrativePushCopy {
  title: string
  body: string
  voice: AttentionVoice
}

export type NarrativePushCopyResolver = (
  item: AgendaItem,
  category: AttentionCategory,
) => NarrativePushCopy | null

export interface NarrativePushDraft {
  type: AttentionCategory
  subjectId: string
  unresolved: string[]
  context: Record<string, string | number | boolean>
  voice: AttentionVoice
  importance: AttentionImportance
  title: string
  body: string
  deepLink: string
  score: number
  narrativePost: NarrativePostReference
}

function categoryFor(item: AgendaItem): AttentionCategory {
  if (item.freshnessQueue === 'anniversary') return 'calendar_anchor'
  if (item.family === 'decisions_era') return 'season_context'
  return 'narrative_return'
}

function passesThreshold(item: AgendaItem): boolean {
  const score = item.scoresBySurface.push.total
  if (item.freshnessQueue === 'anniversary') return score >= ANNIVERSARY_THRESHOLD
  if (item.freshnessQueue === 'since_last') return score >= SINCE_LAST_THRESHOLD
  return false
}

/**
 * Berättarens pushadapter: samma agenda, samma rankning och högst ett ämne.
 * Utan ett godkänt copy-resolverresultat produceras ingenting, så infrastrukturen
 * kan landa före `stickiness-copy-roster` utan dold produktionscopy.
 */
export function narrativePushDrafts(
  game: SaveGame,
  resolveCopy: NarrativePushCopyResolver,
): NarrativePushDraft[] {
  const chronology = currentChronology(game)
  const item = agendaForSurface(redaktoren(game, chronology), 'push')
    .find(passesThreshold)
  if (!item) return []

  const category = categoryFor(item)
  const copy = resolveCopy(item, category)
  if (!copy) return []

  return [{
    type: category,
    subjectId: item.postKey,
    unresolved: ['ledger_post_untold_on_push'],
    context: {
      family: item.family,
      freshnessQueue: item.freshnessQueue,
      ledgerType: item.post.type,
    },
    voice: copy.voice,
    importance: item.post.significance >= 90 ? 'major' : 'normal',
    title: copy.title,
    body: copy.body,
    // stickiness-copy-roster (2026-09-06): narrative_return (revansch/
    // ex-spelare) pekar mot nästa match — deep-linken register §4 tillåter
    // ("nästa match eller Krönikan"), och den enda av de två redan
    // allowlistad i public/notification-sw.js (Krönikan har ingen egen
    // route, bara en ClubScreen-flik, inte allowlistad).
    deepLink: category === 'season_context' ? '/game/tabell' : category === 'narrative_return' ? '/game/match' : '/game/dashboard',
    score: item.scoresBySurface.push.total,
    narrativePost: {
      post: {
        type: item.post.type,
        semanticKey: item.post.semanticKey,
        season: item.post.season,
        matchday: item.post.matchday,
      },
      chronology: {
        season: chronology.season,
        matchday: chronology.matchday,
      },
    },
  }]
}
