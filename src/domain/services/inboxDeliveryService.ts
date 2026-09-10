import type { InboxItem, SaveGame } from '../entities/SaveGame'
import { InboxItemType } from '../enums'
import { canLocalPressSpeak } from './voiceIntroductionService'

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

function topicIsReady(game: SaveGame, item: InboxItem): boolean {
  const topic = TOPIC_BY_TYPE[item.type]
  if (!topic || ACTIONABLE_TYPES.has(item.type)) return true
  return (game.introducedInboxTopics ?? []).includes(topic)
}

function voiceIsReady(game: SaveGame, item: InboxItem, matchday: number): boolean {
  if (item.type !== InboxItemType.Media && item.type !== InboxItemType.MediaEvent) return true
  if (!game.journalist) return true
  return canLocalPressSpeak({ ...game, currentMatchday: matchday })
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
  const existing = game.inbox.map(item => isRoutineArchiveItem(item) ? { ...item, isRead: true } : item)
  const existingIds = new Set(existing.map(item => item.id))
  const recentFingerprints = new Set(existing
    .filter(item => {
      const itemSeason = item.createdSeason ?? chronology.season
      const age = chronology.matchday - (item.createdMatchday ?? chronology.matchday)
      return itemSeason === chronology.season && age >= 0 && age < 2
    })
    .map(occurrenceKey))

  const candidates = [...(game.deferredInbox ?? []), ...newItems]
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

  let informationalUnread = existing.filter(item => !item.isRead && !ACTIONABLE_TYPES.has(item.type)).length
  const delivered: InboxItem[] = []
  const deferred: InboxItem[] = []
  const ordered = [...unique.values()].sort((a, b) => Number(ACTIONABLE_TYPES.has(b.type)) - Number(ACTIONABLE_TYPES.has(a.type)))

  for (const item of ordered) {
    if (!topicIsReady(game, item) || !voiceIsReady(game, item, chronology.matchday)) {
      deferred.push(item)
      continue
    }
    const informationalUnreadItem = !item.isRead && !ACTIONABLE_TYPES.has(item.type)
    if (informationalUnreadItem && informationalUnread >= MAX_UNREAD_INFORMATIONAL_INBOX) {
      deferred.push(item)
      continue
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
    if (ACTIONABLE_TYPES.has(item.type)) return true
    return age < INBOX_UNREAD_EXPIRY_ROUNDS
  })

  return {
    inbox: [...gallred, ...delivered]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 50),
    deferredInbox: deferred.slice(0, MAX_DEFERRED_INBOX),
  }
}
