import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent, GameEventType } from '../entities/GameEvent'
import { isMustDecision } from './decisionTierService'

/**
 * narrativeCoordinatorService — "Centralredaktören"
 * (DOM_CENTRALREDAKTOREN_2026-08-31.md, beställd av människoupplevelse-
 * auditen 2026-08-31: repetition i en framgångsrik säsong 2 — "samma
 * pressfrågor snabbt, gamla svar följer med, två presskanaler samtidigt").
 *
 * Fem okoordinerade system (event-blocket, pressen, sourceCooldownService,
 * uppföljningarna, beat-budgeten) läser inte varandras nyliga historik.
 * DOM:en river dem inte — den lägger ETT beslutslager OVANPÅ, som
 * event-blocket OCH pressgenereringen konsulterar, på det substrat som
 * redan finns (SaveGame.narrativeBeatLog). journalistExclusive (A-H4a) var
 * beviset att koordinering via narrativeBeatLog fungerar — de tre
 * funktionerna här generaliserar exakt det mönstret.
 *
 * Tre uppgifter, tre funktioner:
 *   1. Kanal-exklusivitet  → applySurfacingBudget
 *   2. Innehålls-recency   → recentlySurfaced
 *   3. Subjekts-rotation   → rotateSubject
 *
 * SKYDDAT (domens ord — rör inte): sourceCooldownService, press-eligibility
 * (templateEligibilityService), uppföljningarna (pendingFollowUps) och
 * beat-budgeten (systemhandelseBudgetOk) behåller sin egen mekanik. Den här
 * filen är en koordinator OVANPÅ, inte en ersättning.
 */

// ── 1. Kanal-exklusivitet ────────────────────────────────────────────────

export type SurfacingChannel = 'press' | 'transfer' | 'orten' | 'personal' | 'manager'

/**
 * Kanalindelningen är LÅST (domen §"Kanaler"). Bara typer domen uttryckligen
 * namnger klassificeras — allt annat (playerArc, supporterEvent,
 * academyEvent, playoffEvent, criticalEconomy, refereeMeeting,
 * patronWithdrawal, fanLetter, opponentQuote, seasonGoalHalfway,
 * playThroughInjury, licenseHandlingsplan, icaMaxiEvent, mecenatWithdrawal,
 * varsel, detOmojligaValet, retirementCeremony, economicStress) ligger
 * UTANFÖR koordinatorns stängda scope och passerar filtret opåverkat —
 * samma "SKYDDAT, rör inte"-princip som domens fem system.
 *
 * Verifierat mot faktiska `type:`-värden i fabrikerna, inte mot domens
 * lösa begreppsnamn (som skiljer sig från koden på flera ställen):
 * promotionOffer/shiftConflict sätter båda `type: 'dayJobConflict'`,
 * coworkerBond sätter `type: 'communityEvent'`, mecenatConflict/
 * mecenatAlliance sätter båda `type: 'mecenatEvent'`, mecenatIntervention
 * sätter `type: 'mecenatInteraction'` (se postAdvanceEvents.ts/
 * mecenatService.ts/eventFactories.ts).
 *
 * coworkerBond (`communityEvent`) hör konceptuellt till domens 'personal'
 * enligt uppräkningen, men delar sitt literal-type med det generiska
 * orts-community-systemet (domens 'orten') — koordinatorn kan bara läsa
 * `event.type`, inte vilken generator som byggde eventet, så `communityEvent`
 * klassificeras 'orten' rakt igenom. Dokumenterad avvikelse, inte en gissning
 * som gömts.
 */
export const CHANNEL_BY_EVENT_TYPE: Partial<Record<GameEventType, SurfacingChannel>> = {
  // press
  pressConference: 'press',
  csPress: 'press',
  journalistExclusive: 'press',
  playerMediaComment: 'press',
  // transfer
  transferBidReceived: 'transfer',
  bidWar: 'transfer',
  hesitantPlayer: 'transfer',
  contractRequest: 'transfer',
  // orten
  sponsorOffer: 'orten',
  riskySponsorOffer: 'orten',
  spoksponsor: 'orten',
  mecenatEvent: 'orten',
  mecenatInteraction: 'orten',
  mecenatDinner: 'orten',
  patronEvent: 'orten',
  patronInfluence: 'orten',
  hallDebate: 'orten',
  hallProcess: 'orten',
  kommunMote: 'orten',
  politicianEvent: 'orten',
  gentjanst: 'orten',
  communityEvent: 'orten',
  communityActivityRenewal: 'orten',
  // personal
  playerUnhappy: 'personal',
  starPerformance: 'personal',
  playerPraise: 'personal',
  captainSpeech: 'personal',
  dayJobConflict: 'personal',
  schoolAssignment: 'personal',
  // manager
  burnoutRelief: 'manager',
}

/** Globalt tak per omgång (domens "behåll dagens känsla — >=2 blir dirigentens tak"). */
export const SURFACING_GLOBAL_CAP = 2

/**
 * Undantagna från taket (domen §"Exklusivitet"): systemhandelser (varsel,
 * detOmojligaValet — en gång/säsong, poängen är att de AVBRYTER),
 * retirementCeremony, och HIGH 11:s måste-tier (kontrakts-/licensdeadline,
 * `isMustDecision`, decisionTierService.ts). Sällsynta och pivotala — taket
 * styr återkommande flavor, aldrig det sällsynta viktiga. Ett undantaget
 * event varken förbrukar ett kanal-slot eller det globala taket.
 */
export function isExemptFromSurfacingBudget(event: Pick<GameEvent, 'type' | 'systemhandelse'>): boolean {
  return event.systemhandelse === true || event.type === 'retirementCeremony' || isMustDecision(event)
}

export interface SurfacingBudgetResult {
  kept: GameEvent[]
  dropped: GameEvent[]
}

/**
 * Greedy urval i given (redan prioritetsordnad) ordning: högst en kandidat
 * per kanal, högst SURFACING_GLOBAL_CAP icke-undantagna totalt. Kandidater
 * utanför koordinatorns stängda kanal-scope (se CHANNEL_BY_EVENT_TYPE)
 * passerar opåverkat. Ordningen i `candidates` AVGÖR vem som vinner en
 * kanalkollision — caller ansvarar för prioritetsordningen.
 */
export function applySurfacingBudget(candidates: GameEvent[]): SurfacingBudgetResult {
  const kept: GameEvent[] = []
  const dropped: GameEvent[] = []
  const usedChannels = new Set<SurfacingChannel>()
  let nonExemptCount = 0

  for (const event of candidates) {
    if (isExemptFromSurfacingBudget(event)) {
      kept.push(event)
      continue
    }
    const channel = CHANNEL_BY_EVENT_TYPE[event.type]
    if (!channel) {
      kept.push(event)
      continue
    }
    if (usedChannels.has(channel) || nonExemptCount >= SURFACING_GLOBAL_CAP) {
      dropped.push(event)
      continue
    }
    usedChannels.add(channel)
    nonExemptCount++
    kept.push(event)
  }

  return { kept, dropped }
}

// ── 2. Innehålls-recency ─────────────────────────────────────────────────

/**
 * Generalisering av journalistExclusive-mönstret (isOnCooldown i
 * narrativeLogService.ts är SÄSONGS-skalad; detta är samma idé men
 * OMGÅNGS-skalad — "har semanticKey ytat inom sitt recency-fönster [i
 * omgångar]?"). Startvärden per kanal (domen, mät + D-fact):
 * press 5, personal beat 3. Se RECENCY_WINDOW_BY_CHANNEL.
 */
export function recentlySurfaced(
  game: Pick<SaveGame, 'narrativeBeatLog'>,
  semanticKey: string,
  withinRounds: number,
  currentRound: number,
): boolean {
  const log = game.narrativeBeatLog ?? []
  return log.some(e => e.semanticKey === semanticKey && currentRound - e.round < withinRounds)
}

/**
 * Startvärden 2026-08-31 (domen §"Recency-fönster") — golv att börja från,
 * inte låsta sanningar. orten/manager/transfer saknar egna tal i domen
 * (orten har redan källcooldowns; en extra semanticKey-recency "4 inom en
 * källa" är explicit ANNAT än denna kanal-brett fönster, och byggs INTE
 * här — flaggad i D-fact som ej byggd, inte kringgången i tysthet).
 */
export const RECENCY_WINDOW_BY_CHANNEL: Partial<Record<SurfacingChannel, number>> = {
  press: 5,
  personal: 3,
}

// ── 3. Subjekts-rotation ─────────────────────────────────────────────────

/**
 * Generalisering av pickJournalistExclusiveSubject (postAdvanceEvents.ts,
 * A-H4a). Utesluter de `excludeCount` SENAST figurerade subjekten (senaste
 * distinkta id per semanticKeyPrefix, nyast först) ur poolen; om allt
 * uteslutits (poolen har rullat ett fullt varv) släpper spärren och hela
 * poolen blir valbar igen.
 *
 * excludeCount är den enda skillnaden mellan de två användningsmönstren:
 *   - generiska beats (star-performance/player-praise/media/captain):
 *     min(poolstorlek − 3, K), K = 5 (domen §"Subjekts-rotation") —
 *     garanterar ≥3 färska kandidater.
 *   - journalistExclusive: pool.length (career-brett varv, oförändrat
 *     beteende — domen: "rör inte, det är mallen; peka bara om det till
 *     den delade helpern").
 *
 * Determinismen (domen §"SKYDDAT"): ingen Math.random här — `pickBest`
 * avgör tie-break deterministiskt ur den kvarvarande poolen.
 */
export function rotateSubject<T extends { id: string }>(
  pool: T[],
  semanticKeyPrefix: string,
  game: Pick<SaveGame, 'narrativeBeatLog'>,
  excludeCount: number,
  pickBest: (candidates: T[]) => T,
): T | null {
  if (pool.length === 0) return null

  // round är en säsongslokal axel och nollställs vid rollover. Sortera därför
  // alltid på säsong först; annars ser t.ex. omg 30 förra säsongen nyare ut än
  // omg 2 i den aktuella och fel subjekt spärras av rotationsfönstret.
  const log = [...(game.narrativeBeatLog ?? [])]
    .sort((a, b) => (b.season - a.season) || (b.round - a.round))
  const recentIds: string[] = []
  const seen = new Set<string>()
  for (const e of log) {
    if (!e.semanticKey.startsWith(semanticKeyPrefix)) continue
    const subjectId = e.semanticKey.slice(semanticKeyPrefix.length)
    if (seen.has(subjectId)) continue
    seen.add(subjectId)
    recentIds.push(subjectId)
    if (recentIds.length >= excludeCount) break
  }

  const excludeSet = new Set(recentIds)
  const eligible = pool.filter(p => !excludeSet.has(p.id))
  const candidates = eligible.length > 0 ? eligible : pool
  return pickBest(candidates)
}

/** K = 5 (domen, startvärde 2026-08-31). */
export const SUBJECT_ROTATION_K = 5

export function genericBeatExcludeCount(poolSize: number): number {
  return Math.max(0, Math.min(poolSize - 3, SUBJECT_ROTATION_K))
}
