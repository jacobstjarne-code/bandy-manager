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

  // Economy
  financesBefore: number
  financesAfter: number

  // Events
  injuries: string[]
  newInboxCount: number
}
