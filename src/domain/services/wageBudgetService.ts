import type { Player } from '../entities/Player'

const WAGE_BUDGET_HEADROOM = 1.1
const WAGE_BUDGET_ROUNDING = 1_000

/**
 * Klubbens lönebudget följer den aktuella månadslönen med tio procents
 * rörelseutrymme, avrundat uppåt till närmaste tusental. Samma regel används
 * vid ny karriär, klubbyte och säsongsövergång så budgeten aldrig fryser mot
 * en gammal trupp.
 */
export function calculateWageBudget(players: Player[], clubId: string): number {
  const monthlyWages = players
    .filter(player => player.clubId === clubId)
    .reduce((sum, player) => sum + player.salary, 0)

  return Math.ceil(monthlyWages * WAGE_BUDGET_HEADROOM / WAGE_BUDGET_ROUNDING) * WAGE_BUDGET_ROUNDING
}
