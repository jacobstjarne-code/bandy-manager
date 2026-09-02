/**
 * deferredRolloverService — HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md),
 * §"Rollover — aldrig tyst".
 *
 * ROTORSAK till att filen finns: `deferredDecisions: []` i seasonEndProcessor.ts
 * (2026-08-17) löste en RIKTIG bugg — gamla säsongens undanträngda kort surfade
 * i säsong N+1, daterade och kontextuellt fel. Men den löste den genom att
 * radera kön, inte genom att avsluta besluten. Domen förbjuder engros-
 * nollställningen: "Vid rollover får varje obesvarat beslut ANTINGEN ett
 * dokumenterat default-utfall (tillämpat + EN inboxrad) ELLER en uttrycklig
 * utrinning." Slutläget är detsamma (tom kö, inget läckage), men varje post
 * lämnar ett spår efter sig.
 *
 * Måste-nivån (kontraktsdeadline, licenskrav) kan aldrig hamna här — den är
 * undantagen throttlen och defereras aldrig (decisionTierService.ts,
 * roundProcessor.ts:s KF3-block). Passet rör alltså bara månad/bakgrund.
 *
 * DEFAULT-UTFALLETS POLICY är medvetet konservativ: ett obesvarat beslut får
 * bara ett tillämpat utfall när eventet självt erbjuder ett "håll ställningen"-
 * alternativ, dvs ett val med `effect.type === 'noOp'`. Samma konvention som
 * scripts/stress/fixtures.ts:s autoResolvePendingEvents redan använder, och av
 * samma skäl: noOp är det avsiktliga avböj-/avvakta-alternativet på nästan
 * varje event kodbasen genererar, och därmed det utfall med minst och mest
 * förutsägbar fotavtryck att tillämpa åt en spelare som aldrig svarade.
 * transferBidReceived har inget noOp (accept/counter/reject) och får därför
 * en egen deklarerad policy: avslå — dess håll-ställningen-val. Allt annat
 * rinner ut, uttryckligen.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent, GameEventType, EventChoice } from '../entities/GameEvent'
import type { InboxItem } from '../entities/Inbox'
import { InboxItemType } from '../enums'
import { resolveEvent } from './events/eventResolver'
import { getDeferredResolvedText, getDeferredExpiredText } from '../data/deferredRolloverText'

/**
 * Per-typ-deklarationen domen kräver ("Varje defererbart event måste alltså
 * deklarera sitt default-utfall"). Full Record, inte Partial — en ny
 * GameEventType kompilerar inte förrän den fått en rad här.
 *
 *  'decline'   — tillämpa eventets `noOp`-val om det finns, annars utrinning.
 *  'rejectBid' — tillämpa eventets `rejectTransfer`-val (transferBidReceived
 *                saknar noOp; att falla tillbaka på choices[0] hade ACCEPTERAT
 *                budet, samma fälla som fixtures.ts gick i 2026-08-30 och
 *                dränerade en trupp under 11 spelare).
 *  'expire'    — inget försvarbart tyst utfall finns; rinner ut uttryckligen.
 */
export type RolloverPolicy = 'decline' | 'rejectBid' | 'expire'

export const ROLLOVER_POLICY_BY_TYPE: Record<GameEventType, RolloverPolicy> = {
  // Måste — kan aldrig deferreras, raden finns bara för täckningsgrinden.
  // Skulle en framtida ändring ändå släppa in dem: aldrig ett tyst utfall.
  contractRequest: 'expire',
  licenseHandlingsplan: 'expire',
  // DOM_BURNOUT_TAK_2026-09-02: tier är 'month' (flaggat, ej ännu 'must' —
  // se decisionTierService.ts), men samma "ska aldrig faktiskt nå rollover"-
  // avsikt. expire = tyst noOp om det ändå händer, aldrig ett gissat val.
  burnoutCeiling: 'expire',

  // Bud — eget håll-ställningen-val (avslå), inget noOp finns.
  transferBidReceived: 'rejectBid',

  // Sponsor/mecenat/patron/kommun/anläggning: typer med ett faktiskt noOp-val.
  sponsorOffer: 'decline',
  riskySponsorOffer: 'decline',
  icaMaxiEvent: 'decline',
  patronEvent: 'decline',
  patronWithdrawal: 'decline',
  mecenatEvent: 'decline',
  mecenatInteraction: 'decline',
  mecenatDinner: 'decline',
  mecenatWithdrawal: 'decline',
  hallDebate: 'decline',
  hallProcess: 'decline',
  politicianEvent: 'decline',
  academyEvent: 'decline',
  // ANSPRÅK 4, spak 3: eventet bär ett uttryckligt 'decline'-val med
  // effect.type === 'noOp' ("låt den stå kvar sliten"). Ett obesvarat
  // förnyelsebeslut ska landa där, inte rinna ut tyst — utfallet är ändå
  // synligt nästa säsong, som en aktivitet som fortsatt tappa effekt.
  communityActivityRenewal: 'decline',

  // Kommunmötets, gentjänstens, patronens inflytandekorts och spöksponsorns
  // val är ställningstaganden med state-effekt. Det finns inget neutralt svar
  // som rollover får välja åt spelaren.
  kommunMote: 'expire',
  gentjanst: 'expire',
  patronInfluence: 'expire',
  spoksponsor: 'expire',

  // Ekonomi/trupp: avvakta om eventet erbjuder det.
  economicStress: 'decline',
  bidWar: 'decline',
  hesitantPlayer: 'decline',
  playerUnhappy: 'decline',
  burnoutRelief: 'decline',
  dayJobConflict: 'decline',

  // Ingen tyst väg ut — en kris, ett varsel, ett omöjligt val eller ett
  // slutspelskort som aldrig besvarades ska SÄGAS att det rann ut, inte
  // avfärdas med ett "vi avvaktade".
  criticalEconomy: 'expire',
  varsel: 'expire',
  detOmojligaValet: 'expire',
  playoffEvent: 'expire',

  // Bakgrund: kulör och småval. Avböj där det går, annars utrinning.
  pressConference: 'decline',
  csPress: 'decline',
  // Både accept och decline ändrar state; inget neutralt noOp finns.
  journalistExclusive: 'expire',
  mediaReaction: 'decline',
  // Alla tre svar ändrar den namngivna spelarens moral. Det finns inget
  // neutralt noOp som rollover får välja åt spelaren.
  playerMediaComment: 'expire',
  communityEvent: 'decline',
  // Klackeventens samtliga val ändrar state; inget neutralt noOp finns.
  supporterEvent: 'expire',
  fanLetter: 'decline',
  // Alla val sparar ett faktiskt brev/svar; inget är ett neutralt noOp som
  // kan väljas åt spelaren. Ett obesvarat brev rinner därför ut.
  bandyLetter: 'expire',
  opponentQuote: 'decline',
  starPerformance: 'decline',
  playerPraise: 'decline',
  captainSpeech: 'decline',
  // De levande playerArc-undertyperna saknar neutralt noOp-val; resolverns
  // arc-beslut får aldrig väljas åt spelaren över en säsongsgräns.
  playerArc: 'expire',
  // Varje val skriver en specifik intervju till historiken; inget neutralt
  // svar finns som rollover får välja åt spelaren.
  schoolAssignment: 'expire',
  refereeMeeting: 'decline',
  retirementCeremony: 'expire',
  seasonGoalHalfway: 'decline',
  playThroughInjury: 'expire',
}

export function getRolloverPolicy(type: GameEventType): RolloverPolicy {
  return ROLLOVER_POLICY_BY_TYPE[type] ?? 'expire'
}

/**
 * Default-utfallet för EN konkret instans, eller null om ingen finns.
 * Policyn är per typ; vilket val den landar i är per instans (samma event-typ
 * kan sakna sitt noOp-val i en viss variant).
 */
export function getDefaultRolloverChoice(event: GameEvent): EventChoice | null {
  if ((event.choices?.length ?? 0) === 0) return null
  switch (getRolloverPolicy(event.type)) {
    case 'rejectBid':
      return event.choices.find(c => c.effect?.type === 'rejectTransfer') ?? null
    case 'decline':
      return event.choices.find(c => c.effect?.type === 'noOp') ?? null
    case 'expire':
      return null
  }
}

export type DeferredRolloverKind = 'resolved' | 'expired'

export interface DeferredRolloverOutcome {
  eventId: string
  type: GameEventType
  kind: DeferredRolloverKind
  /** Satt bara för kind === 'resolved'. */
  choiceId?: string
  chosenLabel?: string
}

export interface DeferredRolloverResult {
  game: SaveGame
  outcomes: DeferredRolloverOutcome[]
  inboxItems: InboxItem[]
}

/**
 * Kör resolve-or-expire-passet över `deferred` mot `game` (den redan
 * rollade-över säsong N+1-staten). Returnerar spelet med default-utfallen
 * tillämpade, EN inboxpost per post i kön, och en strukturerad utfallslista
 * (testbar utan att läsa text).
 *
 * `game.deferredDecisions` rörs INTE här — anropsstället (seasonEndProcessor.ts)
 * sätter den till [] i samma rollover-objekt. Slutläget är alltså detsamma som
 * före HIGH 11: tom kö, inget läckage till säsong N+1 (regressionstestet
 * seasonRolloverStaleEvents.test.ts skyddar exakt den garantin).
 *
 * @param seasonThatEnded säsongen besluten hörde till (för inbox-id och text).
 */
export function resolveDeferredAtRollover(
  game: SaveGame,
  deferred: GameEvent[],
  seasonThatEnded: number,
  rand: () => number = Math.random,
): DeferredRolloverResult {
  let g = game
  const outcomes: DeferredRolloverOutcome[] = []
  const inboxItems: InboxItem[] = []

  for (const event of deferred) {
    const choice = getDefaultRolloverChoice(event)

    if (choice) {
      // resolveEvent slår upp eventet i pendingEvents — injicera temporärt,
      // resolvera, städa bort. Samma mönster som transferActions.ts:s
      // syntetiserade kontraktsevent (2026-08), inte en parallell
      // effekttolk: effekterna ska köras av EN motor, inte två.
      const injected: SaveGame = {
        ...g,
        pendingEvents: [...(g.pendingEvents ?? []), { ...event, resolved: false }],
      }
      // HIGH 6 (Jacobs körorder 2026-08-31): rollover väljer choice.id åt
      // spelaren (getDefaultRolloverChoice) — aldrig ett spelar-tryck.
      const afterResolve = resolveEvent(injected, event.id, choice.id, rand, false)
      g = {
        ...afterResolve,
        pendingEvents: (afterResolve.pendingEvents ?? []).filter(e => e.id !== event.id),
      }
      outcomes.push({
        eventId: event.id,
        type: event.type,
        kind: 'resolved',
        choiceId: choice.id,
        chosenLabel: choice.label,
      })
      const text = getDeferredResolvedText({ event, chosenLabel: choice.label, season: seasonThatEnded })
      inboxItems.push({
        id: `inbox_deferred_resolved_${event.id}_${seasonThatEnded}`,
        date: g.currentDate,
        type: InboxItemType.DecisionRollover,
        title: text.title,
        body: text.body,
        isRead: false,
        relatedPlayerId: event.relatedPlayerId,
        relatedClubId: event.relatedClubId,
      })
      continue
    }

    outcomes.push({ eventId: event.id, type: event.type, kind: 'expired' })
    const text = getDeferredExpiredText({ event, season: seasonThatEnded })
    inboxItems.push({
      id: `inbox_deferred_expired_${event.id}_${seasonThatEnded}`,
      date: g.currentDate,
      type: InboxItemType.DecisionRollover,
      title: text.title,
      body: text.body,
      isRead: false,
      relatedPlayerId: event.relatedPlayerId,
      relatedClubId: event.relatedClubId,
    })
  }

  return { game: g, outcomes, inboxItems }
}
