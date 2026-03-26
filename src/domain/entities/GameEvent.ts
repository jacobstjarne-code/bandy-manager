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
  value?: number
  targetPlayerId?: string
  targetClubId?: string
  bidId?: string
  sponsorData?: string
  mediaQuote?: string
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
