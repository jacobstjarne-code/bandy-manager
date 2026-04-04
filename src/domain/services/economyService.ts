import type { CommunityActivities, Sponsor, StandingRow } from '../entities/SaveGame'
import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'

// ── Finance log types ─────────────────────────────────────────────────────────

export type FinanceReason =
  | 'wages'
  | 'match_revenue'
  | 'sponsorship'
  | 'community_round'
  | 'cup_prize'
  | 'league_prize'
  | 'patron'
  | 'kommunbidrag'
  | 'budget_priority'
  | 'transfer_in'
  | 'transfer_out'
  | 'scout'
  | 'academy'
  | 'event'

export interface FinanceEntry {
  round: number
  amount: number      // positive = income, negative = cost
  reason: FinanceReason
  label: string       // human-readable, e.g. "Matchintäkt hemma vs Västerås"
}

export const FINANCE_LOG_MAX = 50

// ── Central mutation function ─────────────────────────────────────────────────

/**
 * Pure function — the single place where Club.finances is mutated.
 * All callers must go through this instead of writing { ...c, finances: c.finances + x }.
 */
export function applyFinanceChange(
  clubs: Club[],
  clubId: string,
  amount: number,
): Club[] {
  return clubs.map(c =>
    c.id === clubId ? { ...c, finances: c.finances + amount } : c
  )
}

/**
 * Appends a FinanceEntry to the log, capping it at FINANCE_LOG_MAX entries.
 */
export function appendFinanceLog(
  log: FinanceEntry[],
  entry: FinanceEntry,
): FinanceEntry[] {
  const updated = [...log, entry]
  return updated.length > FINANCE_LOG_MAX
    ? updated.slice(updated.length - FINANCE_LOG_MAX)
    : updated
}

// ── Canonical round income calculation ───────────────────────────────────────

export interface RoundIncomeBreakdown {
  weeklyBase: number             // reputation × 250
  sponsorIncome: number          // active sponsors' weeklyIncome
  matchRevenue: number           // ticket/gate revenue for a home match (0 if away/no match)
  communityMatchIncome: number   // kiosk/vipTent/functionaries/bandyplay per home match, net
  communityRoundIncome: number   // lottery/bandySchool/socialMedia per round, net
  weeklyWages: number            // monthly salary total / 4
  netPerRound: number            // sum of all income − wages
}

export interface CalcRoundIncomeParams {
  club: Club
  players: Player[]
  sponsors: Sponsor[]
  communityActivities: CommunityActivities | undefined
  fanMood: number
  isHomeMatch: boolean
  matchIsKnockout: boolean
  matchIsCup: boolean
  matchHasRivalry: boolean
  standing: StandingRow | null
  rand: () => number
}

/**
 * Single canonical income calculation.
 * Used by roundProcessor for the actual finance mutation,
 * and by EkonomiTab (with rand: () => 0.5) for display estimates.
 *
 * Community income is split into two parts:
 *   communityMatchIncome — events tied to a home match (kiosk, VIP-tält, etc.)
 *   communityRoundIncome — per-round regardless of home/away (lottery, bandySchool, socialMedia)
 *
 * bandyplay appears in both: per-match participant income + per-round streaming cost.
 * This matches the existing roundProcessor behaviour and is preserved intentionally.
 */
export function calcRoundIncome(params: CalcRoundIncomeParams): RoundIncomeBreakdown {
  const { club, players, sponsors, communityActivities, fanMood, isHomeMatch,
    matchIsKnockout, matchIsCup, matchHasRivalry, standing, rand } = params

  // ── Wages ─────────────────────────────────────────────────────────────────
  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0)
  const weeklyWages = Math.round(totalSalary / 4)

  // ── Weekly base (reputation) ───────────────────────────────────────────────
  const weeklyBase = Math.round(club.reputation * 120)

  // ── Sponsors ──────────────────────────────────────────────────────────────
  const sponsorIncome = sponsors
    .filter(s => s.contractRounds > 0)
    .reduce((sum, s) => sum + s.weeklyIncome, 0)

  // ── Match revenue (home only) ─────────────────────────────────────────────
  let matchRevenue = 0
  let communityMatchIncome = 0

  if (isHomeMatch) {
    const capacity = club.arenaCapacity ?? Math.round(club.reputation * 7 + 150)
    const position = standing?.position ?? 8
    const attendanceRate = Math.min(0.90, 0.35 + (fanMood / 100) * 0.40 + (position <= 3 ? 0.08 : 0))
    const ticketPrice = 50 + Math.round((club.reputation ?? 50) * 0.3)
    const baseRevenue = Math.round(capacity * attendanceRate * ticketPrice)

    const formBonus = position <= 3 ? 1.15 : position <= 6 ? 1.05 : position >= 10 ? 0.88 : 1.0
    const eventBonus = matchIsKnockout ? 1.40 : matchIsCup ? 1.20 : 1.0
    const derbyBonus = matchHasRivalry ? 1.25 : 1.0

    matchRevenue = Math.round(
      baseRevenue * formBonus * eventBonus * derbyBonus + rand() * 2000
    )

    // Community income tied to a home match
    if (communityActivities) {
      const moodMult = 0.7 + (fanMood / 100) * 0.6
      const kioskBase = communityActivities.kiosk === 'upgraded' ? 2500
        : communityActivities.kiosk === 'basic' ? 1250 : 0
      communityMatchIncome += Math.round(kioskBase * moodMult)
      communityMatchIncome += communityActivities.functionaries ? 1000 : 0
      communityMatchIncome += communityActivities.bandyplay
        ? 250 + Math.round(rand() * 250) : 0
      if (communityActivities.vipTent) {
        communityMatchIncome += 1250 + Math.round(rand() * 2500)
      }

      // Running costs per home match
      let runningCost = 0
      if (communityActivities.kiosk === 'upgraded') runningCost += 2500
      else if (communityActivities.kiosk === 'basic') runningCost += 1500
      if (communityActivities.bandyplay) runningCost += 1000
      if (communityActivities.vipTent) runningCost += 2000
      communityMatchIncome -= runningCost
    }
  }

  // ── Per-round community income (lottery, bandySchool, socialMedia) ─────────
  let communityRoundIncome = 0
  if (communityActivities) {
    if (communityActivities.lottery === 'intensive') {
      communityRoundIncome += (1500 + Math.round(rand() * 1000)) - 800
    } else if (communityActivities.lottery === 'basic') {
      communityRoundIncome += (500 + Math.round(rand() * 750)) - 500
    }
    if (communityActivities.bandyplay) {
      // Per-round participant fees minus operational cost
      communityRoundIncome += (250 + Math.round(rand() * 500)) - 1000
    }
    if (communityActivities.socialMedia) {
      communityRoundIncome -= 500  // cost only; reputation bonus handled separately
    }
    if (communityActivities.bandySchool) {
      communityRoundIncome += 1000
    }
  }

  const netPerRound = weeklyBase + sponsorIncome + matchRevenue + communityMatchIncome
    + communityRoundIncome - weeklyWages

  return {
    weeklyBase,
    sponsorIncome,
    matchRevenue,
    communityMatchIncome,
    communityRoundIncome,
    weeklyWages,
    netPerRound,
  }
}

