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
        subtitle: `💰 -${formatValue(raisedAmount)}`,
        effect: { type: 'raiseBid', bidId: bid.id, value: raisedAmount },
      },
      {
        id: 'hold',
        label: 'Stå fast vid ursprungsbudet',
        subtitle: 'Inga effekter',
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
        subtitle: '😊 +15 moral',
        effect: { type: 'boostMorale', targetPlayerId: bid.playerId, value: 15 },
      },
      {
        id: 'accept',
        label: `Acceptera ändå — ${managedClub?.name ?? 'vi'} är rätt val`,
        subtitle: 'Inga effekter',
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
      subtitle: `💰 +${formatValue(bid.offerAmount)} · spelaren lämnar`,
      effect: { type: 'acceptTransfer', bidId: bid.id, targetPlayerId: bid.playerId, targetClubId: bid.buyingClubId },
    },
    ...(canCounter ? [{
      id: 'counter',
      label: `Kräv mer (${formatValue(counterAmount)})`,
      subtitle: `💰 kräver ${formatValue(counterAmount)}`,
      effect: { type: 'counterOffer' as const, bidId: bid.id, value: counterAmount },
    }] : []),
    {
      id: 'reject',
      label: 'Avslå',
      subtitle: 'Spelaren stannar',
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
      subtitle: `💰 ${formatValue(newSalaryHigh)}/mån i 3 år`,
      effect: { type: 'extendContract', targetPlayerId: playerId, value: newSalaryHigh },
    },
    {
      id: 'extend1',
      label: `Förläng 1 år (samma lön, ${formatValue(newSalaryLow)}/mån)`,
      subtitle: `💰 ${formatValue(newSalaryLow)}/mån i 1 år`,
      effect: { type: 'extendContract', targetPlayerId: playerId, value: newSalaryLow },
    },
    {
      id: 'reject',
      label: 'Avslå — vi diskuterar senare',
      subtitle: '⚠️ spelaren kan bli missnöjd',
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
      subtitle: '😊 +10 moral',
      effect: { type: 'boostMorale', targetPlayerId: playerId, value: 10 },
    },
    {
      id: 'hold',
      label: 'Behåll linjen',
      subtitle: 'Inga effekter',
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
        subtitle: '😊 +10 moral',
        effect: { type: 'boostMorale', value: 10, targetPlayerId: player.id },
      },
      {
        id: 'press',
        label: 'Han klarar det',
        subtitle: '😊 -3 moral · risk för skada',
        effect: { type: 'boostMorale', value: -3, targetPlayerId: player.id },
      },
      {
        id: 'goPro',
        label: `Erbjud heltidskontrakt (lön ×1.5 → ${Math.round(player.salary * 1.5).toLocaleString('sv-SE')} kr/mån)`,
        subtitle: `💰 +${Math.round((player.salary * 0.5) / 1000)} tkr/mån · 😊 +15 moral · ⭐ bättre träningseffekt`,
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

// ── Player media comment — unhappy player talks to press ──────────────────
export function generatePlayerMediaEvent(player: Player, journalistName: string): GameEvent {
  const playerName = `${player.firstName} ${player.lastName}`
  return {
    id: `event_media_${player.id}_${Date.now()}`,
    type: 'playerMediaComment',
    title: `📰 ${playerName} till ${journalistName}: "Jag vill spela"`,
    body: `${playerName} har pratat med ${journalistName} och uttryckt frustration över brist på speltid.\n\n"Jag tränar varje dag och gör mitt bästa. Men jag sitter bara på bänken. Det är klart att jag funderar på min framtid."`,
    choices: [
      {
        id: 'talk',
        label: 'Prata med spelaren privat',
        subtitle: '😊 +8 moral',
        effect: { type: 'boostMorale', value: 8, targetPlayerId: player.id },
      },
      {
        id: 'confront',
        label: 'Konfrontera honom om att gå till media',
        subtitle: '😊 -5 moral',
        effect: { type: 'boostMorale', value: -5, targetPlayerId: player.id },
      },
      {
        id: 'ignore',
        label: 'Ignorera — det blåser över',
        subtitle: '😊 -2 moral',
        effect: { type: 'boostMorale', value: -2, targetPlayerId: player.id },
      },
    ],
    relatedPlayerId: player.id,
    resolved: false,
  }
}

// ── Player praise — player praises teammate to media ──────────────────────
export function generatePlayerPraiseEvent(
  praiser: Player,
  praised: Player,
): GameEvent {
  const name1 = `${praiser.firstName} ${praiser.lastName}`
  const name2 = `${praised.firstName} ${praised.lastName}`
  return {
    id: `event_praise_${praiser.id}_${praised.id}`,
    type: 'playerPraise',
    title: `📰 ${name1} om ${name2}: "Bästa jag spelat med"`,
    body: `${name1} berättade för Bandypuls om sitt samarbete med ${name2}.\n\n"Vi har en förståelse på planen som inte kräver ord. ${name2} vet alltid var jag vill ha bollen."`,
    choices: [
      {
        id: 'great',
        label: 'Fint att höra!',
        subtitle: '😊 +3 moral båda',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'boostMorale', value: 3, targetPlayerId: praiser.id },
          { type: 'boostMorale', value: 3, targetPlayerId: praised.id },
        ]) },
      },
    ],
    resolved: false,
  }
}

// ── Captain speech — captain rallies the team after losing streak ─────────
export function generateCaptainSpeechEvent(captain: Player, clubName: string): GameEvent {
  const captainName = `${captain.firstName} ${captain.lastName}`
  return {
    id: `event_captain_speech_s${Date.now()}`,
    type: 'captainSpeech',
    title: `📣 Kaptenen tar ton i omklädningsrummet`,
    body: `${captainName} samlade laget efter träningen:\n\n"Det räcker nu. Vi är bättre än det här. Varenda en av er vet det. Imorgon börjar vi om."\n\nStämningen i ${clubName} har förändrats.`,
    choices: [
      {
        id: 'support',
        label: 'Bra initiativ — det behövdes',
        subtitle: '😊 +5 moral hela laget',
        effect: { type: 'boostMorale', value: 5 },
      },
    ],
    resolved: false,
  }
}

// ── Employer layoff (varsel) event ────────────────────────────────────────
export function generateVarselEvent(
  players: { id: string; firstName: string; lastName: string; dayJob?: { title: string } }[],
  employerName: string,
  season: number,
): GameEvent {
  const names = players.map(p => `${p.firstName} ${p.lastName} (${p.dayJob?.title ?? 'anställd'})`).join(', ')
  return {
    id: `event_varsel_${employerName}_${season}`,
    type: 'varsel',
    title: `Varsel på ${employerName}`,
    body: `${employerName} har meddelat varsel. ${players.length === 1 ? 'En spelare' : `${players.length} spelare`} i truppen berörs: ${names}. De riskerar att förlora jobbet — och kanske behöva flytta.`,
    choices: [
      {
        id: 'support',
        label: 'Stöd spelarna — erbjud extra träning och stöd',
        subtitle: '😊 +5 moral alla · 🤝 laget håller ihop',
        effect: { type: 'boostMorale', value: 5 },
      },
      {
        id: 'offer_pro',
        label: `Erbjud heltidskontrakt åt alla (lönekostnad ×1.5)`,
        subtitle: `💰 höjd lönekostnad · 😊 +15 moral · ⭐ storyline`,
        effect: { type: 'multiEffect', subEffects: JSON.stringify(
          players.map(p => ({ type: 'makeFullTimePro', targetPlayerId: p.id, value: 0 }))
        ) },
      },
      {
        id: 'nothing',
        label: 'Det är tråkigt, men inte vårt problem',
        subtitle: '😊 -8 moral · risk att spelare lämnar',
        effect: { type: 'boostMorale', value: -8 },
      },
    ],
    resolved: false,
    followUpText: `Situationen efter varslet på ${employerName} har stabiliserats. Spelarna har hittat nya lösningar.`,
  }
}

// ── Promotion offer — player's boss offers career advancement ─────────────
export function generatePromotionOfferEvent(player: Player): GameEvent {
  const playerName = `${player.firstName} ${player.lastName}`
  const jobTitle = player.dayJob?.title ?? 'jobbet'
  return {
    id: `event_promotion_${player.id}_${Date.now()}`,
    type: 'dayJobConflict',
    title: `${playerName} erbjuds befordran`,
    body: `${playerName} har erbjudits en befordran som ${jobTitle}. Det innebär mer ansvar, bättre lön — men sämre flexibilitet för bandy. Han behöver ditt råd.`,
    choices: [
      {
        id: 'encourage',
        label: 'Uppmuntra honom — jobbet går först',
        subtitle: '😊 +8 moral',
        effect: { type: 'boostMorale', value: 8, targetPlayerId: player.id },
      },
      {
        id: 'discourage',
        label: 'Be honom tacka nej — bandyn behöver honom',
        subtitle: '😊 -3 moral',
        effect: { type: 'boostMorale', value: -3, targetPlayerId: player.id },
      },
    ],
    relatedPlayerId: player.id,
    resolved: false,
  }
}

// ── Workplace scheduling conflict — specific shift/meeting clash ──────────
export function generateShiftConflictEvent(player: Player, matchRound: number): GameEvent {
  const playerName = `${player.firstName} ${player.lastName}`
  const jobTitle = player.dayJob?.title ?? 'jobbet'
  return {
    id: `event_shift_${player.id}_r${matchRound}`,
    type: 'dayJobConflict',
    title: `Schemakrock för ${playerName}`,
    body: `${playerName} har ett obligatoriskt möte på ${jobTitle} samma dag som nästa match. Han kan inte vara med på uppvärmningen.`,
    choices: [
      {
        id: 'skip_warmup',
        label: 'OK — han ansluter direkt till match',
        subtitle: '😊 -2 moral',
        effect: { type: 'boostMorale', value: -2, targetPlayerId: player.id },
      },
      {
        id: 'bench',
        label: 'Sätt honom på bänken istället',
        subtitle: '😊 -5 moral',
        effect: { type: 'boostMorale', value: -5, targetPlayerId: player.id },
      },
    ],
    relatedPlayerId: player.id,
    resolved: false,
  }
}

// ── Coworker bond — two players who work together develop chemistry ───────
export function generateCoworkerBondEvent(
  player1: Player,
  player2: Player,
  employerName: string,
): GameEvent {
  const name1 = `${player1.firstName} ${player1.lastName}`
  const name2 = `${player2.firstName} ${player2.lastName}`
  return {
    id: `event_bond_${player1.id}_${player2.id}`,
    type: 'communityEvent',
    title: `Arbetskamrater på ${employerName}`,
    body: `${name1} och ${name2} jobbar båda på ${employerName}. De pendlar tillsammans och har börjat träna extra på lunchen. Kemin på planen har blivit bättre.`,
    choices: [
      {
        id: 'great',
        label: 'Fantastiskt — uppmuntra det',
        subtitle: '😊 +5 moral båda',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'boostMorale', value: 5, targetPlayerId: player1.id },
          { type: 'boostMorale', value: 5, targetPlayerId: player2.id },
        ]) },
      },
    ],
    relatedPlayerId: player1.id,
    resolved: false,
  }
}
