export interface CommunityActivities {
  kiosk: 'none' | 'basic' | 'upgraded'
  lottery: 'none' | 'basic' | 'intensive'
  bandyplay: boolean
  functionaries: boolean
  julmarknad: boolean
  bandySchool?: boolean
  socialMedia?: boolean
  vipTent?: boolean
}

export type BoardPersonality = 'supporter' | 'ekonom' | 'traditionalist' | 'modernist'
export type BoardRole = 'ordförande' | 'kassör' | 'ledamot'

export interface BoardMember {
  name: string
  role: BoardRole
  personality: BoardPersonality
}

export type PatronPersonality = 'selfless' | 'controlling' | 'strategic' | 'nostalgic'

export interface Patron {
  name: string
  business: string
  influence: number
  happiness: number
  contribution: number
  favoritePlayerId?: string
  favoriteRelation?: string
  wantsStyle?: string
  isActive: boolean
  hasBeenWarned?: boolean
  personality?: PatronPersonality
  patience?: number           // 0-100, decreases when ignored
  totalContributed?: number   // running total
  demands?: string[]
}

export type PoliticalAgenda = 'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'

export interface LocalPolitician {
  name: string
  title: string
  party: 'S' | 'M' | 'C' | 'L' | 'KD' | 'lokalt' | string
  agenda: PoliticalAgenda
  relationship: number
  kommunBidrag: number
  generosity?: number          // 0-100
  mandatExpires?: number       // season number when mandate expires
  demands?: string[]
  demandsMet?: boolean
  corruption?: number          // 0-100
}

export interface PoliticianInteractionLog {
  invite?: number         // last round invited
  budget?: number         // last round presented budget
  budgetSeason?: number   // season of last budget presentation
  apply?: number          // last round applied for grant
  applySeason?: number    // season of last grant application
}

export interface FacilityProject {
  id: string
  name: string
  description: string
  cost: number
  duration: number
  facilitiesBonus: number
  otherEffects: string[]
  requiresKommun: boolean
  kommunCostShare: number
  status: 'available' | 'in_progress' | 'completed'
  startedMatchday?: number
}

export interface BoardObjective {
  id: string
  type: 'economic' | 'academy' | 'identity' | 'community' | 'sporting'
  label: string
  description: string
  ownerId: string
  ownerPersonality: BoardPersonality
  targetValue: number
  currentValue: number
  measureFn: string
  status: 'active' | 'met' | 'failed' | 'at_risk'
  assignedSeason: number
  successReward: string
  failureConsequence: string
  carryOver: boolean
}

export interface LicenseReview {
  season: number
  status: 'approved' | 'warning' | 'continued_review' | 'denied'
  conditions?: string[]
  deadline?: number           // rounds to fix
  requiredCapital?: number
  warningCount?: number       // consecutive warnings
}
