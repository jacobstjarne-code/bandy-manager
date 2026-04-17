export interface Sponsor {
  id: string
  name: string
  category: string
  weeklyIncome: number
  contractRounds: number
  signedRound: number
  personality?: 'local' | 'regional' | 'foundation'
  networkMood?: number        // 0-100
  icaMaxi?: boolean           // special ICA Maxi sponsor
  icaMaxi_active?: boolean    // player visit active this season
}
