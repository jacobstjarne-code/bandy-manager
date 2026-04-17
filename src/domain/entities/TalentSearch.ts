export interface TalentSearchRequest {
  id: string
  position: string  // PlayerPosition or 'any'
  maxAge: number
  maxSalary: number
  roundsRemaining: number
  createdRound: number
}

export interface TalentSuggestion {
  playerId: string
  scoutNotes: string
  estimatedCA: number
  estimatedValue: number
}

export interface TalentSearchResult {
  id: string
  requestId: string
  players: TalentSuggestion[]
  season: number
  round: number
}
