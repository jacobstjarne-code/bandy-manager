import type { SaveGame, Sponsor, CommunityActivities } from '../entities/SaveGame'
import type { GameEvent, EventChoice, EventEffect, TransferBid } from '../entities/GameEvent'
import type { Player } from '../entities/Player'
import type { Fixture } from '../entities/Fixture'
import { InboxItemType } from '../enums'
import { executeTransfer } from './transferService'
import { generateSponsorOffer } from './sponsorService'
import { generatePressConference } from './pressConferenceService'
import { PATRON_UNHAPPY_QUOTES, PATRON_HAPPY_QUOTES } from '../data/patronData'
import { AGENDA_QUOTES, NEWSPAPER_HEADLINES } from '../data/politicianData'
import { HALL_DEBATE_EVENTS } from '../data/hallDebateData'

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mkr`
  if (v >= 1_000) return `${Math.round(v / 1_000)} tkr`
  return `${v} kr`
}

// ── Transfer drama events ──────────────────────────────────────────────────
function bidWarEvent(bid: TransferBid, game: SaveGame): GameEvent {
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

function hesitantPlayerEvent(bid: TransferBid, game: SaveGame): GameEvent {
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
function bidReceivedEvent(bid: TransferBid, game: SaveGame): GameEvent {
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

// ── generateEvents ─────────────────────────────────────────────────────────
export function generateEvents(
  game: SaveGame,
  currentRound: number,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []
  const alreadyQueued = new Set((game.pendingEvents ?? []).map(e => e.id))
  const ca = game.communityActivities

  // ── Community events ────────────────────────────────────────────────────

  // Kiosk start — round 1, kiosk === 'none'
  if (currentRound === 1 && (ca?.kiosk ?? 'none') === 'none') {
    const eid = 'community_kiosk_start'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Kioskfrågan',
        body: 'Föreningen saknar ordentlig kioskverksamhet. Vill ni starta en enkel kiosk? Det kostar 3 000 kr men ger löpande intäkter.',
        choices: [
          {
            id: 'start',
            label: 'Starta enkel kiosk (−3 000 kr)',
            effect: { type: 'setCommunity', amount: -3000, communityKey: 'kiosk', communityValue: 'basic' },
          },
          {
            id: 'skip',
            label: 'Skippa det',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Kiosk upgrade — round 8, kiosk === 'basic'
  if (currentRound === 8 && ca?.kiosk === 'basic') {
    const eid = 'community_kiosk_upgrade'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Uppgradera kiosken',
        body: 'Kiosken går bra. Ni kan investera i bättre utrustning för 8 000 kr och fördubbla intäkterna.',
        choices: [
          {
            id: 'invest',
            label: 'Investera (−8 000 kr)',
            effect: { type: 'setCommunity', amount: -8000, communityKey: 'kiosk', communityValue: 'upgraded' },
          },
          {
            id: 'keep',
            label: 'Behåll som det är',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Lottery start — round 3, lottery === 'none'
  if (currentRound === 3 && (ca?.lottery ?? 'none') === 'none') {
    const eid = 'community_lottery_start'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Föreningslotten',
        body: 'Kassören föreslår att sälja föreningslotter. Billig att komma igång, ger lite extra varje omgång.',
        choices: [
          {
            id: 'start',
            label: 'Sätt igång (−1 000 kr)',
            effect: { type: 'setCommunity', amount: -1000, communityKey: 'lottery', communityValue: 'basic' },
          },
          {
            id: 'skip',
            label: 'Inte nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Lottery intensive — round 12, lottery === 'basic'
  if (currentRound === 12 && ca?.lottery === 'basic') {
    const eid = 'community_lottery_intensive'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Intensifiera lottförsäljningen',
        body: 'Med en kampanj kan ni sälja mer lotter och öka intäkterna markant — men det kräver mer volontärtid.',
        choices: [
          {
            id: 'push',
            label: 'Kör hårdare (−2 000 kr)',
            effect: { type: 'setCommunity', amount: -2000, communityKey: 'lottery', communityValue: 'intensive' },
          },
          {
            id: 'keep',
            label: 'Behåll lagom nivå',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Julmarknad — round 7, one-time
  if (currentRound === 7 && !ca?.julmarknad) {
    const eid = 'community_julmarknad'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Julmarknad på planen',
        body: `${game.localPaperName ?? 'Lokaltidningen'} föreslår en julmarknad på rinken. Kostar 4 000 men ger 12 000 i intäkter och gott rykte.`,
        choices: [
          {
            id: 'arrange',
            label: 'Arrangera julmarknad',
            effect: { type: 'setCommunity', amount: 8000, communityKey: 'julmarknad', communityValue: 'true' },
          },
          {
            id: 'skip',
            label: 'Inte i år',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Loppis — round 4, 40% chance, one-time
  if (currentRound === 4 && rand() < 0.4) {
    const eid = 'community_loppis'
    if (!alreadyQueued.has(eid)) {
      const loppisAmount = Math.floor(5000 + rand() * 3000)
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Loppis till förmån för laget',
        body: 'Föräldrarna till juniorspelarna vill arrangera en loppis. Kräver en dag men ger 5 000–8 000 kr.',
        choices: [
          {
            id: 'support',
            label: 'Stötta initiativet',
            effect: { type: 'income', amount: loppisAmount },
          },
          {
            id: 'decline',
            label: 'Tack men nej',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Bandyskola — round 2, one-time
  if (currentRound === 2 && !ca?.bandyplay) {
    const eid = 'community_bandyplay'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Bandyskola för barn',
        body: 'Kommunen erbjuder bidrag om ni startar en bandyskola för barn 8–12 år. Ger 6 000/säsong och rekryterar framtida spelare.',
        choices: [
          {
            id: 'start',
            label: 'Starta bandyskolan',
            effect: { type: 'setCommunity', amount: 6000, communityKey: 'bandyplay', communityValue: 'true' },
          },
          {
            id: 'pass',
            label: 'Inte kapacitet just nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Ismaskin — round 10, 40% chance, one-time
  if (currentRound === 10 && rand() < 0.4) {
    const eid = 'community_ismaskin'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Isberedningsmaskin på gång',
        body: 'Isberedningsmaskinens motor börjar krångla. Reparation kostar 15 000 kr. Skjuter ni upp det riskerar ni sämre is.',
        choices: [
          {
            id: 'repair',
            label: 'Reparera nu (−15 000 kr)',
            effect: { type: 'tempFacilities', amount: 1 },
          },
          {
            id: 'postpone',
            label: 'Skjut upp det',
            effect: { type: 'tempFacilities', amount: -1 },
          },
        ],
        resolved: false,
      })
    }
  }

  // Funktionärsdag — round 5, one-time
  if (currentRound === 5 && !ca?.functionaries) {
    const eid = 'community_funktionarsdag'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Rekrytera funktionärer',
        body: 'Föreningen behöver fler funktionärer. En rekryteringsdag kostar 2 000 men ger 15 nya frivilliga och sänker personalkostnader.',
        choices: [
          {
            id: 'arrange',
            label: 'Arrangera rekryteringsdag (−2 000 kr)',
            effect: { type: 'setCommunity', amount: -2000, communityKey: 'functionaries', communityValue: 'true' },
          },
          {
            id: 'skip',
            label: 'Vi klarar oss',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Fikakväll — round 9, 50% chance, one-time
  if (currentRound === 9 && rand() < 0.5) {
    const eid = 'community_fikakväll'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Fikakväll för supportrarna',
        body: 'Arrangera en fikakväll med spelarna. Billigt (500 kr) men höjer fanMood med 8 poäng.',
        choices: [
          {
            id: 'fika',
            label: 'Klart vi fixar fika',
            effect: { type: 'fanMood', amount: 8 },
          },
          {
            id: 'skip',
            label: 'Inte just nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Bilbingo — round 14, 35% chance, one-time
  if (currentRound === 14 && rand() < 0.35) {
    const eid = 'community_bilbingo'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Bilbingo!',
        body: 'Idén om en bilbingo dök upp på styrelsemötet. Kräver lite jobb men kan ge 20 000 kr om det går bra.',
        choices: [
          {
            id: 'go',
            label: 'Vi kör bilbingo',
            effect: { type: 'income', amount: 20000 },
          },
          {
            id: 'pass',
            label: 'För krångligt',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Anläggningsrenovering — round 16, 30% chance, one-time
  if (currentRound === 16 && rand() < 0.3) {
    const eid = 'community_anlaggning'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Anläggningsrenovering',
        body: 'Omklädningsrummen behöver renoveras. Kostar 25 000 men ger +5 reputation och håller spelarna nöjdare.',
        choices: [
          {
            id: 'renovate',
            label: 'Renovera (−25 000 kr)',
            effect: { type: 'reputation', amount: 5 },
          },
          {
            id: 'wait',
            label: 'Får vänta',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // ── Patron events ───────────────────────────────────────────────────────
  const patron = game.patron
  if (patron?.isActive) {
    // Patron unhappy — round 5–10, happiness < 60
    if (currentRound >= 5 && currentRound <= 10 && (patron.happiness ?? 50) < 60) {
      const eid = `patron_unhappy_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_UNHAPPY_QUOTES.length)
        const quote = PATRON_UNHAPPY_QUOTES[quoteIdx]
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} är missnöjd`,
          body: quote,
          choices: [
            {
              id: 'promise',
              label: 'Lova att ta hänsyn',
              effect: { type: 'patronHappiness', amount: 15 },
            },
            {
              id: 'refuse',
              label: 'Jag tar egna beslut',
              effect: { type: 'patronHappiness', amount: -10 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron about to withdraw — round >= 8, happiness < 30
    if (currentRound >= 8 && (patron.happiness ?? 50) < 30) {
      const eid = `patron_withdraw_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} hotar dra sig ur`,
          body: 'Patronen överväger att avsluta sin sponsring. Ni kan försöka rädda relationen med ett möte — eller acceptera förlusten.',
          choices: [
            {
              id: 'meet',
              label: 'Boka ett möte',
              effect: { type: 'patronHappiness', amount: 30 },
            },
            {
              id: 'accept',
              label: 'Acceptera att han/hon lämnar',
              effect: { type: 'patronHappiness', amount: -50 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Patron bonus — round 10–14, happiness > 80
    if (currentRound >= 10 && currentRound <= 14 && (patron.happiness ?? 50) > 80) {
      const eid = `patron_bonus_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const quoteIdx = Math.floor(rand() * PATRON_HAPPY_QUOTES.length)
        const quote = PATRON_HAPPY_QUOTES[quoteIdx]
        events.push({
          id: eid,
          type: 'patronEvent',
          title: `${patron.name} bjuder på bonus`,
          body: `${quote} Patronen skänker 20 000 kr i extra bidrag.`,
          choices: [
            {
              id: 'thank',
              label: 'Tacka varmt',
              effect: { type: 'income', amount: 20000 },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  // ── Politician events ───────────────────────────────────────────────────
  const politician = game.localPolitician
  if (politician) {
    const agenda = politician.agenda
    const rel = politician.relationship ?? 50

    // Youth push — round 4, agenda === 'youth', relationship > 30
    if (currentRound === 4 && agenda === 'youth' && rel > 30) {
      const eid = 'politician_youth'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.youth
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `${politician.name}: Satsa på ungdomen`,
          body: quote,
          choices: [
            {
              id: 'promise',
              label: 'Lova prioritera juniorverksamhet',
              effect: { type: 'politicianRelationship', amount: 15 },
            },
            {
              id: 'decline',
              label: 'Vi fokuserar på a-laget',
              effect: { type: 'politicianRelationship', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Savings — round 6, agenda === 'savings'
    if (currentRound === 6 && agenda === 'savings') {
      const eid = 'politician_savings'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.savings
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `${politician.name}: Kommunen ser över bidragen`,
          body: quote,
          choices: [
            {
              id: 'comply',
              label: 'Presentera budget och sparlöften',
              effect: { type: 'politicianRelationship', amount: 10 },
            },
            {
              id: 'pushback',
              label: 'Ifrågasätt nedskärningarna',
              effect: { type: 'kommunBidragChange', amount: -3000 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Prestige — round 8, agenda === 'prestige'
    if (currentRound === 8 && agenda === 'prestige') {
      const eid = 'politician_prestige'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.prestige
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: 'Kommunen vill synas med laget',
          body: quote,
          choices: [
            {
              id: 'welcome',
              label: 'Välkomna kommunens engagemang',
              effect: { type: 'kommunBidragChange', amount: 8000 },
            },
            {
              id: 'independent',
              label: 'Behåll föreningens självständighet',
              effect: { type: 'politicianRelationship', amount: -8 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Inclusion — round 5, agenda === 'inclusion'
    if (currentRound === 5 && agenda === 'inclusion') {
      const eid = 'politician_inclusion'
      if (!alreadyQueued.has(eid)) {
        const quotes = AGENDA_QUOTES.inclusion
        const quote = quotes[Math.floor(rand() * quotes.length)]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: `${politician.name}: Bandy för alla`,
          body: quote,
          choices: [
            {
              id: 'start_program',
              label: 'Starta inkluderingsprogram',
              effect: { type: 'kommunBidragChange', amount: 6000 },
            },
            {
              id: 'already_open',
              label: 'Vi är redan öppna för alla',
              effect: { type: 'politicianRelationship', amount: -5 },
            },
          ],
          resolved: false,
        })
      }
    }

    // Low relationship warning — round >= 10, relationship < 30
    if (currentRound >= 10 && rel < 30) {
      const eid = `politician_warning_r${currentRound}`
      if (!alreadyQueued.has(eid)) {
        const headlineIdx = Math.floor(rand() * NEWSPAPER_HEADLINES.length)
        const headline = NEWSPAPER_HEADLINES[headlineIdx]
        events.push({
          id: eid,
          type: 'politicianEvent',
          title: 'Kommunbidragen ifrågasätts',
          body: headline,
          choices: [
            {
              id: 'invite',
              label: 'Bjud in politikern till en match',
              effect: { type: 'politicianRelationship', amount: 20 },
            },
            {
              id: 'low_profile',
              label: 'Håll låg profil',
              effect: { type: 'noOp' },
            },
          ],
          resolved: false,
        })
      }
    }
  }

  // ── Hall debate events ──────────────────────────────────────────────────
  const hasIndoorRival = game.clubs.some(
    c => c.id !== game.managedClubId && c.hasIndoorArena === true
  )
  const hallDebateCount = game.hallDebateCount ?? 0
  const lastHallDebateRound = game.lastHallDebateRound ?? 0

  if (hasIndoorRival && hallDebateCount < 3) {
    const debatesByRound: Array<{ round: number; key: keyof typeof HALL_DEBATE_EVENTS; id: string }> = [
      { round: 3, key: 'kommunenFrågar', id: 'hall_kommunen_fragar' },
      { round: 9, key: 'styrelseSplittrad', id: 'hall_styrelse_splittrad' },
      { round: 15, key: 'spelarePerspektiv', id: 'hall_spelare_perspektiv' },
    ]

    for (const entry of debatesByRound) {
      if (
        currentRound === entry.round &&
        !alreadyQueued.has(entry.id) &&
        (currentRound - lastHallDebateRound) >= 3
      ) {
        const debateData = HALL_DEBATE_EVENTS[entry.key]
        const bodyIdx = Math.floor(rand() * debateData.bodyVariants.length)
        const body = debateData.bodyVariants[bodyIdx]

        // Map string effects from data to proper EventEffect objects
        const choices: EventChoice[] = debateData.choices.map(c => {
          const effectsStr = c.effects ?? ''
          let effect: EventEffect = { type: 'noOp' }

          if (effectsStr.includes('politicianRelationship')) {
            const match = effectsStr.match(/politicianRelationship ([+-]\d+)/)
            if (match) {
              effect = { type: 'politicianRelationship', amount: parseInt(match[1], 10) }
            }
          } else if (effectsStr.includes('facilitiesUpgrade')) {
            effect = { type: 'facilitiesUpgrade', amount: 1 }
          } else if (effectsStr.includes('fanMood')) {
            const match = effectsStr.match(/fanMood ([+-]\d+)/)
            if (match) {
              effect = { type: 'fanMood', amount: parseInt(match[1], 10) }
            }
          } else if (effectsStr.includes('finances')) {
            const match = effectsStr.match(/finances ([+-]\d+)/)
            if (match) {
              effect = { type: 'income', amount: parseInt(match[1], 10) }
            }
          }

          return {
            id: c.id,
            label: c.label,
            effect,
          }
        })

        events.push({
          id: entry.id,
          type: 'hallDebate',
          title: debateData.title,
          body,
          choices,
          resolved: false,
        })
        break // only one hall debate event per call to generateEvents
      }
    }
  }

  return events
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
    if (alreadyQueued.has(eid)) continue
    if ((bid.counterCount ?? 0) >= 1) {
      // AI responds to counter — accept if ≥1.5x market value, otherwise withdraw
      const player = game.players.find(p => p.id === bid.playerId)
      const marketVal = player?.marketValue ?? 50000
      const buyingClub = game.clubs.find(c => c.id === bid.buyingClubId)
      const clubName = buyingClub?.name ?? 'Köparklubben'
      const playerName = player ? `${player.firstName} ${player.lastName}` : 'spelaren'
      if (bid.offerAmount >= marketVal * 1.5) {
        events.push({
          id: `event_bid_aiaccept_${bid.id}`,
          type: 'transferBidReceived',
          title: `${clubName} accepterar din motbud`,
          body: `${clubName} godkänner det höjda kravet på ${formatValue(bid.offerAmount)} för ${playerName}. Bekräfta försäljningen.`,
          choices: [{
            id: 'confirm',
            label: `Genomför transfer (${formatValue(bid.offerAmount)})`,
            effect: { type: 'acceptTransfer', bidId: bid.id, targetPlayerId: bid.playerId, targetClubId: bid.buyingClubId },
          }],
          relatedPlayerId: bid.playerId,
          relatedBidId: bid.id,
          resolved: false,
        })
      } else {
        events.push({
          id: `event_bid_aireject_${bid.id}`,
          type: 'transferBidReceived',
          title: `${clubName} drar sig ur`,
          body: `${clubName} accepterar inte din prissättning på ${formatValue(bid.offerAmount)} för ${playerName} och drar tillbaka budet.`,
          choices: [{
            id: 'ok',
            label: 'OK',
            effect: { type: 'rejectTransfer', bidId: bid.id, targetPlayerId: bid.playerId },
          }],
          relatedPlayerId: bid.playerId,
          relatedBidId: bid.id,
          resolved: false,
        })
      }
    } else {
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

  // 5. Day job conflict
  if (events.length < 2) {
    const recentCompleted = game.fixtures
      .filter(f =>
        f.status === 'completed' &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      )
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, 5)

    const dayJobCandidates = game.players.filter(p =>
      p.clubId === game.managedClubId &&
      !p.isInjured &&
      !(p.isFullTimePro ?? false) &&
      (p.dayJob?.flexibility ?? 75) < 70
    )

    for (const p of dayJobCandidates) {
      if (events.length >= 2) break
      const gamesInLast5 = recentCompleted.filter(f => {
        const lineup = f.homeClubId === game.managedClubId ? f.homeLineup : f.awayLineup
        return lineup && lineup.startingPlayerIds.includes(p.id)
      }).length
      if (gamesInLast5 >= 3) {
        const period = Math.floor(roundPlayed / 5)
        const eid = `event_dayjob_${p.id}_period${period}`
        if (!alreadyQueued.has(eid)) {
          events.push(generateDayJobConflictEvent(p, roundPlayed))
        }
      }
    }
  }

  if (events.length >= 2) return events

  // 6a. Bid war (pending outgoing bid, 20% chance per round)
  const pendingOutgoing = (game.transferBids ?? []).filter(
    b => b.direction === 'outgoing' && b.status === 'pending'
  )
  for (const bid of pendingOutgoing) {
    if (events.length >= 2) break
    if (rand() > 0.20) continue
    const eid = `event_bidwar_${bid.id}`
    if (!alreadyQueued.has(eid)) {
      events.push(bidWarEvent(bid, game))
    }
  }

  if (events.length >= 2) return events

  // 6b. Hesitant player (outgoing bid just resolved as accepted, player CA > club avg)
  const justAccepted = (game.transferBids ?? []).filter(
    b => b.direction === 'outgoing' && b.status === 'accepted' && b.expiresRound === roundPlayed
  )
  if (justAccepted.length > 0) {
    const managedPlayersForHesitant = game.players.filter(p => p.clubId === game.managedClubId)
    const avgCA = managedPlayersForHesitant.length > 0
      ? managedPlayersForHesitant.reduce((s, p) => s + p.currentAbility, 0) / managedPlayersForHesitant.length
      : 0
    for (const bid of justAccepted) {
      if (events.length >= 2) break
      const target = game.players.find(p => p.id === bid.playerId)
      if (!target || target.currentAbility <= avgCA) continue
      const eid = `event_hesitant_${bid.id}`
      if (!alreadyQueued.has(eid)) {
        events.push(hesitantPlayerEvent(bid, game))
      }
    }
  }

  if (events.length >= 2) return events

  // 6. Sponsor offer
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
  let updatedGame = game

  switch (effect.type) {
    case 'acceptTransfer': {
      const bid = (game.transferBids ?? []).find(b => b.id === effect.bidId)
      if (bid) {
        updatedGame = executeTransfer(game, bid)
      }
      break
    }
    case 'rejectTransfer': {
      updatedGame = {
        ...updatedGame,
        transferBids: (updatedGame.transferBids ?? []).map(b =>
          b.id === effect.bidId ? { ...b, status: 'rejected' as const } : b,
        ),
        players: effect.targetPlayerId
          ? updatedGame.players.map(p =>
              p.id === effect.targetPlayerId
                ? { ...p, morale: Math.max(0, p.morale - 5) }
                : p,
            )
          : updatedGame.players,
      }
      break
    }
    case 'counterOffer': {
      const currentBid = (updatedGame.transferBids ?? []).find(b => b.id === effect.bidId)
      const currentCount = currentBid?.counterCount ?? 0
      if (currentCount >= 2) {
        // Third attempt — AI gives up
        updatedGame = {
          ...updatedGame,
          transferBids: (updatedGame.transferBids ?? []).map(b =>
            b.id === effect.bidId ? { ...b, status: 'rejected' as const } : b,
          ),
        }
      } else {
        updatedGame = {
          ...updatedGame,
          transferBids: (updatedGame.transferBids ?? []).map(b =>
            b.id === effect.bidId
              ? {
                  ...b,
                  offerAmount: effect.value ?? b.offerAmount,
                  expiresRound: b.expiresRound + 1,
                  counterCount: currentCount + 1,
                }
              : b,
          ),
        }
      }
      break
    }
    case 'extendContract': {
      const pid = effect.targetPlayerId
      if (pid) {
        const player = updatedGame.players.find(p => p.id === pid)
        const years = choice.id === 'extend3' ? 3 : 1
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid
              ? {
                  ...p,
                  contractUntilSeason: updatedGame.currentSeason + years,
                  salary: effect.value ?? p.salary,
                  morale: Math.min(100, p.morale + 10),
                }
              : p,
          ),
          handledContractPlayerIds: [...(updatedGame.handledContractPlayerIds ?? []), pid],
        }
        void player
      }
      break
    }
    case 'rejectContract': {
      const pid = effect.targetPlayerId
      if (pid) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid ? { ...p, morale: Math.max(0, p.morale - 10) } : p,
          ),
          handledContractPlayerIds: [...(updatedGame.handledContractPlayerIds ?? []), pid],
        }
      }
      break
    }
    case 'boostMorale': {
      const pid = effect.targetPlayerId
      if (pid) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
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
            updatedGame = {
              ...updatedGame,
              sponsors: [...(updatedGame.sponsors ?? []), sponsor],
            }
          }
        } catch {}
      }
      break
    }
    case 'pressResponse': {
      const moraleBoost = effect.value ?? 0
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.clubId === updatedGame.managedClubId
            ? { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleBoost)) }
            : p
        ),
      }
      // Add media quote to inbox if present
      if (effect.mediaQuote) {
        const mediaInboxItem = {
          id: `inbox_press_${eventId}_${Date.now()}`,
          date: updatedGame.currentDate,
          type: InboxItemType.Media,
          title: effect.mediaQuote,
          body: '',
          isRead: false,
        }
        updatedGame = {
          ...updatedGame,
          inbox: [...updatedGame.inbox, mediaInboxItem],
        }
      }
      break
    }
    case 'makeFullTimePro': {
      const pid = effect.targetPlayerId
      if (pid) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid
              ? {
                  ...p,
                  isFullTimePro: true,
                  dayJob: undefined,
                  salary: effect.value ?? p.salary,
                  morale: Math.min(100, p.morale + 15),
                }
              : p
          ),
        }
      }
      break
    }
    case 'raiseBid': {
      updatedGame = {
        ...updatedGame,
        transferBids: (updatedGame.transferBids ?? []).map(b =>
          b.id === effect.bidId
            ? { ...b, offerAmount: effect.value ?? Math.round(b.offerAmount * 1.3 / 5000) * 5000, expiresRound: b.expiresRound + 1 }
            : b
        ),
      }
      break
    }
    case 'setCommunity': {
      if (!effect.communityKey) break
      const current: CommunityActivities = updatedGame.communityActivities ?? {
        kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false,
      }
      const val = effect.communityValue
      // Also apply money effect if amount is set
      if (effect.amount) {
        updatedGame = {
          ...updatedGame,
          clubs: updatedGame.clubs.map(c =>
            c.id === updatedGame.managedClubId
              ? { ...c, finances: c.finances + (effect.amount ?? 0) }
              : c
          ),
        }
      }
      if (effect.communityKey === 'kiosk') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), kiosk: val as 'none' | 'basic' | 'upgraded' } }
      } else if (effect.communityKey === 'lottery') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), lottery: val as 'none' | 'basic' | 'intensive' } }
      } else if (effect.communityKey === 'bandyplay') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), bandyplay: true } }
      } else if (effect.communityKey === 'functionaries') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), functionaries: true } }
      } else if (effect.communityKey === 'julmarknad') {
        updatedGame = { ...updatedGame, communityActivities: { ...(updatedGame.communityActivities ?? current), julmarknad: true } }
      }
      break
    }
    case 'patronHappiness': {
      if (!updatedGame.patron || !updatedGame.patron.isActive) break
      const newHappiness = Math.max(0, Math.min(100, (updatedGame.patron.happiness ?? 50) + (effect.amount ?? 0)))
      const stillActive = newHappiness > 0
      updatedGame = {
        ...updatedGame,
        patron: { ...updatedGame.patron, happiness: newHappiness, isActive: stillActive },
      }
      break
    }
    case 'politicianRelationship': {
      if (!updatedGame.localPolitician) break
      const newRel = Math.max(0, Math.min(100, (updatedGame.localPolitician.relationship ?? 50) + (effect.amount ?? 0)))
      updatedGame = {
        ...updatedGame,
        localPolitician: { ...updatedGame.localPolitician, relationship: newRel },
      }
      break
    }
    case 'kommunBidragChange': {
      if (!updatedGame.localPolitician) break
      const newBidrag = Math.max(0, (updatedGame.localPolitician.kommunBidrag ?? 0) + (effect.amount ?? 0))
      updatedGame = {
        ...updatedGame,
        localPolitician: { ...updatedGame.localPolitician, kommunBidrag: newBidrag },
      }
      break
    }
    case 'facilitiesUpgrade': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, reputation: Math.min(100, c.reputation + (effect.amount ?? 1)) }
            : c
        ),
      }
      break
    }
    case 'kommunGamble': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, finances: c.finances + (effect.amount ?? 0) }
            : c
        ),
      }
      break
    }
    case 'tempFacilities': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, facilities: Math.max(0, Math.min(100, c.facilities + (effect.amount ?? 0) * 5)) }
            : c
        ),
      }
      break
    }
    case 'income': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, finances: c.finances + (effect.amount ?? 0) }
            : c
        ),
      }
      break
    }
    case 'reputation': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, reputation: Math.max(1, Math.min(100, c.reputation + (effect.amount ?? 0))) }
            : c
        ),
      }
      break
    }
    case 'fanMood': {
      updatedGame = {
        ...updatedGame,
        fanMood: Math.max(0, Math.min(100, (updatedGame.fanMood ?? 50) + (effect.amount ?? 0))),
      }
      break
    }
    case 'noOp':
    case 'openNegotiation':
    default:
      break
  }

  // If this was a hall debate event, increment counters
  if (eventId.startsWith('hall_')) {
    const lastFixtureRound = updatedGame.lastCompletedFixtureId
      ? (updatedGame.fixtures.find(f => f.id === updatedGame.lastCompletedFixtureId)?.roundNumber ?? 0)
      : 0
    updatedGame = {
      ...updatedGame,
      hallDebateCount: (updatedGame.hallDebateCount ?? 0) + 1,
      lastHallDebateRound: lastFixtureRound,
    }
  }

  // Mark event resolved and remove from pendingEvents
  updatedGame = {
    ...updatedGame,
    pendingEvents: (updatedGame.pendingEvents ?? []).filter(e => e.id !== eventId),
  }

  return updatedGame
}
