import { PlayerPosition, MatchEventType } from '../../domain/enums'

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function positionShort(pos: PlayerPosition): string {
  const map: Record<PlayerPosition, string> = {
    [PlayerPosition.Goalkeeper]: 'MV',
    [PlayerPosition.Defender]: 'DEF',
    [PlayerPosition.Half]: 'HALF',
    [PlayerPosition.Midfielder]: 'MID',
    [PlayerPosition.Forward]: 'FWD',
  }
  return map[pos] ?? pos
}

export const POSITION_ORDER: Record<PlayerPosition, number> = {
  [PlayerPosition.Goalkeeper]: 0,
  [PlayerPosition.Defender]: 1,
  [PlayerPosition.Half]: 2,
  [PlayerPosition.Midfielder]: 3,
  [PlayerPosition.Forward]: 4,
}

export function ordinal(n: number): string {
  if (n === 1) return '1:a'
  if (n === 2) return '2:a'
  return `${n}:e`
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('sv-SE') + ' kr'
}

// mkr/tkr format with sign, e.g. "+1.2 mkr" or "-450 tkr"
export function formatFinance(n: number): string {
  const abs = Math.abs(n)
  const sign = n > 0 ? '+' : n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)} mkr`
  return `${sign}${Math.round(abs / 1_000)} tkr`
}

// mkr/tkr format without sign, e.g. "1.2 mkr" or "450 tkr"
export function formatFinanceAbs(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mkr`
  return `${Math.round(n / 1_000)} tkr`
}

// Community standing color: green → gold → amber → red
export function csColor(cs: number): string {
  if (cs > 70) return '#22c55e'
  if (cs > 50) return '#C9A84C'
  if (cs > 30) return '#f59e0b'
  return '#ef4444'
}

export function eventIcon(type: MatchEventType): string {
  if (type === MatchEventType.Goal) return '🔴'
  if (type === MatchEventType.YellowCard) return '⚠️'
  if (type === MatchEventType.RedCard) return '🚫'
  if (type === MatchEventType.Save) return '🧤'
  if (type === MatchEventType.Corner) return '📐'
  return ''
}
