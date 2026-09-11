import type { InboxItem, SaveGame } from '../entities/SaveGame'
import { InboxItemType } from '../enums'
import { canLocalPressSpeak, canVoiceSpeak, patronVoiceId, mecenatVoiceId } from './voiceIntroductionService'
import { getInboxGroup } from './inboxPresentationService'

export const MAX_UNREAD_INFORMATIONAL_INBOX = 4
export const MAX_DEFERRED_INBOX = 30
const MAX_DEFERRED_AGE = 4

const ACTIONABLE_TYPES = new Set<InboxItemType>([
  InboxItemType.TransferOffer,
  InboxItemType.TransferBidReceived,
  InboxItemType.ContractExpiring,
  InboxItemType.Injury,
  InboxItemType.Suspension,
  InboxItemType.Retirement,
  InboxItemType.YouthIntake,
  InboxItemType.ScoutReport,
  InboxItemType.TransferDeadline,
  InboxItemType.LicenseReview,
  InboxItemType.EconomicCrisis,
  InboxItemType.Scandal,
  InboxItemType.DecisionRollover,
])

const TOPIC_BY_TYPE: Partial<Record<InboxItemType, 'squad' | 'transfers' | 'club'>> = {
  [InboxItemType.Injury]: 'squad',
  [InboxItemType.Recovery]: 'squad',
  [InboxItemType.Suspension]: 'squad',
  [InboxItemType.PlayerDevelopment]: 'squad',
  [InboxItemType.ContractExpiring]: 'squad',
  [InboxItemType.TransferOffer]: 'transfers',
  [InboxItemType.TransferBidReceived]: 'transfers',
  [InboxItemType.TransferBidResult]: 'transfers',
  [InboxItemType.Transfer]: 'transfers',
  [InboxItemType.TransferRumor]: 'transfers',
  [InboxItemType.TransferDeadline]: 'transfers',
  [InboxItemType.Training]: 'club',
  [InboxItemType.Community]: 'club',
  [InboxItemType.KommunBidrag]: 'club',
  [InboxItemType.SponsorNetwork]: 'club',
  [InboxItemType.PatronInfluence]: 'club',
  [InboxItemType.YouthIntake]: 'club',
  [InboxItemType.YouthP17]: 'club',
  [InboxItemType.AcademyAgedOut]: 'club',
}

function occurrenceKey(item: InboxItem): string {
  return JSON.stringify([
    item.type,
    item.relatedClubId ?? '',
    item.relatedPlayerId ?? '',
    item.relatedFixtureId ?? '',
    item.title.trim(),
    item.body.trim(),
  ])
}

function isRoutineArchiveItem(item: InboxItem): boolean {
  return item.type === InboxItemType.MatchResult
    || (item.type === InboxItemType.Training && (item.injuredPlayerCount ?? 0) === 0)
}

function deliveryPriority(item: InboxItem): number {
  if (ACTIONABLE_TYPES.has(item.type)) return 30
  // These are season-defining news, not decisions, but must reach the player
  // before routine summaries consume the four-row informational budget.
  if (item.id.startsWith('inbox_board_verdict_')) return 20
  if (item.type === InboxItemType.MediaEvent) return 20
  if (item.type === InboxItemType.AcademyAgedOut) return 20
  return 10
}

function topicIsReady(game: SaveGame, item: InboxItem): boolean {
  const topic = TOPIC_BY_TYPE[item.type]
  if (!topic) return true
  return (game.introducedInboxTopics ?? []).includes(topic)
}

function voiceIsReady(game: SaveGame, item: InboxItem, matchday: number): boolean {
  const voiceGame = { ...game, currentMatchday: matchday }
  if (item.voiceId) return canVoiceSpeak(voiceGame, item.voiceId)
  if (item.type === InboxItemType.PatronInfluence) {
    // Legacy notifications lack voiceId: recover only exact producer keys,
    // never guess a person from prose or from the generic notification type.
    const mec = (game.mecenater ?? []).find(m => ['unhappy', 'critical', 'happy', 'new', 'demand']
      .some(kind => item.id.startsWith(`inbox_mec_${kind}_${m.id}_`)))
    if (mec) return canVoiceSpeak(voiceGame, mecenatVoiceId(game.managedClubId, mec.id))
    if (game.patron && item.id.startsWith('inbox_patron_')) {
      return canVoiceSpeak(voiceGame, patronVoiceId(game.managedClubId, game.patron.id))
    }
  }
  if (item.type !== InboxItemType.Media && item.type !== InboxItemType.MediaEvent) return true
  if (!game.journalist) return true
  return canLocalPressSpeak(voiceGame)
}

export interface InboxDeliveryResult {
  inbox: InboxItem[]
  deferredInbox: InboxItem[]
}

/**
 * En enda leveransgrind för omgångens inkorg. Producenterna får rapportera
 * sanningen; här avgörs när den får synas och om den redan har berättats.
 */
export function finalizeInboxDelivery(
  game: SaveGame,
  newItems: readonly InboxItem[],
  chronology: { season: number; matchday: number; leagueRound: number | null; date: string },
): InboxDeliveryResult {
  const requiresResponse = (item: InboxItem) => getInboxGroup(item, game) === 'kräver-svar'
  // Event resolutions can add inbox rows between round ticks. Stamp legacy/
  // direct rows the next time they pass the editor so they can age out instead
  // of remaining unread forever.
  let existing = game.inbox.map(item => ({
    ...item,
    createdSeason: item.createdSeason ?? chronology.season,
    createdMatchday: item.createdMatchday ?? chronology.matchday,
    createdRound: item.createdRound === undefined ? chronology.leagueRound : item.createdRound,
    isRead: isRoutineArchiveItem(item) ? true : item.isRead,
  }))
  // Direct writers also pass the introduction gate; being in game.inbox is
  // not proof that a named speaker or a subject has already been introduced.
  const blockedExisting = existing.filter(item => !topicIsReady(game, item) || !voiceIsReady(game, item, chronology.matchday))
  const blockedIds = new Set(blockedExisting.map(item => item.id))
  existing = existing.filter(item => !blockedIds.has(item.id))

  // The cap is a player-facing unread budget, not merely a producer budget.
  // If a direct writer or an old save already exceeded it, keep the newest
  // informational rows unread and quietly archive the remainder. Actionable
  // deadlines are never touched here.
  const unreadInformational = existing
    .filter(item => !item.isRead && !requiresResponse(item))
    .sort((a, b) => b.date.localeCompare(a.date))
  const archiveIds = new Set(
    unreadInformational.slice(MAX_UNREAD_INFORMATIONAL_INBOX).map(item => item.id),
  )
  if (archiveIds.size > 0) {
    existing = existing.map(item => archiveIds.has(item.id) ? { ...item, isRead: true } : item)
  }
  const existingIds = new Set(existing.map(item => item.id))
  const recentFingerprints = new Set(existing
    .filter(item => {
      const itemSeason = item.createdSeason ?? chronology.season
      const age = chronology.matchday - (item.createdMatchday ?? chronology.matchday)
      return itemSeason === chronology.season && age >= 0 && age < 2
    })
    .map(occurrenceKey))

  const candidates = [...blockedExisting, ...(game.deferredInbox ?? []), ...newItems]
  const unique = new Map<string, InboxItem>()
  for (const raw of candidates) {
    if (existingIds.has(raw.id)) continue
    const item: InboxItem = {
      ...raw,
      date: raw.date || chronology.date,
      createdSeason: raw.createdSeason ?? chronology.season,
      createdMatchday: raw.createdMatchday ?? chronology.matchday,
      createdRound: raw.createdRound === undefined ? chronology.leagueRound : raw.createdRound,
      isRead: isRoutineArchiveItem(raw) ? true : raw.isRead,
    }
    const age = item.createdSeason === chronology.season
      ? chronology.matchday - (item.createdMatchday ?? chronology.matchday)
      : MAX_DEFERRED_AGE
    if (age >= MAX_DEFERRED_AGE) continue
    const key = occurrenceKey(item)
    if (recentFingerprints.has(key) || unique.has(key)) continue
    unique.set(key, item)
  }

  let informationalUnread = existing.filter(item => !item.isRead && !requiresResponse(item)).length
  const delivered: InboxItem[] = []
  const deferred: InboxItem[] = []
  const ordered = [...unique.values()].sort((a, b) => deliveryPriority(b) - deliveryPriority(a))

  for (const item of ordered) {
    if (!topicIsReady(game, item) || !voiceIsReady(game, item, chronology.matchday)) {
      deferred.push(item)
      continue
    }
    const informationalUnreadItem = !item.isRead && !requiresResponse(item)
    if (informationalUnreadItem && informationalUnread >= MAX_UNREAD_INFORMATIONAL_INBOX) {
      // Fresh information should not disappear behind four older rows. Retire
      // the oldest existing informational unread row and let the new one take
      // its place. Once this pass has filled the budget with new rows, defer
      // the rest instead of cycling messages produced at the same moment.
      const replaceable = existing
        .filter(candidate => !candidate.isRead && !requiresResponse(candidate))
        .sort((a, b) => {
          const matchdayDelta = (a.createdMatchday ?? chronology.matchday) - (b.createdMatchday ?? chronology.matchday)
          return matchdayDelta || a.date.localeCompare(b.date)
        })[0]
      if (!replaceable) {
        deferred.push(item)
        continue
      }
      existing = existing.map(candidate => candidate.id === replaceable.id ? { ...candidate, isRead: true } : candidate)
      informationalUnread -= 1
    }
    delivered.push(item)
    recentFingerprints.add(occurrenceKey(item))
    if (informationalUnreadItem) informationalUnread += 1
  }

  const INBOX_GALLRING_ROUNDS = 2
  const INBOX_UNREAD_EXPIRY_ROUNDS = 4
  const gallred = existing.filter(item => {
    if (item.createdMatchday === undefined) return true
    if (item.createdSeason !== undefined && item.createdSeason !== chronology.season) return item.isRead
    const age = chronology.matchday - item.createdMatchday
    if (age < 0) return false
    if (item.isRead) return age < INBOX_GALLRING_ROUNDS
    if (requiresResponse(item)) return true
    return age < INBOX_UNREAD_EXPIRY_ROUNDS
  })

  return {
    inbox: [...gallred, ...delivered]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50),
    deferredInbox: deferred.slice(0, MAX_DEFERRED_INBOX),
  }
}
