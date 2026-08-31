/**
 * communityRenewalService — ANSPRÅK 4, spak 3 (nyhetstretmillen),
 * `docs/DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md`.
 *
 * Den här filen äger fyra saker:
 *   1. Vilka aktiviteter som ÄR igång och hur länge de varit klubbens stående
 *      erbjudande (staleness-klockan).
 *   2. Backfyllningen av klockan för state som saknar den — aldrig bakåtdaterad.
 *   3. Aggregeringen av per-aktivitets-staleness till klubbens
 *      `ortFreshnessFactor` — det ENDA staleness konsumeras av sedan väg C.
 *   4. Förnyelsebeslutet: det synliga valet "betala för nästa nyhet ELLER låt
 *      orten tröttna".
 *
 * Avtrappningskurvan själv bor i communityStandingScaling.ts, hos de två andra
 * anspråk-4-knapparna (getActivityStalenessMultiplier).
 *
 * ⚠️ VÄG C, 2026-08-31 (Jacobs beslut, DOM …§"VÄG C"): staleness biter INTE
 * längre på communityStanding. D038 mätte att den vägen var tandlös (+0,3 CS
 * för 318 tkr/säsong — volontärbonusen bär hela ortsspaken). Konsekvensen är
 * flyttad till PUBLIKEN: getOrtFreshnessFactor nedan → computeAttendanceRate.
 * communityProcessor.ts:s csBoost-summering är återställd till flata konstanter.
 *
 * SKYDDAT (domen), tre saker den här filen medvetet INTE gör:
 *   - Rör aldrig aktiviteternas INTÄKTSSIDA (economyService.ts:s
 *     communityMatchIncome/communityRoundIncome-block). Freshness biter på
 *     publikandelen, inte på kiosk-/lotteri-kalkylen. Ingen dubbelräkning.
 *   - Förnyelsen HÖJER aldrig communityStanding och aldrig publiken direkt. Den
 *     återställer bara klockan, dvs. förhindrar den avtrappning som annars hade
 *     skett. "Nyhetsinvesteringen sänker inte CS — den UTEBLIVNA investeringen
 *     låter staleness sänka den."
 *   - Genererar aldrig ett beslut för en klubb som inte har någon avtrappning
 *     (rykte ≤ CS_UPKEEP_REP_FLOOR → multiplikator konstant 1,0). Små klubbar
 *     och Survive ser aldrig tretmillen.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { CommunityActivities, CommunityActivitiesSince, StaleableActivityKey } from '../entities/Community'
import type { GameEvent } from '../entities/GameEvent'
import {
  getActivityStalenessMultiplier,
  getActivityRenewalCost,
  ACTIVITY_RENEWAL_TRIGGER_MULTIPLIER,
  ACTIVITY_STALENESS_FLOOR,
  ORT_FRESHNESS_FLOOR,
} from './communityStandingScaling'
import {
  buildRenewalTokens,
  getRenewalTitle,
  getRenewalBody,
  getRenewalChoiceLabel,
  getDeclineChoiceLabel,
} from '../data/communityRenewalText'

/** De nio CS-bärande aktiviteterna, i samma ordning som communityProcessor.ts
 *  summerar dem. `julmarknad`/`vipTent` saknas medvetet — de har ingen csBoost. */
export const STALEABLE_ACTIVITY_KEYS: readonly StaleableActivityKey[] = [
  'kiosk', 'lottery', 'bandyplay', 'functionaries', 'bandySchool',
  'socialMedia', 'pensionarskaffe', 'soppkvall', 'skolbesok',
] as const

/**
 * Varje aktivitets flata csBoost per omgång. Låg HÄRIFRÅN och inte som nio
 * inline-konstanter i communityProcessor.ts sedan väg C (2026-08-31) — den
 * summerar dem, och `getOrtFreshnessFactor` nedan VÄGER med dem. Två kopior av
 * samma nio tal hade kunnat glida isär utan att något test märkte det
 * (CLAUDE.md, "EN SANNING, ETT STÄLLE"). Värdena är oförändrade från D037:s
 * mätta balans — summan är 0,67 CS/omgång med alla nio igång.
 */
export const ACTIVITY_CS_BOOST: Record<StaleableActivityKey, number> = {
  kiosk: 0.08,
  lottery: 0.05,
  bandyplay: 0.08,
  functionaries: 0.05,
  bandySchool: 0.08,
  socialMedia: 0.03,
  pensionarskaffe: 0.10,
  soppkvall: 0.08,
  skolbesok: 0.12,
}

/** Aktiv = samma villkor som csBoost-summeringen använder. kiosk/lottery är
 *  nivåfält ('none' räknas inte), resten är booleaner. */
export function isActivityActive(
  activities: CommunityActivities | undefined,
  key: StaleableActivityKey,
): boolean {
  if (!activities) return false
  if (key === 'kiosk') return !!activities.kiosk && activities.kiosk !== 'none'
  if (key === 'lottery') return !!activities.lottery && activities.lottery !== 'none'
  return !!activities[key]
}

export function getActiveStaleableActivities(
  activities: CommunityActivities | undefined,
): StaleableActivityKey[] {
  return STALEABLE_ACTIVITY_KEYS.filter(k => isActivityActive(activities, k))
}

/**
 * Backfyllning, INTE bakåtdatering: varje AKTIV aktivitet som saknar en
 * startsäsong får `currentSeason`. En spelare som haft kiosken i fem säsonger
 * under det gamla systemet startar alltså på seasonsActive = 0, inte 5.
 *
 * Returnerar SAMMA referens när ingenting behövde läggas till, så anropsstället
 * kan undvika en meningslös state-skrivning varje omgång.
 */
export function backfillActivitiesSince(
  since: CommunityActivitiesSince | undefined,
  activities: CommunityActivities | undefined,
  currentSeason: number,
): CommunityActivitiesSince {
  const base = since ?? {}
  const missing = getActiveStaleableActivities(activities).filter(k => base[k] === undefined)
  if (missing.length === 0 && since !== undefined) return since
  const next: CommunityActivitiesSince = { ...base }
  for (const k of missing) next[k] = currentSeason
  return next
}

/** Antal hela säsonger aktiviteten varit oförändrad. Saknad klocka → 0 (nyss
 *  backfylld), aldrig negativt (ett save där klockan ligger framåt i tiden ska
 *  ge full effekt, inte en negativ exponent). */
export function getSeasonsActive(
  since: CommunityActivitiesSince | undefined,
  key: StaleableActivityKey,
  currentSeason: number,
): number {
  const startedSeason = since?.[key]
  if (startedSeason === undefined) return 0
  return Math.max(0, currentSeason - startedSeason)
}

export interface ActivityStaleness {
  key: StaleableActivityKey
  seasonsActive: number
  /** Andel av aktivitetens flata csBoost som fortfarande biter (0 < m ≤ 1). */
  multiplier: number
}

/** Alla aktiva aktiviteters färskhetsläge, mest sliten först. */
export function getActivityStaleness(
  game: Pick<SaveGame, 'communityActivities' | 'communityActivitiesSince' | 'currentSeason'>,
  reputation: number,
): ActivityStaleness[] {
  return getActiveStaleableActivities(game.communityActivities)
    .map(key => {
      const seasonsActive = getSeasonsActive(game.communityActivitiesSince, key, game.currentSeason)
      return { key, seasonsActive, multiplier: getActivityStalenessMultiplier(seasonsActive, reputation) }
    })
    .sort((a, b) => a.multiplier - b.multiplier)
}

/**
 * VÄG C (DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md, Jacobs beslut
 * 2026-08-31): klubbens samlade FÄRSKHET som den ticketköpande publiken
 * upplever den, ∈ [ORT_FRESHNESS_FLOOR, 1,0]. Multipliceras in i
 * `computeAttendanceRate` (economyService.ts) — det är HELA konsekvensen av
 * staleness sedan CS-vägen revs. En färsk klubb får 1,0 (ingen förlust alls),
 * en klubb som slutat förnya glider mot golvet.
 *
 * AGGREGERINGEN, tre val, alla mätta (D038:s VÄG C-tillägg):
 *
 * 1. VÄGT SNITT, inte enkelt snitt och inte min(). Vikten är aktivitetens egen
 *    csBoost (ACTIVITY_CS_BOOST) — kodbasens ENDA befintliga uttalande om hur
 *    mycket orten bryr sig om respektive grej. Ett skolbesök (0,12) väger
 *    alltså mer än sociala medier (0,03). Att uppfinna en andra, egen
 *    viktvektor för publiksidan hade varit en ny gissning på ett kontinuerligt
 *    fält — exakt felklassen D031 finns för att stoppa. min() förkastades av
 *    motsatt skäl: då hade EN försummad aktivitet av nio kunnat dra hela
 *    klubbens publik till golvet, en vägg snarare än en glidning.
 *
 *    OCH DET ÄR DESSUTOM MÄTT FEL ÅT (2026-08-31, D038:s VÄG C-MÄTNING).
 *    Hypotesen var att ett min()-lutande medel (potensmedel med p < 1) skulle
 *    göra en försummad aktivitet mer kännbar och därmed förnyelsen mer värd.
 *    Det gör tvärtom, och orsaken är strukturell: den klubb som ALDRIG förnyar
 *    har alla nio aktiviteter exakt lika gamla, så VARJE potensmedel returnerar
 *    samma tal för den — dess färskhet är bit-identisk vid p = 1, 0,25, −1 och
 *    −4 (uppmätt 0,822 i alla fyra). Den klubb som förnyar har per konstruktion
 *    en trappa av åldrar, och just den träffas av ett min()-lutande medel.
 *    Uppmätt föll den förnyande klubbens färskhet 0,942 → 0,941 → 0,939 → 0,934
 *    när p gick 1 → 0,25 → −1 → −4, dvs. GAPET KRYMPTE och förnyelsen blev
 *    sämre affär (−45 125 → −46 487 → −49 153 → −55 647 kr/säsong). Det vägda
 *    aritmetiska medlet (p = 1) är alltså inte bara det disciplinerade valet,
 *    det är också det mätt bästa. Rör det inte.
 *
 * 2. OMSKALAD till [ORT_FRESHNESS_FLOOR, 1]. Per-aktivitets-multiplikatorn bor
 *    i [ACTIVITY_STALENESS_FLOOR, 1] = [0,25, 1]. Att låta den träffa publiken
 *    rakt av hade betytt −75 % publik för en klubb som slutat förnya, dvs. en
 *    kollaps — domens SKYDDAT förbjuder det uttryckligen. Omskalningen är
 *    linjär och bevarar ändpunkterna: helt färsk → exakt 1,0, helt sliten →
 *    exakt golvet.
 *
 * 3. NOLL AKTIVA AKTIVITETER → 1,0. Ingen staleness existerar att erodera. En
 *    klubb som aldrig startat något ortsprogram har ingenting orten kan tröttna
 *    PÅ; den förlorar redan publik den andra vägen (aktiviteternas
 *    CS-bidrag → ATTENDANCE_STANDING_WEIGHT). Vore golvet 1,0 → t.ex. 0,65 här
 *    hade mekaniken straffat att ALDRIG göra något hårdare än att göra något
 *    och sluta förnya.
 *
 * Små klubbar/Survive: vid rykte ≤ CS_UPKEEP_REP_FLOOR är varje
 * per-aktivitets-multiplikator exakt 1,0 (retention 1,0 ⇒ 1^s = 1), alltså är
 * snittet 1,0, alltså är faktorn exakt 1,0. Garanterat av formen, inte av ett
 * villkor någon kan glömma — samma disciplin som knapp 1 och 2.
 */
export function getOrtFreshnessFactor(
  game: Pick<SaveGame, 'communityActivities' | 'communityActivitiesSince' | 'currentSeason'>,
  reputation: number,
): number {
  const list = getActivityStaleness(game, reputation)
  if (list.length === 0) return 1

  let weightedSum = 0
  let weightTotal = 0
  for (const a of list) {
    const w = ACTIVITY_CS_BOOST[a.key]
    weightedSum += w * a.multiplier
    weightTotal += w
  }
  if (weightTotal <= 0) return 1

  const meanMultiplier = weightedSum / weightTotal              // ∈ [0,25, 1]
  const normalised = (meanMultiplier - ACTIVITY_STALENESS_FLOOR) / (1 - ACTIVITY_STALENESS_FLOOR)
  const clamped = Math.max(0, Math.min(1, normalised))
  return ORT_FRESHNESS_FLOOR + (1 - ORT_FRESHNESS_FLOOR) * clamped
}

// ── Förnyelsebeslutet ──────────────────────────────────────────────────────

export function renewalEventId(key: StaleableActivityKey, season: number, matchday: number): string {
  return `event_community_renewal_${key}_s${season}_r${matchday}`
}

/** Samma id-prefix utan omgång — används för att se om DENNA aktivitet redan
 *  har ett obesvarat eller besvarat förnyelsebeslut denna säsong. */
function renewalKeyPrefix(key: StaleableActivityKey, season: number): string {
  return `event_community_renewal_${key}_s${season}_`
}

/**
 * Domens "synliga val, inte dränering". Genererar HÖGST ett beslut per anrop —
 * den mest slitna aktiviteten som (a) faktiskt tappat effekt, (b) inte redan
 * fått ett beslut denna säsong, och (c) klubben har råd att förnya.
 *
 * Råd-villkoret (c) är medvetet: ett kort som erbjuder en kostnad klubben inte
 * kan betala är inte ett val, det är en pekpinne. En klubb utan pengar får
 * alltså inte kortet, och aktiviteten fortsätter tappa — vilket ÄR den andra
 * sidan av valet, bara utan en knapp att trycka på.
 *
 * Frekvensspärren ligger UTANFÖR den här funktionen (source cooldown 'orten' +
 * decisionBudget, eventProcessor.ts) — samma mönster som burnoutRelief och
 * mecenatens middag.
 */
export function generateCommunityRenewalEvent(
  game: SaveGame,
  matchday: number,
): GameEvent | null {
  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return null

  const season = game.currentSeason
  const alreadySeen = new Set([
    ...(game.pendingEvents ?? []).map(e => e.id),
    ...(game.deferredDecisions ?? []).map(e => e.id),
    ...(game.resolvedEventIds ?? []),
  ])

  const candidates = getActivityStaleness(game, club.reputation)
    .filter(s => s.multiplier <= ACTIVITY_RENEWAL_TRIGGER_MULTIPLIER)
    .filter(s => ![...alreadySeen].some(id => id.startsWith(renewalKeyPrefix(s.key, season))))

  const cost = getActivityRenewalCost(club.reputation)
  if (club.finances < cost) return null

  const target = candidates[0]
  if (!target) return null

  const tokens = buildRenewalTokens(target.key, cost, target.seasonsActive, target.multiplier)

  return {
    id: renewalEventId(target.key, season, matchday),
    type: 'communityActivityRenewal',
    // TOM tills Opus levererar (communityRenewalText.ts). Code skriver aldrig
    // svensk speltext — hellre ett kort utan text i 24h än fel ton permanent.
    title: getRenewalTitle(tokens),
    body: getRenewalBody(tokens),
    choices: [
      {
        id: 'renew',
        label: getRenewalChoiceLabel(tokens),
        consequenceLevel: 'costly',
        costLabel: `Kostar ${tokens.cost}`,
        effect: {
          type: 'renewCommunityActivity',
          communityKey: target.key,
          amount: -cost,
        },
      },
      {
        // Uttryckligt "låt den stå kvar sliten" — aldrig ett implicit utfall.
        // noOp gör dessutom att rollover-policyn ('decline', deferredRolloverService.ts)
        // har ett val att tillämpa om beslutet aldrig besvaras.
        id: 'decline',
        label: getDeclineChoiceLabel(tokens),
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}
