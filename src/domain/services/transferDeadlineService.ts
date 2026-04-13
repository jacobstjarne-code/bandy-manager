import type { SaveGame, InboxItem } from '../entities/SaveGame'
import { InboxItemType } from '../enums'

export interface DeadlineBid {
  clubId: string
  clubName: string
  playerId: string
  playerName: string
  amount: number
  reason: string
}

const DEADLINE_BID_REASONS = [
  'De behöver en forward desperat',
  'Ersättare för skadad spelare',
  'Lagbygget kräver mer djup',
  'Tränaren har följt spelaren länge',
  'Sista chansen att förstärka truppen',
]

const DEADLINE_DISCOUNT_REASONS = [
  'Han sitter på bänken. Vi vill att han spelar.',
  'Kontraktet löper ut. Vi vill frigöra utrymme.',
  'Tränaren vill ha andra profiler.',
  'Han förtjänar mer speltid än vi kan erbjuda.',
]

export function generateDeadlineBids(game: SaveGame, rand: () => number): DeadlineBid[] {
  // 30% chans per anrop att generera ETT panikbud
  if (rand() > 0.30) return []

  const alreadySeen = new Set(game.resolvedEventIds ?? [])
  const season = game.currentSeason
  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  // Max 2 deadline-bud per transferfönster
  const deadlineBidsThisWindow = (game.resolvedEventIds ?? []).filter(id =>
    id.startsWith(`deadline_bid_${season}`)
  ).length
  if (deadlineBidsThisWindow >= 2) return []

  const bidId = `deadline_bid_${season}_r${currentRound}`
  if (alreadySeen.has(bidId)) return []

  // Välj AI-klubb som budgivare
  const aiClubs = game.clubs.filter(c => c.id !== game.managedClubId)
  if (aiClubs.length === 0) return []
  const biddingClub = aiClubs[Math.floor(rand() * aiClubs.length)]

  // Välj spelare: hög CA, inte favorit hos klacken, >1 säsong kontrakt kvar
  const favPlayerId = game.supporterGroup?.favoritePlayerId
  const candidates = game.players.filter(p =>
    p.clubId === game.managedClubId &&
    p.currentAbility >= 55 &&
    p.id !== favPlayerId &&
    (p.contractUntilSeason ?? 0) > game.currentSeason + 1
  ).sort((a, b) => b.currentAbility - a.currentAbility)

  if (candidates.length === 0) return []
  const target = candidates[Math.floor(rand() * Math.min(3, candidates.length))]

  const marketValue = target.marketValue ?? target.currentAbility * 1500
  const panicPremium = 1.2 + rand() * 0.2  // 20-40% over market
  const amount = Math.round(marketValue * panicPremium / 1000) * 1000

  const reason = DEADLINE_BID_REASONS[Math.floor(rand() * DEADLINE_BID_REASONS.length)]

  return [{
    clubId: biddingClub.id,
    clubName: biddingClub.name,
    playerId: target.id,
    playerName: `${target.firstName} ${target.lastName}`,
    amount,
    reason,
  }]
}

export function generateDiscountOffer(game: SaveGame, rand: () => number): DeadlineBid | null {
  // 25% chans att ett AI-lag erbjuder rabattspelare
  if (rand() > 0.25) return null

  const season = game.currentSeason
  const alreadySeen = new Set(game.resolvedEventIds ?? [])
  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  const offerId = `deadline_offer_${season}_r${currentRound}`
  if (alreadySeen.has(offerId)) return null

  // Hitta AI-spelare på bänken (låg speltid proxy: CA < 60, inte i managed squad)
  const aiPlayers = game.players.filter(p =>
    p.clubId !== game.managedClubId &&
    p.currentAbility >= 45 && p.currentAbility < 65 &&
    !p.isInjured
  )
  if (aiPlayers.length === 0) return null

  const target = aiPlayers[Math.floor(rand() * Math.min(5, aiPlayers.length))]
  const offeringClub = game.clubs.find(c => c.id === target.clubId)
  if (!offeringClub) return null

  const marketValue = target.marketValue ?? target.currentAbility * 1500
  const discount = 0.7 + rand() * 0.1  // 20-30% rabatt
  const amount = Math.round(marketValue * discount / 1000) * 1000

  const reason = DEADLINE_DISCOUNT_REASONS[Math.floor(rand() * DEADLINE_DISCOUNT_REASONS.length)]

  return {
    clubId: offeringClub.id,
    clubName: offeringClub.name,
    playerId: target.id,
    playerName: `${target.firstName} ${target.lastName} (${target.position}, ${target.currentAbility} CA)`,
    amount,
    reason,
  }
}

export function deadlineBidToInbox(bid: DeadlineBid, date: string, round: number, season: number): InboxItem {
  return {
    id: `deadline_bid_${season}_r${round}_${bid.playerId}`,
    date,
    type: InboxItemType.TransferDeadline,
    title: `📬 BUD: ${bid.clubName} erbjuder ${(bid.amount / 1000).toFixed(0)} 000 kr för ${bid.playerName}`,
    body: `"${bid.reason}. Det här är vårt sista erbjudande."\n\nTransferfönstret stänger snart. Acceptera, avvisa eller motbud via Transfers-fliken.`,
    relatedPlayerId: bid.playerId,
    relatedClubId: bid.clubId,
    isRead: false,
  }
}

export function deadlineOfferToInbox(offer: DeadlineBid, date: string, round: number, season: number): InboxItem {
  return {
    id: `deadline_offer_${season}_r${round}_${offer.playerId}`,
    date,
    type: InboxItemType.TransferDeadline,
    title: `📬 ERBJUDANDE: ${offer.clubName} erbjuder ${offer.playerName} för ${(offer.amount / 1000).toFixed(0)} 000 kr`,
    body: `"${offer.reason}"\n\nRabatterat dödlinepris. Se Transfers-fliken för att genomföra affären.`,
    relatedClubId: offer.clubId,
    isRead: false,
  }
}

export function getTransferWindowRoundsLeft(currentLeagueRound: number): number {
  const TRANSFER_WINDOW_CLOSES = 15
  return Math.max(0, TRANSFER_WINDOW_CLOSES - currentLeagueRound)
}
