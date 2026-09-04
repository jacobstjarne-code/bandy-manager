import type { LoanDeal } from '../entities/Academy'

/**
 * Äldre saves saknar remainingRounds. Rapporterna är den beständiga sanningen
 * om hur många tillfällen som redan har processats, även över glesa matchdays.
 */
export function getLoanRoundsRemaining(deal: LoanDeal): number {
  if (typeof deal.remainingRounds === 'number') {
    return Math.max(0, deal.remainingRounds)
  }
  return Math.max(0, deal.totalMatches - deal.reports.length)
}
