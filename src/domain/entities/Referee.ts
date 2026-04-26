export type RefereeStyle = 'strict' | 'lenient' | 'inconsistent'
export type RefereePersonality = 'neutral' | 'derby-specialist' | 'rookie' | 'veteran' | 'controversial'

export interface Referee {
  id: string
  firstName: string
  lastName: string
  homeTown: string
  yearsOfExperience: number
  style: RefereeStyle
  personality: RefereePersonality
  quirk?: string
  backstory?: string
  managedMatches: number
}

export interface RefereeRelation {
  refereeId: string
  lastMatchSeason: number
  lastMatchRound: number
  totalMatches: number
  totalCardsGiven: number
  totalPenaltiesGiven: number
  clubReaction: -2 | -1 | 0 | 1 | 2
}
