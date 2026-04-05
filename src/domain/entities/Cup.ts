export interface CupMatch {
  id: string
  round: number        // internal cup round: 1=förstarunda, 2=quarterfinals, 3=semifinals, 4=final
  fixtureId: string    // links to a Fixture in game.fixtures
  homeClubId: string
  awayClubId: string
  winnerId?: string    // set after match is played
}

export interface CupBracket {
  season: number
  matches: CupMatch[]
  winnerId?: string
  completed: boolean
}
