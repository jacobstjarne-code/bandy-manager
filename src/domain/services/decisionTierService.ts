/**
 * decisionTierService — HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md).
 *
 * "Tre nivåer i stället för en kö. Nivån är en TAGG på varje beslut/event,
 * satt vid generering." Den här filen äger de tre axlarna domen inför:
 *
 *   1. TIER  (must/month/background) — NÄR och VAR beslutet surfar.
 *   2. MODE  (notis/dilemma/brytpunkt) — HUR kortet ser ut.
 *   3. Visningsregeln — högst ETT primärt + ETT batchat sekundärt kort.
 *
 * SKILD AXEL FRÅN EventPriority (GameEvent.ts). getEventPriority() rörs inte:
 * den styr köordning och overlay-vs-inline (eventQueueService.ts) och
 * klassificerar på en annan grund. Ett 'low'-prioriterat licenskrav är
 * 'must'; ett 'critical'-prioriterat playerUnhappy är 'month'. Att slå ihop
 * dem hade tvingat fram en gemensam ordning som ingen av de två axlarna
 * faktiskt har.
 *
 * SKILD ÄVEN FRÅN systemhandelseBudgetOk (narrativeLogService.ts) — den
 * spärren räknar KADENS (hur ofta systemhändelser får förekomma per säsong,
 * läser narrativeBeatLog). Throttlen här räknar SAMTIDIGHET (hur många beslut
 * spelaren har framför sig just nu, läser pendingEvents/deferredDecisions).
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent, GameEventType, DecisionTier, DecisionMode } from '../entities/GameEvent'

// ── 1. TIER ────────────────────────────────────────────────────────────────

/**
 * Full Record (inte Partial) — TypeScript kräver då att varje ny
 * GameEventType klassificeras här innan den kompilerar. Samma
 * byggtids-täckningsgrind som contentContract.ts:s AssertNoMissingIds, fast
 * gratis via Record-typen.
 *
 * MÅSTE-MEDLEMSKAPET ÄR STÄNGT (Jacobs dom i domen, ordagrant:
 * "Medlemskap (Jacobs dom): kontraktsdeadline och licenskrav/handlingsplan").
 * Utökad 2026-09-02 (DOM_BURNOUT_TAK, Jacobs MUST-TIER-BESLUT) med en tredje
 * medlem, burnoutCeiling — samma logik: ett beslut som INTE går att skjuta.
 * Utöka ALDRIG listan på känsla — en ny måste-medlem är Jacobs beslut, inte
 * en klassificeringsfråga.
 *
 * Rubriken för de två andra (domen §2/§3 + HIGH 11-ordern):
 *   month      = sponsor / mecenat / anläggning / civilt-institutionellt
 *                (kommun, politiker, hall-/licensprocess, mecenatmiddag) +
 *                de ekonomi- och trupp-beslut som bär verklig pengar-/
 *                truppkonsekvens och därför måste SYNAS, om än inte idag.
 *   background = press/media / orts-kulör / småval / motståndarkulör.
 */
export const DECISION_TIER_BY_TYPE: Record<GameEventType, DecisionTier> = {
  // ── MÅSTE (stängd lista, Jacobs dom) ────────────────────────────────────
  contractRequest: 'must',
  licenseHandlingsplan: 'must',
  // DOM_BURNOUT_TAK_2026-09-02, MUST-TIER-BESLUT (Jacob 2026-09-02): tredje
  // måste-medlemmen. Domen slår fast att burnoutCeiling är "ett beslut som
  // INTE går att skjuta" — must-tier är koden som matchar den domen, inte
  // en känsla-klassificering. Ersätter den tidigare 'month'-flaggningen.
  burnoutCeiling: 'must',

  // ── DENNA MÅNAD ─────────────────────────────────────────────────────────
  // Sponsor
  sponsorOffer: 'month',
  riskySponsorOffer: 'month',
  icaMaxiEvent: 'month',
  spoksponsor: 'month',
  // Mecenat/patron
  patronEvent: 'month',
  patronInfluence: 'month',
  patronWithdrawal: 'month',
  mecenatEvent: 'month',
  mecenatInteraction: 'month',
  mecenatDinner: 'month',
  mecenatWithdrawal: 'month',
  // Anläggning + civilt/institutionellt
  hallDebate: 'month',
  hallProcess: 'month',
  kommunMote: 'month',
  politicianEvent: 'month',
  gentjanst: 'month',
  academyEvent: 'month',
  academyDecision: 'month',
  // ANSPRÅK 4, spak 3 (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md).
  // Domen skriver "'denna månad'-nivå för normalt, 'måste'-nivå bara om CS är
  // på väg under en uttågströskel" — den villkorade halvan är INTE byggd, och
  // ska inte byggas härifrån: måste-medlemskapet är stängt på TYP-nivå (se
  // rubriken ovan) och tier saknar per-instans-åsidosättande (till skillnad
  // från mode/priority). En villkorad eskalering kräver ett arkitekturbeslut
  // av Jacob (ett `tier?`-fält på GameEvent, analogt med `mode?`, eller något
  // annat) — flaggat, inte kringgått. Statiskt 'month' är rätt tills dess.
  communityActivityRenewal: 'month',
  // Ekonomi (pengar-konsekvens — syns, väntar begripligt)
  economicStress: 'month',
  criticalEconomy: 'month',
  varsel: 'month',
  // Trupp/kontraktsekonomi med verklig konsekvens (inte kulör)
  transferBidReceived: 'month',
  bidWar: 'month',
  hesitantPlayer: 'month',
  playerUnhappy: 'month',
  detOmojligaValet: 'month',
  // Slutspelets Fokusera-kort — en verklig, tidsbunden matchförberedelse.
  // Bedömningsfråga (domen nämner den inte): den är varken sponsor/anläggning
  // eller press/kulör. Bakgrund hade dolt hela slutspelsvalet, vilket vore en
  // regression av en byggd yta — därför månad. Se rapporten.
  playoffEvent: 'month',
  // Tränarens egen utbrändhetslättnad (HIGH 10-bågen). Bedömningsfråga:
  // personlig, men det ENDA stället bågens andra halva kan besvaras — som
  // bakgrund hade den aldrig nått spelaren. Se rapporten.
  burnoutRelief: 'month',

  // ── BAKGRUND ────────────────────────────────────────────────────────────
  // Press/media
  pressConference: 'background',
  csPress: 'background',
  journalistExclusive: 'background',
  playerMediaComment: 'background',
  // Orten/klacken
  communityEvent: 'background',
  supporterEvent: 'background',
  fanLetter: 'background',
  bandyLetter: 'background',
  // Motståndarkulör
  opponentQuote: 'background',
  // Spelarkulör + småval
  starPerformance: 'background',
  playerPraise: 'background',
  captainSpeech: 'background',
  playerArc: 'background',
  dayJobConflict: 'background',
  schoolAssignment: 'background',
  refereeMeeting: 'background',
  retirementCeremony: 'background',
  seasonGoalHalfway: 'background',
  // Skada-som-kräver-beslut hör enligt domen till uppställningsflödet, inte
  // dashboardens beslutsyta ("Skada-som-kräver-laguppställning hör INTE hit").
  playThroughInjury: 'background',
}

export function getDecisionTier(type: GameEventType): DecisionTier {
  return DECISION_TIER_BY_TYPE[type]
}

/** Nivån för ett konkret event. Tier har (till skillnad från mode) inget
 *  per-instans-åsidosättande — måste-medlemskapet är stängt på TYP-nivå. */
export function getEventDecisionTier(event: Pick<GameEvent, 'type'>): DecisionTier {
  return getDecisionTier(event.type)
}

/** Sant för de två måste-typerna. Den enda grinden som får undanta ett event
 *  från throttlen (decisionBudgetService.ts, roundProcessor.ts:s KF3-block). */
export function isMustDecision(event: Pick<GameEvent, 'type'>): boolean {
  return getEventDecisionTier(event) === 'must'
}

// ── 2. MODE ────────────────────────────────────────────────────────────────

/**
 * Typ-nivåns default-läge. NY funktion — getEventPriority() återanvänds inte
 * och ändras inte (domen: "Tier styr NÄR/VAR kortet surfar; nivån styr HUR
 * det ser ut").
 *
 * Regeln bakom tabellen:
 *   notis      = bakgrundens register (kulör, notiser, småval).
 *   dilemma    = ett verkligt val med två försvarbara sidor (default-vikten,
 *                identisk med hur korten ser ut idag).
 *   brytpunkt  = ett ögonblick som vänder något: licens, konkursnära ekonomi,
 *                ett varsel, en mecenat/patron som drar sig ur, det omöjliga
 *                valet, en legends avsked.
 */
export const DECISION_MODE_BY_TYPE: Record<GameEventType, DecisionMode> = {
  // brytpunkt
  licenseHandlingsplan: 'brytpunkt',
  criticalEconomy: 'brytpunkt',
  detOmojligaValet: 'brytpunkt',
  varsel: 'brytpunkt',
  mecenatWithdrawal: 'brytpunkt',
  patronWithdrawal: 'brytpunkt',
  retirementCeremony: 'brytpunkt',
  burnoutCeiling: 'brytpunkt',

  // dilemma
  contractRequest: 'dilemma',
  transferBidReceived: 'dilemma',
  bidWar: 'dilemma',
  hesitantPlayer: 'dilemma',
  playerUnhappy: 'dilemma',
  sponsorOffer: 'dilemma',
  riskySponsorOffer: 'dilemma',
  icaMaxiEvent: 'dilemma',
  spoksponsor: 'dilemma',
  patronEvent: 'dilemma',
  patronInfluence: 'dilemma',
  mecenatEvent: 'dilemma',
  mecenatInteraction: 'dilemma',
  mecenatDinner: 'dilemma',
  hallDebate: 'dilemma',
  hallProcess: 'dilemma',
  kommunMote: 'dilemma',
  politicianEvent: 'dilemma',
  gentjanst: 'dilemma',
  academyDecision: 'dilemma',
  economicStress: 'dilemma',
  playThroughInjury: 'dilemma',
  burnoutRelief: 'dilemma',
  dayJobConflict: 'dilemma',
  // Två försvarbara sidor: pengarna till nästa nyhet är pengar som inte går
  // till truppen — eller så låter man orten tröttna. Domens egen inramning.
  communityActivityRenewal: 'dilemma',

  // notis
  pressConference: 'notis',
  csPress: 'notis',
  journalistExclusive: 'notis',
  playerMediaComment: 'notis',
  communityEvent: 'notis',
  supporterEvent: 'notis',
  fanLetter: 'notis',
  bandyLetter: 'notis',
  opponentQuote: 'notis',
  starPerformance: 'notis',
  playerPraise: 'notis',
  captainSpeech: 'notis',
  playerArc: 'notis',
  schoolAssignment: 'notis',
  refereeMeeting: 'notis',
  seasonGoalHalfway: 'notis',
  // Enknappskvitteringar av redan inträffade fakta, utan state-effekt.
  // De ska surfa på month-ytan men är inte tvåsidiga dilemman.
  academyEvent: 'notis',
  playoffEvent: 'notis',
}

export function getDecisionMode(type: GameEventType): DecisionMode {
  return DECISION_MODE_BY_TYPE[type]
}

/** Per-instans före typ — samma prioritetsordning som getEffectiveWhyNowLine
 *  (contentContract.ts) och getEffectivePriority (eventQueueService.ts). */
export function getEffectiveDecisionMode(event: Pick<GameEvent, 'type' | 'mode'>): DecisionMode {
  return event.mode ?? getDecisionMode(event.type)
}

// ── 3. VISNINGSREGELN ──────────────────────────────────────────────────────

export interface DashboardDecisionSelection {
  /** Det enda primära beslutskortet: översta måste, annars översta månad. */
  primary: GameEvent | null
  /** Resten av de synliga månads-besluten — batchas till ETT sekundärt kort
   *  med räkning ("3 väntar"), aldrig som egna likvärdiga kort. */
  batched: GameEvent[]
}

/** Ett beslut kräver ett svar först när det har val. Ambienta event (D1
 *  punkt 2) räknas aldrig som beslut och får aldrig ett beslutskort. */
function isActionable(event: GameEvent): boolean {
  return !event.resolved && (event.choices?.length ?? 0) > 0
}

/**
 * Måste-ordningen: tidigast frist först, därefter köordning (FIFO). Vid två
 * samtidiga kontraktsfrister vinner den som löper ut först — den andra ligger
 * kvar i pendingEvents (måste defereras aldrig), den är bara inte primär just
 * nu. Event utan deadlineRound sorteras sist bland måsten.
 */
function byDeadlineThenQueueOrder(all: GameEvent[]) {
  return (a: GameEvent, b: GameEvent): number => {
    const ad = a.deadlineRound ?? Number.POSITIVE_INFINITY
    const bd = b.deadlineRound ?? Number.POSITIVE_INFINITY
    if (ad !== bd) return ad - bd
    return all.indexOf(a) - all.indexOf(b)
  }
}

/**
 * Domen §Visning, ordagrant: "Högst ETT primärt kort (översta måste, annars
 * översta månad) + ETT batchat sekundärt (resten av månad, räknat). Bakgrund
 * syns inte förrän spelaren går in i respektive system."
 *
 * Ren funktion, inga side effects — hela visningsregeln är testbar utan att
 * rendera ett komponentträd.
 */
export function selectDashboardDecisions(game: SaveGame): DashboardDecisionSelection {
  const actionable = (game.pendingEvents ?? []).filter(isActionable)
  const must = actionable.filter(e => getEventDecisionTier(e) === 'must')
    .sort(byDeadlineThenQueueOrder(actionable))
  // Månadsordning = köordning (FIFO). roundProcessor.ts:s KF3-block lägger
  // redan deferrade beslut FÖRST i pendingEvents, så äldst surfar först.
  const month = actionable.filter(e => getEventDecisionTier(e) === 'month')

  if (must.length > 0) {
    // Ett måste tar primärplatsen; HELA månadskön batchas bakom det.
    return { primary: must[0], batched: month }
  }
  if (month.length > 0) {
    return { primary: month[0], batched: month.slice(1) }
  }
  return { primary: null, batched: [] }
}

// ── 4. MÅSTE-FÖRVARNINGEN (auditens MEDIUM 16) ─────────────────────────────

/**
 * Regelsäsongens sista matchdag — den punkt där rollovern tillämpar
 * kontraktsutgång och licensnämnden gör sin nästa prövning
 * (seasonEndProcessor.ts). buildSeasonCalendar() ger 4 cupdagar + 22
 * ligaomgångar = matchday 1–26; slutspelet ligger på 27+ och är inte en frist
 * för de här två besluten. Fallback 26 när kalendern saknas (äldre sparningar).
 */
export const FALLBACK_SEASON_DEADLINE_MATCHDAY = 26

export function getSeasonDeadlineMatchday(game: Pick<SaveGame, 'seasonCalendar'>): number {
  const calendar = game.seasonCalendar ?? []
  if (calendar.length === 0) return FALLBACK_SEASON_DEADLINE_MATCHDAY
  return calendar[calendar.length - 1].matchday
}

/**
 * Tröskeln för förvarningen. Auditens MEDIUM 16 anger raden ordagrant —
 * "2 kontrakt löper ut om 3 omgångar" — och därmed också tröskeln: tre
 * omgångar kvar är det ögonblick raden ska kunna sägas.
 */
export const MUST_DEADLINE_WARNING_ROUNDS = 3

export interface MustDeadline {
  event: GameEvent
  /** Omgångar kvar till fristen. 0 = sista omgången, negativt filtreras bort. */
  roundsRemaining: number
}

/**
 * Obesvarade måste-beslut vars frist är inom `withinRounds` omgångar,
 * tidigast frist först. Derivationen — inte texten. Raden som visas är Opus
 * (mustDeadlineWarningText.ts).
 */
export function getUpcomingMustDeadlines(
  game: SaveGame,
  withinRounds: number = MUST_DEADLINE_WARNING_ROUNDS,
): MustDeadline[] {
  const currentMatchday = game.currentMatchday ?? 1
  return (game.pendingEvents ?? [])
    .filter(isActionable)
    .filter(e => getEventDecisionTier(e) === 'must')
    .filter(e => e.deadlineRound != null)
    .map(e => ({ event: e, roundsRemaining: (e.deadlineRound as number) - currentMatchday }))
    .filter(d => d.roundsRemaining >= 0 && d.roundsRemaining <= withinRounds)
    .sort((a, b) => a.roundsRemaining - b.roundsRemaining)
}
