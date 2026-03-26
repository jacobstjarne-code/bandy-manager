import type { Player } from '../entities/Player'

function ageCurve(age: number): number {
  if (age <= 18) return 0.4
  if (age <= 21) return 0.7
  if (age <= 26) return 1.0
  if (age <= 29) return 0.85
  if (age <= 32) return 0.55
  return 0.25
}

function caCurve(ca: number): number {
  return Math.pow(ca / 50, 2.5)
}

function formMultiplier(form: number): number {
  if (form > 70) return 1.1
  if (form < 40) return 0.85
  return 1.0
}

function contractMultiplier(player: Player, currentSeason: number): number {
  const remaining = player.contractUntilSeason - currentSeason
  if (remaining <= 1) return 0.5
  if (remaining <= 2) return 0.75
  return 1.0
}

export function calculateMarketValue(player: Player, currentSeason: number): number {
  const base = ageCurve(player.age) * caCurve(player.currentAbility)
  const raw = base * formMultiplier(player.form) * contractMultiplier(player, currentSeason) * 50000
  const rounded = Math.round(raw / 5000) * 5000
  return Math.max(5000, Math.min(500000, rounded))
}

export function updateAllMarketValues(players: Player[], currentSeason: number): Player[] {
  return players.map(p => ({ ...p, marketValue: calculateMarketValue(p, currentSeason) }))
}
