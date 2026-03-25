import type { SaveGame, Sponsor } from '../entities/SaveGame'
import type { GameEvent, EventChoice, TransferBid } from '../entities/GameEvent'
import type { Fixture } from '../entities/Fixture'
import { InboxItemType } from '../enums'
import { executeTransfer } from './transferService'
import { generateSponsorOffer } from './sponsorService'
import { generatePressConference } from './pressConferenceService'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

// ── Generate events from incoming bids ────────────────────────────────────
function bidReceivedEvent(bid: TransferBid, game: SaveGame): GameEvent {
  const player = game.players.find(p => p.id === bid.playerId)
  const buyingClub = game.clubs.find(c => c.id === bid.buyingClubId)
  const playerName = player ? `${player.firstName} ${player.lastName}` : 'okänd spelare'
  const clubName = buyingClub?.name ?? 'okänd klubb'
  const contractInfo = player
    ? `Kontrakt: ${player.contractUntilSeason - game.currentSeason} säsong(er) kvar`
    : ''
  const mvText = player ? `Marknadsvärde: ${formatValue(player.marketValue ?? 0)}` : ''
  const counterAmount = Math.round(bid.offerAmount * 1.5 / 5000) * 5000

  const choices: EventChoice[] = [
    {
      id: 'accept',
      label: `Acceptera (${formatValue(bid.offerAmount)})`,
      effect: { type: 'acceptTransfer', bidId: bid.id, targetPlayerId: bid.playerId, targetClubId: bid.buyingClubId },
    },
    {
      id: 'counter',
      label: `Kräv mer (${formatValue(counterAmount)})`,
      effect: { type: 'counterOffer', bidId: bid.id, value: counterAmount },
    },
    {
      id: 'reject',
      label: 'Avslå',
      effect: { type: 'rejectTransfer', bidId: bid.id, targetPlayerId: bid.playerId },
    },
  ]

  return {
    id: `event_bid_${bid.id}`,
    type: 'transferBidReceived',
    title: `📨 Transferbud — ${playerName}`,
    body: `${clubName} vill köpa ${playerName} för ${formatValue(bid.offerAmount)}.\n${mvText}\n${contractInfo}`.trim(),
    choices,
    relatedPlayerId: bid.playerId,
    relatedClubId: bid.buyingClubId,
    relatedBidId: bid.id,
    resolved: false,
  }
}

function contractRequestEvent(game: SaveGame, playerId: string): GameEvent {
  const player = game.players.find(p => p.id === playerId)!
  const playerName = `${player.firstName} ${player.lastName}`
  const newSalaryLow = player.salary
  const newSalaryHigh = Math.round(player.salary * 1.2 / 1000) * 1000

  const choices: EventChoice[] = [
    {
      id: 'extend3',
      label: `Förläng 3 år (+20% lön, ${formatValue(newSalaryHigh)}/mån)`,
      effect: { type: 'extendContract', targetPlayerId: playerId, value: newSalaryHigh },
    },
    {
      id: 'extend1',
      label: `Förläng 1 år (samma lön, ${formatValue(newSalaryLow)}/mån)`,
      effect: { type: 'extendContract', targetPlayerId: playerId, value: newSalaryLow },
    },
    {
      id: 'reject',
      label: 'Avslå — vi diskuterar senare',
      effect: { type: 'rejectContract', targetPlayerId: playerId },
    },
  ]

  return {
    id: `event_contract_${playerId}_${game.currentSeason}`,
    type: 'contractRequest',
    title: `📋 Kontraktsförfrågan — ${playerName}`,
    body: `${playerName} vill diskutera ett nytt kontrakt. Nuvarande kontrakt löper ut efter säsong ${player.contractUntilSeason}.`,
    choices,
    relatedPlayerId: playerId,
    resolved: false,
  }
}

function unhappyPlayerEvent(game: SaveGame, playerId: string): GameEvent {
  const player = game.players.find(p => p.id === playerId)!
  const playerName = `${player.firstName} ${player.lastName}`

  const choices: EventChoice[] = [
    {
      id: 'promise',
      label: 'Lova mer speltid',
      effect: { type: 'boostMorale', targetPlayerId: playerId, value: 10 },
    },
    {
      id: 'hold',
      label: 'Behåll linjen',
      effect: { type: 'noOp' },
    },
  ]

  return {
    id: `event_unhappy_${playerId}_${game.currentSeason}`,
    type: 'playerUnhappy',
    title: `😤 Missnöjd spelare — ${playerName}`,
    body: `${playerName} är missnöjd med sin speltid. Morale: ${player.morale}.`,
    choices,
    relatedPlayerId: playerId,
    resolved: false,
  }
}

// ── generatePostAdvanceEvents ──────────────────────────────────────────────
export function generatePostAdvanceEvents(
  game: SaveGame,
  newBids: TransferBid[],
  roundPlayed: number,
  rand: () => number,
  justCompletedFixture?: Fixture,
): GameEvent[] {
  const events: GameEvent[] = []
  const alreadyQueued = new Set((game.pendingEvents ?? []).map(e => e.id))

  // 0. Press conference after managed match
  if (justCompletedFixture) {
    const pressEvent = generatePressConference(justCompletedFixture, game, rand)
    if (pressEvent && !alreadyQueued.has(pressEvent.id)) {
      events.push(pressEvent)
    }
  }

  // 1. Incoming transfer bids → events
  for (const bid of newBids) {
    if (events.length >= 2) break
    const eid = `event_bid_${bid.id}`
    if (!alreadyQueued.has(eid)) {
      events.push(bidReceivedEvent(bid, game))
    }
  }

  // 1b. Re-surface existing pending incoming bids (e.g. after counter-offer)
  const existingPendingBids = (game.transferBids ?? []).filter(
    b => b.direction === 'incoming' && b.status === 'pending',
  )
  for (const bid of existingPendingBids) {
    if (events.length >= 2) break
    const eid = `event_bid_${bid.id}`
    if (!alreadyQueued.has(eid)) {
      events.push(bidReceivedEvent(bid, game))
    }
  }

  if (events.length >= 2) return events

  // 2. Contract requests (CA > 50, < 1 season left, managed club)
  const CONTRACT_ROUNDS = [5, 10, 15, 20]
  if (CONTRACT_ROUNDS.includes(roundPlayed)) {
    const handledIds = new Set(game.handledContractPlayerIds ?? [])
    const contractCandidates = game.players
      .filter(p =>
        p.clubId === game.managedClubId &&
        p.currentAbility > 50 &&
        p.contractUntilSeason <= game.currentSeason + 1 &&
        !handledIds.has(p.id)
      )
      .sort((a, b) => b.currentAbility - a.currentAbility)

    if (contractCandidates.length > 0 && events.length < 2) {
      const p = contractCandidates[0]
      events.push(contractRequestEvent(game, p.id))
    }
  }

  if (events.length >= 2) return events

  // 3. Unhappy players (morale < 35, bänkad 3+ matcher) — simplified check
  const recentFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.roundNumber - a.roundNumber)
    .slice(0, 3)

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId && !p.isInjured)
  for (const p of managedPlayers) {
    if (events.length >= 2) break
    if (p.morale >= 35) continue

    // Check if benched in last 3 matches
    const benchedCount = recentFixtures.filter(f => {
      const lineup = f.homeClubId === game.managedClubId ? f.homeLineup : f.awayLineup
      return lineup && lineup.benchPlayerIds.includes(p.id) && !lineup.startingPlayerIds.includes(p.id)
    }).length

    if (benchedCount >= 2) {
      const eid = `event_unhappy_${p.id}_${game.currentSeason}`
      if (!alreadyQueued.has(eid)) {
        events.push(unhappyPlayerEvent(game, p.id))
      }
    }
  }

  if (events.length >= 2) return events

  // 4. Star performance (8.5+ rating, auto-resolve with morale boost — add as resolved=false with single choice)
  const lastFixture = recentFixtures[0]
  if (lastFixture?.report?.playerRatings && rand() > 0.5) {
    for (const [pid, rating] of Object.entries(lastFixture.report.playerRatings)) {
      if (events.length >= 2) break
      if (rating < 8.5) continue
      const player = game.players.find(p => p.id === pid)
      if (!player || player.clubId !== game.managedClubId) continue
      const eid = `event_star_${pid}_${roundPlayed}`
      if (alreadyQueued.has(eid)) continue

      events.push({
        id: eid,
        type: 'starPerformance',
        title: `⭐ Stjärnprestation — ${player.firstName} ${player.lastName}`,
        body: `${player.firstName} ${player.lastName} fick betyget ${rating.toFixed(1)} senaste matchen. Laget hyllar insatsen.`,
        choices: [
          {
            id: 'ok',
            label: 'Bra jobbat!',
            effect: { type: 'boostMorale', targetPlayerId: pid, value: 5 },
          },
        ],
        relatedPlayerId: pid,
        resolved: false,
      })
      break
    }
  }

  if (events.length >= 2) return events

  // 5. Sponsor offer
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const activeSponsors = (game.sponsors ?? []).filter(s => s.contractRounds > 0)
  const maxSponsors = Math.min(6, 2 + Math.floor((managedClub?.reputation ?? 50) / 20))

  if (activeSponsors.length < maxSponsors) {
    const offer = generateSponsorOffer(
      managedClub?.reputation ?? 50,
      activeSponsors.length,
      maxSponsors,
      roundPlayed,
      rand
    )
    if (offer) {
      const totalValue = offer.weeklyIncome * offer.contractRounds
      const weeklyFmt = offer.weeklyIncome >= 1000
        ? `${Math.round(offer.weeklyIncome / 1000)}k kr`
        : `${offer.weeklyIncome} kr`
      const totalFmt = totalValue >= 1000000
        ? `${(totalValue / 1000000).toFixed(1)} mkr`
        : totalValue >= 1000
        ? `${Math.round(totalValue / 1000)}k kr`
        : `${totalValue} kr`

      events.push({
        id: `event_sponsor_${offer.id}`,
        type: 'sponsorOffer',
        title: `Sponsorerbjudande — ${offer.name}`,
        body: `${offer.name} vill sponsra ${managedClub?.name ?? 'klubben'} med ${weeklyFmt}/vecka i ${offer.contractRounds} omgångar (totalt ${totalFmt}).`,
        relatedPlayerId: undefined,
        relatedClubId: undefined,
        choices: [
          {
            id: 'accept',
            label: `Acceptera (${weeklyFmt}/vecka)`,
            effect: { type: 'acceptSponsor', sponsorData: JSON.stringify(offer) },
          },
          {
            id: 'reject',
            label: 'Avslå',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
        sponsorData: JSON.stringify(offer),
      })
    }
  }

  return events
}

// ── resolveEvent ───────────────────────────────────────────────────────────
export function resolveEvent(
  game: SaveGame,
  eventId: string,
  choiceId: string,
): SaveGame {
  const event = (game.pendingEvents ?? []).find(e => e.id === eventId)
  if (!event) return game

  const choice = event.choices.find(c => c.id === choiceId)
  if (!choice) return game

  // Handle sponsor events by type (not effect)
  if (event.type === 'sponsorOffer') {
    if (choiceId === 'accept' && event.sponsorData) {
      const sponsor: Sponsor = JSON.parse(event.sponsorData)
      return {
        ...game,
        pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
        sponsors: [...(game.sponsors ?? []), sponsor],
      }
    }
    return {
      ...game,
      pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
    }
  }

  const { effect } = choice
  let updated = game

  switch (effect.type) {
    case 'acceptTransfer': {
      const bid = (game.transferBids ?? []).find(b => b.id === effect.bidId)
      if (bid) {
        updated = executeTransfer(game, bid)
      }
      break
    }
    case 'rejectTransfer': {
      updated = {
        ...updated,
        transferBids: (updated.transferBids ?? []).map(b =>
          b.id === effect.bidId ? { ...b, status: 'rejected' as const } : b,
        ),
        players: effect.targetPlayerId
          ? updated.players.map(p =>
              p.id === effect.targetPlayerId
                ? { ...p, morale: Math.max(0, p.morale - 5) }
                : p,
            )
          : updated.players,
      }
      break
    }
    case 'counterOffer': {
      updated = {
        ...updated,
        transferBids: (updated.transferBids ?? []).map(b =>
          b.id === effect.bidId
            ? { ...b, offerAmount: effect.value ?? b.offerAmount, expiresRound: b.expiresRound + 1 }
            : b,
        ),
      }
      break
    }
    case 'extendContract': {
      const pid = effect.targetPlayerId
      if (pid) {
        const player = updated.players.find(p => p.id === pid)
        const years = choice.id === 'extend3' ? 3 : 1
        updated = {
          ...updated,
          players: updated.players.map(p =>
            p.id === pid
              ? {
                  ...p,
                  contractUntilSeason: updated.currentSeason + years,
                  salary: effect.value ?? p.salary,
                  morale: Math.min(100, p.morale + 10),
                }
              : p,
          ),
          handledContractPlayerIds: [...(updated.handledContractPlayerIds ?? []), pid],
        }
        void player
      }
      break
    }
    case 'rejectContract': {
      const pid = effect.targetPlayerId
      if (pid) {
        updated = {
          ...updated,
          players: updated.players.map(p =>
            p.id === pid ? { ...p, morale: Math.max(0, p.morale - 10) } : p,
          ),
          handledContractPlayerIds: [...(updated.handledContractPlayerIds ?? []), pid],
        }
      }
      break
    }
    case 'boostMorale': {
      const pid = effect.targetPlayerId
      if (pid) {
        updated = {
          ...updated,
          players: updated.players.map(p =>
            p.id === pid ? { ...p, morale: Math.min(100, p.morale + (effect.value ?? 5)) } : p,
          ),
        }
      }
      break
    }
    case 'acceptSponsor': {
      const rawData = effect.sponsorData ?? event.sponsorData
      if (rawData) {
        try {
          const sponsor = JSON.parse(rawData)
          if (sponsor.id) {
            updated = {
              ...updated,
              sponsors: [...(updated.sponsors ?? []), sponsor],
            }
          }
        } catch {}
      }
      break
    }
    case 'pressResponse': {
      const moraleBoost = effect.value ?? 0
      updated = {
        ...updated,
        players: updated.players.map(p =>
          p.clubId === updated.managedClubId
            ? { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleBoost)) }
            : p
        ),
      }
      // Add media quote to inbox if present
      if (effect.mediaQuote) {
        const mediaInboxItem = {
          id: `inbox_press_${eventId}_${Date.now()}`,
          date: updated.currentDate,
          type: InboxItemType.Media,
          title: effect.mediaQuote,
          body: '',
          isRead: false,
        }
        updated = {
          ...updated,
          inbox: [...updated.inbox, mediaInboxItem],
        }
      }
      break
    }
    case 'noOp':
    case 'openNegotiation':
    default:
      break
  }

  // Mark event resolved and remove from pendingEvents
  updated = {
    ...updated,
    pendingEvents: (updated.pendingEvents ?? []).filter(e => e.id !== eventId),
  }

  return updated
}
