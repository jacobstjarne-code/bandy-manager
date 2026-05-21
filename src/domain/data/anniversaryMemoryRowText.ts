import type { ActiveAnniversary } from '../services/clubMemoryService'

/**
 * Eko-label för ClubMemoryEventRow.
 * Tonregel: minimal. Meta-raden bär datum. Detta är bara markören.
 */

export function anniversaryRowLabel(echo: ActiveAnniversary): string {
  if (echo.yearsAgo === 1) return 'Eko · i år igen'
  return `Eko · ${echo.yearsAgo} år sedan`
}

const ECHO_DETAIL: Record<'won' | 'lost' | 'neutral', string> = {
  won: 'Samma vecka som detta hände — ett ljust minne som återkommer.',
  lost: 'Samma vecka som detta hände — det skaver fortfarande.',
  neutral: 'Samma vecka som detta hände — värt att minnas.',
}

export function anniversaryRowDetail(echo: ActiveAnniversary): string {
  return ECHO_DETAIL[echo.outcome]
}

// pickAnniversaryMemoryRowLabel — används av ClubMemoryEventRow.tsx
export function pickAnniversaryMemoryRowLabel(anniversary: ActiveAnniversary): string {
  return anniversaryRowLabel(anniversary)
}
