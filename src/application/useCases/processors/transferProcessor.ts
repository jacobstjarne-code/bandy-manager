import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { TransferBid } from '../../../domain/entities/GameEvent'
import type { LoanDeal } from '../../../domain/entities/Academy'
import { InboxItemType } from '../../../domain/enums'
import { resolveOutgoingBid, generateIncomingBids } from '../../../domain/services/transferService'

export interface TransferProcessorResult {
  resolvedBids: TransferBid[]
  newBids: TransferBid[]
  allBids: TransferBid[]
  inboxItems: InboxItem[]
}

export interface LoanProcessorResult {
  loanUpdatedPlayers: Player[]
  updatedClubs: Club[]
  updatedLoanDeals: LoanDeal[]
  inboxItems: InboxItem[]
}

/**
 * Resolves transfer bids for this round, generates new incoming bids,
 * and produces bid-related inbox notifications.
 *
 * The caller must construct preEventGame from game + availabilityUpdatedPlayers + resolvedBids
 * before passing it to event generation.
 *
 * @param availabilityUpdatedPlayers - Players after availability updates
 * @param nextMatchday - The matchday number being processed
 * @param newDate - ISO date string for this round
 * @param localRand - Seeded random function
 */
export function processTransferBids(
  game: SaveGame,
  availabilityUpdatedPlayers: Player[],
  nextMatchday: number,
  newDate: string,
  localRand: () => number,
): TransferProcessorResult {
  const inboxItems: InboxItem[] = []

  const existingBids: TransferBid[] = game.transferBids ?? []
  const resolvedBids: TransferBid[] = existingBids.map(b => {
    if (b.direction === 'outgoing' && b.status === 'pending' && nextMatchday >= b.expiresRound) {
      const outcome = resolveOutgoingBid(b, game, localRand)
      return { ...b, status: outcome }
    }
    if (b.status === 'pending' && nextMatchday >= b.expiresRound) {
      return { ...b, status: 'expired' as const }
    }
    return b
  })

  const preEventGame: SaveGame = {
    ...game,
    players: availabilityUpdatedPlayers,
    transferBids: resolvedBids,
  }

  const newBids = generateIncomingBids(preEventGame, nextMatchday, localRand)
  const allBids: TransferBid[] = [...resolvedBids, ...newBids]

  // Incoming bid notifications
  for (const bid of newBids) {
    if (bid.direction !== 'incoming') continue
    const target = preEventGame.players.find(p => p.id === bid.playerId)
    const buyingClub = preEventGame.clubs.find(c => c.id === bid.buyingClubId)
    if (!target || !buyingClub) continue
    inboxItems.push({
      id: `inbox_incoming_bid_${bid.id}`,
      date: newDate,
      type: InboxItemType.TransferBidReceived,
      title: `Inkommande bud — ${target.firstName} ${target.lastName}`,
      body: `${buyingClub.name} lägger ett bud på ${target.firstName} ${target.lastName}. Erbjuder ${bid.offerAmount.toLocaleString('sv-SE')} kr. Du har tre omgångar på dig att svara.`,
      isRead: false,
    })
  }

  // Transfer rumour: newly active outgoing bids get a 50% chance of inbox rumour
  const newlyActiveBids = resolvedBids.filter(
    b => b.direction === 'outgoing' && b.status === 'pending' && b.createdRound === nextMatchday,
  )
  for (const bid of newlyActiveBids) {
    if (localRand() > 0.50) continue
    const target = game.players.find(p => p.id === bid.playerId)
    const sellingClub = game.clubs.find(c => c.id === bid.sellingClubId)
    if (!target || !sellingClub) continue
    inboxItems.push({
      id: `inbox_rumour_${bid.id}`,
      date: newDate,
      type: InboxItemType.Media,
      title: `📰 Rykten: ${target.firstName} ${target.lastName} på väg?`,
      body: `Det florera rykten om att ${target.firstName} ${target.lastName} från ${sellingClub.name} kan vara på väg mot en ny utmaning. Inga officiella kommentarer ännu.`,
      isRead: false,
    })
  }

  // Bid resolution notifications
  for (const bid of resolvedBids) {
    if (bid.direction !== 'outgoing') continue
    const wasPending = existingBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue

    const target = preEventGame.players.find(p => p.id === bid.playerId)
    const sellingClub = preEventGame.clubs.find(c => c.id === bid.sellingClubId)

    if (bid.status === 'accepted' && target) {
      inboxItems.push({
        id: `inbox_bid_accepted_${bid.id}`,
        date: newDate,
        type: InboxItemType.TransferBidResult,
        title: `Bud accepterat — ${target.firstName} ${target.lastName}`,
        body: `${sellingClub?.name ?? 'Klubben'} accepterar ditt bud på ${target.firstName} ${target.lastName}! Spelaren ansluter till truppen.`,
        isRead: false,
      })
    } else if (bid.status === 'rejected' && target) {
      inboxItems.push({
        id: `inbox_bid_rejected_${bid.id}`,
        date: newDate,
        type: InboxItemType.TransferBidResult,
        title: `Bud avslaget — ${target.firstName} ${target.lastName}`,
        body: `${sellingClub?.name ?? 'Klubben'} avslår ditt bud på ${target.firstName} ${target.lastName}.`,
        isRead: false,
      })
    }
  }

  return { resolvedBids, newBids, allBids, inboxItems }
}

/**
 * Processes active loan deals: ends expired loans (returning players + applying CA boost),
 * updates in-progress loan stats, and returns updated players/clubs/deals + inbox items.
 *
 * @param availabilityUpdatedPlayers - Player list to base loan updates on
 * @param clubs - Current clubs (after economy updates), used to add returned players to squad
 * @param nextMatchday - The matchday number being processed
 * @param newDate - ISO date string for this round
 * @param localRand - Seeded random function
 */
export function processLoans(
  game: SaveGame,
  availabilityUpdatedPlayers: Player[],
  clubs: Club[],
  nextMatchday: number,
  newDate: string,
  localRand: () => number,
): LoanProcessorResult {
  const inboxItems: InboxItem[] = []

  let loanUpdatedPlayers = [...availabilityUpdatedPlayers]
  const activeLoanDeals = (game.loanDeals ?? []).filter(d => nextMatchday <= d.endRound)
  const returnedLoanPlayerIds: string[] = []

  for (const deal of activeLoanDeals) {
    if (nextMatchday >= deal.endRound) {
      returnedLoanPlayerIds.push(deal.playerId)
      loanUpdatedPlayers = loanUpdatedPlayers.map(p =>
        p.id === deal.playerId ? { ...p, isOnLoan: false, loanClubName: undefined } : p,
      )
      const participationRate = deal.totalMatches > 0 ? deal.matchesPlayed / deal.totalMatches : 0
      const caBoost = participationRate >= 0.75 ? 3 + Math.floor(localRand() * 3)
        : participationRate >= 0.5 ? 1 + Math.floor(localRand() * 2) : 0
      if (caBoost > 0) {
        loanUpdatedPlayers = loanUpdatedPlayers.map(p =>
          p.id === deal.playerId
            ? { ...p, currentAbility: Math.min(p.potentialAbility, p.currentAbility + caBoost), morale: Math.min(100, (p.morale ?? 50) + 10) }
            : p,
        )
      }
      const returnedPlayer = loanUpdatedPlayers.find(p => p.id === deal.playerId)
      if (returnedPlayer) {
        const confStr = participationRate >= 0.75 ? 'spelade regelbundet och kom tillbaka stärkt'
          : participationRate >= 0.5 ? 'fick speltid och har utvecklats'
          : 'satt mest på bänken och är lite besviken'
        inboxItems.push({
          id: `inbox_loan_return_${deal.playerId}_${nextMatchday}`,
          date: newDate,
          type: InboxItemType.YouthIntake,
          title: `🏒 ${returnedPlayer.firstName} ${returnedPlayer.lastName} är tillbaka från lån`,
          body: `${returnedPlayer.firstName} ${returnedPlayer.lastName} återvänder från ${deal.destinationClubName}. Han ${confStr}.${caBoost > 0 ? ` CA +${caBoost}.` : ''}`,
          isRead: false,
        })
      }
    }
  }

  // Return loaned players to squad
  const updatedClubs = returnedLoanPlayerIds.length > 0
    ? clubs.map(c => {
        if (c.id !== game.managedClubId) return c
        const newIds = returnedLoanPlayerIds.filter(id => !c.squadPlayerIds.includes(id))
        return newIds.length > 0 ? { ...c, squadPlayerIds: [...c.squadPlayerIds, ...newIds] } : c
      })
    : clubs

  const updatedLoanDeals: LoanDeal[] = (game.loanDeals ?? [])
    .filter(d => !returnedLoanPlayerIds.includes(d.playerId))
    .map(d => {
      if (nextMatchday % 2 === 0 && nextMatchday < d.endRound) {
        const played = localRand() > 0.25
        const rating = played ? Math.round((5 + localRand() * 3) * 10) / 10 : 0
        const goals = played && localRand() > 0.6 ? 1 : 0
        const newMatchesPlayed = d.matchesPlayed + (played ? 1 : 0)
        return {
          ...d,
          matchesPlayed: newMatchesPlayed,
          averageRating: newMatchesPlayed > 0
            ? Math.round(((d.averageRating * d.matchesPlayed + rating) / newMatchesPlayed) * 10) / 10
            : rating,
          reports: [...d.reports.slice(-5), { round: nextMatchday, played, rating, goals, assists: 0 }],
        }
      }
      return d
    })

  return { loanUpdatedPlayers, updatedClubs, updatedLoanDeals, inboxItems }
}
