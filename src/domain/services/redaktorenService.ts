import type {
  EventLedgerEntry,
  LedgerToldMark,
  NarrativeSurface,
} from '../entities/Narrative'
import type { SaveGame } from '../entities/SaveGame'
import {
  isActiveAnniversaryCandidate,
  momentFamily,
  momentKind,
  type ActiveMemoryKind,
} from './clubMemoryService'
import type { CurrentChronology } from './currentChronology'
import { readClubLedger } from './eventLedgerService'
import { ledgerPostKey, toldMarksFor } from './ledgerToldService'
import { getStorylineTypeFromLedger } from './storylineLedgerService'
import { semanticKeyStem } from './semanticKeyService'

export { semanticKeyStem } from './semanticKeyService'

export type EditorialFamily =
  | 'match'
  | 'facility'
  | 'people'
  | 'relations_money'
  | 'decisions_era'

export type FreshnessQueue = 'since_last' | 'anniversary' | 'background'

export interface EditorialScore {
  significance: number
  freshness: number
  relation: number
  untoldness: number
  total: number
}

export interface AgendaItem {
  post: EventLedgerEntry
  postKey: string
  kind: ActiveMemoryKind
  family: EditorialFamily
  freshnessQueue: FreshnessQueue
  fitsSurfaces: NarrativeSurface[]
  toldBefore: readonly LedgerToldMark[]
  scoresBySurface: Record<NarrativeSurface, EditorialScore>
  /** Högsta ytvikt; konsumenten använder alltid sin egen post i scoresBySurface. */
  editorialWeight: number
}

export interface Agenda {
  chronology: CurrentChronology
  items: AgendaItem[]
}

export const NARRATIVE_SURFACES: NarrativeSurface[] = [
  'portal',
  'efterklang',
  'press',
  'yearbook',
  'review',
  'coffee_room',
  'push',
]

const FAMILY_BY_MEMORY_STAMP: Record<ReturnType<typeof momentFamily>, EditorialFamily> = {
  '⚔️': 'match',
  '🏟️': 'facility',
  '👤': 'people',
  '🤝': 'relations_money',
  '📋': 'decisions_era',
}

const RELATION_FACTOR: Record<EditorialFamily, number> = {
  match: 0.8,
  facility: 1,
  people: 1.4,
  relations_money: 1.4,
  decisions_era: 1,
}

const PRESS_TYPES = new Set<EventLedgerEntry['type']>([
  'referee_feud',
  'patron_withdrawal',
  'mecenat_withdrawal',
  'patron_emerge',
  'era_shift',
  'star_injury',
  'transfer_sold',
  'scandal',
])

const REVIEW_TYPES = new Set<EventLedgerEntry['type']>([
  'transfer_sold',
  'transfer_story',
  'nemesis_signed',
  'player_milestone',
])

function editorialFamily(post: EventLedgerEntry): EditorialFamily {
  const storylineType = getStorylineTypeFromLedger(post)
  if (storylineType === 'journalist_feud' || storylineType === 'journalist_redemption') {
    return 'relations_money'
  }
  return FAMILY_BY_MEMORY_STAMP[momentFamily(post.type)]
}

function fitsSurfaces(post: EventLedgerEntry): NarrativeSurface[] {
  const surfaces: NarrativeSurface[] = ['portal', 'efterklang', 'yearbook', 'push']
  if (PRESS_TYPES.has(post.type)) surfaces.push('press')
  if (REVIEW_TYPES.has(post.type)) surfaces.push('review')
  if (post.subject) surfaces.push('coffee_room')
  return surfaces
}

function isEarlier(a: EventLedgerEntry, b: EventLedgerEntry): boolean {
  return a.season < b.season || (a.season === b.season && a.matchday < b.matchday)
}

function priorStoryPosts(allPosts: readonly EventLedgerEntry[], post: EventLedgerEntry): EventLedgerEntry[] {
  const stem = semanticKeyStem(post.semanticKey)
  return allPosts.filter(candidate =>
    candidate.type === post.type
    && semanticKeyStem(candidate.semanticKey) === stem
    && isEarlier(candidate, post)
  )
}

function inheritedToldMarks(
  game: Pick<SaveGame, 'ledgerTold'>,
  allPosts: readonly EventLedgerEntry[],
  post: EventLedgerEntry,
): readonly LedgerToldMark[] {
  const exact = toldMarksFor(game.ledgerTold, post)
  if (exact.length > 0) return exact

  const prior = priorStoryPosts(allPosts, post)
  if (prior.length === 0) return []
  const priorMax = Math.max(...prior.map(candidate => candidate.significance))
  if (post.significance > priorMax) return [] // eskalering nollställer otaldheten
  return prior.flatMap(candidate => toldMarksFor(game.ledgerTold, candidate))
}

function freshnessFor(post: EventLedgerEntry, chronology: CurrentChronology): {
  queue: FreshnessQueue
  factor: number
} {
  if (isActiveAnniversaryCandidate(post, chronology.season, chronology.matchday)) {
    return { queue: 'anniversary', factor: 1 }
  }

  if (post.season === chronology.season) {
    const age = chronology.matchday - post.matchday
    if (age >= 0 && age <= 4) {
      return { queue: 'since_last', factor: 1 - age * 0.125 }
    }
  }
  return { queue: 'background', factor: 0.2 }
}

function untoldnessFor(marks: readonly LedgerToldMark[], surface: NarrativeSurface): number {
  if (marks.some(mark => mark.surface === surface)) return 0.3
  if (marks.length > 0) return 0.7
  return 1
}

function score(
  post: EventLedgerEntry,
  freshness: number,
  relation: number,
  marks: readonly LedgerToldMark[],
  surface: NarrativeSurface,
): EditorialScore {
  const untoldness = untoldnessFor(marks, surface)
  return {
    significance: post.significance,
    freshness,
    relation,
    untoldness,
    total: post.significance * freshness * relation * untoldness,
  }
}

/**
 * SPEC_BERATTAREN steg 2. Ren urvalsfunktion: inga kvitton skrivs och ingen
 * copy skapas. Varje yta kan därför konsumera samma rankade sanning utan att
 * bli en parallell redaktion.
 */
export function redaktoren(game: SaveGame, chronology: CurrentChronology): Agenda {
  const posts = readClubLedger(game)
  const items = posts.map((post): AgendaItem => {
    const family = editorialFamily(post)
    const relation = RELATION_FACTOR[family]
    const freshness = freshnessFor(post, chronology)
    const toldBefore = inheritedToldMarks(game, posts, post)
    const scoresBySurface = Object.fromEntries(
      NARRATIVE_SURFACES.map(surface => [
        surface,
        score(post, freshness.factor, relation, toldBefore, surface),
      ]),
    ) as Record<NarrativeSurface, EditorialScore>

    return {
      post,
      postKey: ledgerPostKey(post),
      kind: momentKind(post.type, post),
      family,
      freshnessQueue: freshness.queue,
      fitsSurfaces: fitsSurfaces(post),
      toldBefore,
      scoresBySurface,
      editorialWeight: Math.max(...Object.values(scoresBySurface).map(item => item.total)),
    }
  })

  items.sort((a, b) =>
    (b.editorialWeight - a.editorialWeight)
    || (b.post.season - a.post.season)
    || (b.post.matchday - a.post.matchday)
    || a.postKey.localeCompare(b.postKey)
  )
  return { chronology, items }
}

export function agendaForSurface(agenda: Agenda, surface: NarrativeSurface): AgendaItem[] {
  return agenda.items
    .filter(item => item.fitsSurfaces.includes(surface))
    .slice()
    .sort((a, b) =>
      (b.scoresBySurface[surface].total - a.scoresBySurface[surface].total)
      || (b.post.season - a.post.season)
      || (b.post.matchday - a.post.matchday)
      || a.postKey.localeCompare(b.postKey)
    )
}
