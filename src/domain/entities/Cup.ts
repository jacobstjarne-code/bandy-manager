export interface CupMatch {
  id: string
  round: number        // internal cup round: 1=förstarunda, 2=quarterfinals, 3=semifinals, 4=final
  fixtureId: string    // links to a Fixture in game.fixtures
  homeClubId: string
  awayClubId: string
  winnerId?: string    // set after match is played
  isBye?: boolean      // true for bye entries (auto-advance, no real match)
}

export interface CupBracket {
  season: number
  matches: CupMatch[]
  byeTeamIds?: string[]  // teams that got byes in round 1
  winnerId?: string
  completed: boolean
}
