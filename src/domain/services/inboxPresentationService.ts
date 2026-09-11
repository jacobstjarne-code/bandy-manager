import type { InboxItem, SaveGame } from '../entities/SaveGame'
import { InboxItemType } from '../enums'

export type InboxGroup = 'kräver-svar' | 'nyheter' | 'rapporter'

/** A notice about a problem is not itself a request awaiting a response. */
export function getInboxGroup(item: InboxItem, game: SaveGame): InboxGroup {
  if (item.type === InboxItemType.TransferBidReceived || item.type === InboxItemType.TransferOffer) {
    const hasOpenBid = (game.transferBids ?? []).some(b => b.playerId === item.relatedPlayerId
      && b.direction === 'incoming' && b.status === 'pending')
    return hasOpenBid ? 'kräver-svar' : 'nyheter'
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
