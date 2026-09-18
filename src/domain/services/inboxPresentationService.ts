import type { InboxItem, SaveGame } from '../entities/SaveGame'
import { InboxItemType } from '../enums'

/** Match the particular bid, not merely another pending bid for the same player. */
export function getOpenIncomingBidForInboxItem(item: InboxItem, game: SaveGame): SaveGame['transferBids'][number] | undefined {
  if (item.type !== InboxItemType.TransferBidReceived && item.type !== InboxItemType.TransferOffer) return undefined
  const bidId = item.relatedBidId ?? (item.id.startsWith('inbox_incoming_bid_') ? item.id.slice('inbox_incoming_bid_'.length) : undefined)
  return (game.transferBids ?? []).find(b => b.direction === 'incoming' && b.status === 'pending'
    && (bidId ? b.id === bidId : b.playerId === item.relatedPlayerId))
}

export type InboxGroup = 'kräver-svar' | 'nyheter' | 'rapporter'

/** Legacy deadline copy is not a bid. Only a notice tied to a real open bid may appear. */
export function isDeliverableInboxItem(item: InboxItem, game: SaveGame): boolean {
  if (item.type !== InboxItemType.TransferDeadline) return true
  return Boolean(item.relatedBidId && (game.transferBids ?? []).some(b =>
    b.id === item.relatedBidId && b.direction === 'incoming' && b.status === 'pending'))
}

/** A notice about a problem is not itself a request awaiting a response. */
export function getInboxGroup(item: InboxItem, game: SaveGame): InboxGroup {
  if (item.type === InboxItemType.TransferBidReceived || item.type === InboxItemType.TransferOffer) {
    return getOpenIncomingBidForInboxItem(item, game) ? 'kräver-svar' : 'nyheter'
  }
  switch (item.type) {
    case InboxItemType.BoardFeedback:
    case InboxItemType.LicenseReview:
    case InboxItemType.ContractExpiring:
    case InboxItemType.Injury:
    case InboxItemType.Suspension:
    case InboxItemType.EconomicCrisis:
    case InboxItemType.Scandal:
    case InboxItemType.Media:
    case InboxItemType.MediaEvent:
    case InboxItemType.Transfer:
    case InboxItemType.TransferRumor:
    case InboxItemType.TransferBidResult:
    case InboxItemType.Community:
    case InboxItemType.KommunBidrag:
    case InboxItemType.PatronInfluence:
    case InboxItemType.YouthIntake:
    case InboxItemType.Recovery:
    case InboxItemType.Derby:
    case InboxItemType.Playoff:
    case InboxItemType.ReputationMilestone:
    case InboxItemType.SponsorNetwork:
    case InboxItemType.BandyLetter:
      return 'nyheter'
    default:
      return 'rapporter'
  }
}
