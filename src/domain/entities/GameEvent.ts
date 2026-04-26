export type GameEventType =
  | 'transferBidReceived'
  | 'contractRequest'
  | 'playerUnhappy'
  | 'starPerformance'
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
  | 'detOmojligaValet'
  | 'varsel'
  | 'playerMediaComment'
  | 'playerPraise'
  | 'captainSpeech'
  | 'playerArc'
  | 'supporterEvent'
  | 'mecenatInteraction'
  | 'journalistExclusive'
  | 'retirementCeremony'
  | 'economicStress'
  | 'mecenatEvent'
  | 'academyEvent'
  | 'playoffEvent'
  | 'bandyLetter'
  | 'criticalEconomy'
  | 'schoolAssignment'
  | 'mecenatDinner'
  | 'refereeMeeting'
  | 'riskySponsorOffer'
  | 'mecenatWithdrawal'

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
    | 'saveBandyLetter'
    | 'startEconomicCrisis'
    | 'resolveEconomicCrisis'
    | 'saveSchoolAssignment'
    | 'scoutBudget'
    | 'refereeRelationship'
    | 'setLegendRole'
  value?: number
  refereeId?: string
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
  // For saveBandyLetter / saveSchoolAssignment — reply text embedded in choice
  replyText?: string
  // For startEconomicCrisis / resolveEconomicCrisis
  crisisPhase?: string
  removePlayerId?: string
  legendRole?: string
}

export type EventPriority = 'critical' | 'high' | 'normal' | 'low'

export function getEventPriority(type: GameEventType): EventPriority {
  switch (type) {
    case 'mecenatEvent':
    case 'economicStress':
    case 'playerUnhappy':
      return 'critical'
    case 'patronEvent':
    case 'pressConference':
    case 'politicianEvent':
    case 'kommunMote':
    case 'hallDebate':
    case 'mecenatDinner':
      return 'high'
    case 'criticalEconomy':
      return 'critical'
    case 'transferBidReceived':
    case 'contractRequest':
    case 'academyEvent':
    case 'playoffEvent':
      return 'normal'
    case 'bandyLetter':
    case 'schoolAssignment':
      return 'low'
    default:
      return 'low'
  }
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
  relatedFixtureId?: string
  sponsorData?: string
  resolved: boolean
  followUpText?: string      // Simple follow-up inbox text (3-5 matchdays later)
  priority?: EventPriority   // defaults to getEventPriority(type) if not set
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
