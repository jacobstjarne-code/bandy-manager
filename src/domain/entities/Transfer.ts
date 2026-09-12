export interface TransferOffer {
  id: string
  playerId: string
  fromClubId: string
  toClubId: string
  offerAmount: number
  offeredSalary: number
  contractYears: number
  status: 'pending' | 'accepted' | 'rejected'
}

export interface TransferState {
  // genomgang-motor-smafynd (§13): var tidigare Player[] — en FULLSTÄNDIG
  // KOPIA av spelare som redan låg i game.players (clubId==='free_agent').
  // Kopiorna åldrades aldrig medan originalen gjorde det (roten till
  // dubbelposten Opus täppte i signFreeAgent, se transferActions.ts).
  // Mätt: 1359 poster, 3,97 MB av en 7,48 MB 10-säsongerskarriär. En
  // id-lista, aldrig en andra kopia — resolveFreeAgents (transferService.ts)
  // slår upp de faktiska Player-objekten ur game.players.
  freeAgentIds: string[]
  pendingOffers: TransferOffer[]
}
