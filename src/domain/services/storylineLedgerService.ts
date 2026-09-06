import type { SaveGame } from '../entities/SaveGame'
import type { EventLedgerEntry, StorylineEntry, StorylineType } from '../entities/Narrative'
import { logEvent } from './eventLedgerService'
import { semanticKeyStem } from './semanticKeyService'

const STORYLINE_RESOLUTION_PREFIX = 'storyline_resolution:'

const STORYLINE_TYPES = new Set<StorylineType>([
  'rescued_from_unemployment',
  'went_fulltime_pro',
  'workplace_bond',
  'journalist_feud',
  'journalist_redemption',
  'promotion_sacrifice',
  'underdog_season',
  'relegation_escape',
  'gala_winner',
  'captain_rallied_team',
  'hungrig_breakthrough',
  'joker_vindicated',
  'veteran_farewell',
  'veteran_stayed',
  'lokal_hero_moment',
  'contract_drama_resolved',
  'derby_echo_resolved',
])

const STORYLINE_SIGNIFICANCE: Record<StorylineType, number> = {
  underdog_season: 65,
  relegation_escape: 65,
  gala_winner: 60,
  captain_rallied_team: 55,
  promotion_sacrifice: 50,
  hungrig_breakthrough: 50,
  joker_vindicated: 50,
  veteran_farewell: 45,
  veteran_stayed: 45,
  lokal_hero_moment: 45,
  contract_drama_resolved: 40,
  derby_echo_resolved: 35,
  workplace_bond: 40,
  journalist_feud: 40,
  journalist_redemption: 40,
  rescued_from_unemployment: 45,
  went_fulltime_pro: 50,
}

export function storylineResolutionSignificance(type: StorylineType): number {
  return STORYLINE_SIGNIFICANCE[type]
}

export function storylineResolutionSemanticKey(storyline: Pick<StorylineEntry, 'id' | 'type'>): string {
  return `${STORYLINE_RESOLUTION_PREFIX}${storyline.type}:${storyline.id}`
}

export function getStorylineTypeFromLedger(entry: EventLedgerEntry): StorylineType | null {
  if (entry.type !== 'storyline_resolution' || !entry.semanticKey.startsWith(STORYLINE_RESOLUTION_PREFIX)) return null
  const rest = entry.semanticKey.slice(STORYLINE_RESOLUTION_PREFIX.length)
  const separator = rest.indexOf(':')
  if (separator < 1) return null
  const candidate = rest.slice(0, separator) as StorylineType
  return STORYLINE_TYPES.has(candidate) ? candidate : null
}

export function getStorylineIdFromLedger(entry: EventLedgerEntry): string | null {
  const type = getStorylineTypeFromLedger(entry)
  if (!type) return null
  const prefix = `${STORYLINE_RESOLUTION_PREFIX}${type}:`
  const id = entry.semanticKey.slice(prefix.length)
  return id || null
}

export function buildStorylineResolutionLedgerEntry(
  storyline: StorylineEntry,
  globalMatchday: number,
): EventLedgerEntry | null {
  if (!storyline.resolved) return null

  const playerIds = [...new Set([
    ...(storyline.playerId ? [storyline.playerId] : []),
    ...(storyline.playerIds ?? []),
  ])]
  const subject: EventLedgerEntry['subject'] = playerIds[0]
    ? { kind: 'player', id: playerIds[0] }
    : storyline.clubId
      ? { kind: 'club', id: storyline.clubId }
      : undefined
  const subject2: EventLedgerEntry['subject2'] = playerIds[1]
    ? { kind: 'player', id: playerIds[1] }
    : playerIds[0] && storyline.clubId
      ? { kind: 'club', id: storyline.clubId }
      : storyline.relatedClubId
        ? { kind: 'club', id: storyline.relatedClubId }
        : undefined

  return {
    type: 'storyline_resolution',
    semanticKey: storylineResolutionSemanticKey(storyline),
    season: storyline.season,
    matchday: globalMatchday,
    subject,
    subject2,
    outcome: storyline.outcome,
    significance: storylineResolutionSignificance(storyline.type),
  }
}

/**
 * Dual-write only genuine lifecycle transitions: a new resolved entry, or an
 * existing entry changing false→true. Existing historical rows are handled by
 * save migration so an unrelated event never re-dates old history to "today".
 */
export function appendNewlyResolvedStorylines(
  before: SaveGame,
  after: SaveGame,
  globalMatchday = after.currentMatchday,
): SaveGame {
  const beforeById = new Map((before.storylines ?? []).map(storyline => [storyline.id, storyline]))
  const existingKeys = new Set((after.eventLedger ?? [])
    .filter(entry => entry.type === 'storyline_resolution')
    .map(entry => entry.semanticKey))
  let eventLedger = after.eventLedger

  for (const storyline of after.storylines ?? []) {
    if (!storyline.resolved) continue
    const prior = beforeById.get(storyline.id)
    if (prior?.resolved) continue
    const entry = buildStorylineResolutionLedgerEntry(storyline, globalMatchday)
    if (!entry || existingKeys.has(entry.semanticKey)) continue
    eventLedger = logEvent({ ...after, eventLedger }, entry)
    existingKeys.add(entry.semanticKey)
  }

  return eventLedger === after.eventLedger ? after : { ...after, eventLedger }
}

export function getStorylineResolutionEntries(
  game: Pick<SaveGame, 'eventLedger'>,
  season?: number,
): EventLedgerEntry[] {
  const seen = new Set<string>()
  return (game.eventLedger ?? []).filter(entry => {
    if (entry.type !== 'storyline_resolution' || getStorylineTypeFromLedger(entry) === null) return false
    if (season !== undefined && entry.season !== season) return false
    if (seen.has(entry.semanticKey)) return false
    seen.add(entry.semanticKey)
    return true
  })
}

/**
 * Canon determines WHICH resolutions exist. The retained storyline array is
 * only the frozen presentation payload during the strangler migration; entries
 * without a canonical ledger row are deliberately invisible to history views.
 */
export function getResolvedStorylineProjections(game: SaveGame, season?: number): StorylineEntry[] {
  const storylinesById = new Map((game.storylines ?? []).map(storyline => [storyline.id, storyline]))
  return getStorylineResolutionEntries(game, season).flatMap(entry => {
    const id = getStorylineIdFromLedger(entry)
    const type = getStorylineTypeFromLedger(entry)
    const source = id ? storylinesById.get(id) : undefined
    if (!id || !type || !source) return []
    return [{ ...source, id, type, season: entry.season, resolved: true }]
  })
}

export interface PriorStorylineResolutionScope {
  before: { season: number; matchday: number }
  clubId?: string
  subject?: NonNullable<EventLedgerEntry['subject']>
  sameSeasonOnly?: boolean
  resolutionIdSuffix?: string
}

function belongsToClub(entry: EventLedgerEntry, clubId: string): boolean {
  return entry.clubId === clubId
    || (entry.subject?.kind === 'club' && entry.subject.id === clubId)
    || (entry.subject2?.kind === 'club' && entry.subject2.id === clubId)
}

function hasSubjectIdentity(
  entry: EventLedgerEntry,
  type: StorylineType,
  subject: NonNullable<EventLedgerEntry['subject']>,
): boolean {
  const expected = semanticKeyStem(`${type}:${subject.kind}:${subject.id}`)
  return [entry.subject, entry.subject2].some(candidate => candidate
    && semanticKeyStem(`${type}:${candidate.kind}:${candidate.id}`) === expected)
}

/**
 * DOM_ATERFALL_ARCS — räknar kanoniska resolutioner före en given punkt.
 * Typ + strukturerat subject bildar samma tidsrensade identitet över säsonger.
 */
export function countPriorStorylineResolutions(
  game: Pick<SaveGame, 'eventLedger'>,
  type: StorylineType,
  scope: PriorStorylineResolutionScope,
): number {
  return getStorylineResolutionEntries(game).filter(entry => {
    if (getStorylineTypeFromLedger(entry) !== type) return false
    if (scope.sameSeasonOnly && entry.season !== scope.before.season) return false
    if (scope.resolutionIdSuffix && !getStorylineIdFromLedger(entry)?.endsWith(scope.resolutionIdSuffix)) return false
    const isBefore = entry.season < scope.before.season
      || (entry.season === scope.before.season && entry.matchday < scope.before.matchday)
    if (!isBefore) return false
    if (scope.clubId && !belongsToClub(entry, scope.clubId)) return false
    if (scope.subject && !hasSubjectIdentity(entry, type, scope.subject)) return false
    return true
  }).length
}

export function hasPriorStorylineResolution(
  game: Pick<SaveGame, 'eventLedger'>,
  type: StorylineType,
  beforeSeason: number,
  clubId?: string,
): boolean {
  return countPriorStorylineResolutions(game, type, {
    before: { season: beforeSeason, matchday: 0 },
    clubId,
  }) > 0
}
