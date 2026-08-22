/**
 * High 3 (Skutskär-auditen, 2026-08-22): när advance()s auto-loop hoppar
 * över flera omgångar utan hanterad match (t.ex. cuprundor för andra lag),
 * fick spelaren en oförklarad "Ekonomi −N tkr"-rad utan att veta VILKEN
 * period den täckte. Namngiven period + de faktiska financeLog-posterna,
 * inte bara en summa — samma poster ekonomifliken redan visar, bara
 * filtrerade till den här perioden.
 */
export interface RoundSummaryMultiWeekPeriod {
  fromRound: number
  toRound: number
  financeLogEntries: { round: number; amount: number; label: string }[]
}

export interface RoundSummaryData {
  round: number
  date: string
  temperature?: number

  // Match
  matchPlayed: boolean
  matchResult?: string
  matchScorers?: string[]

  // Community
  communityStandingBefore: number
  communityStandingAfter: number
  communityStandingChanges: { reason: string; delta: number }[]
  communityNote?: string
  attendance?: number

  // Academy
  youthMatchResult?: string
  mentorEffect?: string

  // Standing
  standingBefore?: number

  // Economy
  financesBefore: number
  financesAfter: number

  // Events
  injuries: string[]
  newInboxCount: number

  // High 3 (Skutskär-auditen, 2026-08-22) — satt bara när advance() faktiskt
  // hoppade över fler än en omgång (autoLoops > 0) utan hanterad match.
  multiWeekPeriod?: RoundSummaryMultiWeekPeriod
}
