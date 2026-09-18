import type { ActiveAnniversary } from '../services/clubMemoryService'

/**
 * Eko-label för ClubMemoryEventRow.
 * Tonregel: minimal. Meta-raden bär datum. Detta är bara markören.
 */

export function anniversaryRowLabel(echo: ActiveAnniversary): string {
  if (echo.yearsAgo === 1) return 'Eko · ett år sedan'
  return `Eko · ${echo.yearsAgo} år sedan`
}



// pickAnniversaryMemoryRowLabel — används av ClubMemoryEventRow.tsx
export function pickAnniversaryMemoryRowLabel(anniversary: ActiveAnniversary): string {
  return anniversaryRowLabel(anniversary)
}
