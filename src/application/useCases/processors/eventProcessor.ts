import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { GameEvent, TransferBid } from '../../../domain/entities/GameEvent'
import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import { InboxItemType } from '../../../domain/enums'
import { generatePostAdvanceEvents, generateEvents } from '../../../domain/services/eventService'
import { canAddDecision } from '../../../domain/services/decisionBudgetService'
import { isInCooldown } from '../../../domain/services/sourceCooldownService'
import { createEconomicStressEvent } from '../../../domain/services/events/eventFactories'
import { generateSocialEvent, generateSilentShoutEvent, generateMecenat, generateMecenatIntroEvent, getMecenatSocialUsedTypes, getMecenatSocialType, MECENAT_SOCIAL_MAX_PER_SEASON } from '../../../domain/services/mecenatService'
import { generateBandyLetterEvent } from '../../../domain/services/bandyLetterService'
import { checkEconomicCrisis } from '../../../domain/services/economicCrisisService'
import { checkSeasonGoalHalfwayEvent } from '../../../domain/services/seasonGoalService'
import { generateSchoolAssignmentEvent } from '../../../domain/services/schoolAssignmentService'
import { generateDinnerEvent } from '../../../domain/services/mecenatDinnerService'
import { getBurnoutZone } from '../../../domain/services/managerProfileService'
import { generateBurnoutReliefEvent } from '../../../domain/services/burnoutReliefService'
import { generateCommunityRenewalEvent } from '../../../domain/services/communityRenewalService'
import { getInjurySeverity } from '../../../domain/data/injuryDoctorText'
import type { Scandal } from '../../../domain/services/scandalService'
import { checkScandalTrigger, applyScandalEffect, resolveExpiredScandals } from '../../../domain/services/scandalService'
import {
  WAGE_OVERRUN_WARNING_TEXT,
  WAGE_OVERRUN_DEDUCTION_TEXT,
  RISKY_SPONSOR_OFFERS,
  RISKY_SPONSOR_CONTRACT_ROUNDS,
  MECENAT_WITHDRAWAL_TEXT,
  MECENAT_WITHDRAWAL_FALLBACK,
} from '../../../domain/data/eventProcessorStrings'
import { seededPick } from '../../../domain/utils/random'
import { pickDemandCategory, createPendingDemand, isDemandFulfilled } from '../../../domain/services/demandEngine'
import type { MecenatDemand } from '../../../domain/entities/Mecenat'
import type { Patron } from '../../../domain/entities/Community'

export interface EventProcessorResult {
  gameEvents: GameEvent[]
  inboxItems: InboxItem[]
  updatedMecenater: NonNullable<SaveGame['mecenater']>
  updatedPatron: Patron | undefined
  lastEconomicStressRound: number | undefined
  // O2 lager 2 (Jacobs dom 2026-08-24): fas 1 (event_crisis_awareness)
  // konverterad till ambient — tillståndsövergången sker nu vid
  // genereringen (checkEconomicCrisis), inte via en senare choice-
  // resolution. Måste därför tröskas ut ur processGameEvents precis som
  // updatedMecenater/updatedPatron redan gör.
  economicCrisisState: SaveGame['economicCrisisState']
  // Lager 2 state updates
  wageBudgetOverrunRounds: number
  wageBudgetWarningSent: boolean
  riskySponsorOfferSentThisSeason: number | undefined
  mecenatWithdrawnSeason: number | undefined
  // Beslutsekonomi
  lastEventQueueRound: number | undefined
}



function fillL2Tokens(text: string, tokens: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value)
  }
  return result
}

export function processGameEvents(
  game: SaveGame,
  newBids: TransferBid[],
  justCompletedManagedFixture: Fixture | null | undefined,
  nextMatchday: number,
  localRand: () => number,
): EventProcessorResult {
  const inboxItems: InboxItem[] = []
  let mecenatWithdrawnSeason: number | undefined = game.mecenatWithdrawnSeason

  const newEvents = generatePostAdvanceEvents(game, newBids, nextMatchday, localRand, justCompletedManagedFixture ?? undefined)

  // Beslutsekonomi: community events get a 2-round cooldown + budget gate
  const EVENT_QUEUE_COOLDOWN = 2
  const lastEventQueueRoundPrev = game.lastEventQueueRound ?? 0
  const eventQueueCooledDown = nextMatchday - lastEventQueueRoundPrev >= EVENT_QUEUE_COOLDOWN
  const communityEvents = (eventQueueCooledDown && canAddDecision(game, nextMatchday))
    ? generateEvents(game, nextMatchday, localRand)
    : []
  const lastEventQueueRound: number | undefined = (communityEvents.length > 0)
    ? nextMatchday
    : (game.lastEventQueueRound ?? undefined)

  const gameEvents: GameEvent[] = [...newEvents, ...communityEvents]

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (managedClub && managedClub.finances < -50000 && managedClub.finances >= -100000) {
    const warnId = `inbox_finance_warn_${game.currentSeason}_${nextMatchday}`
    if (!game.inbox.some(i => i.id === warnId)) {
      inboxItems.push({
        id: warnId,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: 'Ekonomisk varning',
        body: `Kassan är på ${managedClub.finances.toLocaleString('sv-SE')} kr. Om vi når -100k kan licensnämnden agera.`,
        isRead: false,
      })
    }
  }

  let lastEconomicStressRound: number | undefined = game.lastEconomicStressRound
  const stressEvent = createEconomicStressEvent(game, nextMatchday, localRand)
  if (stressEvent) {
    gameEvents.push(stressEvent)
    lastEconomicStressRound = nextMatchday
  }

  // DREAM-010: Bandybrev
  const bandyLetterEvent = generateBandyLetterEvent(game, nextMatchday)
  if (bandyLetterEvent) gameEvents.push(bandyLetterEvent)

  // DREAM-002: Ekonomisk kris
  const crisisCheck = checkEconomicCrisis(game, nextMatchday)
  if (crisisCheck.event) gameEvents.push(crisisCheck.event)
  const economicCrisisState = crisisCheck.economicCrisisState

  // O3 — säsongsmålets halvtidsrad (ambient, D1 punkt 2)
  const seasonGoalHalfwayEvent = checkSeasonGoalHalfwayEvent(game)
  if (seasonGoalHalfwayEvent) gameEvents.push(seasonGoalHalfwayEvent)

  // DREAM-016: Skoluppgift
  const schoolEvent = generateSchoolAssignmentEvent(game, nextMatchday)
  if (schoolEvent) gameEvents.push(schoolEvent)

  // DREAM-017: Mecenatens middag (omgång 20) — budget gate + source cooldown
  if (nextMatchday === 20 && canAddDecision(game, nextMatchday) && !isInCooldown(game.sourceCooldowns ?? {}, 'mecenat')) {
    const dinnerEvent = generateDinnerEvent(game, nextMatchday)
    if (dinnerEvent) gameEvents.push(dinnerEvent)
  }

  // O4 (DOM_BURNOUT_2026-08-17.md, Jacobs dom 2026-08-23): burnout-relief —
  // budget gate + source cooldown, samma mönster som mecenatens middag ovan.
  // Aldrig i 'frisk'-zonen (ingen effekt att lätta på), aldrig oftare än
  // var 6:e omgång (SOURCE_COOLDOWN_ROUNDS.burnout) så länge zonen håller i sig.
  const burnoutZone = getBurnoutZone(game.managerProfile?.burnoutScore ?? 0)
  if (
    (burnoutZone === 'markbar' || burnoutZone === 'hog') &&
    canAddDecision(game, nextMatchday) &&
    !isInCooldown(game.sourceCooldowns ?? {}, 'burnout')
  ) {
    gameEvents.push(generateBurnoutReliefEvent(nextMatchday, game.currentSeason, burnoutZone))
  }

  // ANSPRÅK 4, spak 3 (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md):
  // nyhetstretmillen. Samma mönster som burnout-relief och mecenatens middag —
  // budget gate + source cooldown ('orten', 6 omgångar). Domens "synligt val,
  // inte dränering": kostnaden är ALDRIG en automatisk avdragspost, alltid ett
  // kort spelaren svarar på. Genereras aldrig för en klubb under rykte 80
  // (staleness-multiplikatorn är då konstant 1,0 → inga kandidater).
  if (canAddDecision(game, nextMatchday) && !isInCooldown(game.sourceCooldowns ?? {}, 'orten')) {
    const renewalEvent = generateCommunityRenewalEvent(game, nextMatchday)
    if (renewalEvent) gameEvents.push(renewalEvent)
  }

  let updatedMecenater = (game.mecenater ?? []).map(mec => {
    if (!mec.isActive) return mec
    const roundsSinceInteraction = nextMatchday - (mec.lastInteractionRound ?? 0)
    const decayedHappiness = roundsSinceInteraction > 4
      ? Math.max(0, mec.happiness - 1)
      : mec.happiness
    return { ...mec, happiness: decayedHappiness }
  })

  // Medium 2 (Skutskär-auditen, 2026-08-22, Jacobs dom): säsongsminne DELAT
  // över alla mecenater i denna omgång — sätts en gång före loopen (läser
  // game.narrativeBeatLog) och uppdateras lokalt vid varje genererat event, så
  // två mecenater som båda rullar i SAMMA omgång inte kan välja samma typ
  // (narrativeBeatLog skrivs först i roundProcessor.ts, efter denna funktion
  // returnerat — en stale läsning av `game` hade missat den racen).
  let mecenatSocialUsedTypes = getMecenatSocialUsedTypes(game)

  for (let i = 0; i < updatedMecenater.length; i++) {
    const mec = updatedMecenater[i]
    if (!mec.isActive) continue

    const roundsSinceLastSocial = nextMatchday - (mec.lastSocialRound ?? 0)
    if (roundsSinceLastSocial >= 4 && localRand() < 0.35 && mecenatSocialUsedTypes.size < MECENAT_SOCIAL_MAX_PER_SEASON) {
      const socialEvent = generateSocialEvent(mec, game.currentSeason, nextMatchday, localRand, mecenatSocialUsedTypes)
      if (socialEvent) {
        gameEvents.push(socialEvent)
        const type = socialEvent.mecenatSocialKey ? getMecenatSocialType(socialEvent.mecenatSocialKey) : undefined
        if (type) mecenatSocialUsedTypes = new Set(mecenatSocialUsedTypes).add(type)
        updatedMecenater = updatedMecenater.map((m, idx) =>
          idx === i ? { ...m, lastSocialRound: nextMatchday } : m
        )
      }
    }

    if (mec.happiness < 30 || mec.silentShout >= 30) {
      const randomPlayer = game.players.find(p => p.clubId === game.managedClubId)
      const playerName = randomPlayer ? `${randomPlayer.firstName} ${randomPlayer.lastName}` : undefined
      const managedTactic = game.clubs.find(c => c.id === game.managedClubId)?.activeTactic
      const shoutEvent = generateSilentShoutEvent(mec, playerName, localRand, managedTactic?.mentality)
      if (shoutEvent) {
        gameEvents.push(shoutEvent)
      }
    }

    // ── Kravmotor (2026-07-19): periodiskt krav kopplat till mecenatens intresse ──
    // Läs FÄRSKASTE state (updatedMecenater[i]), inte den stale `mec`-referensen
    // från loopens topp — social-event-blocket ovan kan redan ha muterat den.
    const mecNow = updatedMecenater[i]
    if (mecNow.pendingDemand) {
      if (nextMatchday >= mecNow.pendingDemand.deadlineRound) {
        const fulfilled = isDemandFulfilled(game, mecNow.pendingDemand, game.managedClubId)
        const delta = fulfilled ? 15 : -15
        const resolvedDemand = mecNow.pendingDemand
        updatedMecenater = updatedMecenater.map((m, idx) => {
          if (idx !== i) return m
          const newDemands: MecenatDemand[] = fulfilled
            ? []
            : [...m.demands, {
                type: resolvedDemand.category,
                description: resolvedDemand.description,
                targetPlayerId: resolvedDemand.targetPlayerId,
              }]
          return {
            ...m,
            happiness: Math.max(0, Math.min(100, m.happiness + delta)),
            demands: newDemands,
            pendingDemand: undefined,
          }
        })
      }
    } else if (localRand() < 0.2) {
      // Ingen garanti varje berättigad omgång — sprider ut genereringen så
      // en misslyckande-serie tar mer än en säsong under otur (balans mot
      // demands.length>=3-withdrawal-tröskeln, se demandEngine.ts).
      const seed = mecNow.id.length * 7 + nextMatchday * 13 + game.currentSeason * 31
      const category = pickDemandCategory(seed)
      const favoritePlayer = mecNow.favoritePlayerId
        ? game.players.find(p => p.id === mecNow.favoritePlayerId)
        : undefined
      const targetPlayerId = category === 'playtime'
        ? (favoritePlayer?.id ?? game.players.find(p => p.clubId === game.managedClubId && !p.isInjured)?.id)
        : undefined
      const newDemand = createPendingDemand(game, category, nextMatchday, {
        seed,
        targetPlayerId,
        favoritePlayerName: favoritePlayer ? `${favoritePlayer.firstName} ${favoritePlayer.lastName}` : undefined,
      })
      updatedMecenater = updatedMecenater.map((m, idx) => idx === i ? { ...m, pendingDemand: newDemand } : m)
    }

    if (mec.demands.length > 0) {
      const demandId = `inbox_mec_demand_${mec.id}_${nextMatchday}`
      if (!game.inbox.some(item => item.id === demandId) && nextMatchday % 5 === 0) {
        const demandTexts = mec.demands.map(d => d.description ?? d.type).join(', ')
        inboxItems.push({
          id: demandId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `${mec.name} påminner`,
          body: `${mec.name} har fortfarande önskemål som inte hanterats: ${demandTexts}.`,
          isRead: false,
        } as InboxItem)
      }
    }

    // ── 2C: Mecenat permanent withdrawal (happiness < 20, 3+ ignorerade krav) ──
    if (mec.happiness < 20 && mec.demands.length >= 3) {
      const withdrawalId = `mecenat_withdrawal_${mec.id}_${game.currentSeason}`
      const alreadyWithdrawn = game.pendingEvents?.some(e => e.id === withdrawalId) ||
        game.inbox.some(i => i.id === withdrawalId)
      if (!alreadyWithdrawn) {
        // Financial penalty based on wealth tier (estimated from happiness × wealth proxy)
        const wealthLevel = (mec.happiness < 10) ? 3 : (mec.happiness < 15) ? 2 : 1
        const penalty = wealthLevel === 3 ? -1_000_000 : wealthLevel === 2 ? -600_000 : -300_000
        const penaltyText = Math.abs(penalty).toLocaleString('sv-SE')

        const withdrawalTemplate =
          MECENAT_WITHDRAWAL_TEXT[mec.personality] ??
          seededPick(MECENAT_WITHDRAWAL_FALLBACK, game.currentSeason)
        const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'Klubben'
        const withdrawalTitle = fillL2Tokens(withdrawalTemplate.title, { MECENAT: mec.name, KLUBB: clubName })
        const withdrawalBody = fillL2Tokens(withdrawalTemplate.body, { MECENAT: mec.name, KLUBB: clubName })

        const withdrawalEvent: GameEvent = {
          id: withdrawalId,
          type: 'mecenatWithdrawal',
          title: withdrawalTitle,
          body: `${withdrawalBody}\n\nEkonomisk effekt: ${penaltyText} kr dras från kassan.`,
          choices: [
            {
              id: 'acknowledge',
              label: 'Noterat',
              effect: {
                type: 'finance',
                value: penalty,
              },
            },
          ],
          resolved: false,
        }
        gameEvents.push(withdrawalEvent)
        updatedMecenater = updatedMecenater.map((m, idx) =>
          idx === i ? { ...m, isActive: false, happiness: 0, permanentlyWithdrawn: true } : m,
        )
        mecenatWithdrawnSeason = game.currentSeason
      }
    }
  }

  // ── 2A: Wage budget overrun tracking ──────────────────────────────────────
  let wageBudgetOverrunRounds = game.wageBudgetOverrunRounds ?? 0
  let wageBudgetWarningSent = game.wageBudgetWarningSent ?? false
  if (managedClub) {
    const totalSalary = game.players
      .filter(p => p.clubId === game.managedClubId)
      .reduce((s, p) => s + (p.salary ?? 0), 0)
    const weeklyWageEquivalent = Math.round(totalSalary / 4)
    if (weeklyWageEquivalent > managedClub.wageBudget) {
      wageBudgetOverrunRounds++
      const wageClubName = managedClub?.name ?? 'Klubben'
      // After 5 rounds: Licensnämnden warning
      if (wageBudgetOverrunRounds >= 5 && !wageBudgetWarningSent) {
        wageBudgetWarningSent = true
        const warnId = `inbox_wage_overrun_warn_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === warnId)) {
          const wt = seededPick(WAGE_OVERRUN_WARNING_TEXT, game.currentSeason)
          inboxItems.push({
            id: warnId,
            date: game.currentDate,
            type: InboxItemType.LicenseReview,
            title: fillL2Tokens(wt.title, { KLUBB: wageClubName }),
            body: fillL2Tokens(wt.body, { KLUBB: wageClubName }),
            isRead: false,
          } as InboxItem)
        }
      }
      // After 10 rounds: point deduction (stored in pendingPointDeductions for next season)
      if (wageBudgetOverrunRounds >= 10) {
        const deductId = `inbox_wage_deduct_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === deductId)) {
          const dt = seededPick(WAGE_OVERRUN_DEDUCTION_TEXT, game.currentSeason + 1)
          inboxItems.push({
            id: deductId,
            date: game.currentDate,
            type: InboxItemType.LicenseReview,
            title: fillL2Tokens(dt.title, { KLUBB: wageClubName }),
            body: fillL2Tokens(dt.body, { KLUBB: wageClubName }),
            isRead: false,
          } as InboxItem)
        }
      }
    } else {
      // Back within budget — reset
      wageBudgetOverrunRounds = 0
      wageBudgetWarningSent = false
    }
  }

  // ── 2B: Risky sponsor offer (1-2x per season, at rounds 8 or 16) ──────────
  let riskySponsorOfferSentThisSeason = game.riskySponsorOfferSentThisSeason
  const triggerRiskyOffer = (nextMatchday === 8 || nextMatchday === 16) &&
    riskySponsorOfferSentThisSeason !== game.currentSeason &&
    localRand() < 0.4  // 40% chance at each trigger round → ~1-2x per season
  if (triggerRiskyOffer) {
    riskySponsorOfferSentThisSeason = game.currentSeason
    const offerId = `risky_sponsor_${game.currentSeason}_${nextMatchday}`
    const offerVariant = seededPick(RISKY_SPONSOR_OFFERS, game.currentSeason + nextMatchday)
    const offerClubName = managedClub?.name ?? 'Klubben'
    const riskySponsor = {
      id: offerId,
      name: offerVariant.name,
      category: offerVariant.category,
      weeklyIncome: offerVariant.weeklyIncome,
      contractRounds: RISKY_SPONSOR_CONTRACT_ROUNDS,
      signedRound: nextMatchday,
      tier: 'risky' as const,
      triggeredBy: 'risky_offer' as const,
      triggeredSeason: game.currentSeason,
      expiresSeason: game.currentSeason + 2,
      riskMaturityRound: nextMatchday + 6,
    }
    const riskyEvent: GameEvent = {
      id: offerId,
      type: 'riskySponsorOffer',
      title: `Sponsorerbjudande: ${offerVariant.title}`,
      body: fillL2Tokens(offerVariant.body, { KLUBB: offerClubName, SPONSOR: offerVariant.name }),
      choices: [
        {
          id: 'accept',
          label: offerVariant.acceptLabel,
          subtitle: offerVariant.risk,
          effect: {
            type: 'acceptSponsor',
            sponsorData: JSON.stringify(riskySponsor),
          },
        },
        {
          id: 'reject',
          label: 'Avböj',
          effect: { type: 'noOp' },
        },
      ],
      resolved: false,
    }
    gameEvents.push(riskyEvent)
  }

  // ── Kravmotor (2026-07-19): Patron — samma motor som Mecenat ovan, egen
  // konsekvens. Uppfyllt/ouppfyllt matar det BEFINTLIGA portalkortet
  // (patron_demand_unmet, initCardBag.ts) + triggern (patronDemandUnmetOver3Rounds,
  // demands.length>0 && patience<30) — demands hålls kvar (INTE rensad) vid
  // misslyckande så triggern hittar den stale texten; rensas bara vid uppfyllt.
  let updatedPatron = game.patron
  if (updatedPatron?.isActive) {
    if (updatedPatron.pendingDemand) {
      if (nextMatchday >= updatedPatron.pendingDemand.deadlineRound) {
        const fulfilled = isDemandFulfilled(game, updatedPatron.pendingDemand, game.managedClubId)
        const delta = fulfilled ? 15 : -15
        updatedPatron = {
          ...updatedPatron,
          happiness: Math.max(0, Math.min(100, updatedPatron.happiness + delta)),
          goodwill: Math.max(0, Math.min(100, (updatedPatron.goodwill ?? 80) + delta)),
          demands: fulfilled ? [] : updatedPatron.demands,
          pendingDemand: undefined,
        }
      }
    } else if (localRand() < 0.2) {
      const seed = (updatedPatron.name?.length ?? 5) * 7 + nextMatchday * 13 + game.currentSeason * 31
      const category = pickDemandCategory(seed)
      const favoritePlayer = updatedPatron.favoritePlayerId
        ? game.players.find(p => p.id === updatedPatron!.favoritePlayerId)
        : undefined
      const targetPlayerId = category === 'playtime'
        ? (favoritePlayer?.id ?? game.players.find(p => p.clubId === game.managedClubId && !p.isInjured)?.id)
        : undefined
      const newDemand = createPendingDemand(game, category, nextMatchday, {
        seed,
        targetPlayerId,
        favoritePlayerName: favoritePlayer ? `${favoritePlayer.firstName} ${favoritePlayer.lastName}` : undefined,
        favoriteRelation: updatedPatron.favoriteRelation,
      })
      updatedPatron = { ...updatedPatron, pendingDemand: newDemand, demands: [newDemand.description] }
    }
  }

  return {
    gameEvents,
    inboxItems,
    updatedMecenater,
    updatedPatron,
    lastEconomicStressRound,
    economicCrisisState,
    wageBudgetOverrunRounds,
    wageBudgetWarningSent,
    riskySponsorOfferSentThisSeason,
    mecenatWithdrawnSeason,
    lastEventQueueRound,
  }
}

// ── Mecenat spawn ─────────────────────────────────────────────────────────

/**
 * Taket på samtidiga mecenater — DISKRET, oförändrat (Jacobs dom 2026-08-26,
 * "takmodellen"). Delad mellan `applyMecenatSpawn` (gate för nya) och
 * `applyMecenatCapEviction` (tvingar ut en om taket sjunker under antalet
 * aktiva) — en sanning, ett ställe, kan inte glida isär.
 */
export function mecenatCapForCs(cs: number): number {
  return cs >= 85 ? 3 : cs >= 70 ? 2 : 1
}

export function applyMecenatSpawn(
  game: SaveGame,
  postTransferClubs: Club[],
  isSecondPass: boolean,
  currentLeagueRound: number | null,
  updatedMecenater: NonNullable<SaveGame['mecenater']>,
  localRand: () => number,
): { updatedMecenater: NonNullable<SaveGame['mecenater']>; newEvents: GameEvent[] } {
  if (
    isSecondPass ||
    currentLeagueRound === null ||
    currentLeagueRound < 6 ||
    currentLeagueRound > 18
  ) {
    return { updatedMecenater, newEvents: [] }
  }
  // 2C: Lock out new mecenater for 2 seasons after a patron withdrawal
  const withdrawnSeason = game.mecenatWithdrawnSeason
  if (withdrawnSeason !== undefined && game.currentSeason <= withdrawnSeason + 2) {
    return { updatedMecenater, newEvents: [] }
  }
  const cs = game.communityStanding ?? 50
  const rep = postTransferClubs.find(c => c.id === game.managedClubId)?.reputation ?? 50
  const activeMecenater = updatedMecenater.filter(m => m.isActive)
  const maxMecenater = mecenatCapForCs(cs)
  const alreadySpawnedThisSeason = updatedMecenater.some(m => m.arrivedSeason === game.currentSeason)

  // "Takmodellen" (Jacobs dom 2026-08-26, ARBETSKARTAN fråga 3 —
  // sannolikhetsrampen mättes och kastades: 1-15%/omgång upprepad 130-220
  // gånger över en karriär konvergerar mot säkerhet oavsett cs, se
  // RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md). Ortstödet ska avgöra HUR
  // MÅNGA (taket ovan, redan diskret), inte HUR OFTA — därför borttaget:
  // det tidigare `cs >= 65`-försöksgrindet. Golvet på taket är 1 (aldrig
  // 0) — en klubb kan ALLTID ha en mecenat, oavsett hur lågt ortstödet är,
  // bara långsammare (samma 15%-chans, oförändrad) och begränsat till en
  // åt gången tills taket stiger.
  if (
    rep >= 55 &&
    activeMecenater.length < maxMecenater &&
    !alreadySpawnedThisSeason &&
    localRand() < 0.15
  ) {
    const newMecenat = generateMecenat(game.managedClubId, game.currentSeason, localRand)
    const introEvent = generateMecenatIntroEvent(newMecenat)
    return {
      updatedMecenater: [...updatedMecenater, { ...newMecenat, isActive: false }],
      newEvents: [introEvent],
    }
  }
  return { updatedMecenater, newEvents: [] }
}

/**
 * "Takmodellen", andra halvan (Jacobs dom 2026-08-26): relationen var
 * enkelriktad — communityStanding avgjorde bara ANKOMST, aldrig AVHOPP
 * (bekräftat kodläst, RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md punkt 4). Om
 * taket sjunker under antalet aktiva mecenater (orten har svikit klubben)
 * ska en lämna — annars är orten en spärr man passerar en gång, inte en
 * spak i båda riktningarna. Den MINST NÖJDA (lägst happiness) lämnar
 * först — samma "vem har mest att förlora"-logik som redan används för
 * att välja VILKEN mecenat en ekonomisk kris drabbar
 * (economicCrisisService.ts). Ingen ekonomisk straffavgift här (skiljer
 * denna väg från kravmotorns avhopp) — orsaken är omständighet, inte ett
 * brutet löfte klubben gav, så kostnaden är bara den förlorade relationen,
 * inte ytterligare ett kronbelopp.
 */
export function applyMecenatCapEviction(
  game: SaveGame,
  updatedMecenater: NonNullable<SaveGame['mecenater']>,
): { updatedMecenater: NonNullable<SaveGame['mecenater']>; newEvents: GameEvent[] } {
  const cs = game.communityStanding ?? 50
  const cap = mecenatCapForCs(cs)
  const active = updatedMecenater.filter(m => m.isActive)
  if (active.length <= cap) return { updatedMecenater, newEvents: [] }

  const toEvict = [...active].sort((a, b) => a.happiness - b.happiness)[0]
  const withdrawalId = `mecenat_cs_eviction_${toEvict.id}_${game.currentSeason}`
  const alreadyQueued = (game.pendingEvents ?? []).some(e => e.id === withdrawalId) ||
    game.inbox.some(i => i.id === withdrawalId)
  if (alreadyQueued) return { updatedMecenater, newEvents: [] }

  const newUpdated = updatedMecenater.map(m =>
    m.id === toEvict.id ? { ...m, isActive: false, happiness: 0, permanentlyWithdrawn: true } : m,
  )
  const withdrawalEvent: GameEvent = {
    id: withdrawalId,
    type: 'mecenatWithdrawal',
    // Orsaken är orten, inte relationen: mecenaten lämnar för att bygden
    // hen ville stötta har tunnats ut, inte för att hen känt sig ignorerad
    // (skild orsak från kravmotorns avhopp ovan). Ingen ekonomisk straff-
    // avgift — bara den förlorade relationen.
    title: `${toEvict.name} drar sig tillbaka`,
    body: `${toEvict.name} ber om ett möte. Ingen ilska den här gången, ingenting du gjort fel.\n\n"Jag gav inte pengarna för klubbens skull i första hand. Jag gav dem för bygden. Men den bygd jag ville hålla vid liv tunnas ut. Folk flyttar, läktaren glesnar, det pratas knappt bandy på orten längre. Då räcker inte jag till. Det är inte ert fel, det är bara tiden."\n\n${toEvict.name} lämnar. Det blir tyst — tystare än förr.`,
    choices: [{ id: 'acknowledge', label: 'Noterat', effect: { type: 'noOp' } }],
    resolved: false,
  }
  return { updatedMecenater: newUpdated, newEvents: [withdrawalEvent] }
}

// ── Pool 1c: spela-på-erbjudandet (injuryDoctorText.ts) ──────────────────────
//
// Jacobs tre designbeslut (2026-07-18):
// 1. Bara mjuk/mild severity erbjuds — aldrig svår/långtid (orimligt avvägande).
// 2. Ingen matchvikts-gating — spelaren väger själv om matchen är värd risken.
// 3. Erbjuds varje matchcykel villkoren håller, inte engångs — men aldrig en
//    andra samtidig offert för samma spelare (dedup mot pendingEvents).
//
// Textytan (title/body/choice-labels) är Opus-text, levererad och wirad
// 2026-07-20 (doktorns röst, se raderna nedan) — kommentaren nedan beskrev
// tidigare ett '[Opus]'-platshållarläge, rättad 2026-07-21 (release-svepet).
// PLAY_THROUGH_AFTERMATH-raderna som visas EFTER matchen är redan Opus-text
// (injuryDoctorText.ts) — de rörs inte här, bara wiring i playerStateProcessor.
export function checkForPlayThroughInjuryOffer(
  game: SaveGame,
  nextMatchday: number,
): GameEvent[] {
  const managedId = game.managedClubId
  const hasManagedFixtureThisRound = game.fixtures.some(
    f => f.matchday === nextMatchday && f.status === 'scheduled' &&
         (f.homeClubId === managedId || f.awayClubId === managedId)
  )
  if (!hasManagedFixtureThisRound) return []

  const candidates = game.players.filter(p =>
    p.clubId === managedId &&
    p.isInjured &&
    !p.playingThroughInjury &&
    ['mjuk', 'mild'].includes(getInjurySeverity(p.injuryDaysRemaining))
  )
  if (candidates.length === 0) return []

  const pending = game.pendingEvents ?? []
  const events: GameEvent[] = []
  for (const player of candidates) {
    const alreadyPending = pending.some(
      e => e.type === 'playThroughInjury' && e.relatedPlayerId === player.id && !e.resolved
    )
    if (alreadyPending) continue
    events.push({
      id: `playthrough_${player.id}_${nextMatchday}`,
      type: 'playThroughInjury',
      title: `${game.doctor?.name ?? 'Doktorn'} om ${player.lastName}`,
      body: 'Han vill spela. Han säger att det håller. Jag säger att det inte gör det — men han kan gå ut om du sätter honom. Sen får vi se hur länge han är borta i stället.',
      choices: [
        { id: 'play', label: 'Han spelar', subtitle: 'Risken är att skadan förvärras', effect: { type: 'playThroughInjury', targetPlayerId: player.id } },
        { id: 'rest', label: 'Han vilar', subtitle: 'Tillbaka enligt plan', effect: { type: 'noOp' } },
      ],
      relatedPlayerId: player.id,
      resolved: false,
    })
  }
  return events
}

// ── Scandals (Lager 1 — Världshändelser) ─────────────────────────────────

export interface ScandalProcessorResult {
  inboxItems: InboxItem[]
  updatedClubs: Club[]
  updatedScandals: Scandal[]
  updatedScandalHistory: Scandal[]
  pointDeductions: Record<string, number>
  pendingPointDeductions: Record<string, number>
}

export function processScandals(
  game: SaveGame,
  nextMatchday: number,
  localRand: () => number,
  options?: { skipSideEffects?: boolean },
): ScandalProcessorResult {
  const neutral: ScandalProcessorResult = {
    inboxItems: [],
    updatedClubs: game.clubs,
    updatedScandals: game.activeScandals ?? [],
    updatedScandalHistory: game.scandalHistory ?? [],
    pointDeductions: game.pointDeductions ?? {},
    pendingPointDeductions: game.pendingPointDeductions ?? {},
  }
  if (options?.skipSideEffects) return neutral

  // 1. Resolve expired scandals first
  const resolved = resolveExpiredScandals(game, nextMatchday)
  const gameAfterResolution: SaveGame = {
    ...game,
    clubs: resolved.updatedClubs,
    activeScandals: resolved.updatedScandals,
    scandalHistory: resolved.updatedScandalHistory,
  }

  // 2. Check for new scandal trigger
  const newScandal = checkScandalTrigger(gameAfterResolution, nextMatchday, localRand)
  if (!newScandal) {
    return {
      ...neutral,
      updatedClubs: resolved.updatedClubs,
      updatedScandals: resolved.updatedScandals,
      updatedScandalHistory: resolved.updatedScandalHistory,
    }
  }

  // 3. Apply effects
  const effects = applyScandalEffect(gameAfterResolution, newScandal, localRand)

  return {
    inboxItems: effects.inboxItems,
    updatedClubs: effects.updatedClubs,
    updatedScandals: [...resolved.updatedScandals, newScandal],
    updatedScandalHistory: resolved.updatedScandalHistory,
    pointDeductions: effects.pointDeductions,
    pendingPointDeductions: effects.pendingPointDeductions,
  }
}
