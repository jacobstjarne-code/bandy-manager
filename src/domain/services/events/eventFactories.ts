import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent, EventChoice, TransferBid } from '../../entities/GameEvent'
import type { Player } from '../../entities/Player'

export function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

// ── Transfer drama events ──────────────────────────────────────────────────
export function bidWarEvent(bid: TransferBid, game: SaveGame): GameEvent {
  const player = game.players.find(p => p.id === bid.playerId)
  const sellingClub = game.clubs.find(c => c.id === bid.sellingClubId)
  const playerName = player ? `${player.firstName} ${player.lastName}` : 'okänd spelare'
  const raisedAmount = Math.round(bid.offerAmount * 1.3 / 5000) * 5000

  return {
    id: `event_bidwar_${bid.id}`,
    type: 'bidWar',
    title: `⚔️ Budkrig — ${playerName}`,
    body: `${sellingClub?.name ?? 'Klubben'} uppges ha fått intresse från ytterligare en klubb för ${playerName}. Vill du höja budet från ${formatValue(bid.offerAmount)} till ${formatValue(raisedAmount)} för att säkra affären?`,
    choices: [
      {
        id: 'raise',
        label: `Höj budet till ${formatValue(raisedAmount)}`,
        effect: { type: 'raiseBid', bidId: bid.id, value: raisedAmount },
      },
      {
        id: 'hold',
        label: 'Stå fast vid ursprungsbudet',
        effect: { type: 'noOp' },
      },
    ],
    relatedPlayerId: bid.playerId,
    relatedBidId: bid.id,
    resolved: false,
  }
}

export function hesitantPlayerEvent(bid: TransferBid, game: SaveGame): GameEvent {
  const player = game.players.find(p => p.id === bid.playerId)
  const playerName = player ? `${player.firstName} ${player.lastName}` : 'okänd spelare'
  const managedClub = game.clubs.find(c => c.id === bid.buyingClubId)

  return {
    id: `event_hesitant_${bid.id}`,
    type: 'hesitantPlayer',
    title: `🤔 Tveksam spelare — ${playerName}`,
    body: `${playerName} är intresserad men tveksam — din klubb är ett steg ner i ambitionsnivå. Vill du lova honom en nyckelroll för att övertala honom?`,
    choices: [
      {
        id: 'convince',
        label: 'Lova en nyckelroll (+moral)',
        effect: { type: 'boostMorale', targetPlayerId: bid.playerId, value: 15 },
      },
      {
        id: 'accept',
        label: `Acceptera ändå — ${managedClub?.name ?? 'vi'} är rätt val`,
        effect: { type: 'noOp' },
      },
    ],
    relatedPlayerId: bid.playerId,
    relatedBidId: bid.id,
    resolved: false,
  }
}

// ── Generate events from incoming bids ────────────────────────────────────
export function bidReceivedEvent(bid: TransferBid, game: SaveGame): GameEvent {
  const player = game.players.find(p => p.id === bid.playerId)
  const buyingClub = game.clubs.find(c => c.id === bid.buyingClubId)
  const playerName = player ? `${player.firstName} ${player.lastName}` : 'okänd spelare'
  const clubName = buyingClub?.name ?? 'okänd klubb'
  const contractInfo = player
    ? `Kontrakt: ${player.contractUntilSeason - game.currentSeason} säsong(er) kvar`
    : ''
  const mvText = player ? `Marknadsvärde: ${formatValue(player.marketValue ?? 0)}` : ''
  const playerMarketVal = player?.marketValue ?? 50000
  const counterAmountRaw = Math.round(bid.offerAmount * 1.3 / 5000) * 5000
  const counterAmount = Math.min(counterAmountRaw, playerMarketVal * 2)
  const canCounter = counterAmount > bid.offerAmount && (bid.counterCount ?? 0) < 2

  const choices: EventChoice[] = [
    {
      id: 'accept',
      label: `Acceptera (${formatValue(bid.offerAmount)})`,
      effect: { type: 'acceptTransfer', bidId: bid.id, targetPlayerId: bid.playerId, targetClubId: bid.buyingClubId },
    },
    ...(canCounter ? [{
      id: 'counter',
      label: `Kräv mer (${formatValue(counterAmount)})`,
      effect: { type: 'counterOffer' as const, bidId: bid.id, value: counterAmount },
    }] : []),
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

export function contractRequestEvent(game: SaveGame, playerId: string): GameEvent {
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

export function unhappyPlayerEvent(game: SaveGame, playerId: string): GameEvent {
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

// ── Day job conflict event ─────────────────────────────────────────────────
export function generateDayJobConflictEvent(player: Player, roundNumber: number): GameEvent {
  const playerName = `${player.firstName} ${player.lastName}`
  const dayJobTitle = player.dayJob?.title ?? 'jobbet'
  const period = Math.floor(roundNumber / 5)

  return {
    id: `event_dayjob_${player.id}_period${period}`,
    type: 'dayJobConflict',
    title: 'Jobbet kolliderar med träningen',
    body: `${playerName} kämpar med att kombinera sin roll som ${dayJobTitle} med det tuffa matchschemat. Något måste ge.`,
    choices: [
      {
        id: 'vila',
        label: 'Ge honom vila',
        effect: { type: 'boostMorale', value: 10, targetPlayerId: player.id },
      },
      {
        id: 'press',
        label: 'Han klarar det',
        effect: { type: 'boostMorale', value: -3, targetPlayerId: player.id },
      },
      {
        id: 'goPro',
        label: `Erbjud heltidskontrakt (lön ×1.5 → ${Math.round(player.salary * 1.5).toLocaleString('sv-SE')} kr/mån)`,
        effect: {
          type: 'makeFullTimePro',
          targetPlayerId: player.id,
          value: Math.round(player.salary * 1.5),
        },
      },
    ],
    relatedPlayerId: player.id,
    resolved: false,
  }
}
