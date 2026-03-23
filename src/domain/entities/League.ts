export interface League {
  id: string
  name: string
  season: number
  teamIds: string[]
  fixtureIds: string[]

  pointsForWin: number    // 3
  pointsForDraw: number   // 1
  pointsForLoss: number   // 0
}
