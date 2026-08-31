/**
 * communityRenewalService — ANSPRÅK 4, spak 3 (nyhetstretmillen),
 * `docs/DOM_ANSPAK4_TREDJE_SPAK_NYHET_2026-08-29.md`.
 *
 * Den här filen äger tre saker:
 *   1. Vilka aktiviteter som ÄR igång och hur länge de varit klubbens stående
 *      erbjudande (staleness-klockan).
 *   2. Backfyllningen av klockan för state som saknar den — aldrig bakåtdaterad.
 *   3. Förnyelsebeslutet: det synliga valet "betala för nästa nyhet ELLER låt
 *      orten tröttna".
 *
 * Avtrappningskurvan själv bor i communityStandingScaling.ts, hos de två andra
 * anspråk-4-knapparna (getActivityStalenessMultiplier).
 *
 * SKYDDAT (domen), tre saker den här filen medvetet INTE gör:
 *   - Rör aldrig intäktsvägen (economyService.ts:s community-block). Staleness
 *     biter enbart på CS-boosten. Ingen dubbelräkning.
 *   - Förnyelsen HÖJER aldrig communityStanding. Den återställer bara klockan,
 *     dvs. förhindrar den avtrappning som annars hade skett. "Nyhetsinvesteringen
 *     sänker inte CS — den UTEBLIVNA investeringen låter staleness sänka den."
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
