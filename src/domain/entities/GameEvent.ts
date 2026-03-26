export type GameEventType =
  | 'transferBidReceived'
  | 'transferBidResult'
  | 'contractRequest'
  | 'playerUnhappy'
  | 'starPerformance'
  | 'transferWindowAlert'
  | 'sponsorOffer'
  | 'pressConference'
  | 'dayJobConflict'
  | 'bidWar'
  | 'hesitantPlayer'
  | 'communityEvent'
  | 'patronEvent'
  | 'politicianEvent'
  | 'hallDebate'

export interface EventChoice {
  id: string
  label: string
  effect: EventEffect
}

export interface EventEffect {
  type:
    | 'acceptTransfer'
    | 'rejectTransfer'
    | 'counterOffer'
    | 'extendContract'
    | 'rejectContract'
    | 'boostMorale'
    | 'acceptSponsor'
    | 'pressResponse'
    | 'noOp'
    | 'openNegotiation'
    | 'makeFullTimePro'
    | 'raiseBid'
    | 'setCommunity'
    | 'patronHappiness'
    | 'politicianRelationship'
    | 'kommunBidragChange'
    | 'facilitiesUpgrade'
    | 'kommunGamble'
    | 'tempFacilities'
    | 'income'
    | 'reputation'
    | 'fanMood'
  value?: number
  amount?: number
  targetPlayerId?: string
  targetClubId?: string
  bidId?: string
  sponsorData?: string
  mediaQuote?: string
  communityKey?: string
  communityValue?: string
}

export interface GameEvent {
  id: string
  type: GameEventType
  title: string
  body: string
  choices: EventChoice[]
  relatedPlayerId?: string
  relatedClubId?: string
  relatedBidId?: string
  sponsorData?: string
  resolved: boolean
}

export interface TransferBid {
  id: string
  playerId: string
  buyingClubId: string
  sellingClubId: string
  offerAmount: number
  offeredSalary: number
  contractYears: number
  direction: 'incoming' | 'outgoing'
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  createdRound: number
  expiresRound: number
}
