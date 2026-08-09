import type { BoardPersonality } from './Club'
import type { PendingDemand } from './Demand'

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

// KF4 (2026-06-21): BoardMember, BoardRole, BoardPersonality bor nu i Club.ts (EN modell).
// BoardPersonality används i BoardObjective.ownerPersonality (importeras överst).

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
  // Kravmotor (2026-07-19): demands håller den PÅGÅENDE/senast avgjorda
  // kravtexten (befintlig form, 3 konsumenter läser den som ren sträng —
  // dailyBriefingService/patronTriggers/PatronDemandPrimary, orörda).
  // Rensas till [] först när ett krav UPPFYLLS; hålls kvar (stale text)
  // vid misslyckande så patronDemandUnmetOver3Rounds fortfarande hittar
  // det när patience faller under tröskeln. pendingDemand bär den
  // maskin-läsbara livscykeln (deadline, kategori) — internt, ingen UI läser den.
  demands?: string[]
  pendingDemand?: PendingDemand
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
}

export interface PoliticianInteractionLog {
  invite?: number              // last round invited (stored as round number, may be 0)
  inviteSeasonStart?: number   // season when invite-count started
  inviteCountThisSeason?: number // how many invites used this season (cap: 2)
  budget?: number              // last round presented budget
  budgetSeason?: number        // season of last budget presentation
  apply?: number               // last round applied for grant
  applySeason?: number         // season of last grant application
}

export type FacilityFinancingMode = 'club' | 'kommun' | 'mecenat'

// ── B1 Facility tree — ny modell ──────────────────────────────────────────

export type FacilityGren = 'anlaggning' | 'verksamhet' | 'akademi'

export interface FacilityConsequence {
  dim: 'publik' | 'ekonomi' | 'ungdom' | 'sjal'
  dir: 'upp' | 'ned' | 'noll'
  label: string
}

// B1 §1 — finansieringskällor per nod. Egen kassa är alltid implicit (full cost).
export interface NodeFinancing {
  kommun?: { share: number; minRelation: number; minStanding?: number }
  mecenat?: { share: number }   // bara om en aktiv, villig mecenat finns
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
  financing?: NodeFinancing  // B1 §1 — kommun/mecenat-medfinansiering
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

// Saved state för facility-trädet (B1)
export interface FacilityState {
  builtNodeIds: string[]
  activeProject?: {
    nodeId: string
    startedMatchday: number
    etaMatchday: number
    completedSeason?: number
  }
  /** B1 portal-beat: satt av advanceFacilityState när ett bygge blir klart. Beat-triggern
   *  kontrollerar matchday === game.currentMatchday för att visa beatet DENNA omgång. */
  lastCompleted?: { nodeId: string; matchday: number }
  /** B1 §5 (06-12-modellen): matchhall-prövningens tillståndsmaskin. undefined = vilande.
   *  EN support-axel, tre förankrings-decisions, kommunförhandling via politicianData. */
  hallTrial?: HallTrial
}

export type HallTrialStage =
  | 'vilande'
  | 'forankring'
  | 'krav'
  | 'forhandling'
  | 'bygge'
  | 'klar'
  | 'nedlagd'
  | 'bordlagd'

export interface HallTrial {
  stage: HallTrialStage
  support?: number            // 0–100, bara under forankring
  startedSeason: number
  stageStartedRound: number
  cooldownUntilSeason?: number  // efter fall/nedläggning
  finansiering?: 'egen' | 'kommun' | 'patron'  // sätts i förhandlingen
  // Release-svepet 2026-07-21 (Block 3a/3e): satt av roundProcessor.ts precis
  // när stage → 'klar' (matchhall-completion). Utan detta hade HALLNODE_SUBS.klar
  // ("Byggd {year}") behövt gissa ett årtal — facilityService.ts:s FacilityNodeView
  // saknar dokumenterat en per-nod completedSeason (se clubMemoryService.ts:s
  // kommentar om samma hål för Facility-minnen generellt).
  completedSeason?: number
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
  /** SLUTTEST RUNDA 3 (2026-08-08, punkt 3): läget när målet sattes — krävs för
   *  en ärlig progressbar på lägre-är-bättre-mål (topHalf/reduceInjuries), där
   *  currentValue/targetValue-kvoten pekar åt fel håll. Se computeProgressPct
   *  i BoardObjectivesList.tsx. Saknas på saves från före detta fält
   *  (saveGameMigration.ts backfyller med currentValue som fallback-start). */
  startValue?: number
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
