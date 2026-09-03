import type { SaveGame, Sponsor, CommunityActivities } from '../../entities/SaveGame'
import type { HallTrial, HallTrialStage, StaleableActivityKey } from '../../entities/Community'
import { STALEABLE_ACTIVITY_KEYS } from '../communityRenewalService'
import type { GameEvent } from '../../entities/GameEvent'
import { InboxItemType } from '../../enums'
import { executeTransfer } from '../transferService'
import { describeRippleChain, transferRejectMoraleWeight } from '../rippleEffectService'
import { applyFinanceChange, appendFinanceLog } from '../economyService'
import { startFacilityBuild } from '../facilityService'
import { recordInteraction, recordPressRefusal, generateCriticalArticle } from '../journalistService'
import { pickCSPressPublishedQuote } from '../../data/csPressEventText'
import type { PressChoice } from '../../data/csPressEventText'
import { EVENT_SOURCE_MAP, startCooldown } from '../sourceCooldownService'
import type { SourceKey } from '../sourceCooldownService'
import { PROVNING_RESOLUTION } from '../../data/hallProvningData'
import { FACILITY_NODE_DEFS } from '../../data/facilityNodes'
import { getCurrentLeagueRound } from '../../data/seasonPhases'
import { logNarrativeBeat } from '../narrativeLogService'
import { captureSystemDecision, buildDecisionLedgerEntry } from '../seasonDecisionCaptureService'
import { logEvent } from '../eventLedgerService'
import { captureDecisionRipple } from '../orsakVerkanService'
import { applyPatronHappinessTransition } from '../patronWithdrawalService'
import { findEmployerForJob } from '../../data/localEmployers'

/**
 * PÅSTÅENDEKARTAN (2026-08-24): den nedskrivna sanningen "vad valde spelaren"
 * — se SaveGame.ts:s resolvedChoices-kommentar. EN skrivväg, anropad på alla
 * fem exit-punkter i resolveEvent() (1 kanonisk + 4 tidiga specialfall som
 * går förbi den: sponsorOffer×2, riskySponsorOffer×2). Samma cap-mönster
 * (senaste 200) som resolvedEventIds.
 *
 * MEDIUM 15 (2026-08-29): de fyra tidiga specialfallen gick förbi den kanoniska
 * vägens ANDRA skrivning också — `resolvedEventIds`. Se recordResolvedId nedan.
 */
function recordResolvedChoice(
  game: SaveGame,
  event: Pick<GameEvent, 'id' | 'type'>,
  choiceId: string,
  label: string,
  madeByPlayer: boolean,
): SaveGame['resolvedChoices'] {
  return [...(game.resolvedChoices ?? []), {
    eventId: event.id,
    eventType: event.type,
    choiceId,
    label,
    madeByPlayer,
  }].slice(-200)
}

/**
 * MEDIUM 15 (audit 2026-08-29): "sponsorernas motbud återställer förhandlingen".
 *
 * Rotorsak: sponsorOffer/riskySponsorOffer är fyra TIDIGA returer som går förbi
 * den kanoniska skrivvägen längst ned i resolveEvent — och den kanoniska vägen är
 * det enda ställe som skriver `resolvedEventIds`. Ett besvarat sponsorerbjudande
 * lämnade därför inget spår alls utom `resolvedChoices` (som bara Granska läser).
 * Generatorn (postAdvanceEvents.ts) gatar på `pendingEvents` — så i det ögonblick
 * resolutionen plockade bort eventet ur kön öppnade grinden igen, och eftersom
 * seeden är deterministisk per matchdag (baseSeed = nextMatchday * 1000 + säsong * 7)
 * återskapades ett BYTE-IDENTISKT erbjudande med samma id på managed-matchens
 * andra pass. Spelaren såg samma 45 tkr igen. Att acceptera var enda vägen ut,
 * eftersom accept höjer activeSponsors — den andra halvan av grindens villkor.
 *
 * De fyra returerna delar nu denna hjälpare, med samma cap (senaste 200) som
 * den kanoniska vägen.
 */
function recordResolvedId(game: SaveGame, eventId: string): string[] {
  return [...(game.resolvedEventIds ?? []), eventId].slice(-200)
}

/**
 * En gemensam patronrelationsväg för både top-level- och multiEffect-val.
 * Nollpunkten är inte bara en siffra: den avaktiverar patronen, sätter
 * cooldown-säsongen och köar avhoppskortet. Därför får multiEffect inte ha
 * en förenklad parallell implementation som missar följdeffekterna.
 */
function applyPatronHappiness(game: SaveGame, amount: number): SaveGame {
  const transition = applyPatronHappinessTransition(game, amount)
  return {
    ...game,
    patron: transition.patron,
    patronWithdrawnSeason: transition.patronWithdrawnSeason,
    pendingEvents: transition.withdrawalEvent
      ? [...(game.pendingEvents ?? []), transition.withdrawalEvent]
      : game.pendingEvents,
    // DOM_PATRON_MECENAT_LAST_2026-09-02.md — patron→liggaren, uttågshalvan.
    eventLedger: transition.ledgerEntry ? logEvent(game, transition.ledgerEntry) : game.eventLedger,
  }
}

/**
 * En gemensam heltidsproffsväg för top-level- och multiEffect-val.
 * Storylinen är ett kvitto på en verklig statusövergång, så ett saknat mål,
 * en redan heltidsanställd spelare eller en spelare utanför managed club får
 * varken ett falskt karriärminne eller en press-/matchpremiss.
 */
function applyFullTimePro(
  game: SaveGame,
  playerId: string,
  salary: number | undefined,
  madeByPlayer: boolean,
): SaveGame {
  const player = game.players.find(p => p.id === playerId)
  if (!player) return game

  const oldJob = player.dayJob?.title ?? 'jobbet'
  const storylineId = `story_pro_${playerId}_${game.currentSeason}`
  const shouldWriteStoryline = madeByPlayer
    && !player.isFullTimePro
    && player.clubId === game.managedClubId
    && !(game.storylines ?? []).some(story => story.id === storylineId)
  const displayText = `${player.firstName} ${player.lastName} slutade som ${oldJob} för att satsa heltid på bandyn`

  return {
    ...game,
    players: game.players.map(p => p.id === playerId
      ? {
          ...p,
          isFullTimePro: true,
          dayJob: undefined,
          salary: salary ?? p.salary,
          morale: Math.min(100, p.morale + 15),
        }
      : p),
    ...(shouldWriteStoryline ? {
      storylines: [
        ...(game.storylines ?? []),
        {
          id: storylineId,
          type: 'went_fulltime_pro' as const,
          season: game.currentSeason,
          matchday: getCurrentLeagueRound(game),
          playerId,
          clubId: game.managedClubId,
          description: displayText,
          displayText,
          resolved: true,
        },
      ],
    } : {}),
  }
}

// ── resolveEvent ───────────────────────────────────────────────────────────
/**
 * @cites resolvedChoices, matchday, fanMood
 */
/**
 * HIGH 6 (audit 2026-08-29), attributionshålet, Jacobs körorder 2026-08-31:
 * `madeByPlayer` är OBLIGATORISK, sist, ingen default — samma disciplin som
 * 2.5-vakt-svepets obligatoriska fält. Fel default hade varit farligt åt
 * BÅDA håll: `true` som default hade missat en auto-väg och låtit spelet
 * fortsätta ljuga ("Kaptenen samlade laget" i EN AI-simulerad säsong); `false`
 * hade missat en spelar-väg och tystat årsboken helt. Kompilatorn tvingar nu
 * fram ett medvetet val vid varje anropsställe — `grep resolveEvent(` gav
 * listan, tsc gav resten gratis.
 *
 * Flaggan styr ENDAST spelar-tillskriven BERÄTTELSE (captureSystemDecision-
 * kandidaten, captainSpeech/varsel-storylines) — se gaterna längre ner.
 * `narrativeBeatLog` och `resolvedChoices`/`resolvedEventIds` grindas
 * MEDVETET INTE: de är mekanik (cooldowns, dedup), inte spelar-berättelse,
 * och sim behöver dem oavsett vem som "tryckte".
 */
export function resolveEvent(
  game: SaveGame,
  eventId: string,
  choiceId: string,
  rand: () => number = Math.random,
  madeByPlayer: boolean,
): SaveGame {
  const event = (game.pendingEvents ?? []).find(e => e.id === eventId)
    ?? (game.pendingPressConference?.id === eventId ? game.pendingPressConference : undefined)
    ?? (game.pendingRefereeMeeting?.id === eventId ? game.pendingRefereeMeeting : undefined)
    ?? (game.pendingCSPress?.id === eventId ? game.pendingCSPress : undefined)
  if (!event) return game

  // Events with no choices are observations, not decisions: consume the row and
  // remember its stable id for generator dedup, but never fabricate a
  // resolvedChoices entry or a player-attributed narrative beat.
  if (event.choices.length === 0) {
    return {
      ...game,
      pendingEvents: (game.pendingEvents ?? []).filter(e => e.id !== eventId),
      resolvedEventIds: recordResolvedId(game, eventId),
    }
  }

  const choice = event.choices.find(c => c.id === choiceId)
  if (!choice) return game

  // Alla ekonomiska eventeffekter går genom många olika effect-typer
  // (income, finance, setCommunity, multiEffect, krisutfall osv). Fånga den
  // faktiska nettoskillnaden en gång här så spelarens transaktionshistorik
  // aldrig behöver känna till varje intern effekttyp.
  const financesBeforeEvent = game.clubs.find(c => c.id === game.managedClubId)?.finances
  const financeLogBeforeEvent = game.financeLog

  // Handle sponsor events by type (not effect)
  if (event.type === 'sponsorOffer') {
    // O1 (varsel-mallen, "sponsorn med ett problem"): konfliktvariantens
    // rival — uppslaget FÖRE mutation, båda utfallstexterna (accept/avslag)
    // behöver namnet och rivalen kan vara borta ur listan efter accept.
    const rivalName = event.terminateSponsorId
      ? (game.sponsors ?? []).find(s => s.id === event.terminateSponsorId)?.name
      : undefined
    if (choiceId === 'accept' && event.sponsorData) {
      const sponsor: Sponsor = JSON.parse(event.sponsorData)
      // en konfliktvariant bär terminateSponsorId (postAdvanceEvents.ts) —
      // rivalen i samma kategori avslutas (contractRounds→0, samma idiom
      // som sponsorProcessor.ts använder för naturligt utlöpta avtal) och
      // priset betalas i communityStanding. Plain-varianten saknar båda
      // fälten och beter sig som förut.
      const sponsors = event.terminateSponsorId
        ? [...(game.sponsors ?? []).map(s => s.id === event.terminateSponsorId ? { ...s, contractRounds: 0 } : s), sponsor]
        : [...(game.sponsors ?? []), sponsor]
      const communityStanding = event.terminateSponsorId
        ? Math.max(0, Math.min(100, (game.communityStanding ?? 50) + (event.communityStandingDelta ?? 0)))
        : game.communityStanding
      const inbox = rivalName
        ? [...game.inbox, {
            id: `inbox_sponsor_conflict_accept_${event.id}`,
            date: game.currentDate,
            type: InboxItemType.SponsorNetwork,
            title: `${sponsor.name} tecknar avtal`,
            body: `${sponsor.name} är med från nästa match. ${rivalName} svarade inte i telefon.`,
            isRead: false,
          }]
        : game.inbox
      // O2 lager 3 (Jacobs dom 2026-08-24): plain-varianten (inget
      // terminateSponsorId — rivalvarianten har redan sin egna
      // communityStanding-kostnad ovan, ingen dubbel risk läggs på den) hade
      // tidigare NOLL nedsida — mekaniskt gratis pengar varje gång
      // (O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md). 8% (mitten av Jacobs
      // 5–10%-spann) chans att avtalet ändå visar sig vara riskabelt, samma
      // mognadsmekanik (applyRiskySponsorMaturation, sponsorProcessor.ts)
      // som redan finns för den uttalat riskabla sponsorvarianten (se
      // 'riskySponsorOffer' nedan) — tyst tills den ev. utlöses, ingen ny
      // text krävs. Bara om inget riskykontrakt redan pågår (samma
      // encelliga state som resten av mekanismen).
      const dedicatedRiskOfferPending = [...(game.pendingEvents ?? []), ...(game.deferredDecisions ?? [])]
        .some(candidate => candidate.type === 'riskySponsorOffer' && !candidate.resolved)
      const riskySponsorContract = (!event.terminateSponsorId && !game.riskySponsorContract && !dedicatedRiskOfferPending && rand() < 0.08)
        ? {
            sponsorId: sponsor.id,
            riskMaturityRound: game.currentMatchday + 6,
            season: game.currentSeason,
          }
        : game.riskySponsorContract
      return {
        ...game,
        pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
        sponsors,
        communityStanding,
        inbox,
        riskySponsorContract,
        resolvedChoices: recordResolvedChoice(game, event, choiceId, choice.label, madeByPlayer),
        resolvedEventIds: recordResolvedId(game, eventId),
      }
    }
    const rejectedOffer = choiceId === 'reject' && rivalName && event.sponsorData
      ? (JSON.parse(event.sponsorData) as Sponsor)
      : undefined
    const inbox = rejectedOffer
      ? [...game.inbox, {
          id: `inbox_sponsor_conflict_reject_${event.id}`,
          date: game.currentDate,
          type: InboxItemType.SponsorNetwork,
          title: `${rejectedOffer.name} — inget avtal`,
          body: `${rejectedOffer.name} tackade artigt och la på. ${rivalName} fick aldrig veta.`,
          isRead: false,
        }]
      : game.inbox
    return {
      ...game,
      pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
      inbox,
      resolvedChoices: recordResolvedChoice(game, event, choiceId, choice.label, madeByPlayer),
      resolvedEventIds: recordResolvedId(game, eventId),
    }
  }

  // 2B: Risky sponsor offer — accept adds sponsor AND stores risk contract
  if (event.type === 'riskySponsorOffer') {
    if (choiceId === 'accept') {
      const rawData = choice.effect.sponsorData
      if (!rawData) throw new Error("riskySponsorOffer/accept saknar obligatoriskt fält sponsorData")
      let parsedSponsorData: unknown
      try {
        parsedSponsorData = JSON.parse(rawData)
      } catch {
        throw new Error("riskySponsorOffer/accept har ogiltig sponsorData-JSON")
      }
      if (!parsedSponsorData || typeof parsedSponsorData !== 'object' || Array.isArray(parsedSponsorData)) {
        throw new Error("riskySponsorOffer/accept har ofullständig sponsorData")
      }
      const sponsorData = parsedSponsorData as Record<string, unknown>
      if (
        typeof sponsorData.id !== 'string' || sponsorData.id.length === 0 ||
        typeof sponsorData.name !== 'string' || sponsorData.name.length === 0 ||
        typeof sponsorData.category !== 'string' || sponsorData.category.length === 0 ||
        typeof sponsorData.weeklyIncome !== 'number' || !Number.isFinite(sponsorData.weeklyIncome) ||
        typeof sponsorData.contractRounds !== 'number' || !Number.isFinite(sponsorData.contractRounds) || sponsorData.contractRounds <= 0 ||
        typeof sponsorData.signedRound !== 'number' || !Number.isFinite(sponsorData.signedRound) ||
        typeof sponsorData.riskMaturityRound !== 'number' || !Number.isFinite(sponsorData.riskMaturityRound)
      ) {
        throw new Error("riskySponsorOffer/accept har ofullständig sponsorData")
      }
      if (game.riskySponsorContract) {
        throw new Error("riskySponsorOffer/accept kan inte ersätta ett pågående riskavtal")
      }
      const sponsor: Sponsor = {
        id: sponsorData.id,
        name: sponsorData.name,
        category: sponsorData.category,
        weeklyIncome: sponsorData.weeklyIncome,
        contractRounds: sponsorData.contractRounds,
        signedRound: sponsorData.signedRound,
        tier: sponsorData.tier as Sponsor['tier'],
        triggeredBy: sponsorData.triggeredBy as Sponsor['triggeredBy'],
        triggeredSeason: sponsorData.triggeredSeason as number | undefined,
        expiresSeason: sponsorData.expiresSeason as number | undefined,
      }
      return {
        ...game,
        pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
        sponsors: [...(game.sponsors ?? []), sponsor],
        riskySponsorContract: {
          sponsorId: sponsor.id,
          riskMaturityRound: sponsorData.riskMaturityRound,
          season: game.currentSeason,
        },
        resolvedChoices: recordResolvedChoice(game, event, choiceId, choice.label, madeByPlayer),
        resolvedEventIds: recordResolvedId(game, eventId),
      }
    }
    return {
      ...game,
      pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
      resolvedChoices: recordResolvedChoice(game, event, choiceId, choice.label, madeByPlayer),
      resolvedEventIds: recordResolvedId(game, eventId),
    }
  }

  const { effect } = choice
  let updatedGame = game

  // ÖVERLÄMNING 2 steg 1-pilot (2026-08-12): before/after-snapshot kring
  // transferbudets tre utfall. Satt inuti respektive case (spelarnamnet
  // behövs för subjectName), konsumerat efter switchen — se
  // pilotTransferBidRippleChain-kommentaren i SaveGame.ts för varför den
  // INTE är pendingRippleChains (renderas ingenstans ännu, medvetet).
  let pilotTransferBidTrigger: 'transfer_bid_accepted' | 'transfer_bid_rejected' | 'transfer_bid_countered' | null = null
  let pilotTransferBidPlayerName: string | undefined
  // ÖVERLÄMNING 2 steg 3-underlag: bara avslaget bär en relatedPlayerId in i
  // kedjan — det är utfallet vars enda konsekvens (spelarens morale) annars
  // är osynlig. Accept/kräv mer behöver den inte (Kassan/tomt redan rätt).
  let pilotTransferBidRelatedPlayerId: string | undefined

  switch (effect.type) {
    case 'acceptTransfer': {
      // 2.5-vakt-svepet (2026-08-17): bidId saknat → .find() ger undefined →
      // tyst no-op utan spår. Samma klass som boostMorale-familjen ovan.
      if (!effect.bidId) throw new Error("effect 'acceptTransfer' saknar obligatoriskt fält bidId")
      const bid = (game.transferBids ?? []).find(b => b.id === effect.bidId)
      if (bid) {
        updatedGame = executeTransfer(game, bid)
        const player = game.players.find(p => p.id === bid.playerId)
        pilotTransferBidTrigger = 'transfer_bid_accepted'
        pilotTransferBidPlayerName = player ? `${player.firstName} ${player.lastName}` : undefined
      }
      break
    }
    case 'rejectTransfer': {
      // ÖVERLÄMNING 2 (2026-08-16): Moralen skalar nu som de tre andra
      // triggarna — temperament (discipline) × bud-gap mot marknadsvärde ×
      // kvarvarande kontraktstid. Mittpunkt reproducerar dagens −5.
      // 2.5-vakt-svepet (2026-08-17): båda fälten obligatoriska — utan bidId
      // matchar .map() ingen post (tyst no-op), utan targetPlayerId uteblir
      // moralstraffet helt trots att bud-avslaget genomförs.
      if (!effect.bidId) throw new Error("effect 'rejectTransfer' saknar obligatoriskt fält bidId")
      if (!effect.targetPlayerId) throw new Error("effect 'rejectTransfer' saknar obligatoriskt fält targetPlayerId")
      const rejectedBid = (game.transferBids ?? []).find(b => b.id === effect.bidId)
      const rejectedPlayer = effect.targetPlayerId ? game.players.find(p => p.id === effect.targetPlayerId) : undefined
      const moraleWeight = (rejectedBid && rejectedPlayer)
        ? transferRejectMoraleWeight(rejectedPlayer, rejectedBid, game.currentSeason)
        : 1.0
      const moraleDelta = Math.round(5 * moraleWeight)
      updatedGame = {
        ...updatedGame,
        transferBids: (updatedGame.transferBids ?? []).map(b =>
          b.id === effect.bidId ? { ...b, status: 'rejected' as const } : b,
        ),
        players: effect.targetPlayerId
          ? updatedGame.players.map(p =>
              p.id === effect.targetPlayerId
                ? { ...p, morale: Math.max(0, p.morale - moraleDelta) }
                : p,
            )
          : updatedGame.players,
      }
      {
        const player = effect.targetPlayerId ? game.players.find(p => p.id === effect.targetPlayerId) : undefined
        pilotTransferBidTrigger = 'transfer_bid_rejected'
        pilotTransferBidPlayerName = player ? `${player.firstName} ${player.lastName}` : undefined
        pilotTransferBidRelatedPlayerId = effect.targetPlayerId
      }
      break
    }
    case 'counterOffer': {
      // 2.5-vakt-svepet (2026-08-17): utan bidId matchar map() ingen post —
      // tyst no-op, budet varken höjs eller markeras avvisat.
      if (!effect.bidId) throw new Error("effect 'counterOffer' saknar obligatoriskt fält bidId")
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
      {
        const player = currentBid ? game.players.find(p => p.id === currentBid.playerId) : undefined
        pilotTransferBidTrigger = 'transfer_bid_countered'
        pilotTransferBidPlayerName = player ? `${player.firstName} ${player.lastName}` : undefined
      }
      break
    }
    case 'extendContract': {
      // 2.5-vakt-svepet (2026-08-17): utan targetPlayerId sker ingen
      // kontraktsförlängning alls — tyst no-op på ett val som lovar en
      // konkret ny lön/kontraktslängd.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'extendContract' saknar obligatoriskt fält targetPlayerId")
      {
        // O2 lager 1 (Jacobs dom 2026-08-24): choice.id==='extend3'-gissningen
        // täckte bara contractRequestEvent. contractYears sätts nu explicit
        // vid varje konstruktionsställe istället för att härledas ur ett
        // magiskt choice.id.
        const years = effect.contractYears ?? 1
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
      }
      break
    }
    case 'rejectContract': {
      // Se extendContract-kommentaren ovan — samma vaktprincip.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'rejectContract' saknar obligatoriskt fält targetPlayerId")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === pid ? { ...p, morale: Math.max(0, p.morale - 10) } : p,
        ),
        handledContractPlayerIds: [...(updatedGame.handledContractPlayerIds ?? []), pid],
      }
      break
    }
    case 'releasePlayer': {
      // O2 lager 1 (Jacobs dom 2026-08-24): arcService.ts:s let_go-val
      // ("Du får gå") applicerade tidigare bara boostMorale på spelaren som
      // lämnar — spelaren blev aldrig faktiskt free agent. Samma
      // clubId:'free_agent' + squadPlayerIds-borttag som redan används av
      // resolveEconomicCrisis (sold_star) och detOmojligaValet-specialfallet
      // nedan, nu som en generisk effekttyp istället för ytterligare ett
      // event.type-specialfall.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'releasePlayer' saknar obligatoriskt fält targetPlayerId")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p => p.id === pid ? { ...p, clubId: 'free_agent' } : p),
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== pid) }
            : c
        ),
      }
      break
    }
    case 'boostMorale': {
      // 2.5 (choice-label-svepet, 2026-08-17): kastade tidigare tyst över
      // saknat targetPlayerId (if (pid) {...}, annars break). Fyra choice-
      // konstruktioner missade fältet och blev osynliga no-ops bakom stora
      // löften ("+8 moral hela laget" levererade noll) — synliga först vid
      // browser-genomspelning, inte vid build/test. Ett obligatoriskt fält
      // som saknas ska krascha vid konstruktionstillfället, inte tystna.
      // Vill du boosta hela laget: teamBoostMorale, inte boostMorale utan mål.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'boostMorale' saknar obligatoriskt fält targetPlayerId — använd teamBoostMorale för hela laget")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === pid ? { ...p, morale: Math.max(0, Math.min(100, p.morale + (effect.value ?? 5))) } : p,
        ),
      }
      break
    }
    case 'restPlayer': {
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'restPlayer' saknar obligatoriskt fält targetPlayerId")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === pid
            ? { ...p, restGamesRemaining: Math.max(p.restGamesRemaining ?? 0, effect.amount ?? 1) }
            : p,
        ),
      }
      break
    }
    case 'setCaptain': {
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'setCaptain' saknar obligatoriskt fält targetPlayerId")
      if (!updatedGame.players.some(p => p.id === pid && p.clubId === updatedGame.managedClubId)) {
        throw new Error("effect 'setCaptain' kräver en spelare i den hanterade klubben")
      }
      updatedGame = { ...updatedGame, captainPlayerId: pid }
      break
    }
    case 'developmentRateDelta': {
      // O2 lager 3 (Jacobs dom 2026-08-24): hungrig_peak_event — back_him
      // (spela igenom målsvälten obetingat) kostar utvecklingstakt, inte
      // taket. Permanent, ingen clamp mot ett golv utöver 0-100.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'developmentRateDelta' saknar obligatoriskt fält targetPlayerId")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === pid
            ? { ...p, developmentRate: Math.max(0, Math.min(100, p.developmentRate + (effect.amount ?? 0))) }
            : p,
        ),
      }
      break
    }
    case 'disciplineDelta': {
      // O2 lager 3 (Jacobs dom 2026-08-24): joker_peak_event — back_joker
      // (backa jokern obetingat, aldrig ifrågasätta utvisningarna) kostar
      // discipline — fältet disciplineRisk redan läser i matchmotorn
      // (matchCore.ts).
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'disciplineDelta' saknar obligatoriskt fält targetPlayerId")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === pid
            ? { ...p, discipline: Math.max(0, Math.min(100, p.discipline + (effect.amount ?? 0))) }
            : p,
        ),
      }
      break
    }
    case 'playThroughInjury': {
      // Pool 1c: tillfälligt fritagen för EN match. injuryDaysRemaining rörs
      // INTE — det är originalvärdet post-match-rullningen (playerStateProcessor)
      // dubblar vid återfall. Om spelaren inte faktiskt startar den matchen
      // återställs isInjured där, utan att rullningen sker.
      // 2.5-vakt-svepet (2026-08-17): utan targetPlayerId spelar ingen —
      // valet "han spelar" skulle tyst inte ändra någon spelares status.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'playThroughInjury' saknar obligatoriskt fält targetPlayerId")
      if (!event.relatedPlayerId || event.relatedPlayerId !== pid) {
        throw new Error("playThroughInjury-effekten matchar inte kortets relatedPlayerId")
      }
      // HIGH 9 (audit 2026-08-29): sista spärren. Rensningen av inaktuella kort
      // (isPlayThroughInjuryCardStillValid) körs på omgångsadvance och efter
      // livematch, men resolutionen är den punkt där EFFEKTEN faktiskt landar —
      // och effekten är destruktiv på en frisk spelare: playingThroughInjury=true
      // gör att playerStateProcessorns återfallsrullning DUBBLAR en skada som
      // inte finns. En frisk spelare ska aldrig "spela vidare på skadan"; valet
      // no-op:ar då i stället, och kortet försvinner ur kön som vanligt nedan.
      const target = updatedGame.players.find(p => p.id === pid)
      if (target?.isInjured) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === pid ? { ...p, isInjured: false, playingThroughInjury: true } : p,
          ),
        }
      }
      break
    }
    case 'teamBoostMorale': {
      // 2.5 (choice-label-svepet, 2026-08-17): targetClubId var tidigare
      // valfritt med fallback "boosta alla spelare, alla klubbar" — riskabelt
      // för en typ vars hela poäng är "hela LAGET", inte hela ligan. Ingen
      // befintlig konstruktion utelämnade fältet (typen var oanvänd innan
      // denna sweep), så kravet stänger en risk utan att röra något som
      // förlitat sig på det gamla beteendet.
      const boost = effect.value ?? 5
      const clubId = effect.targetClubId
      if (!clubId) throw new Error("effect 'teamBoostMorale' saknar obligatoriskt fält targetClubId")
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.clubId === clubId
            ? { ...p, morale: Math.min(100, Math.max(0, p.morale + boost)) }
            : p,
        ),
      }
      break
    }
    case 'acceptSponsor': {
      // 2.5-vakt-svepet (2026-08-17): rawData saknat → inget sponsoravtal
      // alls. JSON.parse-fel tystas fortfarande (malformad sträng, inte ett
      // konstruktionsfel) — men sponsor.id saknat EFTER lyckad parsning är
      // samma "parsat men obligatoriskt fält saknas"-klass som spawnPatron.
      const rawData = effect.sponsorData ?? event.sponsorData
      if (!rawData) throw new Error("effect 'acceptSponsor' saknar obligatoriskt fält sponsorData")
      try {
        const sponsor = JSON.parse(rawData)
        if (!sponsor.id) throw new Error("effect 'acceptSponsor': sponsorData saknar obligatoriskt fält id")
        updatedGame = {
          ...updatedGame,
          sponsors: [...(updatedGame.sponsors ?? []), sponsor],
          inbox: [...updatedGame.inbox, {
            id: `inbox_sponsor_${sponsor.id}`,
            date: updatedGame.currentDate,
            type: InboxItemType.BoardFeedback,
            title: `🤝 Nytt sponsoravtal: ${sponsor.name}`,
            body: `${sponsor.name} har tecknat avtal. +${sponsor.weeklyIncome} kr/omgång i ${sponsor.contractRounds} omgångar.`,
            isRead: false,
          }],
        }
      } catch (e) {
        if (e instanceof SyntaxError) { /* malformad JSON, tystas */ } else { throw e }
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
      // Update journalist memory
      if (updatedGame.journalist) {
        // B1 — premiss-anchor: matchen presskonferensen faktiskt gäller.
        // A-L1 (SLUTTEST_KO.md, rotorsak): tidigare gissades "senaste ligamatchen"
        // fram genom att skanna HELA game.fixtures (alla säsonger) efter högst
        // .roundNumber — fel fält (roundNumber nollställs varje säsong, är inte
        // den globala spelordningen — se CLAUDE.md: använd ALDRIG roundNumber för
        // ordning, bara matchday) och utan säsongsfilter. När skanningen inte
        // hittade något föll den till en hårdkodad 0, som sedan visades ordagrant
        // som "omg 0" i Efterklangs journalist-premiss. Läs nu matchen direkt via
        // event.relatedFixtureId (satt av generatePressConference), fältet som
        // finns exakt för detta. Fallback (äldre pending events utan fältet)
        // scopas till innevarande säsong och läser .matchday, aldrig .roundNumber.
        const relatedFixture = event.relatedFixtureId
          ? updatedGame.fixtures.find(f => f.id === event.relatedFixtureId)
          : undefined
        const lastLeagueFixture = relatedFixture ?? updatedGame.fixtures
          .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout && f.season === updatedGame.currentSeason)
          .reduce<typeof updatedGame.fixtures[number] | undefined>(
            (latest, f) => (f.matchday > (latest?.matchday ?? -1) ? f : latest), undefined)
        // Sista utväg om ingen matchande fixture alls hittas: nuvarande matchday
        // (aldrig 0 här — pressResponse kan bara ske efter en spelad match).
        // Aldrig en hårdkodad 0-sentinel som riskerar att renderas ordagrant.
        const matchday = lastLeagueFixture?.matchday ?? updatedGame.currentMatchday
        const oppId = lastLeagueFixture
          ? (lastLeagueFixture.homeClubId === updatedGame.managedClubId
              ? lastLeagueFixture.awayClubId : lastLeagueFixture.homeClubId)
          : undefined
        const opponentShort = oppId
          ? (updatedGame.clubs.find(c => c.id === oppId)?.shortName)
          : undefined
        const isRefusal = choiceId === 'refuse_press'
        updatedGame = {
          ...updatedGame,
          journalist: isRefusal
            ? recordPressRefusal(updatedGame.journalist, updatedGame.currentSeason, matchday)
            : recordInteraction(updatedGame.journalist, updatedGame.currentSeason, matchday,
                moraleBoost > 0 ? 'good_answer' : 'bad_answer', moraleBoost > 0 ? 3 : -3, opponentShort),
          journalistRelationship: isRefusal
            ? Math.max(0, (updatedGame.journalistRelationship ?? 50) - 8)
            : Math.max(0, Math.min(100,
                (updatedGame.journalistRelationship ?? 50) + (moraleBoost > 0 ? 3 : -3))),
        }
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
      // Se boostMorale-kommentaren ovan — samma vaktprincip.
      const pid = effect.targetPlayerId
      if (!pid) throw new Error("effect 'makeFullTimePro' saknar obligatoriskt fält targetPlayerId")
      updatedGame = applyFullTimePro(updatedGame, pid, effect.value, madeByPlayer)
      break
    }
    case 'raiseBid': {
      // 2.5-vakt-svepet (2026-08-17): utan bidId matchar map() ingen post.
      if (!effect.bidId) throw new Error("effect 'raiseBid' saknar obligatoriskt fält bidId")
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
      // 2.5-vakt-svepet (2026-08-17): utan communityKey vet resolvern inte
      // vilken community-aktivitet som ska sättas — tyst no-op tidigare.
      if (!effect.communityKey) throw new Error("effect 'setCommunity' saknar obligatoriskt fält communityKey")
      const current: CommunityActivities = updatedGame.communityActivities ?? {
        kiosk: 'none', lottery: 'none', bandyplay: false, functionaries: false, julmarknad: false,
      }
      const val = effect.communityValue
      // Also apply money effect if amount is set
      if (effect.amount) {
        updatedGame = {
          ...updatedGame,
          clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount),
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
      // ANSPRÅK 4, spak 3: en aktivitet som SÄTTS PÅ (eller uppgraderas) här är
      // ny — starta dess staleness-klocka. Samma stämpling som
      // academyActions.ts:s activateCommunity gör på den andra aktiveringsvägen.
      // julmarknad saknar csBoost och har därför ingen klocka.
      if (STALEABLE_ACTIVITY_KEYS.includes(effect.communityKey as StaleableActivityKey)) {
        updatedGame = {
          ...updatedGame,
          communityActivitiesSince: {
            ...(updatedGame.communityActivitiesSince ?? {}),
            [effect.communityKey as StaleableActivityKey]: updatedGame.currentSeason,
          },
        }
      }
      break
    }
    case 'renewCommunityActivity': {
      // ANSPRÅK 4, spak 3 (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md).
      // Samma 2.5-vaktsdisciplin som setCommunity ovan: utan communityKey vet
      // resolvern inte VILKEN klocka som ska nollställas, och en tyst no-op
      // hade tagit betalt utan att ge något.
      if (!effect.communityKey) throw new Error("effect 'renewCommunityActivity' saknar obligatoriskt fält communityKey")
      const renewKey = effect.communityKey as StaleableActivityKey
      if (!STALEABLE_ACTIVITY_KEYS.includes(renewKey)) {
        throw new Error(`effect 'renewCommunityActivity': okänd communityKey "${effect.communityKey}"`)
      }
      updatedGame = {
        ...updatedGame,
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount ?? 0),
        // Klockan nollställs till innevarande säsong — aktiviteten är ny igen.
        // INGEN communityStanding-ändring: förnyelsen förhindrar avtrappningen,
        // den lyfter inte CS av egen kraft (domens SKYDDAT-punkt).
        communityActivitiesSince: {
          ...(updatedGame.communityActivitiesSince ?? {}),
          [renewKey]: updatedGame.currentSeason,
        },
      }
      break
    }
    case 'patronHappiness': {
      updatedGame = applyPatronHappiness(updatedGame, effect.amount ?? 0)
      break
    }
    case 'spawnPatron': {
      // 2.5-vakt-svepet (2026-08-17): utan patronData/sponsorData finns
      // ingen mecenat att skapa. JSON.parse-fel tystas (malformad sträng),
      // men name/business saknat EFTER lyckad parsning är samma
      // "parsat men obligatoriskt fält saknas"-klass som acceptSponsor.
      const rawPatron = effect.patronData ?? effect.sponsorData  // patronData preferred, sponsorData for legacy saves
      if (!rawPatron) throw new Error("effect 'spawnPatron' saknar obligatoriskt fält patronData/sponsorData")
      try {
        const p = JSON.parse(rawPatron)
        if (!p.name || !p.business) throw new Error("effect 'spawnPatron': parsad data saknar obligatoriskt fält name/business")
        // DOM_PATRON_MECENAT_LAST_2026-09-02.md — samma id-mönster som
        // Mecenat/setupManagedClub.ts:s generatePatron (namn+säsong).
        const patronId = `patron_${String(p.name).split(' ')[0].toLowerCase()}_${updatedGame.currentSeason}`
        updatedGame = {
          ...updatedGame,
          patron: {
            id: patronId,
            name: p.name,
            business: p.business,
            influence: p.influence ?? 50,
            happiness: Math.min(100, 60 + (effect.amount ?? 0)),
            contribution: p.contribution ?? 0,
            wantsStyle: p.wantsStyle ?? undefined,
            isActive: true,
            hasBeenWarned: false,
            backstory: p.backstory ?? undefined,
            goodwill: 80,
            totalContributed: 0,
            demands: [],
          },
        }
        // DOM_PATRON_MECENAT_LAST_2026-09-02.md — patron→liggaren, Fas 4+-
        // mönstret (samma som recentMoments/ripple-kedjorna). Skrivs bara vid
        // en genuin anskaffning (madeByPlayer, dvs 'welcome'/'cautious' — den
        // enda vägen hit; 'decline' använder effekten 'noOp' och når aldrig
        // denna case). significance 85 = samma tyngdklass som era_shift
        // (MOMENT_LEDGER_SIGNIFICANCE) — en stor, positiv händelse.
        if (madeByPlayer) {
          updatedGame = {
            ...updatedGame,
            eventLedger: logEvent(updatedGame, {
              type: 'patron_emerge',
              semanticKey: event.id,
              season: updatedGame.currentSeason,
              matchday: updatedGame.currentMatchday,
              subject: { kind: 'patron', id: patronId },
              significance: 85,
              madeByPlayer: true,
            }),
          }
        }
      } catch (e) {
        if (e instanceof SyntaxError) { /* malformad JSON, tystas */ } else { throw e }
      }
      break
    }
    case 'patronWithdrawn': {
      updatedGame = {
        ...updatedGame,
        patron: updatedGame.patron ? { ...updatedGame.patron, isActive: false } : updatedGame.patron,
        patronWithdrawnSeason: updatedGame.currentSeason,
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
      const delta = effect.amount ?? 0
      const newBidrag = Math.max(0, (updatedGame.localPolitician.kommunBidrag ?? 0) + delta)
      updatedGame = {
        ...updatedGame,
        localPolitician: {
          ...updatedGame.localPolitician,
          kommunBidrag: newBidrag,
          kommunBidragModifier: (updatedGame.localPolitician.kommunBidragModifier ?? 0) + delta,
        },
      }
      break
    }
    case 'facilitiesUpgrade': {
      updatedGame = {
        ...updatedGame,
        clubs: updatedGame.clubs.map(c =>
          c.id === updatedGame.managedClubId
            ? { ...c, facilities: Math.max(0, Math.min(100, (c.facilities ?? 50) + (effect.amount ?? 5))) }
            : c
        ),
      }
      break
    }
    case 'kommunGamble': {
      updatedGame = {
        ...updatedGame,
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount ?? 0),
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
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.amount ?? 0),
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
    case 'communityStanding': {
      updatedGame = {
        ...updatedGame,
        communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + (effect.amount ?? 0))),
      }
      break
    }
    case 'journalistRelationship': {
      const relationship = Math.max(0, Math.min(100,
        (updatedGame.journalist?.relationship ?? updatedGame.journalistRelationship ?? 50) + (effect.amount ?? 0),
      ))
      updatedGame = {
        ...updatedGame,
        journalistRelationship: relationship,
        journalist: updatedGame.journalist
          ? { ...updatedGame.journalist, relationship, lastInteractionMatchday: updatedGame.currentMatchday }
          : updatedGame.journalist,
      }
      break
    }
    case 'patronInfluence': {
      if (!updatedGame.patron) break
      updatedGame = {
        ...updatedGame,
        patron: {
          ...updatedGame.patron,
          influence: Math.max(0, Math.min(100, (updatedGame.patron.influence ?? 30) + (effect.amount ?? 0))),
          goodwill: Math.max(0, Math.min(100, (updatedGame.patron.goodwill ?? 80) + (effect.value ?? 0))),
        },
      }
      break
    }
    case 'mecenatHappiness': {
      // 2.5-vakt-svepet (2026-08-17): targetMecenatId är ett konstruktions-
      // krav (samma klass som targetPlayerId-familjen) — kastar om det
      // saknas. `!updatedGame.mecenater`/`!target` är legitimt speltillstånd
      // (ingen mecenat spawnad än, eller en refererad mecenat som inte
      // längre finns) — de förblir break, inte throw.
      if (!effect.targetMecenatId) throw new Error("effect 'mecenatHappiness' saknar obligatoriskt fält targetMecenatId")
      if (!updatedGame.mecenater) break
      const targetId = effect.targetMecenatId
      const delta = effect.amount ?? 0
      const costKr = effect.value ?? 0
      const target = updatedGame.mecenater.find(m => m.id === targetId)
      if (!target) break
      // K5 (SLUTTEST-KÖN, 2026-08-17): permanent ska betyda permanent — en
      // avskedad mecenat kan inte röras av mecenatHappiness alls, varken
      // isActive, happiness eller kostnaden nedan. Se Mecenat.ts:s kommentar
      // vid permanentlyWithdrawn.
      if (target.permanentlyWithdrawn) break
      if (!target.isActive) {
        // Intro activation — pending mecenat accepts relationship
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.map(m =>
            m.id === targetId
              ? { ...m, isActive: true, happiness: Math.min(100, 50 + delta), lastInteractionRound: updatedGame.currentMatchday }
              : m
          ),
        }
      } else {
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.map(m =>
            m.id === targetId
              ? {
                  ...m,
                  happiness: Math.max(0, Math.min(100, m.happiness + delta)),
                  lastInteractionRound: updatedGame.currentMatchday,
                }
              : m
          ),
        }
      }
      if (costKr !== 0) {
        updatedGame = {
          ...updatedGame,
          clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, costKr),
        }
      }
      break
    }
    case 'boardPatience': {
      updatedGame = {
        ...updatedGame,
        boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + (effect.amount ?? 0))),
      }
      break
    }
    case 'multiEffect': {
      // subEffects is a JSON array of EventEffect objects
      if (effect.subEffects) {
        // 2.5 (choice-label-svepet, 2026-08-17): JSON.parse-felet ska tystas
        // (malformad sträng, inget att göra åt), men ett sub-effekt-block som
        // saknar ett obligatoriskt fält ska INTE fångas av samma catch — det
        // var precis vad som gjorde makeFullTimePro-no-open (varsel offer_pro)
        // osynlig. Parsning och validering separerade i två steg.
        let subList: Array<{ type: string; amount?: number; value?: number; targetPlayerId?: string; targetMecenatId?: string; targetClubId?: string; contractYears?: number }> | null = null
        try {
          subList = JSON.parse(effect.subEffects)
        } catch { /* ignore parse errors */ }
        if (subList) {
          for (const sub of subList) {
            if (sub.type === 'income') {
              updatedGame = {
                ...updatedGame,
                clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, sub.amount ?? 0),
              }
            } else if (sub.type === 'communityStanding') {
              updatedGame = {
                ...updatedGame,
                communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'fanMood') {
              updatedGame = {
                ...updatedGame,
                fanMood: Math.max(0, Math.min(100, (updatedGame.fanMood ?? 50) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'journalistRelationship') {
              // Narrative.ts markerar journalist.relationship som canonical
              // ersättare för legacyfältet. Alla generiska relationseffekter
              // måste ändå dual-write:a tills legacyfältet är migrerat bort.
              const relationship = Math.max(0, Math.min(100,
                (updatedGame.journalist?.relationship ?? updatedGame.journalistRelationship ?? 50) + (sub.amount ?? 0),
              ))
              updatedGame = {
                ...updatedGame,
                journalistRelationship: relationship,
                journalist: updatedGame.journalist
                  ? { ...updatedGame.journalist, relationship, lastInteractionMatchday: updatedGame.currentMatchday }
                  : updatedGame.journalist,
              }
            } else if (sub.type === 'boardPatience') {
              updatedGame = {
                ...updatedGame,
                boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'setCaptain') {
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'setCaptain' saknar obligatoriskt fält targetPlayerId")
              if (!updatedGame.players.some(p => p.id === sub.targetPlayerId && p.clubId === updatedGame.managedClubId)) {
                throw new Error("multiEffect-subEffect 'setCaptain' kräver en spelare i den hanterade klubben")
              }
              updatedGame = { ...updatedGame, captainPlayerId: sub.targetPlayerId }
            } else if (sub.type === 'reduceBurnout') {
              // O4 (DOM_BURNOUT_2026-08-17.md, 2026-08-23): burnoutRelief-eventets
              // tre handlingar. amount är alltid negativt (sänker), samma
              // clamp 0-100 som updateManagerBurnout (managerProfileService.ts).
              if (updatedGame.managerProfile) {
                const newScore = Math.max(0, Math.min(100, updatedGame.managerProfile.burnoutScore + (sub.amount ?? 0)))
                updatedGame = {
                  ...updatedGame,
                  managerProfile: { ...updatedGame.managerProfile, burnoutScore: newScore },
                }
              }
            } else if (sub.type === 'startTrainingSlowdown') {
              // O4: "Sänk tempot på träningen"-valets pris. amount = antal
              // omgångar. roundProcessor.ts tvingar trainingIntensity till
              // 'light' till och med detta matchday, oavsett vad spelaren
              // själv valt i Träna-fliken.
              updatedGame = {
                ...updatedGame,
                burnoutTrainingSlowdownUntilRound: updatedGame.currentMatchday + (sub.amount ?? 0),
              }
            } else if (sub.type === 'politicianRelationship') {
              if (updatedGame.localPolitician) {
                updatedGame = {
                  ...updatedGame,
                  localPolitician: {
                    ...updatedGame.localPolitician,
                    relationship: Math.max(0, Math.min(100, (updatedGame.localPolitician.relationship ?? 50) + (sub.amount ?? 0))),
                  },
                }
              }
            } else if (sub.type === 'kommunBidragChange') {
              // 2026-08-17 (Stickiness-audit): politicianEvents.ts:151-155 lovar "+6 000
              // kr/sä kommunbidrag" i subtitlen via en multiEffect-subEffect, men denna
              // gren saknades — effekten var tyst noll. Samma matte som top-level
              // case 'kommunBidragChange' (rad 491-499).
              if (updatedGame.localPolitician) {
                const delta = sub.amount ?? 0
                updatedGame = {
                  ...updatedGame,
                  localPolitician: {
                    ...updatedGame.localPolitician,
                    kommunBidrag: Math.max(0, (updatedGame.localPolitician.kommunBidrag ?? 0) + delta),
                    kommunBidragModifier: (updatedGame.localPolitician.kommunBidragModifier ?? 0) + delta,
                  },
                }
              }
            } else if (sub.type === 'reputation') {
              // 2026-08-17 (Stickiness-audit): politicianEvents.ts:118-121 lovar "+5
              // reputation" i subtitlen (redan en gång "synkad mot subtitlen" enligt M29-
              // kommentaren där — den synken la till subEffect-posten men missade att
              // multiEffect-resolvern saknade en reputation-gren, så effekten förblev
              // tyst noll). Samma matte som top-level case 'reputation' (rad 536-546).
              updatedGame = {
                ...updatedGame,
                clubs: updatedGame.clubs.map(c =>
                  c.id === updatedGame.managedClubId
                    ? { ...c, reputation: Math.max(1, Math.min(100, c.reputation + (sub.amount ?? 0))) }
                    : c
                ),
              }
            } else if (sub.type === 'facilitiesUpgrade') {
              // DOMLOGG 2026-08-31 §3-A: samma failure-mode som reputation-
              // grenen ovan dokumenterar — communityActivitiesEvents.ts:s
              // renovate-val lovade "🏗️ +15 faciliteter" i undertexten, men
              // multiEffect-resolvern saknade en facilitiesUpgrade-gren, så
              // löftet förblev tyst noll. Samma matte som top-level case
              // 'facilitiesUpgrade' (rad ~815).
              updatedGame = {
                ...updatedGame,
                clubs: updatedGame.clubs.map(c =>
                  c.id === updatedGame.managedClubId
                    ? { ...c, facilities: Math.max(0, Math.min(100, (c.facilities ?? 50) + (sub.amount ?? 5))) }
                    : c
                ),
              }
            } else if (sub.type === 'supporterMood') {
              if (updatedGame.supporterGroup) {
                updatedGame = {
                  ...updatedGame,
                  supporterGroup: {
                    ...updatedGame.supporterGroup,
                    mood: Math.max(0, Math.min(100, updatedGame.supporterGroup.mood + (sub.amount ?? 0))),
                  },
                }
              }
            } else if (sub.type === 'boostMorale') {
              // 2.5 (choice-label-svepet, 2026-08-17): villkoret var tidigare
              // `&& sub.targetPlayerId` — ett saknat fält gjorde att grenen
              // aldrig ens matchade, tyst noll-effekt. Samma vaktprincip som
              // top-level case 'boostMorale' ovan.
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'boostMorale' saknar obligatoriskt fält targetPlayerId")
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.id === sub.targetPlayerId
                    ? { ...p, morale: Math.max(0, Math.min(100, p.morale + (sub.amount ?? 5))) }
                    : p
                ),
              }
            } else if (sub.type === 'restPlayer') {
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'restPlayer' saknar obligatoriskt fält targetPlayerId")
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.id === sub.targetPlayerId
                    ? { ...p, restGamesRemaining: Math.max(p.restGamesRemaining ?? 0, sub.amount ?? 1) }
                    : p
                ),
              }
            } else if (sub.type === 'releasePlayer') {
              // O2 lager 1 (Jacobs dom 2026-08-24): arcService.ts:s let_go-val
              // — samma gren som top-level case 'releasePlayer', tillgänglig
              // här så let_go kan kombinera den med den redan skrivna
              // "💛 Moral −25"-texten utan att uppfinna ny svensk copy.
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'releasePlayer' saknar obligatoriskt fält targetPlayerId")
              {
                const pid = sub.targetPlayerId
                updatedGame = {
                  ...updatedGame,
                  players: updatedGame.players.map(p => p.id === pid ? { ...p, clubId: 'free_agent' } : p),
                  clubs: updatedGame.clubs.map(c =>
                    c.id === updatedGame.managedClubId
                      ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== pid) }
                      : c
                  ),
                }
              }
            } else if (sub.type === 'extendContract') {
              // O1 kandidat 2 (Jacobs dom 2026-08-24, veteran_farewell): samma
              // gren som top-level case 'extendContract' ovan, tillgänglig här
              // så extend_veteran kan kombinera kontraktsförlängningen med
              // supporterMood (klackens reaktion är konsekvensen, inte
              // villkoret — den kan bara uttryckas i samma val via multiEffect).
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'extendContract' saknar obligatoriskt fält targetPlayerId")
              {
                const pid = sub.targetPlayerId
                const years = sub.contractYears ?? 1
                updatedGame = {
                  ...updatedGame,
                  players: updatedGame.players.map(p =>
                    p.id === pid
                      ? {
                          ...p,
                          contractUntilSeason: updatedGame.currentSeason + years,
                          salary: sub.value ?? p.salary,
                          morale: Math.min(100, p.morale + 10),
                        }
                      : p,
                  ),
                  handledContractPlayerIds: [...(updatedGame.handledContractPlayerIds ?? []), pid],
                }
              }
            } else if (sub.type === 'developmentRateDelta') {
              // O2 lager 3 (Jacobs dom 2026-08-24): samma gren som
              // top-level case 'developmentRateDelta' — arcService.ts:s
              // back_him kombinerar den med boostMorale (Jacobs låsta
              // subtitle "Han får spela sig igenom det...").
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'developmentRateDelta' saknar obligatoriskt fält targetPlayerId")
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.id === sub.targetPlayerId
                    ? { ...p, developmentRate: Math.max(0, Math.min(100, p.developmentRate + (sub.amount ?? 0))) }
                    : p
                ),
              }
            } else if (sub.type === 'disciplineDelta') {
              // O2 lager 3 (Jacobs dom 2026-08-24): samma gren som
              // top-level case 'disciplineDelta' — arcService.ts:s
              // back_joker kombinerar den med boostMorale (Jacobs låsta
              // subtitle "Du säger inget om utvisningarna...").
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'disciplineDelta' saknar obligatoriskt fält targetPlayerId")
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.id === sub.targetPlayerId
                    ? { ...p, discipline: Math.max(0, Math.min(100, p.discipline + (sub.amount ?? 0))) }
                    : p
                ),
              }
            } else if (sub.type === 'teamBoostMorale') {
              // O2 lager 3 (Jacobs dom 2026-08-24): samma gren som
              // top-level case 'teamBoostMorale' — arcService.ts:s
              // ceremony_flowers/give_word kombinerar den med income/
              // boardPatience (priset för en riskfri lagbred gest, se
              // O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md).
              if (!sub.targetClubId) throw new Error("multiEffect-subEffect 'teamBoostMorale' saknar obligatoriskt fält targetClubId")
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.clubId === sub.targetClubId
                    ? { ...p, morale: Math.min(100, Math.max(0, p.morale + (sub.amount ?? 5))) }
                    : p
                ),
              }
            } else if (sub.type === 'makeFullTimePro') {
              // 2.5 (choice-label-svepet, 2026-08-17): saknades helt —
              // varsel-eventets 'offer_pro'-val konstruerade denna sub-typ,
              // men multiEffect-resolvern hade ingen gren för den. Total
              // no-op bakom "höjd lönekostnad · +15 moral". Samma effekt som
              // top-level case 'makeFullTimePro'.
              if (!sub.targetPlayerId) throw new Error("multiEffect-subEffect 'makeFullTimePro' saknar obligatoriskt fält targetPlayerId")
              updatedGame = applyFullTimePro(updatedGame, sub.targetPlayerId, sub.value, madeByPlayer)
            } else if (sub.type === 'patronInfluence') {
              if (updatedGame.patron) {
                updatedGame = {
                  ...updatedGame,
                  patron: {
                    ...updatedGame.patron,
                    influence: Math.max(0, Math.min(100, (updatedGame.patron.influence ?? 30) + (sub.amount ?? 0))),
                  },
                }
              }
            } else if (sub.type === 'patronHappiness') {
              updatedGame = applyPatronHappiness(updatedGame, sub.amount ?? 0)
            } else if (sub.type === 'mecenatHappiness') {
              // 2.5-vakt-svepet (2026-08-17): villkoret var tidigare
              // `&& sub.targetMecenatId` — samma tyst-no-op-mönster som
              // boostMorale/makeFullTimePro-subeffekterna ovan. Saknad
              // mecenater-array eller permanentlyWithdrawn förblir ett
              // legitimt tyst skip (speltillstånd, inte konstruktionsfel).
              if (!sub.targetMecenatId) throw new Error("multiEffect-subEffect 'mecenatHappiness' saknar obligatoriskt fält targetMecenatId")
              if (updatedGame.mecenater && !updatedGame.mecenater.find(m => m.id === sub.targetMecenatId)?.permanentlyWithdrawn) {
                const delta = sub.amount ?? 0
                updatedGame = {
                  ...updatedGame,
                  mecenater: updatedGame.mecenater.map(m =>
                    m.id === sub.targetMecenatId
                      ? {
                          ...m,
                          happiness: Math.max(0, Math.min(100, m.happiness + delta)),
                          lastInteractionRound: updatedGame.currentMatchday,
                        }
                      : m
                  ),
                }
              }
            } else if (sub.type === 'startBurnoutCeilingRecovery') {
              // DOM_BURNOUT_TAK_2026-09-02 (C) — "Kliv tillbaka"-valets
              // garanterade nedtrend. amount = antal omgångar. Läses av
              // updateManagerBurnout (managerProfileService.ts, nettodelta-
              // golvet) och getBurnoutTacticSuppression (burnoutReliefService.ts,
              // tvingad full taktikundertryckning under samma fönster).
              updatedGame = {
                ...updatedGame,
                burnoutCeilingRecoveryUntilRound: updatedGame.currentMatchday + (sub.amount ?? 0),
              }
            }
          }
        }
      }
      break
    }
    case 'supporterMood': {
      if (updatedGame.supporterGroup) {
        updatedGame = {
          ...updatedGame,
          supporterGroup: {
            ...updatedGame.supporterGroup,
            mood: Math.max(0, Math.min(100, updatedGame.supporterGroup.mood + (effect.amount ?? 0))),
          },
        }
      }
      break
    }
    case 'hallProcess': {
      // B1 §5 (06-12-modellen): uppdatera FacilityState.hallTrial.
      // 2.5-vakt-svepet (2026-08-17): utan hallProcessData sker ingen
      // uppdatering av hallprövningen alls — tyst no-op på ett helt
      // valresultat. JSON.parse-fel tystas fortfarande (malformad sträng).
      const rawData = effect.hallProcessData
      if (!rawData) throw new Error("effect 'hallProcess' saknar obligatoriskt fält hallProcessData")
      {
        try {
          const update = JSON.parse(rawData) as {
            init?: HallTrial
            stage?: HallTrialStage
            stageStartedRound?: number
            supportDelta?: number
            finansiering?: 'egen' | 'kommun' | 'patron'
            cooldownUntilSeason?: number
            selfNedlagd?: boolean
            buildCost?: number
            buildPausedUntilSeason?: number
            buildPausedAtMatchday?: number
          }
          const currentTrial = updatedGame.facilityState?.hallTrial
          let newTrial: HallTrial
          if (update.init) {
            newTrial = update.init
          } else if (currentTrial) {
            newTrial = {
              ...currentTrial,
              ...(update.stage !== undefined && { stage: update.stage }),
              ...(update.stageStartedRound !== undefined && { stageStartedRound: update.stageStartedRound }),
              ...(update.supportDelta !== undefined && {
                support: Math.max(0, Math.min(100, (currentTrial.support ?? 50) + update.supportDelta)),
              }),
              ...(update.finansiering !== undefined && { finansiering: update.finansiering }),
              ...(update.cooldownUntilSeason !== undefined && { cooldownUntilSeason: update.cooldownUntilSeason }),
              ...(update.buildPausedUntilSeason !== undefined && { buildPausedUntilSeason: update.buildPausedUntilSeason }),
              ...(update.buildPausedAtMatchday !== undefined && { buildPausedAtMatchday: update.buildPausedAtMatchday }),
            }
          } else break
          const baseFacState = updatedGame.facilityState ?? { builtNodeIds: [] }
          const shouldStartBuild = newTrial.stage === 'bygge'
            && !baseFacState.activeProject
            && !baseFacState.builtNodeIds.includes('matchhall')
          const resolvedFacState = shouldStartBuild
            ? startFacilityBuild('matchhall', baseFacState, updatedGame.currentMatchday)
            : baseFacState
          const matchhallDef = FACILITY_NODE_DEFS.find(def => def.id === 'matchhall')
          const externalShare = update.finansiering === 'kommun'
            ? (matchhallDef?.financing?.kommun?.share ?? 0)
            : update.finansiering === 'patron'
              ? (matchhallDef?.financing?.mecenat?.share ?? 0)
              : 0
          const buildCost = update.buildCost ?? Math.round((matchhallDef?.cost ?? 0) * (1 - externalShare))
          if (shouldStartBuild && (!Number.isFinite(buildCost) || buildCost < 0)) {
            throw new Error("effect 'hallProcess': buildCost måste vara ett icke-negativt tal")
          }
          updatedGame = {
            ...updatedGame,
            facilityState: { ...resolvedFacState, hallTrial: newTrial },
            clubs: shouldStartBuild
              ? applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, -buildCost)
              : updatedGame.clubs,
          }
          // Avbryta-val: liten klackMood-vinst ("han lyssnade")
          if (update.selfNedlagd && updatedGame.supporterGroup) {
            updatedGame = {
              ...updatedGame,
              supporterGroup: {
                ...updatedGame.supporterGroup,
                mood: Math.min(100, updatedGame.supporterGroup.mood + 3),
              },
            }
          }

          // Release-svepet 2026-07-21 (Block 3c) — PROVNING_RESOLUTION → inbox
          // (permanent post-it, händelsekortet självt arkiveras aldrig — bara
          // ID:t i resolvedEventIds) + ett kort kafferums-eko (samma pending+
          // expires-mönster som pendingVictoryEcho/pendingNationalTeamReturn).
          // Bara förankringens EGEN röstningsutgång (hallprocess_res_s-eventet)
          // bär den här texten — förhandlingens kommun-nej (hallprocess_fhnej_s)
          // har sin egen, andra text (ingen PROVNING_RESOLUTION-post finns för
          // den, rörs inte). nedlagd_egen hör bara till avbryta-valet.
          let resolutionText: string | undefined
          if (update.selfNedlagd) {
            resolutionText = PROVNING_RESOLUTION.nedlagd_egen
          } else if (eventId.startsWith('hallprocess_res_s')) {
            if (update.stage === 'bordlagd') resolutionText = PROVNING_RESOLUTION.bordlagd
            else if (update.stage === 'nedlagd') resolutionText = PROVNING_RESOLUTION.nedlagd_fall
          }
          if (resolutionText) {
            const resInboxId = `inbox_hall_resolution_${eventId}`
            updatedGame = {
              ...updatedGame,
              inbox: updatedGame.inbox.some(i => i.id === resInboxId)
                ? updatedGame.inbox
                : [...updatedGame.inbox, {
                    id: resInboxId,
                    date: updatedGame.currentDate,
                    type: InboxItemType.Community,
                    title: 'Hallfrågan',
                    body: resolutionText,
                    isRead: false,
                  }],
              pendingHallEcho: { text: resolutionText },
              hallEchoExpires: (updatedGame.currentMatchday ?? 0) + 1,
            }
          }
        } catch (e) {
          if (e instanceof SyntaxError) { /* malformed payload — silently ignore */ } else { throw e }
        }
      }
      break
    }
    case 'noOp':
      // Mecenat intro declined — remove the pending (inactive) mecenat from the array
      if (eventId.startsWith('event_mecenat_intro_') && updatedGame.mecenater?.length) {
        const mecenatId = eventId.replace('event_mecenat_intro_', '')
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.filter(m => !(m.id === mecenatId && !m.isActive)),
        }
      }
      break
    case 'finance': {
      // DEV-012: direct finance mutation for economic stress events
      updatedGame = {
        ...updatedGame,
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.value ?? 0),
      }
      break
    }
    case 'lockKioskSupplyContract': {
      // O2 materialar-/korvfallet: den utlovade tvååriga bindningen var
      // tidigare bara text, vilket gjorde +4 000-valet strikt dominant över
      // no-op-alternativet. Bindningen spärrar nya omförhandlingar tills
      // perioden löpt ut; värdet i att behålla flexibiliteten blir därmed
      // verkligt utan att uppfinna en annan kostnad än den spelaren såg.
      updatedGame = {
        ...updatedGame,
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.value ?? 0),
        kioskSupplyContractUntilSeason: updatedGame.currentSeason + (effect.amount ?? 2),
      }
      break
    }
    case 'moraleDelta': {
      // DEV-012: apply morale delta to all managed club players
      const delta = effect.value ?? 0
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.clubId === updatedGame.managedClubId
            ? { ...p, morale: Math.max(0, Math.min(100, p.morale + delta)) }
            : p
        ),
      }
      break
    }
    case 'saveBandyLetter': {
      // DREAM-010: archive the letter + reply
      const letter = {
        id: eventId,
        senderName: event.sender?.name ?? 'Okänd',
        // Nya events bär dessa strukturerat. Fallbackarna bevarar äldre
        // serialiserade brev utan att försöka gissa ur brödtexten.
        senderAge: effect.senderAge ?? 0,
        senderOrigin: effect.senderOrigin ?? effect.communityValue ?? '',
        season: updatedGame.currentSeason,
        text: event.body,
        playerReply: effect.replyText,
        savedInArchive: true,
      }
      updatedGame = {
        ...updatedGame,
        bandyLetters: [...(updatedGame.bandyLetters ?? []), letter],
        bandyLetterThisSeason: updatedGame.currentSeason,
      }
      break
    }
    case 'startEconomicCrisis': {
      // DREAM-002: initialise or advance the crisis state
      const currentMatchday = updatedGame.fixtures
        .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout)
        .reduce((m, f) => Math.max(m, f.matchday ?? 0), 0)
      // pressure_rejected → treat as 'pressure' phase (sponsor left without plan)
      const rawPhase = effect.crisisPhase ?? 'awareness'
      const phase = (rawPhase === 'pressure_rejected' ? 'pressure' : rawPhase) as 'awareness' | 'pressure' | 'decision' | 'resolved'
      if (!updatedGame.economicCrisisState) {
        updatedGame = {
          ...updatedGame,
          economicCrisisState: {
            startedSeason: updatedGame.currentSeason,
            startedMatchday: currentMatchday,
            phase,
            eventsFired: ['awareness'],
          },
        }
      } else {
        updatedGame = {
          ...updatedGame,
          economicCrisisState: {
            ...updatedGame.economicCrisisState,
            phase,
            eventsFired: [...updatedGame.economicCrisisState.eventsFired, rawPhase],
          },
        }
      }
      if (effect.value) {
        updatedGame = {
          ...updatedGame,
          clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.value),
        }
      }
      break
    }
    case 'resolveEconomicCrisis': {
      // DREAM-002: resolve the crisis
      const outcomeMap: Record<string, 'sold_star' | 'loan' | 'mecenat' | 'natural_recovery'> = {
        sold_star: 'sold_star', loan: 'loan', mecenat: 'mecenat',
      }
      const outcome = outcomeMap[effect.crisisPhase ?? ''] ?? 'natural_recovery'
      // 2.5-vakt-svepet (2026-08-17): outcome='sold_star' skrevs tidigare till
      // economicCrisisState oavsett om removePlayerId fanns — en falsk
      // "spelare-sald"-berättelse utan att någon spelare faktiskt togs bort
      // (samma klass som varsel offer_pro-storylinen, 441c4474). Reproducerbart
      // i economicCrisisService.ts om managedPlayers är tomt (bestPlayer
      // undefined) — se rapport i CHOICE_LABEL_SVEP_2026-08-17.md.
      if (outcome === 'sold_star' && !effect.removePlayerId) throw new Error("effect 'resolveEconomicCrisis' med crisisPhase 'sold_star' saknar obligatoriskt fält removePlayerId")
      // Efterdyning-stämpel: senaste spelade ligamatch denna säsong (counter-oberoende,
      // samma mönster som journalist-premissen ovan — rör inte currentMatchday-räknaren).
      const resolvedMatchday = updatedGame.fixtures
        .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout && f.season === updatedGame.currentSeason)
        .reduce((max, f) => Math.max(max, f.matchday ?? 0), 0)
      // sold_star: fånga namnet FÖRE removePlayerId tar bort spelaren ur truppen
      const soldToSurvivePlayerName = outcome === 'sold_star' && effect.removePlayerId
        ? (() => {
            const sold = updatedGame.players.find(p => p.id === effect.removePlayerId)
            return sold ? `${sold.firstName} ${sold.lastName}` : undefined
          })()
        : undefined
      updatedGame = {
        ...updatedGame,
        economicCrisisState: updatedGame.economicCrisisState
          ? {
              ...updatedGame.economicCrisisState,
              phase: 'resolved' as const,
              outcome,
              resolvedMatchday,
              ...(soldToSurvivePlayerName ? { soldToSurvivePlayerName } : {}),
            }
          : undefined,
      }
      if (effect.value) {
        updatedGame = {
          ...updatedGame,
          clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, effect.value),
        }
      }
      if (effect.removePlayerId) {
        const pid = effect.removePlayerId
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p => p.id === pid ? { ...p, clubId: 'free_agent' } : p),
          clubs: updatedGame.clubs.map(c =>
            c.id === updatedGame.managedClubId
              ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== pid) }
              : c
          ),
        }
      }
      // O2 lager 1 (Jacobs dom 2026-08-24): ask_mecenat-valets tidigare
      // okodade "lojalitet −30" — targetMecenatId/mecenatHappinessDelta
      // satta av economicCrisisService.ts vid konstruktionstillfället
      // (tie-break: mecenaten med högst happiness).
      if (effect.targetMecenatId && effect.mecenatHappinessDelta !== undefined && updatedGame.mecenater) {
        const targetId = effect.targetMecenatId
        const delta = effect.mecenatHappinessDelta
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.map(m =>
            m.id === targetId ? { ...m, happiness: Math.max(0, Math.min(100, m.happiness + delta)) } : m
          ),
        }
      }
      break
    }
    case 'saveSchoolAssignment': {
      // DREAM-016: archive the school assignment answer
      if (!effect.replyText) {
        throw new Error("effect 'saveSchoolAssignment' saknar obligatoriskt fält replyText")
      }
      const player = event.relatedPlayerId
        ? updatedGame.players.find(p => p.id === event.relatedPlayerId)
        : undefined
      const record = {
        season: updatedGame.currentSeason,
        youngPlayerName: player ? `${player.firstName} ${player.lastName}` : event.sender?.name ?? '',
        choiceLabel: event.choices.find(c => c.id === choiceId)?.label ?? choiceId,
        archiveText: effect.replyText,
      }
      updatedGame = {
        ...updatedGame,
        schoolAssignmentArchive: [...(updatedGame.schoolAssignmentArchive ?? []), record],
        schoolAssignmentThisSeason: updatedGame.currentSeason,
      }
      break
    }
    case 'scoutBudget': {
      const delta = effect.amount ?? 0
      updatedGame = {
        ...updatedGame,
        scoutBudget: Math.max(0, Math.min(30, (updatedGame.scoutBudget ?? 10) + delta)),
      }
      break
    }
    case 'refereeRelationship': {
      // 2.5-vakt-svepet (2026-08-17): utan refereeId sker ingen uppdatering
      // alls, men pendingRefereeMeeting rensades ändå — mötet såg "avklarat"
      // ut för spelaren trots att relationen aldrig rördes.
      const delta = effect.value ?? 0
      const refId = effect.refereeId
      if (!refId) throw new Error("effect 'refereeRelationship' saknar obligatoriskt fält refereeId")
      if (updatedGame.refereeRelations !== undefined) {
        const existing = updatedGame.refereeRelations.find(r => r.refereeId === refId)
        if (existing) {
          const newReaction = Math.max(-2, Math.min(2, existing.clubReaction + delta)) as -2 | -1 | 0 | 1 | 2
          updatedGame = {
            ...updatedGame,
            refereeRelations: updatedGame.refereeRelations.map(r =>
              r.refereeId === refId ? { ...r, clubReaction: newReaction } : r
            ),
          }
          // DOM_DOMARRELATION_2026-09-02 (Jacobs beslut, nivå 3): clubReaction-
          // valet blir sant på riktigt — när attityden korsar en tröskel (in
          // i -2/+2 FRÅN ett mindre extremt läge, aldrig bara "ligger kvar
          // där") skrivs en liggarpost, samma steg-2-3-mönster som patron/
          // burnout. Första gången SKAPAR relationen (existing===undefined)
          // kan aldrig träffa tröskeln direkt (delta är max ±1) — bara denna
          // gren kan korsa. madeByPlayer: true — bara ett spelarval når hit.
          if (newReaction === -2 && existing.clubReaction > -2) {
            updatedGame = {
              ...updatedGame,
              eventLedger: logEvent(updatedGame, {
                type: 'referee_feud',
                semanticKey: `referee_feud_${refId}`,
                season: updatedGame.currentSeason,
                matchday: updatedGame.currentMatchday,
                subject: { kind: 'referee', id: refId },
                significance: 65,
                madeByPlayer: true,
              }),
            }
          } else if (newReaction === 2 && existing.clubReaction < 2) {
            updatedGame = {
              ...updatedGame,
              eventLedger: logEvent(updatedGame, {
                type: 'referee_trust',
                semanticKey: `referee_trust_${refId}`,
                season: updatedGame.currentSeason,
                matchday: updatedGame.currentMatchday,
                subject: { kind: 'referee', id: refId },
                significance: 65,
                madeByPlayer: true,
              }),
            }
          }
        } else {
          // First time — create relation. delta är max ±1 (en enda mötes-
          // choice), kan aldrig träffa ±2-tröskeln direkt — ingen liggarpost
          // härifrån, se grenen ovan.
          const newReaction = Math.max(-2, Math.min(2, delta)) as -2 | -1 | 0 | 1 | 2
          updatedGame = {
            ...updatedGame,
            refereeRelations: [
              ...(updatedGame.refereeRelations ?? []),
              {
                refereeId: refId,
                lastMatchSeason: updatedGame.currentSeason,
                lastMatchRound: 0,
                totalMatches: 0,
                totalCardsGiven: 0,
                totalPenaltiesGiven: 0,
                clubReaction: newReaction,
              },
            ],
          }
        }
      }
      // Also clear pending referee meeting
      updatedGame = { ...updatedGame, pendingRefereeMeeting: undefined }
      break
    }
    case 'setLegendRole': {
      // 2.5-vakt-svepet (2026-08-17): utan legendRole/relatedPlayerId sätts
      // ingen roll alls — tyst no-op på pensionsceremonins enda beslut.
      const role = effect.legendRole as 'youth_coach' | 'scout' | 'farewell' | undefined
      if (!role) throw new Error("effect 'setLegendRole' saknar obligatoriskt fält legendRole")
      if (!event.relatedPlayerId) throw new Error("event 'retirementCeremony' saknar obligatoriskt fält relatedPlayerId för setLegendRole")
      {
        updatedGame = {
          ...updatedGame,
          clubLegends: (updatedGame.clubLegends ?? []).map(l =>
            l.playerId === event.relatedPlayerId ? { ...l, role } : l
          ),
        }
        if (role === 'youth_coach') {
          updatedGame = {
            ...updatedGame,
            clubs: updatedGame.clubs.map(c =>
              c.id === updatedGame.managedClubId
                ? { ...c, youthQuality: Math.min(100, (c.youthQuality ?? 50) + 5) }
                : c
            ),
          }
        } else if (role === 'scout') {
          updatedGame = {
            ...updatedGame,
            scoutBudget: Math.min(30, (updatedGame.scoutBudget ?? 10) + 3),
          }
        }
      }
      break
    }
    case 'openNegotiation':
    default:
      break
  }

  // Special: detOmojligaValet sell — remove player from squad
  // H3 (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24): O18
  // fält 2 (seasonDecisionCaptureService.ts) skriver "Du sålde {namn}" för
  // detta val — den meningen får bara skrivas när övergången faktiskt
  // hände. Hård assertion HÄR (inte bara ett hopp att sentence-byggaren
  // råkar stämma överens) — om `event.relatedPlayerId` saknas, eller
  // spelaren av någon anledning inte kan hittas/tas bort, ska resolutionen
  // krascha synligt, inte tyst lämna spelaren kvar medan årsboken ändå
  // påstår att han lämnade.
  if (event.type === 'detOmojligaValet' && choiceId === 'sell') {
    const pid = event.relatedPlayerId
    if (!pid) throw new Error("detOmojligaValet/sell saknar obligatoriskt fält relatedPlayerId")
    updatedGame = {
      ...updatedGame,
      players: updatedGame.players.map(p => p.id === pid ? { ...p, clubId: 'free_agent' } : p),
      clubs: updatedGame.clubs.map(c =>
        c.id === updatedGame.managedClubId
          ? { ...c, squadPlayerIds: c.squadPlayerIds.filter(id => id !== pid) }
          : c
      ),
      inbox: [...(updatedGame.inbox ?? []), {
        id: `inbox_sell_academyproduct_${pid}_${updatedGame.currentSeason}`,
        date: updatedGame.currentDate,
        type: InboxItemType.Media,
        title: 'Akademijuvel säljs',
        body: 'Klubben säljer sin akademiprodukt för att lösa den ekonomiska krisen. Lokaltidningen skriver kritiskt om beslutet.',
        isRead: false,
      }],
    }
    const soldPlayer = updatedGame.players.find(p => p.id === pid)
    const stillInSquad = updatedGame.clubs
      .find(c => c.id === updatedGame.managedClubId)?.squadPlayerIds.includes(pid)
    if (!soldPlayer || soldPlayer.clubId === updatedGame.managedClubId || stillInSquad) {
      throw new Error(`detOmojligaValet/sell: spelare ${pid} finns fortfarande i managedClub efter sell — invariant bruten`)
    }
  }

  // SupporterGroup-markörerna konsumeras mot global currentMatchday i
  // klackPresenter. lastProcessedMatchday är en processorcursor och kan
  // ligga på en annan axel/vara stale; lagra den kanoniska tidpunkten här.
  const resolvedMatchday = game.currentMatchday

  // Special: supporterEvent tifo — mark tifoDone
  if (event.type === 'supporterEvent' && event.id.startsWith('supporter_tifo_') && choiceId !== 'no' && updatedGame.supporterGroup) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: { ...updatedGame.supporterGroup, tifoDone: true, tifoDoneMatchday: resolvedMatchday },
    }
  }

  // Special: supporterEvent away_trip — mark awayTripSeason
  if (event.type === 'supporterEvent' && event.id.startsWith('supporter_away_trip_') && updatedGame.supporterGroup) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: { ...updatedGame.supporterGroup, awayTripSeason: updatedGame.currentSeason, awayTripMatchday: resolvedMatchday },
    }
  }

  // Special: supporterEvent conflict — mark conflictSeason
  if (event.type === 'supporterEvent' && event.id.startsWith('supporter_conflict_') && updatedGame.supporterGroup) {
    updatedGame = {
      ...updatedGame,
      supporterGroup: { ...updatedGame.supporterGroup, conflictSeason: updatedGame.currentSeason, conflictMatchday: resolvedMatchday },
    }
  }

  // Special: spoksponsor accept — add board member modernist
  // KF4 (2026-06-21): EN styrelsemodell — bygg full BoardMember på game.board.
  // Namn behålls som 'Okänd Investerare' (uppdelat), kön/ålder deterministisk default.
  if (event.type === 'spoksponsor' && choiceId === 'accept') {
    const existing = updatedGame.board ?? []
    const ledamotCount = existing.filter(m => m.role === 'ledamot').length
    const newMember = {
      id: `ledamot-${ledamotCount}`,
      firstName: 'Okänd',
      lastName: 'Investerare',
      age: 50,
      gender: 'm' as const,
      role: 'ledamot' as const,
      personality: 'modernist' as const,
    }
    updatedGame = {
      ...updatedGame,
      board: [...existing, newMember],
    }
  }

  // Special: school conflict — affect youth player confidence
  if (eventId.startsWith('event_school_conflict_') && updatedGame.youthTeam && event.relatedPlayerId) {
    const youthPlayerId = event.relatedPlayerId
    const confidenceDelta = choiceId === 'let_study' ? 8 : -8
    updatedGame = {
      ...updatedGame,
      youthTeam: {
        ...updatedGame.youthTeam,
        players: updatedGame.youthTeam.players.map(p =>
          p.id === youthPlayerId
            ? { ...p, confidence: Math.max(0, Math.min(100, p.confidence + confidenceDelta)) }
            : p
        ),
      },
    }
  }

  // Special: district callup — affect confidence + development of EXACTLY
  // the named players (M3, audit 5c9a7a8, 2026-08-24). Tidigare filtrerade
  // detta blocket om truppen på nytt (potentialAbility > 50) vid
  // resolveringstillfället — kunde träffa fler/andra spelare än kortet
  // faktiskt namngav (truppen kan ha ändrats sedan kortet visades, t.ex.
  // efter en P19-match). Läser nu event.selectedPlayerIds, satt vid
  // korttillfället (youthProcessor.ts). "send" sätter också
  // availabilityUntilRound — kortets löfte "Ej tillgänglig 2 omg" hade
  // tidigare ingen mekanik alls (simulateYouthMatch, academyService.ts).
  if (eventId.startsWith('event_district_callup_') && updatedGame.youthTeam) {
    const selectedIds = event.selectedPlayerIds ?? []
    if (selectedIds.length > 0) {
      const confidenceDelta = choiceId === 'send' ? 15 : -5
      const devDelta = choiceId === 'send' ? 2 : 0
      // P19-matcher spelas var annan omgång (nextMatchday % 2 === 0) —
      // +4 matchdays täcker exakt de två nästa P19-omgångarna kortet lovar.
      const availabilityUntilRound = updatedGame.currentMatchday + 4
      updatedGame = {
        ...updatedGame,
        youthTeam: {
          ...updatedGame.youthTeam,
          players: updatedGame.youthTeam.players.map(p =>
            selectedIds.includes(p.id)
              ? {
                  ...p,
                  confidence: Math.max(0, Math.min(100, p.confidence + confidenceDelta)),
                  developmentRate: Math.min(100, p.developmentRate + devDelta),
                  ...(choiceId === 'send' ? { availabilityUntilRound } : {}),
                }
              : p
          ),
        },
      }
    }
  }

  // C-T6: add exactly the bandy-school candidates carried by the decision.
  // The two-player option is resolved from the frozen payload, not by
  // regenerating prospects from the current P19 state.
  if (eventId.startsWith('event_academy_school_partnership_') && updatedGame.youthTeam) {
    const candidates = event.schoolIntakeCandidates ?? []
    const selected = choiceId === 'take_all'
      ? candidates
      : choiceId === 'take_best'
        ? [...candidates]
            .sort((a, b) => b.potentialAbility - a.potentialAbility || b.currentAbility - a.currentAbility)
            .slice(0, 2)
        : []
    const existingIds = new Set(updatedGame.youthTeam.players.map(player => player.id))
    updatedGame = {
      ...updatedGame,
      youthTeam: {
        ...updatedGame.youthTeam,
        players: [
          ...updatedGame.youthTeam.players,
          ...selected.filter(player => !existingIds.has(player.id)),
        ],
      },
    }
  }

  // Special: pressConference — clear pendingPressConference + DEV-013 refusal consequence
  if (event.type === 'pressConference') {
    // Clear pendingPressConference (WEAK-002)
    if (updatedGame.pendingPressConference?.id === eventId) {
      updatedGame = { ...updatedGame, pendingPressConference: undefined }
    }
    // DEV-013: critical article after 3 refusals
    // M36 (textaudit 2026-07-04): pressRefusals nollställs aldrig, så `>= 3` gav
    // en ny kritisk artikel i inkorgen vid VARJE vägran från och med den tredje
    // (varje refusal_id unik via räknaren) — oändlig spam. `=== 3` triggar exakt
    // en gång, eftersom räknaren bara ökar.
    if (choiceId === 'refuse_press' && updatedGame.journalist && updatedGame.journalist.pressRefusals === 3) {
      const managerName = updatedGame.managerName ?? 'Tränaren'
      const article = generateCriticalArticle(updatedGame.journalist, managerName, updatedGame.currentDate)
      const updatedJournalist = { ...updatedGame.journalist, style: 'provocative' as const }
      updatedGame = {
        ...updatedGame,
        journalist: updatedJournalist,
        inbox: [article, ...updatedGame.inbox],
      }
    }
  }

  // Special: refereeMeeting — clear pendingRefereeMeeting
  if (event.type === 'refereeMeeting') {
    if (updatedGame.pendingRefereeMeeting?.id === eventId) {
      updatedGame = { ...updatedGame, pendingRefereeMeeting: undefined }
    }
  }

  // C-B1: csPress — CS-villkorad pressfråga
  if (event.type === 'csPress') {
    const choiceType = choiceId as PressChoice
    const playerId = event.relatedPlayerId
    const fixtureId = event.relatedFixtureId

    const player = playerId ? updatedGame.players.find(p => p.id === playerId) : undefined
    const fixture = fixtureId ? updatedGame.fixtures.find(f => f.id === fixtureId) : undefined
    const opponent = fixture
      ? updatedGame.clubs.find(c => c.id === (
          fixture.homeClubId === updatedGame.managedClubId ? fixture.awayClubId : fixture.homeClubId
        ))
      : undefined
    const journalist = updatedGame.journalist

    // O2 lager 3 (Jacobs dom 2026-08-24): individual dominerade tidigare de
    // andra tre valen fullständigt (vann eller delade på båda mätta
    // dimensionerna — se O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md). Jacobs
    // dom: "individual förblir bäst i förväntan men inte riskfri, och
    // system/team får en äkta nisch." De tre valen görs nu genuint olika i
    // KARAKTÄR, inte bara i magnitud:
    // - individual: oförändrad uppsida (+5 spelaren, +3 journalist), men en
    //   18% risk att en SLUMPMÄSSIG lagkamrat (inte spelaren själv) tappar
    //   4 moral — avundsjuka i laget av att en spelare lyfts fram ensam.
    // - team: ingen risk, men bredd — hela truppen (inte bara spelaren) får
    //   +2 moral istället för spelarens tidigare 0.
    // - system: den tidigare −2 var aldrig en verklig avvägning (ingen text
    //   förklarade varför "systemet" skulle skada spelarens moral) — tas
    //   bort. Nischen blir journalistrelationen: +4 istället för individuals
    //   +3, riskfritt. "Strukturen håller" bygger press-förtroendet stabilast.
    if (player) {
      const moraleDelta = choiceType === 'individual' ? 5 : 0
      if (moraleDelta !== 0) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === playerId
              ? { ...p, morale: Math.min(100, Math.max(0, (p.morale ?? 50) + moraleDelta)) }
              : p
          ),
        }
      }
    }

    if (choiceType === 'individual' && playerId && rand() < 0.18) {
      const teammates = updatedGame.players.filter(
        p => p.clubId === updatedGame.managedClubId && p.id !== playerId
      )
      if (teammates.length > 0) {
        const envious = teammates[Math.floor(rand() * teammates.length)]
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.id === envious.id ? { ...p, morale: Math.max(0, (p.morale ?? 50) - 4) } : p
          ),
        }
      }
    }

    if (choiceType === 'team') {
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.clubId === updatedGame.managedClubId
            ? { ...p, morale: Math.min(100, (p.morale ?? 50) + 2) }
            : p
        ),
      }
    }

    // Journalist relationship + memory
    if (journalist) {
      const relDelta = choiceType === 'individual' ? 3 : choiceType === 'system' ? 4 : choiceType === 'silent' ? -2 : 0
      const newRelationship = Math.min(100, Math.max(0, journalist.relationship + relDelta))
      let newStyle = journalist.style
      if (choiceType === 'silent' && newRelationship < 30 && journalist.style !== 'provocative') {
        newStyle = 'provocative' as const
      }

      const newMemory = [
        ...journalist.memory.slice(-9),
        {
          season: updatedGame.currentSeason,
          matchday: updatedGame.currentMatchday,
          event: `cs_press_${choiceType}`,
          sentiment: relDelta,
          opponentShort: opponent?.shortName ?? opponent?.name,
          questionId: event.journalistQuestionId,
          answerId: choiceType,
          subjectPlayerId: playerId,
          fixtureId,
        },
      ]

      updatedGame = {
        ...updatedGame,
        journalist: {
          ...journalist,
          relationship: newRelationship,
          style: newStyle,
          memory: newMemory,
          lastInteractionMatchday: updatedGame.currentMatchday,
        },
        journalistRelationship: newRelationship,
      }
    }

    // Published quote — inbox notification
    if (player && journalist) {
      const managerLastName = (updatedGame.managerName ?? 'Tränaren').split(' ').pop() ?? 'Tränaren'
      // Split journalist.name into firstName + lastName for the quote function
      const nameParts = journalist.name.split(' ')
      const journalistForQuote = {
        firstName: nameParts.slice(0, -1).join(' ') || journalist.name,
        lastName: nameParts[nameParts.length - 1] ?? journalist.name,
        outlet: journalist.outlet,
      }
      const quote = pickCSPressPublishedQuote(
        choiceType,
        { lastName: managerLastName },
        player,
        journalistForQuote,
        fixtureId ?? event.id,
      )
      const quoteInbox = {
        id: `cs_press_quote_${event.id}`,
        date: updatedGame.currentDate,
        type: InboxItemType.Media,
        title: `📰 ${journalist.outlet}`,
        body: quote,
        isRead: false,
      }
      updatedGame = {
        ...updatedGame,
        inbox: [...updatedGame.inbox, quoteInbox],
      }
    }

    // Clear pendingCSPress
    updatedGame = { ...updatedGame, pendingCSPress: undefined }
  }

  // Mark event resolved and remove from pendingEvents
  // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 1/9. semanticKey =
  // event.type — grovkornigt (skiljer inte t.ex. varsel mot olika
  // arbetsgivare), avsiktligt: DOM:en säger uttryckligen att finkorniga
  // semanticKey-beslut tas EFTER att loggen finns, inte som förarbete här.
  //
  // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 3 (Jacobs dom
  // 2026-09-02): round-fältet var getCurrentLeagueRound (ligarond) här men
  // nextMatchday (global matchday) i roundProcessor.ts:s nio skrivvägar —
  // samma fält, två skalor, en PREEXISTERANDE bugg (bekräftat: systemhandelse-
  // BudgetOk:s currentRound-parameter matas alltid med den globala skalan av
  // sina anropare, men mostRecentRound kom härifrån på ligarond-skala).
  // Standardiserat till updatedGame.currentMatchday (global) — den globala
  // skalan liggarens EventLedgerEntry.matchday redan kräver.
  updatedGame = {
    ...updatedGame,
    pendingEvents: (updatedGame.pendingEvents ?? []).filter(e => e.id !== eventId),
    resolvedEventIds: [...(updatedGame.resolvedEventIds ?? []), eventId].slice(-200), // keep last 200
    resolvedChoices: recordResolvedChoice(updatedGame, event, choiceId, choice.label, madeByPlayer),
    narrativeBeatLog: logNarrativeBeat(
      updatedGame, event.type, updatedGame.currentSeason, updatedGame.currentMatchday,
      event.systemhandelse,
    ),
  }

  // O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md, Jacobs dom 2026-08-24):
  // kandidatinsamling för "säsongens viktigaste beslut".
  //
  // H3-uppföljning (5c9a7a8, 2026-08-24): captureSystemDecision() fick
  // tidigare BARA `game` (den ORIGINELLA, oförändrade parametern) — dess
  // EGEN docstring påstod "game här är alltså redan updatedGame", vilket
  // var fel (dokumentation och kod hade glidit isär). detOmojligaValet/
  // sell-byggaren kunde alltså aldrig VERIFIERA att spelaren faktiskt
  // togs bort — den skrev "Du sålde X" baserat enbart på choiceId, inte på
  // bekräftad state. Nu tar den emot BÅDA: `game` (före, offer_pro
  // behöver lönen FÖRE höjningen) och `updatedGame` (efter, effekten är
  // redan applicerad — detOmojligaValet/sell verifierar mot den). Tyst
  // no-op (null) för alla event/val utanför den slutna listan av åtta —
  // det normala fallet.
  //
  // HIGH 6 (auditen 2026-08-29): anropet låg tidigare bakom
  // `if (event.systemhandelse)`. Den grinden var STALE — A-H9 tog bort exakt
  // den kollen INNE i captureSystemDecision ("domen kräver att kandidat-
  // mängden är 'varje löst beslut', inte bara O19-märkta systemhandelser"),
  // men anropsstället här smalnade tyst av poolen igen. `systemhandelse` är
  // O19:s säsongsbudget-klassning (narrativeLogService.systemhandelseBudgetOk)
  // och sitter på ett dussintal fabriker — varken mecenatkonflikten eller
  // kaptensmötet sätter den, så deras byggare hade aldrig kunnat köra ens
  // efter att de lagts till i BUILDERS. Anropet är nu ovillkorat mot
  // `event.systemhandelse` — BUILDERS-uppslaget är den enda ÄMNES-grinden.
  //
  // HIGH 6, attributionshålet (Jacobs körorder 2026-08-31): den STALE-grinden
  // ovan döljde en ANDRA bugg — anropet saknade helt en kontroll av VEM som
  // löste eventet. "Säsongens viktigaste beslut" är per definition ett beslut
  // SPELAREN fattade; ett mecenatEvent som sim-the-rest auto-resolvade åt en
  // AI-styrd säsong (eller rollover som auto-väljer default-choice) kunde
  // ändå bli kandidat, och årsboken skulle då hävda ett beslut spelaren
  // aldrig var med om att fatta. Gated nu på madeByPlayer.
  const candidate = madeByPlayer ? captureSystemDecision(game, updatedGame, event, choiceId) : null
  if (candidate) {
    // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 2 — RETIRE-STEGET.
    // Skriver INTE längre seasonDecisionCandidates här — årsboken
    // (seasonEndProcessor.ts) läser liggaren via pickMostImportantDecisionText
    // sedan alla tre kandidatkällor (denna, gameStore.ts, gameFlowActions.ts)
    // dual-writer. `candidate` bärs bara vidare till buildDecisionLedgerEntry,
    // aldrig till det gamla fältet. Fältet SaveGame.seasonDecisionCandidates
    // finns kvar (store/-skrivarna refererar typen fortfarande) men är dött
    // härifrån.
    //
    // semanticKey = `${event.type}:${choiceId}`, finkornigare än narrativeBeatLog-
    // skrivningens rena event.type ovan — composeSeasonDecisionSentence
    // (seasonDecisionCaptureService.ts) måste kunna skilja t.ex.
    // criticalEconomy/sell_star från criticalEconomy/ask_mecenat, som delar
    // event.type men har olika meningar.
    updatedGame = {
      ...updatedGame,
      eventLedger: logEvent(updatedGame, buildDecisionLedgerEntry(candidate, `${event.type}:${choiceId}`, updatedGame.currentMatchday)),
    }
  }

  // ── Post-resolution storyline generation ────────────────────────────────
  // 4.6 (SLUTTEST_KO.md, 2026-08-17): getCurrentLeagueRound, inte en
  // inline-reimplementation — se kommentaren vid importen/rad ~398 för varför.
  const currentMatchday = getCurrentLeagueRound(updatedGame)

  // Coworker bond: the event names a pair, not merely relatedPlayerId. Keep
  // the storyline coupled to the same canonical employer model that generated
  // the card and that calculatePairChemistry reads. A malformed/stale card,
  // an auto-resolution, or players who no longer satisfy the premise may
  // still apply its explicit morale effect, but must not write false history.
  if (madeByPlayer && event.type === 'communityEvent' && event.id.startsWith('event_bond_') && choiceId === 'great') {
    const playerIds = [...new Set(event.selectedPlayerIds ?? [])]
    const players = playerIds.map(id => game.players.find(p => p.id === id))
    const validPair = playerIds.length === 2
      && players.every((p): p is NonNullable<typeof p> => Boolean(
        p
        && p.clubId === game.managedClubId
        && !p.isFullTimePro
        && p.dayJob?.title,
      ))
    const employers = validPair
      ? players.map(p => findEmployerForJob(game.managedClubId, p!.dayJob!.title))
      : []
    const sameEmployer = employers.length === 2
      && employers[0] !== undefined
      && employers[0].name === employers[1]?.name
    const storylineId = `story_workplace_bond_${playerIds.slice().sort().join('_')}`

    if (validPair && sameEmployer && event.relatedClubId === game.managedClubId
      && !(updatedGame.storylines ?? []).some(story => story.id === storylineId)) {
      updatedGame = {
        ...updatedGame,
        storylines: [
          ...(updatedGame.storylines ?? []),
          {
            id: storylineId,
            type: 'workplace_bond' as const,
            season: updatedGame.currentSeason,
            matchday: currentMatchday,
            playerIds,
            clubId: game.managedClubId,
            description: event.body,
            displayText: event.body,
            resolved: true,
          },
        ],
      }
    }
  }

  // Promotion sacrifice: persist the player's explicit advice choice, but do
  // not invent a second job/promotion model. The day-job card already owns the
  // immediate morale consequence; this resolved storyline is the durable fact
  // that later narrative surfaces can recall.
  if (madeByPlayer && event.type === 'dayJobConflict' && event.id.startsWith('event_promotion_') && choiceId === 'discourage') {
    const player = game.players.find(p => p.id === event.relatedPlayerId)
    const storylineId = player
      ? `story_promotion_sacrifice_${player.id}_${game.currentSeason}`
      : undefined
    if (player && storylineId
      && player.clubId === game.managedClubId
      && !player.isFullTimePro
      && player.dayJob
      && !(updatedGame.storylines ?? []).some(story => story.id === storylineId)) {
      // Existing approved wording from FORSTARKNINGSSPEC_V3; no new player copy.
      const displayText = 'Tackade nej till befordran för bandyn'
      updatedGame = {
        ...updatedGame,
        storylines: [
          ...(updatedGame.storylines ?? []),
          {
            id: storylineId,
            type: 'promotion_sacrifice' as const,
            season: updatedGame.currentSeason,
            matchday: currentMatchday,
            playerId: player.id,
            clubId: game.managedClubId,
            description: displayText,
            displayText,
            resolved: true,
          },
        ],
      }
    }
  }

  // 2.5 (choice-label-svepet, 2026-08-17): skrevs tidigare OAVSETT choiceId
  // — "Kaptenen samlade laget" hamnade i karriärminnet även när spelaren
  // valde 'decline' ("Nej — jag tar det här samtalet själv", ingen moralboost
  // alls). Effekt och historikpost i samma operation: bara 'support', bara
  // när teamBoostMorale faktiskt kan verka (managedClubId finns).
  // HIGH 6, attributionshålet (Jacobs körorder 2026-08-31): samma klass som
  // captureSystemDecision ovan — "Kaptenen samlade laget" är en spelar-
  // berättad milstolpe (karriärminnet), inte en mekanisk sanning. Ett
  // auto-resolvat captainSpeech (sim-the-rest, rollover) fick den tidigare
  // in i karriären som om spelaren varit med.
  if (madeByPlayer && event.type === 'captainSpeech' && choiceId === 'support' && updatedGame.managedClubId) {
    // relatedPlayerId is the captain frozen onto the generated card. The
    // take_charge target is a compatibility fallback for older queued saves.
    // Do not turn a stale card into history if that player has since left.
    const captainId = event.relatedPlayerId
      ?? event.choices.find(candidate => candidate.id === 'take_charge')?.effect.targetPlayerId
    const captain = updatedGame.players.find(player =>
      player.id === captainId && player.clubId === updatedGame.managedClubId,
    )
    if (captain) {
      updatedGame = {
        ...updatedGame,
        storylines: [
          ...(updatedGame.storylines ?? []),
          {
            id: `story_captain_${updatedGame.currentSeason}`,
            type: 'captain_rallied_team' as const,
            season: updatedGame.currentSeason,
            matchday: currentMatchday,
            playerId: captain.id,
            clubId: updatedGame.managedClubId,
            // 4.6 (SLUTTEST_KO.md, 2026-08-17): var den råa typnyckeln — se
            // kommentaren vid went_fulltime_pro-storylinen ovan för rotorsak.
            description: 'Kaptenen samlade laget efter en svår period',
            displayText: 'Kaptenen samlade laget efter en svår period',
            resolved: true,
          },
        ],
      }
    }
  }

  // DOM_O20_K3K5_KLASS_2026-09-02, Jacobs beslut — hesitantPlayer/convince
  // var ett val där en gren uppenbart vann (garanterad +15 moral mot ett
  // riskfritt noOp), ingen verklig avvägning. convince deklareras nu noOp
  // vid konstruktion (eventFactories.ts) och appliceras här probabilistiskt:
  // 65% ger den lovade +15-moralen, 35% slår tillbaka — spelaren känner sig
  // pressad och tappar lite förtroende istället. accept förblir en äkta
  // noOp (det trygga icke-valet ska inte GE något — nedsidan hör på det
  // aktiva valet, per domen).
  if (madeByPlayer && event.type === 'hesitantPlayer' && choiceId === 'convince') {
    const pid = event.relatedPlayerId
    if (!pid) throw new Error("hesitantPlayer/convince saknar obligatoriskt fält relatedPlayerId")
    const backfired = rand() >= 0.65
    const delta = backfired ? -8 : 15
    updatedGame = {
      ...updatedGame,
      players: updatedGame.players.map(p =>
        p.id === pid ? { ...p, morale: Math.max(0, Math.min(100, p.morale + delta)) } : p,
      ),
    }
  }

  // 2.5 (choice-label-svepet, 2026-08-17): skrevs tidigare oavsett om
  // multiEffect-subeffekterna faktiskt lyckades applicera makeFullTimePro på
  // någon spelare — samma "storyline oberoende av effektutfall"-mönster som
  // captainSpeech ovan. Gated nu på att minst en berörd spelare verkligen
  // blev isFullTimePro efter resolutionen, inte bara på choiceId.
  // HIGH 6, attributionshålet (Jacobs körorder 2026-08-31): samma klass —
  // "Klubben räddade spelare..." är en spelar-berättad handling. Auto-
  // resolverad varsel/offer_pro (sim-the-rest, rollover) fick den tidigare
  // in i karriären utan att spelaren gjort valet.
  if (madeByPlayer && event.type === 'varsel' && choiceId === 'offer_pro') {
    const successfulRescuePlayerIds = new Set<string>()
    try {
      const subList = JSON.parse(choice.effect.subEffects ?? '[]') as Array<{ type: string; targetPlayerId?: string }>
      for (const sub of subList) {
        if (sub.type !== 'makeFullTimePro' || !sub.targetPlayerId) continue
        const before = game.players.find(p => p.id === sub.targetPlayerId)
        const after = updatedGame.players.find(p => p.id === sub.targetPlayerId)
        if (before?.clubId === game.managedClubId && !before.isFullTimePro && after?.isFullTimePro === true) {
          successfulRescuePlayerIds.add(sub.targetPlayerId)
        }
      }
    } catch { /* malformad subEffects — ingen räddning skedde */ }

    if (successfulRescuePlayerIds.size > 0) {
      updatedGame = {
        ...updatedGame,
        storylines: [
          ...(updatedGame.storylines ?? []),
          ...[...successfulRescuePlayerIds].map(playerId => ({
            id: `story_varsel_rescue_${playerId}_${updatedGame.currentSeason}`,
            type: 'rescued_from_unemployment' as const,
            season: updatedGame.currentSeason,
            matchday: currentMatchday,
            playerId,
            clubId: game.managedClubId,
            // 4.6 (SLUTTEST_KO.md, 2026-08-17): var den råa typnyckeln — se
            // kommentaren vid went_fulltime_pro-storylinen (eventResolver.ts
            // rad ~405) för rotorsak.
            description: 'Klubben räddade spelare från uppsägning genom att erbjuda heltidskontrakt',
            displayText: 'Klubben räddade spelare från uppsägning genom att erbjuda heltidskontrakt',
            resolved: true,
          })),
        ],
      }
    }
  }

  // DOM_BURNOUT_TAK_2026-09-02 (D) — ärret. Skrivs OAVSETT vilken gren som
  // valdes (till skillnad från varsel/offer_pro ovan, som bara skriver vid
  // FRAMGÅNG) — själva VALET vid taket lämnar spåret, inte utfallet. Matar
  // isBurnoutRelapse-familjens mönster vidare (burnoutScar bär det djupare,
  // takspecifika lagret; burnout_peak/isBurnoutRelapse bär zon-lagret sedan
  // innan). Dedikerad hook, inte en generisk effekttyp — scar-skrivningen rör
  // TVÅ fält samtidigt (diary + burnoutScar) och branchar på choiceId, ingen
  // punktvis fält-mutation subEffects redan är byggt för.
  //
  // madeByPlayer-gated, samma HIGH 6-disciplin som varsel/offer_pro ovan —
  // ett permanent ärr ska inte tillskrivas ett val spelaren aldrig gjorde.
  // I praktiken ska detta eventet aldrig auto-resolveras alls (rollover-
  // policyn är 'expire', se deferredRolloverService.ts): gaten är ett
  // defensivt skydd, inte den förväntade vägen.
  //
  // updatedGame.currentMatchday (GLOBAL), INTE den lokala `currentMatchday`
  // ovan (4.6, SLUTTEST_KO.md — den är medvetet getCurrentLeagueRound för
  // storyline-generering). managerProfile.diary:s ANDRA poster (burnout_peak/
  // era_shift, roundProcessor.ts) skrivs redan på GLOBAL skala — att blanda
  // in en ligarond-stämplad post i samma array hade återskapat exakt den
  // skalbugg-klass Fas 3 jagade (två numreringssystem i samma fält).
  if (madeByPlayer && event.type === 'burnoutCeiling') {
    const scar: 'hardened' | 'stepped_back' = choiceId === 'step_back' ? 'stepped_back' : 'hardened'
    const alreadyScarred = (updatedGame.managerProfile?.diary ?? []).some(
      e => e.type === 'burnout_scar' && e.season === updatedGame.currentSeason && e.matchday === updatedGame.currentMatchday)
    if (updatedGame.managerProfile && !alreadyScarred) {
      updatedGame = {
        ...updatedGame,
        managerProfile: {
          ...updatedGame.managerProfile,
          burnoutScar: scar,
          diary: [
            ...(updatedGame.managerProfile.diary ?? []),
            { season: updatedGame.currentSeason, matchday: updatedGame.currentMatchday, type: 'burnout_scar' as const, text: scar === 'stepped_back' ? 'Den våren blev du kvar i klubben men klev tillbaka från bänken en period. Första gången du satte dig själv först. Det sätter sig, ett sånt beslut.' : 'Den våren var du nära att gå sönder och körde vidare ändå. Något härdades, och gick inte att ta tillbaka.' },
          ],
        },
      }
    }

    // HIGH 1 (DOM_HIGH1_BURNOUT_LEDGER_2026-09-02): ärret är manager-
    // minnets vy av beslutet; liggaren är den kanoniska sanningen som
    // "Säsongens beslut" läser. Dual-write, aldrig flytt. Posten byggs
    // direkt eftersom burnout-valet inte är en effektverifierad A-H9-
    // builder: själva valet vid taket är den irreversibla händelsen.
    const semanticKey = `burnoutCeiling:${choiceId}`
    const alreadyLogged = (updatedGame.eventLedger ?? []).some(entry =>
      entry.type === 'decision'
      && entry.semanticKey === semanticKey
      && entry.season === updatedGame.currentSeason
      && entry.matchday === updatedGame.currentMatchday)
    if (!alreadyLogged) {
      updatedGame = {
        ...updatedGame,
        eventLedger: logEvent(updatedGame, {
          type: 'decision',
          semanticKey,
          season: updatedGame.currentSeason,
          matchday: updatedGame.currentMatchday,
          significance: 100,
          irreversible: true,
          tension: true,
          systemsAffectedCount: 4,
          madeByPlayer: true,
        }),
      }
    }
  }

  // ── Create follow-up if event has followUpText ──────────────────────────
  const followUpText = choice.followUpText ?? event.followUpText
  if (followUpText) {
    const followUp = {
      id: `fu_${eventId}_${choiceId}`,
      triggerEventId: eventId,
      matchdaysDelay: 3 + Math.floor(rand() * 3), // 3-5 matchdays
      createdMatchday: currentMatchday,
      type: 'simple_inbox',
      data: { text: followUpText } as Record<string, unknown>,
    }
    updatedGame = {
      ...updatedGame,
      pendingFollowUps: [...(updatedGame.pendingFollowUps ?? []), followUp],
    }
  }

  // ── NARR-001: Mecenat retirement resolution ───────────────────────────────
  if (event.type === 'mecenatEvent' && eventId.startsWith('event_mecenat_retire_')) {
    const mecenatId = eventId.split('_')[3]
    updatedGame = {
      ...updatedGame,
      mecenater: (updatedGame.mecenater ?? []).map(m => {
        if (m.id !== mecenatId) return m
        if (choiceId === 'listen') {
          return { ...m, hasAnnouncedRetirement: true, retirementThreshold: (m.retirementThreshold ?? 6) + 1, happiness: Math.min(100, m.happiness + 5) }
        }
        if (choiceId === 'plan_succession') {
          return { ...m, hasAnnouncedRetirement: true }
        }
        if (choiceId === 'offer_tribute') {
          return { ...m, hasAnnouncedRetirement: true, happiness: Math.min(100, m.happiness + 5) }
        }
        return { ...m, hasAnnouncedRetirement: true }
      }),
    }
    if (choiceId === 'plan_succession') {
      updatedGame = {
        ...updatedGame,
        communityStanding: Math.min(100, (updatedGame.communityStanding ?? 50) + 2),
      }
    }
    if (choiceId === 'offer_tribute') {
      updatedGame = {
        ...updatedGame,
        communityStanding: Math.min(100, (updatedGame.communityStanding ?? 50) + 3),
        clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, -25000),
      }
    }
  }

  // ── Record arc decisions ──────────────────────────────────────────────────
  if (event.type === 'playerArc') {
    updatedGame = {
      ...updatedGame,
      activeArcs: (updatedGame.activeArcs ?? []).map(arc =>
        arc.eventsFired.includes(eventId)
          ? {
              ...arc,
              decisionsMade: [...arc.decisionsMade, choiceId],
              // joker_vindicated must be grounded in a contribution AFTER
              // the manager backed the player. Keep the global time anchor
              // on the existing arc data instead of inferring it later.
              data: arc.type === 'joker_redemption'
                ? { ...arc.data, decisionMatchday: updatedGame.currentMatchday }
                : arc.data,
            }
          : arc
      ),
    }
  }

  // Kommunmötet ska inträffa en gång per politiker. Fältet fanns och lästes
  // redan av generatorn, men skrevs aldrig, vilket gjorde framför allt
  // infrastructure-varianten säsongsåterkommande. Ett svar avslutar själva
  // mötet oavsett om spelaren höll med; valets separata effekt avgör relationen.
  if (event.type === 'kommunMote' && updatedGame.localPolitician) {
    updatedGame = {
      ...updatedGame,
      localPolitician: { ...updatedGame.localPolitician, demandsMet: true },
    }
  }

  // ── Start source cooldown when a source-specific event resolves ────────────
  const eventSource = EVENT_SOURCE_MAP[event.type]
  if (eventSource) {
    const newCooldowns = startCooldown(
      updatedGame.sourceCooldowns ?? {},
      eventSource as SourceKey,
    )
    // U5 (SLUTTEST_KO.md, 2026-08-17): narrativeBeatLog-skrivväg 6/9. Egen
    // semanticKey (source_{eventSource}) — grovare gruppering än event.type
    // (skriv väg 1), flera event-typer kan dela samma källa.
    // Fas 3 (2026-09-02): global matchday, samma skalstandardisering som
    // skrivväg 1/9 ovan.
    updatedGame = {
      ...updatedGame,
      sourceCooldowns: newCooldowns,
      narrativeBeatLog: logNarrativeBeat(updatedGame, `source_${eventSource}`, updatedGame.currentSeason, updatedGame.currentMatchday),
    }
  }

  // ÖVERLÄMNING 2 steg 1-pilot: se kommentaren vid deklarationen ovan.
  if (pilotTransferBidTrigger) {
    updatedGame = {
      ...updatedGame,
      pilotTransferBidRippleChain: describeRippleChain(
        game, updatedGame, pilotTransferBidTrigger, pilotTransferBidPlayerName,
        game.currentMatchday, game.currentSeason, pilotTransferBidRelatedPlayerId,
      ),
    }
  }

  // MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 1 — orsak/verkan som
  // FÖRSTA rena liggarkonsumenten. Generellt anropsställe (alla spelar-
  // fattade beslut denna funktion resolvar), skiljt från pilotTransferBid-
  // blocket ovan (smalare, transferbudsspecifikt, orört — se
  // orsakVerkanService.ts:s filhuvud). `matchday` = det GLOBALA
  // matchday-fältet (schemats regel: "ALDRIG rond-identitet"), inte
  // getCurrentLeagueRound (som narrativeBeatLog-skrivningen ovan medvetet
  // använder för ETT annat fält med andra semantik). Skriver ingen post om
  // beslutet inte rörde något ripple-bärande fält (trivial-brus-golvet,
  // se captureDecisionRipple).
  if (madeByPlayer) {
    const ledgerEntry = captureDecisionRipple(
      game, updatedGame, event.type, updatedGame.currentSeason, updatedGame.currentMatchday,
      event.relatedPlayerId, event.relatedClubId,
    )
    if (ledgerEntry) {
      updatedGame = { ...updatedGame, eventLedger: logEvent(updatedGame, ledgerEntry) }
    }
  }

  const financesAfterEvent = updatedGame.clubs.find(c => c.id === updatedGame.managedClubId)?.finances
  if (financesBeforeEvent !== undefined && financesAfterEvent !== undefined
      && updatedGame.financeLog === financeLogBeforeEvent) {
    const eventFinanceDelta = financesAfterEvent - financesBeforeEvent
    if (eventFinanceDelta !== 0) {
      updatedGame = {
        ...updatedGame,
        financeLog: appendFinanceLog(updatedGame.financeLog ?? [], {
          round: updatedGame.currentMatchday ?? currentMatchday,
          amount: eventFinanceDelta,
          reason: 'event',
          label: `Beslut: ${event.title}`,
        }),
      }
    }
  }

  return updatedGame
}
