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
  /**
   * PÅSTÅENDEKARTAN SANNINGEN-SAKNAS-fix (2026-08-25, Jacobs dom: "bygg
   * räknaren"). Antal P19-omgångar i följd readyForPromotion varit sant utan
   * att spelaren kallats upp — nollställs så fort readyForPromotion blir
   * falskt igen (form/utveckling kan sjunka tillbaka) eller vid uppflyttning.
   */
  roundsReadyForPromotion: number
  /**
   * M3 (audit 5c9a7a8, 2026-08-24): satt av event_district_callup_-
   * resolvern när spelaren skickas till juniorlandslaget — kortet lovar
   * "Ej tillgänglig 2 omg" men ingen mekanik verkställde det. Absolut
   * matchday (inte en nedräknare) eftersom P19-matcher bara spelas var
   * annan omgång (youthProcessor.ts: nextMatchday % 2 === 0) — en spelare
   * är borta från P19-laget så länge matchday <= detta värde
   * (simulateYouthMatch, academyService.ts).
   */
  availabilityUntilRound?: number
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

export interface MentorshipRecord {
  seniorPlayerId: string
  youthPlayerId: string
  startRound: number
  endSeason?: number
  outcome?: 'graduated' | 'ended'
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
