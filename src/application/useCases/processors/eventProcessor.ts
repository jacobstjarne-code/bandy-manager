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

// ── Lager 2 text ───────────────────────────────────────────────────────────

const WAGE_OVERRUN_WARNING_TEXT = [
  {
    title: 'Licensnämnden: Formell varning',
    body: 'Licensnämnden har noterat att {KLUBB}s lönekostnader överstiger budgeten med mer än 20%. Detta är en formell varning. Om förhållandet kvarstår vid säsongsslut kommer åtgärder att övervägas.',
  },
  {
    title: 'RF:s licensnämnd kräver plan',
    body: 'RF:s licensnämnd skriver till klubben: "Vi har granskat {KLUBB}s ekonomiska redovisning för innevarande säsong. Lönebudgeten är överskriden. Vi förväntar oss en plan för återställning inom fyra veckor."',
  },
  {
    title: 'Licensnämnden: Krav på åtgärd',
    body: '"Det är inte en fråga om huruvida ni har råd just nu", står det i brevet från Licensnämnden. "Det är en fråga om hur ni planerar er verksamhet långsiktigt. Vi vill se en plan."',
  },
]

const WAGE_OVERRUN_DEDUCTION_TEXT = [
  {
    title: 'Licensnämnden: −2 poäng nästa säsong',
    body: 'Licensnämnden har beslutat: {KLUBB} får ett avdrag på 2 poäng inför nästa säsong. Beslutet är slutgiltigt och kan inte överklagas. Lönebudgeten är fortsatt överskriden — fortsätter det blir det större.',
  },
  {
    title: 'Poängavdrag bekräftat — {KLUBB} −2',
    body: 'Två poäng dras inför nästa säsong. Det står i beslutet från Licensnämnden. "Klubben har inte följt sina egna ekonomiska planer", skriver de. "Detta är konsekvensen."',
  },
  {
    title: 'Licensnämnden verkställer: −2 poäng',
    body: 'Det blev konkret. Två poäng. Ordföranden samlar styrelsen för krismöte. "Vi måste bestämma vad som ska bort", säger han. "För något ska bort."',
  },
]

const RISKY_SPONSOR_OFFERS = [
  {
    name: 'Borgvik Bygg AB',
    category: 'Bygg & Fastighet',
    weeklyIncome: 550,      // ≈ 12 000 kr/säsong
    title: 'Borgvik Bygg AB erbjuder marknadsavtal — 12 000/säsong',
    body: 'Borgvik Bygg AB erbjuder marknadsavtal med {KLUBB} på 12 000 per säsong i tre säsonger. VD:n nämner i samtal att företaget "går igenom en granskning från Skatteverket men det är rutin". Avtalet är klart att skriva på.',
    acceptLabel: 'Acceptera (12 000 kr/säsong)',
    risk: '⚠️ Risk: Skatteverket-granskning kan bli publik',
  },
  {
    name: 'Nordström Logistik AB',
    category: 'Logistik & Transport',
    weeklyIncome: 365,      // ≈ 8 000 kr/säsong
    title: 'Nordström Logistik AB vill bli sponsor — 8 000/säsong',
    body: 'Nordström Logistik AB hör av sig genom sin nytillträdde VD. Företaget är okänt på orten men har god kontakt med tre andra klubbar i regionen. VD:n vill träffas snart. Hans bakgrund finns inte på företagets hemsida ännu.',
    acceptLabel: 'Acceptera (8 000 kr/säsong)',
    risk: '⚠️ Risk: Okänt bolag med oklar bakgrund',
  },
  {
    name: 'Hellström & Co',
    category: 'Konsult',
    weeklyIncome: 680,      // ≈ 15 000 kr/säsong
    title: 'Hellström & Co — kontakt via gemensam vän — 15 000/säsong',
    body: '"Vi har gemensamma bekanta", står det i mejlet från Hellström & Co. Företaget vill betala 15 000 per säsong i marknadsavtal. När du frågar vilka bekanta blir svaret "det är en småstad". Det stämmer, men du har ingen aning om vem de menar.',
    acceptLabel: 'Acceptera (15 000 kr/säsong)',
    risk: '⚠️ Risk: Oklar koppling, inga references',
  },
  {
    name: 'Lindström Holdings',
    category: 'Holding',
    weeklyIncome: 910,      // ≈ 20 000 kr/säsong
    title: 'Lindström Holdings: 20 000 i förskott — direkt avtal',
    body: 'Lindström Holdings erbjuder 20 000 i förskott för ett tre års marknadsavtal. "Inga byråkratiska processer", skriver han, "vi vill bara stötta lokal idrott". Beloppet är osedvanligt högt. Bolaget registrerades för fyra månader sedan.',
    acceptLabel: 'Acceptera (20 000 kr/säsong)',
    risk: '⚠️ Risk: Nystartat bolag, osedvanligt högt belopp',
  },
]

const MECENAT_WITHDRAWAL_TEXT: Record<string, { title: string; body: string }> = {
  kontrollfreak: {
    title: '{MECENAT} drar sig ur',
    body: '{MECENAT} ringer. Tonen är iskall.\n\n"Du har ignorerat mig tre gånger nu. Det är tydligt att klubben vill gå sin egen väg. Det är ert val. Men ni får göra det utan mig — och utan de pengar jag investerat i fastighetssidan. Det jag betalat är förbrukat. Det som var planerat dras tillbaka."\n\n{MECENAT} lämnar klubben permanent.',
  },
  filantropen: {
    title: '{MECENAT} avslutar samarbetet',
    body: '{MECENAT} ber om ett möte. Det är inte ilska i rösten, det är besvikelse — vilket är värre.\n\n"Jag har försökt förstå er. Men ni gör det inte enkelt. Jag drar mig ur det här samarbetet — det fungerar inte att ge när det inte tas emot. Jag önskar er lycka till."\n\n{MECENAT} lämnar permanent. Pengar som var öronmärkta för ungdomssatsningar dras tillbaka.',
  },
  nostalgiker: {
    title: '{MECENAT} tar farväl',
    body: '{MECENAT} sitter på sitt kontor och stirrar ut genom fönstret när du kommer in. Han ser äldre ut än vanligt.\n\n"Jag växte upp med {KLUBB}. Min far gick på matcherna i femtiotalet. Jag har försökt ge tillbaka. Men det måste vara åt båda håll. Jag drar mig tillbaka. Det är inte mot dig. Det är åt mig själv."\n\n{MECENAT} lämnar. Det blir tyst på orten — gamla supportrar tar det här illa.',
  },
}

const MECENAT_WITHDRAWAL_FALLBACK = [
  MECENAT_WITHDRAWAL_TEXT.kontrollfreak,
  MECENAT_WITHDRAWAL_TEXT.filantropen,
  MECENAT_WITHDRAWAL_TEXT.nostalgiker,
]

function pickByIndex<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
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

        const withdrawalTemplate =
          MECENAT_WITHDRAWAL_TEXT[mec.personality] ??
          pickByIndex(MECENAT_WITHDRAWAL_FALLBACK, game.currentSeason)
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
      const wageClubName = managedClub?.name ?? 'Klubben'
      // After 5 rounds: Licensnämnden warning
      if (wageBudgetOverrunRounds >= 5 && !wageBudgetWarningSent) {
        wageBudgetWarningSent = true
        const warnId = `inbox_wage_overrun_warn_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === warnId)) {
          const wt = pickByIndex(WAGE_OVERRUN_WARNING_TEXT, game.currentSeason)
          inboxItems.push({
            id: warnId,
            date: game.currentDate,
            type: InboxItemType.LicenseReview,
            title: `⚠️ ${fillL2Tokens(wt.title, { KLUBB: wageClubName })}`,
            body: fillL2Tokens(wt.body, { KLUBB: wageClubName }),
            isRead: false,
          } as InboxItem)
        }
      }
      // After 10 rounds: point deduction (stored in pendingPointDeductions for next season)
      if (wageBudgetOverrunRounds >= 10) {
        const deductId = `inbox_wage_deduct_${game.currentSeason}`
        if (!game.inbox.some(i => i.id === deductId)) {
          const dt = pickByIndex(WAGE_OVERRUN_DEDUCTION_TEXT, game.currentSeason + 1)
          inboxItems.push({
            id: deductId,
            date: game.currentDate,
            type: InboxItemType.LicenseReview,
            title: `🚨 ${fillL2Tokens(dt.title, { KLUBB: wageClubName })}`,
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
    const offerVariant = pickByIndex(RISKY_SPONSOR_OFFERS, game.currentSeason + nextMatchday)
    const offerClubName = managedClub?.name ?? 'Klubben'
    const riskySponsor = {
      id: offerId,
      name: offerVariant.name,
      category: offerVariant.category,
      weeklyIncome: offerVariant.weeklyIncome,
      contractRounds: 44,
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
