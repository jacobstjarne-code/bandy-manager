import type { SaveGame } from '../entities/SaveGame'
import type { TransferBid, FollowUp } from '../entities/GameEvent'
import { getTransferWindowStatus } from './transferWindowService'
import { InboxItemType } from '../enums'
import { applyFinanceChange, appendFinanceLog } from './economyService'
import type { FinanceEntry } from './economyService'

function bidId(round: number, playerId: string, buyingClubId: string): string {
  return `bid_${round}_${playerId}_${buyingClubId}`
}

// WEAK-015 + DEV-004: build a rich narrative body when a historically significant player leaves
interface TransferStoryFlags {
  isCaptain: boolean
  isFanFavorite: boolean
  hasActiveArc: boolean
  isLegend: boolean
  isHomegrown: boolean
}

function buildTransferStory(
  player: import('../entities/Player').Player,
  flags: TransferStoryFlags,
  buyerClub: import('../entities/Club').Club | undefined,
): string {
  const parts: string[] = []
  if (flags.isCaptain) {
    parts.push(`Kaptenen är borta. ${player.firstName} ${player.lastName} tog bindeln sist och gav laget en hållhake hela säsongen.`)
  }
  if (flags.isFanFavorite) {
    parts.push('Klacken är tyst. "Vi förlåter inte det här i första taget" skriver en insändare.')
  }
  if (flags.isHomegrown) {
    parts.push(`${player.firstName} växte upp här. Tränade i vår akademi. Det här är en del av klubbens historia som lämnar.`)
  }
  if (flags.isLegend) {
    parts.push(`${player.careerStats.totalGames} matcher i tröjan. ${player.careerStats.totalGoals} mål. En epok är över.`)
  }
  if (flags.hasActiveArc) {
    parts.push('Berättelsen om honom fick inte ett slut — den klipptes av.')
  }
  parts.push(`Han skrev på för ${buyerClub?.name ?? 'annan klubb'}.`)
  return parts.join(' ')
}

// ── AI-bud på spelarens lag ─────────────────────────────────────────────────
export function generateIncomingBids(
  game: SaveGame,
  currentRound: number,
  rand: () => number,
): TransferBid[] {
  const windowInfo = getTransferWindowStatus(game.currentDate)
  if (windowInfo.status === 'closed') return []

  // Max 1 active incoming bid at a time
  const hasActiveBid = (game.transferBids ?? []).some(
    b => b.direction === 'incoming' && b.status === 'pending',
  )
  if (hasActiveBid) return []

  // 15% chance per round (hot_transfer_market signature can raise this)
  const bidMult = game.currentSeasonSignature?.modifiers.incomingBidMultiplier ?? 1.0
  if (rand() > 0.15 * bidMult) return []

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return []

  const managedPlayers = game.players.filter(
    p => p.clubId === game.managedClubId && !p.isInjured,
  )
  if (managedPlayers.length === 0) return []

  // AI targets: high CA, expiring contracts, not the captain
  // Use last played match lineup since pendingLineup is cleared after each advance
  const lastPlayedFixture = [...game.fixtures]
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.roundNumber - a.roundNumber)[0]
  const lastLineup = lastPlayedFixture?.homeClubId === game.managedClubId
    ? lastPlayedFixture.homeLineup
    : lastPlayedFixture?.awayLineup
  const captainId = lastLineup?.captainPlayerId ?? game.managedClubPendingLineup?.captainPlayerId
  const candidates = managedPlayers
    .filter(p => p.id !== captainId)
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, Math.ceil(managedPlayers.length * 0.4))  // top 40%

  if (candidates.length === 0) return []

  // Pick a candidate — weight towards expiring contracts
  const idx = Math.floor(rand() * candidates.length)
  const targetPlayer = candidates[idx]

  // Pick a buying club that is NOT the managed club
  const otherClubs = game.clubs.filter(c => c.id !== game.managedClubId)
  if (otherClubs.length === 0) return []
  const buyingClub = otherClubs[Math.floor(rand() * otherClubs.length)]

  const marketVal = targetPlayer.marketValue ?? 50000
  const isAcademyProduct = targetPlayer.isHomegrown && targetPlayer.academyClubId === game.managedClubId
  const premiumMultiplier = isAcademyProduct ? 1.2 : 1.0
  const offerAmount = Math.round(marketVal * (0.8 + rand() * 0.6) * premiumMultiplier / 5000) * 5000
  const offeredSalary = Math.round(targetPlayer.salary * (1.1 + rand() * 0.3) / 1000) * 1000

  const bid: TransferBid = {
    id: bidId(currentRound, targetPlayer.id, buyingClub.id),
    playerId: targetPlayer.id,
    buyingClubId: buyingClub.id,
    sellingClubId: game.managedClubId,
    offerAmount,
    offeredSalary,
    contractYears: 3,
    direction: 'incoming',
    status: 'pending',
    createdRound: currentRound,
    expiresRound: currentRound + 3,
  }

  return [bid]
}

// ── Spelaren lägger bud ────────────────────────────────────────────────────
export function createOutgoingBid(
  game: SaveGame,
  playerId: string,
  offerAmount: number,
  offeredSalary: number,
  contractYears: number,
  currentRound: number,
): { success: boolean; error?: string; bid?: TransferBid } {
  const windowInfo = getTransferWindowStatus(game.currentDate)
  if (windowInfo.status === 'closed') {
    return { success: false, error: 'Transferfönstret är stängt' }
  }

  const outgoingCount = (game.transferBids ?? []).filter(
    b => b.direction === 'outgoing' && b.status === 'pending',
  ).length
  if (outgoingCount >= 3) {
    return { success: false, error: 'Du har redan 3 aktiva bud (max)' }
  }

  const target = game.players.find(p => p.id === playerId)
  if (!target) return { success: false, error: 'Spelare hittades inte' }

  // DREAM-011: club legends cannot be transferred out
  if (target.isClubLegend && target.clubId === game.managedClubId) {
    return { success: false, error: 'Klubblegender kan inte säljas' }
  }

  const report = (game.scoutReports ?? {})[playerId]
  if (!report) return { success: false, error: 'Spelaren måste vara scoutad innan du lägger bud' }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return { success: false, error: 'Ingen managed klubb' }

  if (managedClub.transferBudget < offerAmount) {
    return { success: false, error: `Otillräcklig transferbudget (${managedClub.transferBudget.toLocaleString('sv-SE')} kr)` }
  }

  const bid: TransferBid = {
    id: bidId(currentRound, playerId, game.managedClubId),
    playerId,
    buyingClubId: game.managedClubId,
    sellingClubId: target.clubId,
    offerAmount,
    offeredSalary,
    contractYears,
    direction: 'outgoing',
    status: 'pending',
    createdRound: currentRound,
    expiresRound: currentRound + 1,  // answer next round
  }

  return { success: true, bid }
}

// ── AI svarar på spelarens bud ─────────────────────────────────────────────
export type BidResolution = 'accepted' | 'rejected' | 'counter'

export interface CounterOffer {
  amount: number   // what the AI wants instead
  message: string
}

export function resolveOutgoingBid(
  bid: TransferBid,
  game: SaveGame,
  rand: () => number,
): BidResolution {
  const target = game.players.find(p => p.id === bid.playerId)
  if (!target) return 'rejected'

  const marketVal = target.marketValue ?? 50000
  const ratio = bid.offerAmount / marketVal
  const countersDone = bid.counterCount ?? 0

  // Always accept at 120%+ of market value
  if (ratio >= 1.2) return 'accepted'

  // Accept at 90-120% unless player is club's top player
  if (ratio >= 0.9) {
    const sellingClubPlayers = game.players.filter(p => p.clubId === bid.sellingClubId)
    const isTopPlayer = sellingClubPlayers.length > 0 &&
      sellingClubPlayers.sort((a, b) => b.currentAbility - a.currentAbility)[0].id === target.id
    if (!isTopPlayer) return rand() > 0.3 ? 'accepted' : 'rejected'
  }

  // Counter-offer at 70-90%: AI proposes 105% of market if no prior counters
  if (ratio >= 0.7 && countersDone === 0) return 'counter'

  return 'rejected'
}

export function getCounterOfferAmount(bid: TransferBid, game: SaveGame): CounterOffer {
  const target = game.players.find(p => p.id === bid.playerId)
  const marketVal = target?.marketValue ?? 50000
  const counterAmount = Math.round(marketVal * 1.05 / 10000) * 10000
  const sellerClub = game.clubs.find(c => c.id === bid.sellingClubId)
  const sellerName = sellerClub?.shortName ?? sellerClub?.name ?? 'säljarlaget'
  return {
    amount: counterAmount,
    message: `${sellerName} accepterar inte budet. De kräver ${counterAmount.toLocaleString('sv-SE')} kr.`,
  }
}

// ── Genomför transfer ──────────────────────────────────────────────────────
export function executeTransfer(
  game: SaveGame,
  bid: TransferBid,
): SaveGame {
  const { playerId, buyingClubId, sellingClubId, offerAmount, offeredSalary, contractYears } = bid

  // BUG-008: block purchase if managed club would go below -100k
  if (buyingClubId === game.managedClubId) {
    const buyingClub = game.clubs.find(c => c.id === buyingClubId)
    if (buyingClub && buyingClub.finances - offerAmount < -100000) {
      return game
    }
  }

  const updatedPlayers = game.players.map(p => {
    if (p.id !== playerId) return p
    return {
      ...p,
      clubId: buyingClubId,
      salary: offeredSalary,
      contractUntilSeason: game.currentSeason + contractYears,
    }
  })

  const withSquadUpdates = game.clubs.map(c => {
    if (c.id === sellingClubId) {
      return { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== playerId) }
    }
    if (c.id === buyingClubId) {
      return {
        ...c,
        transferBudget: Math.max(0, c.transferBudget - offerAmount),
        squadPlayerIds: [...c.squadPlayerIds, playerId],
      }
    }
    return c
  })
  let updatedClubs = applyFinanceChange(withSquadUpdates, sellingClubId, offerAmount)
  updatedClubs = applyFinanceChange(updatedClubs, buyingClubId, -offerAmount)

  const updatedBids = (game.transferBids ?? []).map(b =>
    b.id === bid.id ? { ...b, status: 'accepted' as const } : b,
  )

  const soldPlayer = game.players.find(p => p.id === playerId)
  const isAcademyProduct = soldPlayer?.isHomegrown && soldPlayer.academyClubId === sellingClubId
  const isSoldFromManagedClub = sellingClubId === game.managedClubId
  const buyerClub = game.clubs.find(c => c.id === buyingClubId)

  // WEAK-015 + DEV-004: rich narrative inbox for historically significant sales
  const storyInboxItems = (() => {
    if (!isSoldFromManagedClub || !soldPlayer) return []
    const isCaptain = game.captainPlayerId === soldPlayer.id
    const isFanFavorite = game.supporterGroup?.favoritePlayerId === soldPlayer.id
    const hasActiveArc = (game.activeArcs ?? []).some(a => a.playerId === soldPlayer.id && a.phase !== 'resolving')
    const isLegend = soldPlayer.careerStats.totalGames >= 80
    const isHomegrown = !!(soldPlayer.isHomegrown && soldPlayer.academyClubId === game.managedClubId)
    const hasHistory = isCaptain || isFanFavorite || hasActiveArc || isLegend || isHomegrown
    if (!hasHistory) return []
    return [{
      id: `transfer_story_${soldPlayer.id}_${game.currentDate}`,
      date: game.currentDate,
      type: InboxItemType.Transfer,
      title: `${soldPlayer.firstName} ${soldPlayer.lastName} lämnar`,
      body: buildTransferStory(soldPlayer, { isCaptain, isFanFavorite, hasActiveArc, isLegend, isHomegrown }, buyerClub),
      isRead: false,
    }]
  })()

  const fanInboxItems = (isAcademyProduct && isSoldFromManagedClub && soldPlayer)
    ? [{
        id: `inbox_fan_academy_sale_${playerId}_${game.currentDate}`,
        date: game.currentDate,
        type: InboxItemType.Media,
        title: `Fans reagerar på försäljningen av ${soldPlayer.firstName} ${soldPlayer.lastName}`,
        body: `Lokaltidningen skriver om missnöjet bland supportrarna efter att ${soldPlayer.firstName} ${soldPlayer.lastName}, en produkt ur egen akademi, säljs till en annan klubb. "Man säljer inte sin framtid," säger supporterklubben.`,
        isRead: false,
      }]
    : []

  const fanMoodPenalty = isAcademyProduct && isSoldFromManagedClub ? -8 : 0

  const latestRound = Math.max(0, ...game.fixtures
    .filter(f => f.status === 'completed')
    .map(f => f.roundNumber),
  )
  const soldPlayerName = soldPlayer ? `${soldPlayer.firstName} ${soldPlayer.lastName}` : 'spelaren'
  const buyingClubName = game.clubs.find(c => c.id === buyingClubId)?.name ?? 'köparklubben'

  let updatedFinanceLog = game.financeLog ?? []
  if (isSoldFromManagedClub) {
    const saleEntry: FinanceEntry = {
      round: latestRound,
      amount: offerAmount,
      reason: 'transfer_out',
      label: `Spelarförsäljning — ${soldPlayerName} till ${buyingClubName}`,
    }
    updatedFinanceLog = appendFinanceLog(updatedFinanceLog, saleEntry)
  } else if (buyingClubId === game.managedClubId) {
    const buyEntry: FinanceEntry = {
      round: latestRound,
      amount: -offerAmount,
      reason: 'transfer_in',
      label: `Spelarköp — ${soldPlayerName}`,
    }
    updatedFinanceLog = appendFinanceLog(updatedFinanceLog, buyEntry)
  }

  // DEV-011: Nemesis becomes lagkamrat — generate diary follow-ups
  const nemesisFollowUps: FollowUp[] = []
  if (buyingClubId === game.managedClubId && soldPlayer) {
    const nemesisKey = Object.keys(game.nemesisTracker ?? {}).find(
      k => (game.nemesisTracker ?? {})[k].playerId === soldPlayer.id
    )
    if (nemesisKey) {
      const currentMatchday = Math.max(0, ...game.fixtures.filter(f => f.status === 'completed').map(f => f.matchday))
      const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'oss'
      const diaryTexts = [
        `${soldPlayer.firstName} anlände idag. Omklädningsrummet var tyst.`,
        `${soldPlayer.firstName} pratade med kaptenen. Någonting lossnade.`,
        `${soldPlayer.firstName}: "Jag har alltid gillat ${clubName}. Det har bara varit på andra sidan."`,
      ]
      diaryTexts.forEach((text, idx) => {
        nemesisFollowUps.push({
          id: `nemesis_diary_${soldPlayer.id}_${idx}`,
          triggerEventId: `nemesis_signed_${soldPlayer.id}`,
          matchdaysDelay: idx + 1,
          createdMatchday: currentMatchday,
          type: 'nemesis_diary',
          data: { text, playerId: soldPlayer.id },
        })
      })
    }
  }

  return {
    ...game,
    players: updatedPlayers,
    clubs: updatedClubs,
    transferBids: updatedBids,
    financeLog: updatedFinanceLog,
    pendingFollowUps: nemesisFollowUps.length > 0
      ? [...(game.pendingFollowUps ?? []), ...nemesisFollowUps]
      : game.pendingFollowUps,
    inbox: (() => {
      const extra = [...storyInboxItems, ...fanInboxItems]
      return extra.length > 0 ? [...extra, ...game.inbox] : game.inbox
    })(),
    fanMood: fanMoodPenalty !== 0 ? Math.max(0, (game.fanMood ?? 50) + fanMoodPenalty) : game.fanMood,
  }
}
