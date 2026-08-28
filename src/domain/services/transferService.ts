import type { SaveGame } from '../entities/SaveGame'
import type { TransferBid, FollowUp } from '../entities/GameEvent'
import type { Player } from '../entities/Player'
import type { Club } from '../entities/Club'
import { getTransferWindowStatus } from './transferWindowService'
import { InboxItemType } from '../enums'
import { applyFinanceChange, appendFinanceLog, computeContractMinSalary, computeLeaguePositionAverages } from './economyService'
import type { FinanceEntry } from './economyService'
import { getRegionDistance } from '../data/regionGeography'
import { getRivalry } from '../data/rivalries'
import { formatSalary } from '../format'
import { clamp } from '../utils/clamp'

function bidId(round: number, playerId: string, buyingClubId: string): string {
  return `bid_${round}_${playerId}_${buyingClubId}`
}

// DOM_FRAMGANGSKURVAN_2026-08-27, anspråk 2 — "Framgång kostar folk". Jacobs dom:
// budfrekvensen ska skala med klubbens renommé OCH föregående säsongs slutplacering,
// inte ligga på en flat 15%. En nykrönt mästare ska tappa spelare oftare än ett
// mittenlag — priset för att vinna.
//
// positionFactor-trapporna är absoluta placeringstal (1 / 2-3 / 4-6 / 7-9 / 10-12),
// inte proportionella mot totalTeams — matchar Bandy Managers fasta 12-lagsliga.
export function computePositionFactor(finalPosition: number | undefined): number {
  if (typeof finalPosition !== 'number') return 1.0 // ingen data (säsong 1, eller klubben var inte med) — neutralt
  if (finalPosition === 1) return 2.2
  if (finalPosition <= 3) return 1.6
  if (finalPosition <= 6) return 1.2
  if (finalPosition <= 9) return 1.0
  return 0.6 // 10-12, botten
}

export function computeReputationFactor(reputation: number): number {
  return clamp(0.5 + reputation / 100, 0.5, 1.5)
}

/**
 * @cites managedClub.reputation, seasonStartSnapshot.finalPosition
 */
export function computeBidChance(
  managedClub: Club,
  seasonStartSnapshot: { finalPosition: number } | undefined,
  bidMult: number,
): number {
  const positionFactor = computePositionFactor(seasonStartSnapshot?.finalPosition)
  const reputationFactor = computeReputationFactor(managedClub.reputation)
  const successFactor = clamp(positionFactor * reputationFactor, 0.4, 3.0)
  return clamp(0.15 * bidMult * successFactor, 0, 0.6)
}

// Rank-viktat urval — bud ska rikta sig mot klubbens BÄSTA spelare oftare än mot
// en godtycklig spelare i toppskiktet. `candidates` antas redan sorterad fallande
// på currentAbility (bäst = index 0). Harmonisk viktning: vikt(i) = 1/(i+1).
export function weightedPickIndex(poolSize: number, rand: () => number): number {
  if (poolSize <= 1) return 0
  const weights: number[] = []
  let totalWeight = 0
  for (let i = 0; i < poolSize; i++) {
    const w = 1 / (i + 1)
    weights.push(w)
    totalWeight += w
  }
  const r = rand() * totalWeight
  let cumulative = 0
  for (let i = 0; i < poolSize; i++) {
    cumulative += weights[i]
    if (r < cumulative) return i
  }
  return poolSize - 1
}

// WEAK-015 + DEV-004: build a rich narrative body when a historically significant player leaves
interface TransferStoryFlags {
  isCaptain: boolean
  isFanFavorite: boolean
  hasActiveArc: boolean
  isLegend: boolean
  isHomegrown: boolean
}

/**
 * @cites isCaptain, isFanFavorite, isHomegrown, isLegend, hasActiveArc, careerStats.totalGames, careerStats.totalGoals
 */
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

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return []

  // DOM_FRAMGANGSKURVAN_2026-08-27 anspråk 2: bud-chansen skalar med föregående
  // säsongs slutplacering + rykte (computeBidChance), istf en flat 15%.
  // hot_transfer_market-signaturens bidMult är oförändrad, oberoende faktor.
  const bidMult = game.currentSeasonSignature?.modifiers.incomingBidMultiplier ?? 1.0
  const bidChance = computeBidChance(managedClub, game.seasonStartSnapshot, bidMult)
  if (rand() > bidChance) return []

  const managedPlayers = game.players.filter(
    p => p.clubId === game.managedClubId && !p.isInjured,
  )
  if (managedPlayers.length === 0) return []

  // AI targets: high CA, expiring contracts, not the captain
  // Use last played match lineup since pendingLineup is cleared after each advance
  const lastPlayedFixture = [...game.fixtures]
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]
  const lastLineup = lastPlayedFixture?.homeClubId === game.managedClubId
    ? lastPlayedFixture.homeLineup
    : lastPlayedFixture?.awayLineup
  const captainId = lastLineup?.captainPlayerId ?? game.managedClubPendingLineup?.captainPlayerId
  const candidates = managedPlayers
    .filter(p => p.id !== captainId)
    .sort((a, b) => b.currentAbility - a.currentAbility)
    .slice(0, Math.ceil(managedPlayers.length * 0.4))  // top 40%

  if (candidates.length === 0) return []

  // Rank-viktat urval — bud ska rikta sig mot klubbens BÄSTA spelare oftare
  // (DOM_FRAMGANGSKURVAN_2026-08-27 anspråk 2). candidates är redan sorterad
  // fallande på currentAbility, så index 0 = bäst.
  const idx = weightedPickIndex(candidates.length, rand)
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

  // O5 kraft 1 (Jacobs dom 2026-08-17, byggd 2026-08-23): "vad spelarna
  // begär" gäller vid nyförvärv precis som vid förlängning — samma golv-
  // formel som transferActions.ts:s renewContract, skalad mot KÖPANDE
  // klubbs rykte (spelaren är alltid köpare i utgående bud, se kommentaren
  // "Spelaren lägger bud" ovan). Innan detta hade offeredSalary ingen
  // valideringsgräns alls. Prestationsfaktor (DOM_FRAMGANGSKURVAN_2026-08-27,
  // anspråk 1) tillagd 2026-08-27 — computeContractMinSalary (economyService.ts)
  // är nu EN SANNING, ETT STÄLLE för hela golv-formeln.
  const leagueAverages = computeLeaguePositionAverages(game)
  const minSalary = computeContractMinSalary(target, managedClub, leagueAverages)
  if (offeredSalary < minSalary) {
    return { success: false, error: `${target.firstName} tackar nej — kräver minst ${formatSalary(minSalary)}` }
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
      relatedPlayerId: soldPlayer.id,
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

  // Framgångskurvan steg 3 fix (2026-08-28): dedikerad, ocappad säsongsräknare
  // för investSurplus — financeLog-posterna nedan trängs ut av FINANCE_LOG_MAX
  // (50) i en händelserik säsong, se SaveGame.ts's kommentar på fältet.
  // Samma teckenkonvention som FinanceEntry.amount (verifierad ovan): sålt =
  // positivt/intäkt, köpt = negativt/utgift.
  let updatedSeasonNetTransferSpend = game.seasonNetTransferSpend ?? 0
  let updatedFinanceLog = game.financeLog ?? []
  if (isSoldFromManagedClub) {
    const saleEntry: FinanceEntry = {
      round: latestRound,
      amount: offerAmount,
      reason: 'transfer_out',
      label: `Spelarförsäljning — ${soldPlayerName} till ${buyingClubName}`,
    }
    updatedFinanceLog = appendFinanceLog(updatedFinanceLog, saleEntry)
    updatedSeasonNetTransferSpend += offerAmount
  } else if (buyingClubId === game.managedClubId) {
    const buyEntry: FinanceEntry = {
      round: latestRound,
      amount: -offerAmount,
      reason: 'transfer_in',
      label: `Spelarköp — ${soldPlayerName}`,
    }
    updatedFinanceLog = appendFinanceLog(updatedFinanceLog, buyEntry)
    updatedSeasonNetTransferSpend -= offerAmount
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
    seasonNetTransferSpend: updatedSeasonNetTransferSpend,
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

// C-T1 — Returns true if the player agrees to the transfer (after club accepts)
export function playerAcceptsTransfer(
  player: Player,
  buyerClub: Club,
  sellerClub: Club,
  rand: () => number,
): boolean {
  const personality = player.transferPersonality ?? 'default'

  // dream_club check — 100% accept if buyer matches dreamClubId
  if (personality === 'dream_club' && player.dreamClubId === buyerClub.id) return true

  // Base accept rates per personality
  const baseRates: Record<string, number> = {
    homebound: 0.35,
    default: 0.70,
    ambitious: 0.85,
    family: 0.45,
    dream_club: 0.25,  // waiting for dream club — reluctant
  }
  let acceptChance = baseRates[personality] ?? 0.70

  // Geographic bias — uses seller club's region vs buyer club's region
  const dist = getRegionDistance(sellerClub.region, buyerClub.region)
  // homebound/family get extra penalty for distance
  if (dist >= 3) acceptChance *= (personality === 'homebound' || personality === 'family') ? 0.30 : 0.70
  else if (dist >= 2) acceptChance *= (personality === 'homebound' || personality === 'family') ? 0.45 : 0.85
  else if (dist >= 1) acceptChance *= (personality === 'homebound' || personality === 'family') ? 0.60 : 0.93

  // Rivalry bias
  const rivalry = getRivalry(sellerClub.id, buyerClub.id)
  if (rivalry) {
    const rivalPenalty: Record<number, number> = { 1: -0.10, 2: -0.20, 3: -0.30 }
    acceptChance += rivalPenalty[rivalry.intensity] ?? 0
  }

  acceptChance = Math.max(0.05, Math.min(0.95, acceptChance))
  return rand() < acceptChance
}
