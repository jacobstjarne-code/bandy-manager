import type { SaveGame } from '../entities/SaveGame'

export type FatiguePressure = 'calm' | 'warm' | 'hot'

export interface FatigueState {
  meter: number          // 0–100
  pressure: FatiguePressure
}

export function getItemAge(event: { deferredAt?: number }, currentMatchday: number): number {
  if (event.deferredAt === undefined) return 0
  return Math.max(0, currentMatchday - event.deferredAt)
}

export function getFatigueState(game: SaveGame): FatigueState {
  const deferred = game.deferredDecisions ?? []
  const matchday = game.currentMatchday ?? 0

  if (deferred.length === 0) return { meter: 0, pressure: 'calm' }

  const maxAge = Math.max(...deferred.map(e => getItemAge(e as { deferredAt?: number }, matchday)))
  const count = deferred.length

  const meter = Math.min(100, count * 10 + maxAge * 8)

  let pressure: FatiguePressure = 'calm'
  if (maxAge >= 5 || count >= 7) pressure = 'hot'
  else if (maxAge >= 3 || count >= 5) pressure = 'warm'

  return { meter, pressure }
}
