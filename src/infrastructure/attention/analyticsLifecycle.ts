import type { SaveGame } from '../../domain/entities/SaveGame'
import { getDifficulty } from '../../domain/services/offerSelectionService'
import {
  isAnalyticsEnabled,
  recordAnalyticsEvent,
  type AnalyticsEvent,
} from './attentionClient'

const SENT_KEY = 'bandy-analytics-sent-v1'
const BASELINE_KEY = 'bandy-analytics-baseline-v1'
const inFlight = new Map<string, Promise<void>>()
let activeSession: { ended: boolean; end: () => void } | null = null

function readSent(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(SENT_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter(value => typeof value === 'string') : [])
  } catch {
    return new Set()
  }
}

function remember(key: string): void {
  try {
    const sent = readSent()
    sent.add(key)
    localStorage.setItem(SENT_KEY, JSON.stringify([...sent].slice(-500)))
  } catch {
    // Best-effort dedupe. Servern validerar fortfarande varje enskild post.
  }
}

function sendOnce(
  key: string,
  event: AnalyticsEvent,
  payload: Record<string, string | number> = {},
): void {
  if (readSent().has(key) || inFlight.has(key)) return
  // Om spelaren stängt av statistik ska redan passerade milstolpar inte
  // skickas retroaktivt den dag hen eventuellt slår på den igen.
  if (!isAnalyticsEnabled()) {
    remember(key)
    return
  }
  const request = recordAnalyticsEvent(event, payload)
    .then(stored => { if (stored) remember(key) })
    .catch(error => {
      if (import.meta.env.DEV) console.info('[Analytics] Event sync skipped:', error)
    })
    .finally(() => { inFlight.delete(key) })
  inFlight.set(key, request)
}

function platformLabel(): string {
  const agent = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(agent)) return 'ios'
  if (/Android/.test(agent)) return 'android'
  return 'desktop'
}

export function startAnalyticsSession(): () => void {
  if (activeSession && !activeSession.ended) return activeSession.end
  sendOnce('installation', 'install', {
    appVersion: typeof __GIT_HASH__ === 'string' ? __GIT_HASH__ : 'unknown',
    platform: platformLabel(),
    locale: navigator.language || 'unknown',
  })

  const sessionId = crypto.randomUUID()
  const startedAt = Date.now()
  void recordAnalyticsEvent('session_start', { sessionId }).catch(error => {
    if (import.meta.env.DEV) console.info('[Analytics] Session start skipped:', error)
  })
  const session = {
    ended: false,
    end: () => {},
  }
  session.end = () => {
    if (session.ended) return
    session.ended = true
    const durationSeconds = Math.min(24 * 60 * 60, Math.max(0, Math.round((Date.now() - startedAt) / 1_000)))
    void recordAnalyticsEvent('session_end', { sessionId, durationSeconds }).catch(() => {})
  }
  activeSession = session
  return session.end
}

function gameOverReason(game: SaveGame): 'dismissed' | 'license' | 'bankruptcy' {
  if (game.firedReason === 'licenseDenied') return 'license'
  if (game.firedReason === 'bankruptcy') return 'bankruptcy'
  return 'dismissed'
}

/**
 * Första releasen får inte tidsstämpla gamla karriärmilstolpar som om de
 * hände i dag. Efter avslutad Zustand-hydrering baslinas därför det state
 * som redan fanns på enheten; bara senare övergångar skickas.
 */
export function initializeAnalyticsBaseline(game: SaveGame | null): void {
  try {
    if (localStorage.getItem(BASELINE_KEY) === 'true') return
    if (game) {
      remember(`game_created:${game.id}`)
      if (game.onboardingComplete === true) remember(`onboarding_done:${game.id}`)
      if (game.lastCompletedFixtureId || game.fixtures.some(fixture =>
        fixture.status === 'completed' &&
        (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
      )) remember(`first_match:${game.id}`)
      for (const summary of game.seasonSummaries ?? []) {
        remember(`season_completed:${game.id}:${summary.season}`)
      }
      if (game.managerFired) remember(`game_over:${game.id}`)
    }
    localStorage.setItem(BASELINE_KEY, 'true')
  } catch {
    // Utan localStorage kan dedupe/baslinje inte lovas. Nätfelet får inte
    // blockera spelet; serverkontraktet begränsar fortfarande payloaden.
  }
}

/** Fångar sanna, durabla spelmilstolpar och reparerar missade nätanrop vid nästa state. */
export function syncGameAnalytics(game: SaveGame): void {
  const club = game.clubs.find(candidate => candidate.id === game.managedClubId)
  if (club) {
    sendOnce(`game_created:${game.id}`, 'game_created', {
      club: club.id,
      difficulty: getDifficulty(club),
    })
  }
  if (game.onboardingComplete === true) {
    sendOnce(`onboarding_done:${game.id}`, 'onboarding_done')
  }
  if (game.lastCompletedFixtureId || game.fixtures.some(fixture =>
    fixture.status === 'completed' &&
    (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
  )) {
    sendOnce(`first_match:${game.id}`, 'first_match')
  }
  for (const summary of game.seasonSummaries ?? []) {
    sendOnce(`season_completed:${game.id}:${summary.season}`, 'season_completed', {
      season: summary.season,
      placement: summary.finalPosition,
    })
  }
  if (game.managerFired) {
    sendOnce(`game_over:${game.id}`, 'game_over', {
      reason: gameOverReason(game),
      seasonsSurvived: game.seasonSummaries?.length ?? 0,
    })
  }
}
