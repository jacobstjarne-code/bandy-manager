import { PlayerPosition, MatchEventType } from '../../domain/enums'

// Kanoniska positionsetiketter + pengar bor i domain/format (delas med domänlagret,
// som inte får importera presentation). Re-exporteras här så befintliga import-ställen
// (positionShort/formatValue/formatSalary från '../utils/formatters') är oförändrade.
export { positionShort, positionLong, formatValue, formatSalary } from '../../domain/format'

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
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
  if (cs > 70) return 'var(--success)'
  if (cs > 50) return 'var(--accent)'
  if (cs > 30) return 'var(--warning)'
  return 'var(--danger)'
}

export function eventIcon(type: MatchEventType): string {
  if (type === MatchEventType.Goal) return '🥅'
  if (type === MatchEventType.Suspension) return '🚫'
  if (type === MatchEventType.Save) return '🧤'
  if (type === MatchEventType.Corner) return '📐'
  return ''
}

export function trendStroke(last: number, prev: number): 'success' | 'danger' | 'accent' {
  return last > prev ? 'success' : last < prev ? 'danger' : 'accent'
}

/** Season-level trend: last point vs first point. Used for kassa/puls sparklines. */
export function seasonTrendStroke(
  points: number[],
  options?: { neutral?: 'accent' | 'cold' | 'warm' | 'danger' },
): 'success' | 'accent' | 'cold' | 'warm' | 'danger' {
  if (points.length < 2) return options?.neutral ?? 'danger'
  return points[points.length - 1] >= points[0] ? 'success' : (options?.neutral ?? 'danger')
}

export function attributeLabel(key: string): string {
  const map: Record<string, string> = {
    skating: 'Skridskoåkning', acceleration: 'Acceleration', stamina: 'Kondition',
    ballControl: 'Bollkontroll', passing: 'Passning', shooting: 'Skott',
    dribbling: 'Dribbling', vision: 'Vision', decisions: 'Spelsinne',
    workRate: 'Arbetsinsats', positioning: 'Positionering', defending: 'Försvar',
    cornerSkill: 'Hörnspel', goalkeeping: 'Målvaktsspel',
  }
  return map[key] ?? key
}
