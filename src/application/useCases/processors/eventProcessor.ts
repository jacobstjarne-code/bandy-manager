import type { SaveGame, InboxItem } from '../../../domain/entities/SaveGame'
import type { GameEvent, TransferBid } from '../../../domain/entities/GameEvent'
import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import { InboxItemType } from '../../../domain/enums'
import { generatePostAdvanceEvents, generateEvents } from '../../../domain/services/eventService'
import { createEconomicStressEvent } from '../../../domain/services/events/eventFactories'
import { generateSocialEvent, generateSilentShoutEvent, generateMecenat, generateMecenatIntroEvent } from '../../../domain/services/mecenatService'
import { generateBandyLetterEvent } from '../../../domain/services/bandyLetterService'
import { checkEconomicCrisis } from '../../../domain/services/economicCrisisService'
import { generateSchoolAssignmentEvent } from '../../../domain/services/schoolAssignmentService'
import { generateDinnerEvent } from '../../../domain/services/mecenatDinnerService'
import type { Scandal } from '../../../domain/services/scandalService'
import { checkScandalTrigger, applyScandalEffect, resolveExpiredScandals } from '../../../domain/services/scandalService'

export interface EventProcessorResult {
  gameEvents: GameEvent[]
  inboxItems: InboxItem[]
  updatedMecenater: NonNullable<SaveGame['mecenater']>
  lastEconomicStressRound: number | undefined
  // Lager 2 state updates
  wageBudgetOverrunRounds: number
  wageBudgetWarningSent: boolean
  riskySponsorOfferSentThisSeason: number | undefined
  patronWithdrawnSeason: number | undefined
}

export function processGameEvents(
  game: SaveGame,
  newBids: TransferBid[],
  justCompletedManagedFixture: Fixture | null | undefined,
  nextMatchday: number,
  localRand: () => number,
): EventProcessorResult {
  const inboxItems: InboxItem[] = []
  let patronWithdrawnSeason: number | undefined = game.patronWithdrawnSeason

  const newEvents = generatePostAdvanceEvents(game, newBids, nextMatchday, localRand, justCompletedManagedFixture ?? undefined)
  const communityEvents = generateEvents(game, nextMatchday, localRand)
  const gameEvents: GameEvent[] = [...newEvents, ...communityEvents]

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (managedClub && managedClub.finances < -50000 && managedClub.finances >= -100000) {
    const warnId = `inbox_finance_warn_${game.currentSeason}_${nextMatchday}`
    if (!game.inbox.some(i => i.id === warnId)) {
      inboxItems.push({
        id: warnId,
        date: game.currentDate,
        type: InboxItemType.BoardFeedback,
        title: '⚠️ Ekonomisk varning',
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
  const crisisEvent = checkEconomicCrisis(game, nextMatchday)
  if (crisisEvent) gameEvents.push(crisisEvent)

  // DREAM-016: Skoluppgift
  const schoolEvent = generateSchoolAssignmentEvent(game, nextMatchday)
  if (schoolEvent) gameEvents.push(schoolEvent)

  // DREAM-017: Mecenatens middag (omgång 20)
  if (nextMatchday === 20) {
    const dinnerEvent = generateDinnerEvent(game, nextMatchday)
    if (dinnerEvent) gameEvents.push(dinnerEvent)
  }

  let updatedMecenater = (game.mecenater ?? []).map(mec => {
    if (!mec.isActive) return mec
    const roundsSinceInteraction = nextMatchday - (mec.lastInteractionRound ?? 0)
    const decayedHappiness = roundsSinceInteraction > 4
      ? Math.max(0, mec.happiness - 1)
      : mec.happiness
    return { ...mec, happiness: decayedHappiness }
  })

  for (let i = 0; i < updatedMecenater.length; i++) {
    const mec = updatedMecenater[i]
    if (!mec.isActive) continue

    const roundsSinceLastSocial = nextMatchday - (mec.lastSocialRound ?? 0)
    if (roundsSinceLastSocial >= 4 && localRand() < 0.35) {
      const socialEvent = generateSocialEvent(mec, game.currentSeason, nextMatchday, localRand)
      gameEvents.push(socialEvent)
      updatedMecenater = updatedMecenater.map((m, idx) =>
        idx === i ? { ...m, lastSocialRound: nextMatchday } : m
      )
    }

    if (mec.happiness < 30 || mec.silentShout >= 30) {
      const randomPlayer = game.players.find(p => p.clubId === game.managedClubId)
      const playerName = randomPlayer ? `${randomPlayer.firstName} ${randomPlayer.lastName}` : undefined
      const shoutEvent = generateSilentShoutEvent(mec, playerName, localRand)
      if (shoutEvent) {
        gameEvents.push(shoutEvent)
      }
    }

    if (mec.demands.length > 0) {
      const demandId = `inbox_mec_demand_${mec.id}_${nextMatchday}`
      if (!game.inbox.some(item => item.id === demandId) && nextMatchday % 5 === 0) {
        const demandTexts = mec.demands.map(d => d.description ?? d.type).join(', ')
        inboxItems.push({
          id: demandId,
          date: game.currentDate,
          type: InboxItemType.PatronInfluence,
          title: `📋 ${mec.name} påminner`,
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

        const withdrawalEvent: GameEvent = {
          id: withdrawalId,
          type: 'mecenatWithdrawal',
          title: `${mec.name} drar sig ur`,
          body: `${mec.name} har tröttnat. Han lämnar och kräver tillbaka det han investerat — ${penaltyText} kr dras från kassan. Det kan dröja länge innan nästa mecenat dyker upp.`,
          choices: [
            {
              id: 'acknowledge',
              label: 'Noterat',
              effect: {
                type: 'finance',
                amount: penalty,
              },
            },
          ],
          resolved: false,
        }
        gameEvents.push(withdrawalEvent)
        updatedMecenater = updatedMecenater.map((m, idx) =>
          idx === i ? { ...m, isActive: false, happiness: 0 } : m,
        )
        patronWithdrawnSeason = game.currentSeason
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
      // After 5 rounds: Licensnämnden warning
      if (wageBudgetOverrunRounds >= 5 && !wageBudgetWarningSent) {
        wageBudgetWarningSent = true
        const warnId = `inbox_wage_overrun_warn_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === warnId)) {
          inboxItems.push({
            id: warnId,
            date: game.currentDate,
            type: InboxItemType.LicenseReview,
            title: '⚠️ Licensnämnden: Lönekostnad',
            body: 'Licensnämnden noterar att era lönekostnader överstiger den godkända lönebudgeten. Om överskridandet fortsätter i ytterligare fem omgångar tillkommer poängavdrag.',
            isRead: false,
          } as InboxItem)
        }
      }
      // After 10 rounds: point deduction (stored in pendingPointDeductions for next season)
      if (wageBudgetOverrunRounds >= 10) {
        const deductId = `inbox_wage_deduct_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === deductId)) {
          inboxItems.push({
            id: deductId,
            date: game.currentDate,
            type: InboxItemType.LicenseReview,
            title: '🚨 Licensnämnden: Poängavdrag',
            body: 'Lönekostnaderna har överskridit budgeten i 10 omgångar. Tre poängs avdrag tillämpas nästa säsong.',
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
    const riskySponsor = {
      id: offerId,
      name: 'Borgvik Bygg AB',
      category: 'Bygg & Fastighet',
      weeklyIncome: 2_000,
      contractRounds: 44,  // 2 seasons
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
      title: 'Sponsorerbjudande: Borgvik Bygg AB',
      body: 'Borgvik Bygg AB erbjuder 2 000 kr/omgång i marknadsavtal. Notera: företaget är föremål för en Skatteverkets-granskning. Det kan bli komplicerat om granskningen leder till åtal.',
      choices: [
        {
          id: 'accept',
          label: 'Acceptera (2 000 kr/omg)',
          subtitle: '⚠️ Risk: Skatteverket-granskning kan bli publik',
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

  return {
    gameEvents,
    inboxItems,
    updatedMecenater,
    lastEconomicStressRound,
    wageBudgetOverrunRounds,
    wageBudgetWarningSent,
    riskySponsorOfferSentThisSeason,
    patronWithdrawnSeason,
  }
}

// ── Mecenat spawn ─────────────────────────────────────────────────────────

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
  const withdrawnSeason = game.patronWithdrawnSeason
  if (withdrawnSeason !== undefined && game.currentSeason <= withdrawnSeason + 2) {
    return { updatedMecenater, newEvents: [] }
  }
  const cs = game.communityStanding ?? 50
  const rep = postTransferClubs.find(c => c.id === game.managedClubId)?.reputation ?? 50
  const activeMecenater = updatedMecenater.filter(m => m.isActive)
  const maxMecenater = cs >= 85 ? 3 : cs >= 70 ? 2 : 1
  const alreadySpawnedThisSeason = updatedMecenater.some(m => m.arrivedSeason === game.currentSeason)

  if (
    cs >= 65 &&
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
