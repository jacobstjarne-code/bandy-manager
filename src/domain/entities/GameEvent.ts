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
  | 'licenseHandlingsplan'
  | 'kommunMote'
  | 'gentjanst'
  | 'icaMaxiEvent'
  | 'patronInfluence'
  | 'spoksponsor'
  | 'presskonferens'
  | 'detOmojligaValet'
  | 'varsel'
  | 'playerMediaComment'
  | 'playerPraise'
  | 'captainSpeech'
  | 'playerArc'
  | 'supporterEvent'
  | 'mecenatInteraction'
  | 'journalistExclusive'
  | 'supporterAwayTrip'
  | 'retirementCeremony'
  | 'economicStress'
  | 'mecenatEvent'

export interface EventChoice {
  id: string
  label: string
  subtitle?: string    // Consequence preview: "💛 +8 fanMood · ⭐ +3 reputation"
  effect: EventEffect
}

export interface EventSender {
  name: string
  role: string
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
    | 'communityStanding'
    | 'journalistRelationship'
    | 'patronInfluence'
    | 'boardPatience'
    | 'multiEffect'
    | 'teamBoostMorale'
    | 'supporterMood'
    | 'mecenatHappiness'
    | 'finance'
    | 'moraleDelta'
  value?: number
  amount?: number
  targetPlayerId?: string
  targetClubId?: string
  targetMecenatId?: string
  bidId?: string
  sponsorData?: string
  mediaQuote?: string
  communityKey?: string
  communityValue?: string
  // For multiEffect: serialized array of sub-effects
  subEffects?: string
}

export interface GameEvent {
  id: string
  type: GameEventType
  title: string
  body: string
  choices: EventChoice[]
  sender?: EventSender       // Named person + role
  relatedPlayerId?: string
  relatedClubId?: string
  relatedBidId?: string
  sponsorData?: string
  resolved: boolean
  followUpText?: string      // Simple follow-up inbox text (3-5 matchdays later)
}

// ── Follow-up system ──────────────────────────────────────────────────────

export interface FollowUp {
  id: string
  triggerEventId: string
  matchdaysDelay: number
  createdMatchday: number
  type: string
  data?: Record<string, unknown>
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
  counterCount?: number
}
