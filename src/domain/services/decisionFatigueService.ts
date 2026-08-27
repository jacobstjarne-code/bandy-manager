import type { SaveGame } from '../entities/SaveGame'
import { getActiveDecisionCount } from './decisionBudgetService'

export type FatiguePressure = 'calm' | 'warm' | 'hot'

export interface FatigueState {
  meter: number          // 0–100
  pressure: FatiguePressure
}

export function getItemAge(event: { deferredAt?: number }, currentMatchday: number): number {
  if (event.deferredAt === undefined) return 0
  return Math.max(0, currentMatchday - event.deferredAt)
}

/**
 * "Beslutsbörda" mäter OBESVARADE beslut — aktiva (obesvarade, ej ännu köade
 * p.g.a. budget) OCH köade (deferred, körda ur budgeten). Innan 2026-08-27
 * räknade måttet bara deferred-kön, vilket lät "Lugn" stå kvar när aktiv-kön
 * redan låg i taket (3 aktiva) och deferred bara var 2-4 — spelaren hade då
 * facto 5-7 obesvarade beslut men såg "Lugn" (SEXSÄSONGSAUDITEN M4, Forsbacka
 * 44-51 inboxnotiser + "flera aktiva/köade beslut" samtidigt som "Lugn").
 * Måttet räknar fortfarande INTE rå inbox-volym (olästa informationsnotiser
 * utan choices) — det är en medveten gräns, inte samma sak som obesvarade
 * BESLUT. decisionBudgetService.ts's docstring: "Atmospheric/informational
 * events... bypass the budget" — den gränsen ändras inte här.
 */
export function getFatigueState(game: SaveGame): FatigueState {
  const deferred = game.deferredDecisions ?? []
  const matchday = game.currentMatchday ?? 0
  const activeCount = getActiveDecisionCount(game)
  const unansweredCount = activeCount + deferred.length

  if (unansweredCount === 0) return { meter: 0, pressure: 'calm' }

  const maxAge = deferred.length > 0
    ? Math.max(...deferred.map(e => getItemAge(e as { deferredAt?: number }, matchday)))
    : 0

  const meter = Math.min(100, unansweredCount * 10 + maxAge * 8)

  let pressure: FatiguePressure = 'calm'
  if (maxAge >= 5 || unansweredCount >= 7) pressure = 'hot'
  else if (maxAge >= 3 || unansweredCount >= 5) pressure = 'warm'

  return { meter, pressure }
}
