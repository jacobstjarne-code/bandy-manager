import type { PlayerPosition, PlayerArchetype } from '../enums'

export type AcademyLevel = 'basic' | 'developing' | 'elite'

export interface YouthPlayer {
  id: string
  firstName: string
  lastName: string
  age: number                 // 15-19
  position: PlayerPosition
  archetype: PlayerArchetype
  currentAbility: number      // 10-30 typically
  potentialAbility: number    // 30-90
  developmentRate: number     // 0-100
  confidence: number          // 0-100
  mentorId?: string
  schoolConflict: boolean
  isPartnerPlayer?: boolean
  partnerClubId?: string
  seasonGoals: number
  seasonAssists: number
  readyForPromotion: boolean
}

export interface YouthMatchResult {
  round: number
  opponentName: string
  goalsFor: number
  goalsAgainst: number
  scorers: string[]
  bestPlayer?: string
}

export interface YouthTeam {
  players: YouthPlayer[]
  results: YouthMatchResult[]
  seasonRecord: { w: number; d: number; l: number; gf: number; ga: number }
  tablePosition: number       // 1-12 in youth league
}

export interface Mentorship {
  seniorPlayerId: string
  youthPlayerId: string
  startRound: number
  isActive: boolean
}

export interface LoanReport {
  round: number
  played: boolean
  rating: number
  goals: number
  assists: number
}

export interface LoanDeal {
  playerId: string
  destinationClubName: string
  startRound: number
  endRound: number
  salaryShare: number         // 0.5 = 50% of salary covered by loan club
  matchesPlayed: number
  totalMatches: number
  averageRating: number
  reports: LoanReport[]
}

export interface RegionalPartnership {
  partnerClubId: string
  partnerClubName: string
  startSeason: number
  playersShared: string[]     // YouthPlayer IDs
  isActive: boolean
  renewalOffered: boolean
}
