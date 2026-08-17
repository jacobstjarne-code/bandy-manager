import type { SaveGame, Sponsor, CommunityActivities } from '../../entities/SaveGame'
import type { HallTrial, HallTrialStage } from '../../entities/Community'
import type { GameEvent } from '../../entities/GameEvent'
import type { DinnerScene } from '../mecenatDinnerService'
import { InboxItemType } from '../../enums'
import { executeTransfer } from '../transferService'
import { describeRippleChain, transferRejectMoraleWeight } from '../rippleEffectService'
import { applyFinanceChange } from '../economyService'
import { startFacilityBuild } from '../facilityService'
import { recordInteraction, recordPressRefusal, generateCriticalArticle } from '../journalistService'
import { pickCSPressPublishedQuote, buildCSPressMemoryEntry } from '../../data/csPressEventText'
import type { PressChoice } from '../../data/csPressEventText'
import { EVENT_SOURCE_MAP, startCooldown } from '../sourceCooldownService'
import type { SourceKey } from '../sourceCooldownService'
import { PROVNING_RESOLUTION } from '../../data/hallProvningData'

// ── resolveEvent ───────────────────────────────────────────────────────────
export function resolveEvent(
  game: SaveGame,
  eventId: string,
  choiceId: string,
  rand: () => number = Math.random,
): SaveGame {
  const event = (game.pendingEvents ?? []).find(e => e.id === eventId)
    ?? (game.pendingPressConference?.id === eventId ? game.pendingPressConference : undefined)
    ?? (game.pendingRefereeMeeting?.id === eventId ? game.pendingRefereeMeeting : undefined)
    ?? (game.pendingCSPress?.id === eventId ? game.pendingCSPress : undefined)
  if (!event) return game

  // Events with no choices (e.g. atmospheric auto-resolved events) — just remove from queue
  if (event.choices.length === 0) {
    return {
      ...game,
      pendingEvents: (game.pendingEvents ?? []).filter(e => e.id !== eventId),
    }
  }

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

  // 2B: Risky sponsor offer — accept adds sponsor AND stores risk contract
  if (event.type === 'riskySponsorOffer') {
    if (choiceId === 'accept') {
      const rawData = choice.effect.sponsorData
      if (rawData) {
        try {
          const sponsorData = JSON.parse(rawData)
          const sponsor: Sponsor = {
            id: sponsorData.id,
            name: sponsorData.name,
            category: sponsorData.category,
            weeklyIncome: sponsorData.weeklyIncome,
            contractRounds: sponsorData.contractRounds,
            signedRound: sponsorData.signedRound,
            tier: sponsorData.tier,
            triggeredBy: sponsorData.triggeredBy,
            triggeredSeason: sponsorData.triggeredSeason,
            expiresSeason: sponsorData.expiresSeason,
          }
          return {
            ...game,
            pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
            sponsors: [...(game.sponsors ?? []), sponsor],
            riskySponsorContract: {
              sponsorId: sponsor.id,
              riskMaturityRound: sponsorData.riskMaturityRound,
              acceptedRound: sponsorData.signedRound,
              season: game.currentSeason,
            },
          }
        } catch {}
      }
    }
    return {
      ...game,
      pendingEvents: game.pendingEvents.filter(e => e.id !== eventId),
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
          p.id === pid ? { ...p, morale: Math.min(100, p.morale + (effect.value ?? 5)) } : p,
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
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === pid ? { ...p, isInjured: false, playingThroughInjury: true } : p,
        ),
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
        // B1 — premiss-anchor: senaste ligamatchens motståndare (lätt åtkomligt här,
        // pressfrågan gäller den just spelade matchen)
        const lastLeagueFixture = updatedGame.fixtures
          .filter(f => f.status === 'completed' && !f.isCup)
          .reduce<typeof updatedGame.fixtures[number] | undefined>(
            (latest, f) => (f.roundNumber > (latest?.roundNumber ?? -1) ? f : latest), undefined)
        const matchday = lastLeagueFixture?.roundNumber ?? 0
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
            : (updatedGame.journalistRelationship ?? 50) + (moraleBoost > 0 ? 3 : -3),
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
      {
        const proPlayer = updatedGame.players.find(p => p.id === pid)
        const oldJob = proPlayer?.dayJob?.title ?? 'jobbet'
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
          storylines: [
            ...(updatedGame.storylines ?? []),
            {
              id: `story_pro_${pid}_${updatedGame.currentSeason}`,
              type: 'went_fulltime_pro' as const,
              season: updatedGame.currentSeason,
              matchday: updatedGame.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((m, f) => Math.max(m, f.roundNumber), 0),
              playerId: pid,
              description: 'went_fulltime_pro',
              displayText: proPlayer
                ? `${proPlayer.firstName} ${proPlayer.lastName} slutade som ${oldJob} för att satsa heltid på bandyn`
                : 'Blev heltidsproffs',
              resolved: true,
            },
          ],
        }
      }
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
      break
    }
    case 'patronHappiness': {
      if (!updatedGame.patron?.isActive) break
      const patronBeforeUpdate = updatedGame.patron
      const newHappiness = Math.max(0, Math.min(100, (patronBeforeUpdate.happiness ?? 50) + (effect.amount ?? 0)))
      updatedGame = {
        ...updatedGame,
        patron: { ...patronBeforeUpdate, happiness: newHappiness, isActive: newHappiness > 0 },
      }
      if (newHappiness === 0) {
        // Set cooldown immediately so it holds across season boundaries even if withdrawal event goes unacknowledged
        updatedGame = { ...updatedGame, patronWithdrawnSeason: updatedGame.currentSeason }
        // Patron withdrawal kris-event
        const withdrawalId = `patron_withdrawal_${updatedGame.currentSeason}`
        const alreadyQueued = (updatedGame.pendingEvents ?? []).some(e => e.id === withdrawalId)
        if (!alreadyQueued) {
          const patronName = patronBeforeUpdate.name
          const contribution = patronBeforeUpdate.contribution
          const tkr = Math.round(contribution / 1000)
          const withdrawalEvent: GameEvent = {
            id: withdrawalId,
            type: 'patronWithdrawal',
            title: `${patronName} drar sig ur`,
            body: `${patronName} har bestämt sig. Det grundläggande bidraget — ${tkr} tkr/säsong — upphör. Klubben tappar sin dolda grundpelare.`,
            choices: [
              {
                id: 'acknowledge',
                label: 'Noterat',
                effect: { type: 'patronWithdrawn' },
              },
            ],
            resolved: false,
          }
          updatedGame = {
            ...updatedGame,
            pendingEvents: [...(updatedGame.pendingEvents ?? []), withdrawalEvent],
          }
        }
      }
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
        updatedGame = {
          ...updatedGame,
          patron: {
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
      } catch (e) {
        if (e instanceof SyntaxError) { /* malformad JSON, tystas */ } else { throw e }
      }
      break
    }
    case 'patronWithdrawn': {
      updatedGame = { ...updatedGame, patronWithdrawnSeason: updatedGame.currentSeason }
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
            ? { ...c, facilities: Math.min(100, (c.facilities ?? 50) + (effect.amount ?? 5)) }
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
      updatedGame = {
        ...updatedGame,
        journalistRelationship: Math.max(0, Math.min(100, (updatedGame.journalistRelationship ?? 50) + (effect.amount ?? 0))),
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
        const completedFixtures = (updatedGame.fixtures ?? []).filter(f => (f.status as string) === 'completed')
        const currentMatchday = completedFixtures.length > 0
          ? Math.max(...completedFixtures.map(f => f.matchday))
          : 0
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.map(m =>
            m.id === targetId
              ? { ...m, isActive: true, happiness: Math.min(100, 50 + delta), lastInteractionRound: currentMatchday }
              : m
          ),
        }
      } else {
        updatedGame = {
          ...updatedGame,
          mecenater: updatedGame.mecenater.map(m =>
            m.id === targetId
              ? { ...m, happiness: Math.max(0, Math.min(100, m.happiness + delta)) }
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
        let subList: Array<{ type: string; amount?: number; value?: number; targetPlayerId?: string; targetMecenatId?: string }> | null = null
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
              updatedGame = {
                ...updatedGame,
                journalistRelationship: Math.max(0, Math.min(100, (updatedGame.journalistRelationship ?? 50) + (sub.amount ?? 0))),
              }
            } else if (sub.type === 'boardPatience') {
              updatedGame = {
                ...updatedGame,
                boardPatience: Math.max(0, Math.min(100, (updatedGame.boardPatience ?? 70) + (sub.amount ?? 0))),
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
                updatedGame = {
                  ...updatedGame,
                  localPolitician: {
                    ...updatedGame.localPolitician,
                    kommunBidrag: Math.max(0, (updatedGame.localPolitician.kommunBidrag ?? 0) + (sub.amount ?? 0)),
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
                    ? { ...p, morale: Math.min(100, p.morale + (sub.amount ?? 5)) }
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
              updatedGame = {
                ...updatedGame,
                players: updatedGame.players.map(p =>
                  p.id === sub.targetPlayerId
                    ? { ...p, isFullTimePro: true, dayJob: undefined, salary: sub.value ?? p.salary, morale: Math.min(100, p.morale + 15) }
                    : p
                ),
              }
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
                      ? { ...m, happiness: Math.max(0, Math.min(100, m.happiness + delta)) }
                      : m
                  ),
                }
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
            }
          } else break
          const baseFacState = updatedGame.facilityState ?? { builtNodeIds: [] }
          const shouldStartBuild = newTrial.stage === 'bygge'
            && !baseFacState.activeProject
            && !baseFacState.builtNodeIds.includes('matchhall')
          const resolvedFacState = shouldStartBuild
            ? startFacilityBuild('matchhall', baseFacState, updatedGame.currentMatchday)
            : baseFacState
          updatedGame = {
            ...updatedGame,
            facilityState: { ...resolvedFacState, hallTrial: newTrial },
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
      const managedPlayers = updatedGame.players.filter(p => p.clubId === updatedGame.managedClubId)
      const letter = {
        id: eventId,
        senderName: event.sender?.name ?? 'Okänd',
        senderAge: 0,
        senderOrigin: '',
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
      // Morale boost to managed players — reading the letter together
      if (managedPlayers.length > 0) {
        updatedGame = {
          ...updatedGame,
          players: updatedGame.players.map(p =>
            p.clubId === updatedGame.managedClubId
              ? { ...p, morale: Math.min(100, p.morale + 3) }
              : p
          ),
        }
      }
      break
    }
    case 'startEconomicCrisis': {
      // DREAM-002: initialise or advance the crisis state
      const currentMatchday = updatedGame.fixtures
        .filter(f => f.status === 'completed' && !f.isCup)
        .reduce((m, f) => Math.max(m, f.roundNumber), 0)
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
        .filter(f => f.status === 'completed' && !f.isCup && f.season === updatedGame.currentSeason)
        .reduce((max, f) => Math.max(max, f.roundNumber), 0)
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
      break
    }
    case 'saveSchoolAssignment': {
      // DREAM-016: archive the school assignment answer
      const player = event.relatedPlayerId
        ? updatedGame.players.find(p => p.id === event.relatedPlayerId)
        : undefined
      const record = {
        season: updatedGame.currentSeason,
        youngPlayerName: player ? `${player.firstName} ${player.lastName}` : event.sender?.name ?? '',
        choiceLabel: event.choices.find(c => c.id === choiceId)?.label ?? choiceId,
        archiveText: effect.replyText ?? '',
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
        } else {
          // First time — create relation
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
  if (event.type === 'detOmojligaValet' && choiceId === 'sell' && event.relatedPlayerId) {
    const pid = event.relatedPlayerId
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
  }

  const resolvedMatchday = game.lastProcessedMatchday ?? 1

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

  // Special: icaMaxiEvent send_player — also add morale effect to random player
  if (event.type === 'icaMaxiEvent' && choiceId === 'send_player') {
    const managedPlayers = updatedGame.players.filter(p => p.clubId === updatedGame.managedClubId && !p.isInjured)
    if (managedPlayers.length > 0) {
      const chosen = managedPlayers[Math.floor(rand() * managedPlayers.length)]
      const moraleDelta = (chosen.discipline ?? 50) > 60 ? 5 : -3
      updatedGame = {
        ...updatedGame,
        players: updatedGame.players.map(p =>
          p.id === chosen.id ? { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleDelta)) } : p
        ),
      }
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

  // Special: district callup — affect confidence + development of high-potential youth players
  if (eventId.startsWith('event_district_callup_') && updatedGame.youthTeam) {
    const candidates = updatedGame.youthTeam.players.filter(p => p.potentialAbility > 50)
    if (candidates.length > 0) {
      const confidenceDelta = choiceId === 'send' ? 15 : -5
      const devDelta = choiceId === 'send' ? 2 : 0
      updatedGame = {
        ...updatedGame,
        youthTeam: {
          ...updatedGame.youthTeam,
          players: updatedGame.youthTeam.players.map(p =>
            candidates.some(c => c.id === p.id)
              ? {
                  ...p,
                  confidence: Math.max(0, Math.min(100, p.confidence + confidenceDelta)),
                  developmentRate: Math.min(100, p.developmentRate + devDelta),
                }
              : p
          ),
        },
      }
    }
  }

  // If this was a hall debate event, apply choice effects + increment counters
  if (eventId.startsWith('hall_')) {
    // Apply effects based on choiceId
    if (choiceId === 'support') {
      // politicianRelationship +8, fanMood -3
      if (updatedGame.localPolitician) {
        updatedGame = { ...updatedGame, localPolitician: { ...updatedGame.localPolitician, relationship: Math.min(100, (updatedGame.localPolitician.relationship ?? 50) + 8) } }
      }
      if (updatedGame.supporterGroup) {
        updatedGame = { ...updatedGame, supporterGroup: { ...updatedGame.supporterGroup, mood: Math.max(0, updatedGame.supporterGroup.mood - 3) } }
      }
    } else if (choiceId === 'defend_outdoor') {
      // fanMood +5, politicianRelationship -5
      if (updatedGame.localPolitician) {
        updatedGame = { ...updatedGame, localPolitician: { ...updatedGame.localPolitician, relationship: Math.max(0, (updatedGame.localPolitician.relationship ?? 50) - 5) } }
      }
      if (updatedGame.supporterGroup) {
        updatedGame = { ...updatedGame, supporterGroup: { ...updatedGame.supporterGroup, mood: Math.min(100, updatedGame.supporterGroup.mood + 5) } }
      }
    } else if (choiceId === 'side_modern') {
      // fanMood -2
      if (updatedGame.supporterGroup) {
        updatedGame = { ...updatedGame, supporterGroup: { ...updatedGame.supporterGroup, mood: Math.max(0, updatedGame.supporterGroup.mood - 2) } }
      }
    } else if (choiceId === 'side_tradition') {
      // fanMood +3
      if (updatedGame.supporterGroup) {
        updatedGame = { ...updatedGame, supporterGroup: { ...updatedGame.supporterGroup, mood: Math.min(100, updatedGame.supporterGroup.mood + 3) } }
      }
    } else if (choiceId === 'acknowledge_both') {
      // boardPatience +3 (proxy for facilitiesUpgrade)
      updatedGame = { ...updatedGame, boardPatience: Math.min(100, (updatedGame.boardPatience ?? 70) + 3) }
    } else if (choiceId === 'invest_small') {
      // finances -8000, morale +3
      updatedGame = { ...updatedGame, clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, -8000) }
      updatedGame = { ...updatedGame, players: updatedGame.players.map(p => p.clubId === updatedGame.managedClubId ? { ...p, morale: Math.min(100, p.morale + 3) } : p) }
    } else if (choiceId === 'arrange_indoor') {
      // finances -3000
      updatedGame = { ...updatedGame, clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, -3000) }
    } else if (choiceId === 'tough_love') {
      // morale -2
      updatedGame = { ...updatedGame, players: updatedGame.players.map(p => p.clubId === updatedGame.managedClubId ? { ...p, morale: Math.max(0, p.morale - 2) } : p) }
    }

    // Create narrative inbox item if choice has narrative text
    const hallChoice = event.choices.find(c => c.id === choiceId)
    const narrative = hallChoice?.subtitle
    if (narrative) {
      const inboxItem = {
        id: `inbox_hall_${eventId}_${choiceId}`,
        date: updatedGame.currentDate,
        type: InboxItemType.KommunBidrag,
        title: 'Eftermäle: hallfrågan',
        body: narrative,
        isRead: false,
      }
      updatedGame = {
        ...updatedGame,
        inbox: [inboxItem, ...updatedGame.inbox],
      }
    }

    const lastFixtureRound = updatedGame.lastCompletedFixtureId
      ? (updatedGame.fixtures.find(f => f.id === updatedGame.lastCompletedFixtureId)?.roundNumber ?? 0)
      : 0
    updatedGame = {
      ...updatedGame,
      hallDebateCount: (updatedGame.hallDebateCount ?? 0) + 1,
      lastHallDebateRound: lastFixtureRound,
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

    // Player morale effect
    if (player) {
      const moraleDelta = choiceType === 'individual' ? 5 : choiceType === 'system' ? -2 : 0
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

    // Journalist relationship + memory
    if (journalist) {
      const relDelta = choiceType === 'individual' ? 3 : choiceType === 'system' ? 3 : choiceType === 'silent' ? -2 : 0
      const newRelationship = Math.min(100, Math.max(0, journalist.relationship + relDelta))
      let newStyle = journalist.style
      if (choiceType === 'silent' && newRelationship < 30 && journalist.style !== 'provocative') {
        newStyle = 'provocative' as const
      }

      const memoryText = player && opponent
        ? buildCSPressMemoryEntry(choiceType, player, opponent)
        : `Coach valde ${choiceType} vid CS-pressrunda`
      const newMemory = [
        ...journalist.memory.slice(-9),
        {
          season: updatedGame.currentSeason,
          matchday: updatedGame.currentMatchday,
          event: `cs_press_${choiceType}`,
          sentiment: relDelta,
        },
      ]

      updatedGame = {
        ...updatedGame,
        journalist: { ...journalist, relationship: newRelationship, style: newStyle, memory: newMemory },
        journalistRelationship: newRelationship,
      }
      // suppress unused warning on memoryText
      void memoryText
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
  updatedGame = {
    ...updatedGame,
    pendingEvents: (updatedGame.pendingEvents ?? []).filter(e => e.id !== eventId),
    resolvedEventIds: [...(updatedGame.resolvedEventIds ?? []), eventId].slice(-200), // keep last 200
  }

  // ── Post-resolution storyline generation ────────────────────────────────
  const currentMatchday = updatedGame.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((m, f) => Math.max(m, f.roundNumber), 0)

  // 2.5 (choice-label-svepet, 2026-08-17): skrevs tidigare OAVSETT choiceId
  // — "Kaptenen samlade laget" hamnade i karriärminnet även när spelaren
  // valde 'decline' ("Nej — jag tar det här samtalet själv", ingen moralboost
  // alls). Effekt och historikpost i samma operation: bara 'support', bara
  // när teamBoostMorale faktiskt kan verka (managedClubId finns).
  if (event.type === 'captainSpeech' && choiceId === 'support' && updatedGame.managedClubId) {
    updatedGame = {
      ...updatedGame,
      storylines: [
        ...(updatedGame.storylines ?? []),
        {
          id: `story_captain_${updatedGame.currentSeason}`,
          type: 'captain_rallied_team' as const,
          season: updatedGame.currentSeason,
          matchday: currentMatchday,
          description: 'captain_rallied_team',
          displayText: 'Kaptenen samlade laget efter en svår period',
          resolved: true,
        },
      ],
    }
  }

  // 2.5 (choice-label-svepet, 2026-08-17): skrevs tidigare oavsett om
  // multiEffect-subeffekterna faktiskt lyckades applicera makeFullTimePro på
  // någon spelare — samma "storyline oberoende av effektutfall"-mönster som
  // captainSpeech ovan. Gated nu på att minst en berörd spelare verkligen
  // blev isFullTimePro efter resolutionen, inte bara på choiceId.
  if (event.type === 'varsel' && choiceId === 'offer_pro') {
    let hasSuccessfulRescue = false
    try {
      const subList = JSON.parse(choice.effect.subEffects ?? '[]') as Array<{ type: string; targetPlayerId?: string }>
      hasSuccessfulRescue = subList.some(sub =>
        sub.type === 'makeFullTimePro' && sub.targetPlayerId
        && updatedGame.players.find(p => p.id === sub.targetPlayerId)?.isFullTimePro === true
      )
    } catch { /* malformad subEffects — ingen räddning skedde */ }

    if (hasSuccessfulRescue) {
      updatedGame = {
        ...updatedGame,
        storylines: [
          ...(updatedGame.storylines ?? []),
          {
            id: `story_varsel_rescue_${updatedGame.currentSeason}`,
            type: 'rescued_from_unemployment' as const,
            season: updatedGame.currentSeason,
            matchday: currentMatchday,
            description: 'rescued_from_unemployment',
            displayText: 'Klubben räddade spelare från uppsägning genom att erbjuda heltidskontrakt',
            resolved: true,
          },
        ],
      }
    }
  }

  // ── Create follow-up if event has followUpText ──────────────────────────
  if (event.followUpText) {
    const followUp = {
      id: `fu_${eventId}_${choiceId}`,
      triggerEventId: eventId,
      matchdaysDelay: 3 + Math.floor(rand() * 3), // 3-5 matchdays
      createdMatchday: currentMatchday,
      type: 'simple_inbox',
      data: { text: event.followUpText } as Record<string, unknown>,
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

  // ── DREAM-017: Mecenatens middag — apply cumulative effects ─────────────────
  if (event.type === 'mecenatDinner' && choiceId.startsWith('final|') && event.sponsorData) {
    try {
      const scene: DinnerScene = JSON.parse(event.sponsorData)
      const chosenIds = choiceId.replace('final|', '').split('|')
      let totalHappiness = 0, totalCS = 0, totalFinancial = 0
      for (const q of scene.questions) {
        const chosen = chosenIds.find(id => id.startsWith(q.id + '_'))
        if (!chosen) continue
        const opt = q.options.find(o => o.id === chosen)
        if (!opt) continue
        totalHappiness += opt.effect.happiness
        totalCS += opt.effect.communityStanding
        totalFinancial += opt.effect.financial ?? 0
      }
      // Apply mecenat happiness
      if (scene.mecenatId) {
        updatedGame = {
          ...updatedGame,
          mecenater: (updatedGame.mecenater ?? []).map(m =>
            m.id === scene.mecenatId
              ? { ...m, happiness: Math.max(0, Math.min(100, m.happiness + totalHappiness)), lastInteractionRound: currentMatchday }
              : m
          ),
        }
      }
      // Apply communityStanding
      if (totalCS !== 0) {
        updatedGame = {
          ...updatedGame,
          communityStanding: Math.max(0, Math.min(100, (updatedGame.communityStanding ?? 50) + totalCS)),
        }
      }
      // Apply financial (cost-share gift from mecenat)
      if (totalFinancial > 0) {
        updatedGame = {
          ...updatedGame,
          clubs: applyFinanceChange(updatedGame.clubs, updatedGame.managedClubId, totalFinancial),
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // ── Record arc decisions ──────────────────────────────────────────────────
  if (event.type === 'playerArc') {
    updatedGame = {
      ...updatedGame,
      activeArcs: (updatedGame.activeArcs ?? []).map(arc =>
        arc.eventsFired.includes(eventId)
          ? { ...arc, decisionsMade: [...arc.decisionsMade, choiceId] }
          : arc
      ),
    }
  }

  // ── Start source cooldown when a source-specific event resolves ────────────
  const eventSource = EVENT_SOURCE_MAP[event.type]
  if (eventSource) {
    const newCooldowns = startCooldown(
      updatedGame.sourceCooldowns ?? {},
      eventSource as SourceKey,
    )
    updatedGame = { ...updatedGame, sourceCooldowns: newCooldowns }
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

  return updatedGame
}
