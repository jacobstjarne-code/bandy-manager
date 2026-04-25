import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { TransferBid } from '../../../domain/entities/GameEvent'
import type { LoanDeal } from '../../../domain/entities/Academy'
import type { Moment } from '../../../domain/entities/Moment'
import { InboxItemType } from '../../../domain/enums'
import { resolveOutgoingBid, generateIncomingBids, getCounterOfferAmount, executeTransfer } from '../../../domain/services/transferService'
import { getTransferWindowStatus } from '../../../domain/services/transferWindowService'
import { applyFinanceChange } from '../../../domain/services/economyService'

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

  const windowNow = getTransferWindowStatus(newDate)
  const windowClosed = windowNow.status === 'closed'

  const existingBids: TransferBid[] = game.transferBids ?? []
  const resolvedBids: TransferBid[] = existingBids.map(b => {
    // Avbryt utgående bud om transferfönstret stängde sedan budet lades
    if (b.direction === 'outgoing' && b.status === 'pending' && windowClosed) {
      return { ...b, status: 'expired' as const }
    }
    if (b.direction === 'outgoing' && b.status === 'pending' && nextMatchday >= b.expiresRound) {
      const outcome = resolveOutgoingBid(b, game, localRand)
      if (outcome === 'counter') {
        // Counter-offer: keep bid pending but mark counter received, extend expiry by 2
        return { ...b, status: 'pending' as const, counterCount: (b.counterCount ?? 0) + 1, expiresRound: b.expiresRound + 2 }
      }
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

  // Press speculation: existing pending incoming bids generate saga rumours (40% chance per round)
  const existingPendingIncoming = existingBids.filter(
    b => b.direction === 'incoming' && b.status === 'pending' && !newBids.some(nb => nb.id === b.id),
  )
  for (const bid of existingPendingIncoming) {
    if (localRand() > 0.40) continue
    const target = preEventGame.players.find(p => p.id === bid.playerId)
    const buyingClub = preEventGame.clubs.find(c => c.id === bid.buyingClubId)
    if (!target || !buyingClub) continue
    const sagaRumourId = `inbox_saga_speculation_${bid.id}_r${nextMatchday}`
    inboxItems.push({
      id: sagaRumourId,
      date: newDate,
      type: InboxItemType.Media,
      title: `📰 Spekulationer kring ${target.firstName} ${target.lastName}`,
      body: `Medierna skriver om budet från ${buyingClub.name}. ${target.firstName} ${target.lastName} är tyst men omgivningen märker av oro i laget. Affären är ännu olöst.`,
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

    // Fönster stängdes — notifiera om avbrutet bud
    if (bid.status === 'expired' && windowClosed && target) {
      inboxItems.push({
        id: `inbox_bid_window_closed_${bid.id}`,
        date: newDate,
        type: InboxItemType.TransferBidResult,
        title: `Bud på ${target.firstName} ${target.lastName} avbröts`,
        body: `Transferfönstret stängde och budet på ${target.firstName} ${target.lastName} (${sellingClub?.name ?? '?'}) avbröts automatiskt.`,
        isRead: false,
      })
      continue
    }

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
    } else if (bid.counterCount && bid.counterCount > (existingBids.find(b => b.id === bid.id)?.counterCount ?? 0) && target) {
      // Counter-offer notification
      const counter = getCounterOfferAmount(bid, preEventGame)
      inboxItems.push({
        id: `inbox_bid_counter_${bid.id}_c${bid.counterCount}`,
        date: newDate,
        type: InboxItemType.TransferBidResult,
        title: `Motbud — ${target.firstName} ${target.lastName}`,
        body: counter.message + ` Du kan höja ditt bud eller dra tillbaka det.`,
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
      const participationRate = deal.totalMatches > 0 ? deal.matchesPlayed / deal.totalMatches : 0
      const caBoost = participationRate >= 0.75 ? 3 + Math.floor(localRand() * 3)
        : participationRate >= 0.5 ? 1 + Math.floor(localRand() * 2) : 0
      // Merge loan stats into player's season stats on return
      let loanGoals = 0, loanAssists = 0
      for (const r of deal.reports) { loanGoals += r.goals ?? 0; loanAssists += r.assists ?? 0 }
      loanUpdatedPlayers = loanUpdatedPlayers.map(p => {
        if (p.id !== deal.playerId) return p
        const prevStats = p.seasonStats
        const combinedGames = prevStats.gamesPlayed + deal.matchesPlayed
        const combinedRating = combinedGames > 0
          ? (prevStats.averageRating * prevStats.gamesPlayed + deal.averageRating * deal.matchesPlayed) / combinedGames
          : prevStats.averageRating
        const updatedPlayer = {
          ...p,
          isOnLoan: false,
          loanClubName: undefined,
          seasonStats: {
            ...prevStats,
            gamesPlayed: combinedGames,
            goals: prevStats.goals + loanGoals,
            assists: prevStats.assists + loanAssists,
            averageRating: Math.round(combinedRating * 10) / 10,
          },
          careerStats: {
            ...p.careerStats,
            totalGames: p.careerStats.totalGames + deal.matchesPlayed,
            totalGoals: p.careerStats.totalGoals + loanGoals,
            totalAssists: p.careerStats.totalAssists + loanAssists,
          },
        }
        if (caBoost > 0) {
          return {
            ...updatedPlayer,
            currentAbility: Math.min(p.potentialAbility, p.currentAbility + caBoost),
            morale: Math.min(100, (p.morale ?? 50) + 10),
          }
        }
        return updatedPlayer
      })
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

// ── Apply accepted transfer bids (nemesis, mecenat cost-share, sponsor reactions) ──

export interface TransferExecutionInput {
  game: SaveGame
  preEventGame: SaveGame
  players: Player[]
  clubs: Club[]
  resolvedBids: TransferBid[]
  prevBids: TransferBid[]
  nemesisTracker: NonNullable<SaveGame['nemesisTracker']>
  nextMatchday: number
}

export interface TransferExecutionResult {
  players: Player[]
  clubs: Club[]
  nemesisTracker: NonNullable<SaveGame['nemesisTracker']>
  sponsorNetworkMoodDelta: number
  moments: Moment[]
}

export function executeAcceptedTransfers(input: TransferExecutionInput): TransferExecutionResult {
  const { game, preEventGame, resolvedBids, prevBids, nextMatchday } = input
  let players = input.players
  let clubs = input.clubs
  let nemesisTracker = { ...input.nemesisTracker }
  let sponsorNetworkMoodDelta = 0
  const moments: Moment[] = []

  for (const bid of resolvedBids) {
    if (bid.direction !== 'outgoing' || bid.status !== 'accepted') continue
    const wasPending = prevBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue
    const tmpGame = { ...preEventGame, players, clubs }
    const result = executeTransfer(tmpGame, bid)
    players = result.players
    clubs = result.clubs

    const nemesis = nemesisTracker[bid.playerId]
    if (nemesis && nemesis.goalsAgainstUs >= 3) {
      const signedPlayer = players.find(p => p.id === bid.playerId)
      if (signedPlayer) {
        nemesisTracker[bid.playerId] = { ...nemesis, signedBy: game.managedClubId }
        moments.push({
          id: `moment_nemesis_${bid.playerId}_${game.currentSeason}`,
          source: 'nemesis_signed',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${signedPlayer.firstName} ${signedPlayer.lastName} — i rätt färger nu`,
          body: `${nemesis.goalsAgainstUs} mål MOT oss. Nu bär han våra.`,
          subjectPlayerId: bid.playerId,
        })
      }
    }

    if (bid.direction === 'outgoing' && bid.status === 'accepted' && bid.offerAmount > 0) {
      const activeMec = (game.mecenater ?? []).find(m => m.isActive && (m.happiness ?? 50) >= 60 &&
        (m.businessType === 'brukspatron' || m.businessType === 'entrepreneur'))
      if (activeMec) {
        const share = Math.min(50000, Math.round(bid.offerAmount * 0.20))
        clubs = applyFinanceChange(clubs, game.managedClubId, share)
        const boughtPlayer = players.find(p => p.id === bid.playerId)
        moments.push({
          id: `moment_mec_costshare_${bid.playerId}_${nextMatchday}`,
          source: 'mecenat_costshare',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${activeMec.name} täcker 20%`,
          body: `${boughtPlayer ? `${boughtPlayer.firstName} ${boughtPlayer.lastName}` : 'Affären'} blev lite billigare. ${share.toLocaleString('sv-SE')} kr tillbaka i kassan.`,
          subjectPlayerId: boughtPlayer?.id,
        })
      }
    }

    const transferPlayer = players.find(p => p.id === bid.playerId)
    if (transferPlayer) {
      if (bid.direction === 'outgoing' && bid.status === 'accepted' && transferPlayer.currentAbility > 70) {
        sponsorNetworkMoodDelta += 3
        moments.push({
          id: `moment_sponsor_buy_${bid.playerId}_${nextMatchday}`,
          source: 'sponsor_positive',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: 'Sponsornätverket reagerar positivt',
          body: `Huvudsponsorn nöjd med värvningen av ${transferPlayer.firstName} ${transferPlayer.lastName}.`,
          subjectPlayerId: bid.playerId,
        })
      }
    }
  }

  for (const bid of resolvedBids) {
    if (bid.direction !== 'incoming' || bid.status !== 'accepted') continue
    const wasPending = prevBids.find(b => b.id === bid.id)?.status === 'pending'
    if (!wasPending) continue
    const soldPlayer = players.find(p => p.id === bid.playerId)
    const isFavorite = soldPlayer && game.supporterGroup?.favoritePlayerId === bid.playerId
    if (isFavorite) {
      sponsorNetworkMoodDelta -= 5
      moments.push({
        id: `moment_sponsor_sell_${bid.playerId}_${nextMatchday}`,
        source: 'sponsor_negative',
        matchday: nextMatchday,
        season: game.currentSeason,
        title: 'Sponsornätverket oroligt',
        body: `Sponsornätverket oroligt efter stjärnförsäljningen av ${soldPlayer.firstName} ${soldPlayer.lastName}.`,
        subjectPlayerId: bid.playerId,
      })
    }

    if (soldPlayer) {
      const isCaptain = game.captainPlayerId === bid.playerId
      const isFanFavorite = game.supporterGroup?.favoritePlayerId === bid.playerId
      const isLegend = soldPlayer.careerStats.totalGames >= 80
      const isHomegrown = !!(soldPlayer.isHomegrown && soldPlayer.academyClubId === game.managedClubId)
      if (isCaptain || isFanFavorite || isLegend || isHomegrown) {
        const buyerClub = game.clubs.find(c => c.id === bid.buyingClubId)
        const role = isCaptain ? 'kapten' : isFanFavorite ? 'klackfavorit' : isLegend ? 'legend' : 'akademiprodukt'
        moments.push({
          id: `moment_transfer_${bid.playerId}_${nextMatchday}`,
          source: 'transfer_story',
          matchday: nextMatchday,
          season: game.currentSeason,
          title: `${soldPlayer.firstName} ${soldPlayer.lastName} lämnar`,
          body: `Vår ${role} lämnar${buyerClub ? ` till ${buyerClub.name}` : ''}. Det är inte lätt att ta in.`,
          subjectPlayerId: bid.playerId,
          subjectClubId: buyerClub?.id,
        })
      }
    }
  }

  return { players, clubs, nemesisTracker, sponsorNetworkMoodDelta, moments }
}
