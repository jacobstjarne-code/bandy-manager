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

export function eventIcon(type: MatchEventType): string {
  if (type === MatchEventType.Goal) return '🔴'
  if (type === MatchEventType.YellowCard) return '⚠️'
  if (type === MatchEventType.RedCard) return '🚫'
  if (type === MatchEventType.Save) return '🧤'
  if (type === MatchEventType.Corner) return '📐'
  return ''
}
