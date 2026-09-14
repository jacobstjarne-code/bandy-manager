/**
 * Two-season release playtest for the entrance principle.
 *
 * Uses the real new-game, onboarding seed, event resolver, round processor,
 * queue partition and portal builder. Choices are deliberately conservative;
 * the purpose is chronology and load, not balance calibration.
 *
 * Run:
 *   node_modules/.bin/vite-node scripts/playtest-introduction-arcs.ts
 */
import assert from 'node:assert/strict'
import type { GameEvent } from '../src/domain/entities/GameEvent'
import type { SaveGame } from '../src/domain/entities/SaveGame'
import { createNewGame } from '../src/application/useCases/createNewGame'
import { advanceToNextEvent } from '../src/application/useCases/roundProcessor'
import { resolveEvent } from '../src/domain/services/events/eventResolver'
import {
  canEventPassVoiceGate,
  canVoiceSpeak,
  getVoiceEligibleEvents,
  isVoiceIntroduced,
  queueRosterVoiceIntroductions,
  seedTilltradeVoices,
} from '../src/domain/services/voiceIntroductionService'
import {
  applyDecisionBudget,
  getActiveDecisionCount,
  MAX_ACTIVE_DECISIONS,
  promoteFromQueue,
} from '../src/domain/services/decisionBudgetService'
import { buildPortal, makeSeed } from '../src/domain/services/portal/portalBuilder'
import { initCardBag } from '../src/domain/services/portal/initCardBag'
import { autoResolvePendingScreen, autoSelectLineup } from './stress/fixtures'

const START_SEASON = 2026
const TARGET_SEASON = START_SEASON + 2
const CLUB_ID = 'club_malilla' // medium difficulty in the club selector
const SEED = 41

interface Metrics {
  steps: number
  seasonsCompleted: number
  maxActiveDecisions: number
  maxEligibleEventCards: number
  maxPortalSecondary: number
  maxPortalMinimal: number
  introductions: Array<{ voiceId: string; season: number; matchday: number }>
  surfacedVoiceEvents: number
  blockedVoiceEventsObserved: number
  maxUnreadInbox: number
}

function choose(event: GameEvent): string {
  if (event.id.startsWith('event_mecenat_intro_')) return event.choices.find(c => c.id === 'welcome')?.id ?? event.choices[0]?.id ?? ''
  if (event.id.startsWith('patron_emerge_') || event.id.startsWith('patron_intro_')) return event.choices.find(c => c.id === 'welcome')?.id ?? event.choices[0]?.id ?? ''
  if (event.id.startsWith('supporter_tifo_')) return event.choices.find(c => c.id === 'yes')?.id ?? event.choices[0]?.id ?? ''
  if (event.id.startsWith('supporter_conflict_')) return event.choices.find(c => c.id === 'both')?.id ?? event.choices[0]?.id ?? ''
  if (event.type === 'transferBidReceived') return event.choices.find(c => c.effect.type === 'rejectTransfer')?.id ?? event.choices.at(-1)?.id ?? ''
  return (event.choices.find(c => c.effect.type === 'noOp') ?? event.choices[0])?.id ?? 'ambient_dismiss'
}

function assertChronology(game: SaveGame, metrics: Metrics): void {
  const active = getActiveDecisionCount(game)
  metrics.maxActiveDecisions = Math.max(metrics.maxActiveDecisions, active)
  assert(active <= MAX_ACTIVE_DECISIONS, `decision budget ${active}/${MAX_ACTIVE_DECISIONS} at s${game.currentSeason} d${game.currentMatchday}`)

  const eligible = getVoiceEligibleEvents(game, game.pendingEvents ?? [])
  metrics.maxEligibleEventCards = Math.max(metrics.maxEligibleEventCards, eligible.length)
  const eligibleIntro = eligible.filter(event => event.introducesVoiceId)
  assert(eligibleIntro.length <= 1, `more than one voice entrance eligible at s${game.currentSeason} d${game.currentMatchday}`)

  for (const event of game.pendingEvents ?? []) {
    if (!event.voiceId) continue
    const known = isVoiceIntroduced(game, event.voiceId)
    const selfIntro = event.introducesVoiceId === event.voiceId
    const surfaces = canEventPassVoiceGate(game, event, game.pendingEvents ?? [])
    if (surfaces) {
      metrics.surfacedVoiceEvents++
      assert(known || selfIntro, `${event.id} surfaced before ${event.voiceId} was introduced`)
      if (known && !selfIntro) {
        assert(canVoiceSpeak(game, event.voiceId), `${event.id} spoke in the same period as ${event.voiceId}'s entrance`)
      }
    } else {
      metrics.blockedVoiceEventsObserved++
    }
  }

  for (const item of game.inbox) {
    if (!item.voiceId) continue
    assert(
      isVoiceIntroduced(game, item.voiceId),
      `inbox item ${item.id} exposed unknown voice ${item.voiceId}`,
    )
  }

  const layout = buildPortal(game, makeSeed(game))
  metrics.maxPortalSecondary = Math.max(metrics.maxPortalSecondary, layout.secondary.length)
  metrics.maxPortalMinimal = Math.max(metrics.maxPortalMinimal, layout.minimal.length)
  assert(layout.secondary.length <= 3, 'portal secondary cap broke')
  assert(layout.minimal.length <= 4, 'portal minimal cap broke')

  const unreadInformational = game.inbox.filter(item => !item.isRead).length
  metrics.maxUnreadInbox = Math.max(metrics.maxUnreadInbox, unreadInformational)
}

function drainVisibleEvents(game: SaveGame, metrics: Metrics): SaveGame {
  let current = game
  const handled = new Set<string>()
  for (let guard = 0; guard < 30; guard++) {
    const event = getVoiceEligibleEvents(current, current.pendingEvents ?? [])
      .find(candidate => !handled.has(candidate.id))
    if (!event) break
    handled.add(event.id)
    const beforeKnown = event.introducesVoiceId
      ? isVoiceIntroduced(current, event.introducesVoiceId)
      : true
    const resolved = resolveEvent(current, event.id, choose(event), () => 0.5, false)
    assert.notEqual(resolved, current, `visible event ${event.id} could not be resolved`)
    current = (resolved.deferredDecisions ?? []).length > 0 ? promoteFromQueue(resolved) : resolved
    if (event.introducesVoiceId && !beforeKnown) {
      assert(isVoiceIntroduced(current, event.introducesVoiceId), `${event.introducesVoiceId} was not recorded`)
      metrics.introductions.push({
        voiceId: event.introducesVoiceId,
        season: current.currentSeason,
        matchday: current.currentMatchday,
      })
    }
    assertChronology(current, metrics)
  }
  return current
}

function clearSingularDecisions(game: SaveGame): SaveGame {
  let current = game
  if (current.pendingWeeklyDecision) {
    const decision = current.pendingWeeklyDecision
    current = {
      ...current,
      pendingWeeklyDecision: undefined,
      resolvedWeeklyDecisions: [
        ...(current.resolvedWeeklyDecisions ?? []),
        `${decision.id}_${current.currentSeason}`,
      ],
    }
  }
  for (const field of ['pendingPressConference', 'pendingRefereeMeeting', 'pendingCSPress'] as const) {
    const event = current[field]
    if (!event) continue
    if (event.voiceId && !canEventPassVoiceGate(current, event, [event])) continue
    current = resolveEvent(current, event.id, choose(event), () => 0.5, false)
  }
  return applyDecisionBudget(current, current.currentMatchday)
}

function run(): Metrics {
  initCardBag()
  let game = createNewGame({ managerName: 'Astra bågprov', clubId: CLUB_ID, season: START_SEASON, seed: SEED })
  game = queueRosterVoiceIntroductions(seedTilltradeVoices({
    ...game,
    onboardingComplete: true,
    introducedInboxTopics: ['squad', 'transfers', 'club'],
    pendingScreen: null,
  }))

  const metrics: Metrics = {
    steps: 0,
    seasonsCompleted: 0,
    maxActiveDecisions: 0,
    maxEligibleEventCards: 0,
    maxPortalSecondary: 0,
    maxPortalMinimal: 0,
    introductions: [],
    surfacedVoiceEvents: 0,
    blockedVoiceEventsObserved: 0,
    maxUnreadInbox: 0,
  }

  const seenSeason = new Set<number>()
  while (game.currentSeason < TARGET_SEASON && metrics.steps < 700) {
    metrics.steps++
    seenSeason.add(game.currentSeason)
    assertChronology(game, metrics)
    game = drainVisibleEvents(game, metrics)
    game = clearSingularDecisions(game)

    const screen = autoResolvePendingScreen(game)
    assert(!screen.unresolvable, `unresolvable screen ${screen.screenType}`)
    game = autoSelectLineup({ ...screen.game, pendingScene: undefined })

    const result = advanceToNextEvent(game, SEED * 100_000 + metrics.steps)
    game = result.game
    assertChronology(game, metrics)
    if (game.managerFired && !result.seasonEnded) {
      throw new Error(`manager fired before two-season arc test completed (s${game.currentSeason} d${game.currentMatchday})`)
    }
  }

  assert(game.currentSeason >= TARGET_SEASON, `career stopped at season ${game.currentSeason} after ${metrics.steps} steps`)
  metrics.seasonsCompleted = seenSeason.size

  const ledgerIntros = (game.eventLedger ?? []).filter(entry =>
    entry.type === 'voice_introduced'
    && entry.subject?.kind === 'voice'
    && !entry.subject.id.startsWith('board:')
    && !entry.subject.id.startsWith('assistant_coach:'),
  )
  const perVoice = new Map<string, number>()
  const perPeriod = new Map<string, number>()
  for (const entry of ledgerIntros) {
    perVoice.set(entry.subject!.id, (perVoice.get(entry.subject!.id) ?? 0) + 1)
    const key = `${entry.season}:${entry.matchday}`
    perPeriod.set(key, (perPeriod.get(key) ?? 0) + 1)
  }
  for (const [voiceId, count] of perVoice) assert.equal(count, 1, `${voiceId} introduced ${count} times`)
  for (const [period, count] of perPeriod) assert(count <= 1, `${count} introductions in ${period}`)

  const requiredPrefixes = ['local_press:', 'klack_leader:', 'politician:']
  for (const prefix of requiredPrefixes) {
    assert([...perVoice.keys()].some(voiceId => voiceId.startsWith(prefix)), `missing natural ${prefix} entrance`)
  }

  return metrics
}

try {
  const metrics = run()
  console.log(JSON.stringify({
    verdict: 'PASS',
    club: CLUB_ID,
    difficulty: 'medium',
    seed: SEED,
    ...metrics,
  }, null, 2))
  process.exit(0)
} catch (error) {
  console.error(JSON.stringify({
    verdict: 'FAIL',
    club: CLUB_ID,
    difficulty: 'medium',
    seed: SEED,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exit(1)
}
