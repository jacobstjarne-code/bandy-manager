export interface CommunityActivities {
  kiosk: 'none' | 'basic' | 'upgraded'
  lottery: 'none' | 'basic' | 'intensive'
  bandyplay: boolean
  functionaries: boolean
  julmarknad: boolean
  bandySchool?: boolean
  socialMedia?: boolean
  vipTent?: boolean
  // Community-relation activities (affect communityStanding, not income)
  pensionarskaffe?: boolean   // Pensionärskaffe — integration med lokalsamhället
  soppkvall?: boolean         // Soppkväll med laget — genuint engagemang
  skolbesok?: boolean         // Skolbesök — nästa generations supportrar
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
  backstory?: string
}

export type PoliticalAgenda = 'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure'

export type MediaProfile = 'tystlåten' | 'utåtriktad' | 'populist'
export type PersonalInterest = 'bandy' | 'fotboll' | 'kultur' | 'ingenting'

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
  campaignPromise?: string     // "Bygg en ishall senast 2028"
  personalInterest?: PersonalInterest
  mediaProfile?: MediaProfile
  oppositionStrength?: number  // 0-100, hur stark opposition
  popularitet?: number         // 0-100
}

export interface PoliticianInteractionLog {
  invite?: number         // last round invited
  budget?: number         // last round presented budget
  budgetSeason?: number   // season of last budget presentation
  apply?: number          // last round applied for grant
  applySeason?: number    // season of last grant application
}

export type FacilityFinancingMode = 'club' | 'kommun' | 'mecenat'

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
  completedSeason?: number
  completedMatchday?: number
  financingMode?: FacilityFinancingMode
  mecenatCostShare?: number    // faktisk mecenat-andel (0–1) som tillämpades
}

// ── B1 Facility tree — ny modell ──────────────────────────────────────────

export type FacilityGren = 'anlaggning' | 'verksamhet' | 'akademi'

export interface FacilityConsequence {
  dim: 'publik' | 'ekonomi' | 'ungdom' | 'sjal'
  dir: 'upp' | 'ned' | 'noll'
  label: string
}

export interface FacilityNodeDef {
  id: string
  gren: FacilityGren
  label: string
  cost: number
  buildRounds: number
  requires: string[]
  consequences: FacilityConsequence[]
  isHall?: boolean
  facilitiesBonus: number    // applys to club.facilities on completion (backward compat)
  capacityBonus?: number     // added to audience capacity on completion
}

// Derived view type — never saved, computed from FacilityState
export type FacilityNodeStatus = 'built' | 'ongoing' | 'available' | 'locked'

export interface FacilityNodeView {
  def: FacilityNodeDef
  status: FacilityNodeStatus
  completedSeason?: number
  etaMatchday?: number
  cooldownTotal?: number
  cooldownFilled?: number
}

// Saved state — replaces FacilityProject[] for new saves
export interface FacilityState {
  builtNodeIds: string[]
  activeProject?: {
    nodeId: string
    startedMatchday: number
    etaMatchday: number
    completedSeason?: number
  }
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

export type SupporterRole = 'leader' | 'veteran' | 'youth' | 'family'

export interface SupporterCharacter {
  name: string
  role: SupporterRole
  favoritePlayerId?: string   // this character's personal favorite player
}

export interface SupporterGroup {
  name: string                // e.g. "Järnkurvan"
  founded: number             // season
  members: number             // 10-80
  mood: number                // 0-100, starts 60
  leader: SupporterCharacter
  veteran: SupporterCharacter
  youth: SupporterCharacter
  family: SupporterCharacter
  favoritePlayerId?: string   // shared klack favorite (highest-rated forward)
  ritual?: string             // active ritual name
  tifoDone?: boolean          // Elin's tifo event seen this season
  tifoDoneMatchday?: number   // matchday when tifo event resolved
  conflictSeason?: number     // season when Sture/Elin conflict occurred
  conflictMatchday?: number   // matchday when conflict resolved
  awayTripSeason?: number     // last season with away trip event
  awayTripMatchday?: number   // matchday when away trip resolved
}
