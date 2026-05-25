export interface ManagerProfile {
  firstName: string
  lastName: string
  age: number
  hometown: string
  burnoutScore: number       // 0-100
  burnoutHistory: number[]   // per-round scores, capped at 22 entries
  careerWins: number
  careerDraws: number
  careerLosses: number
  seasonsAtClub: number
}
