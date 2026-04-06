import type { InboxItemType } from '../enums'
import type { Club } from './Club'
import type { Player } from './Player'
import type { League } from './League'
import type { Fixture, TeamSelection } from './Fixture'
import type { MatchWeather } from './Weather'
import type { TrainingFocus, TrainingSession, TrainingProject } from './Training'
import type { PlayoffBracket } from './Playoff'
import type { CupBracket } from './Cup'
import type { SeasonSummary } from './SeasonSummary'
import type { ScoutReport, ScoutAssignment } from './Scouting'
import type { YouthTeam, Mentorship, LoanDeal, AcademyLevel } from './Academy'
import type { GameEvent, TransferBid } from './GameEvent'
import type { OpponentAnalysis } from '../services/opponentAnalysisService'

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

export interface StandingRow {
  clubId: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  position: number
}

export interface InboxItem {
  id: string
  date: string        // ISO date
  type: InboxItemType
  title: string
  body: string
  relatedClubId?: string
  relatedPlayerId?: string
  relatedFixtureId?: string
  isRead: boolean
}

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
  freeAgents: Player[]
  pendingOffers: TransferOffer[]
}

export interface YouthIntakeRecord {
  season: number
  clubId: string
  date: string
  playerIds: string[]
  topProspectId?: string
}

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

export interface LicenseReview {
  season: number
  status: 'approved' | 'warning' | 'continued_review' | 'denied'
  conditions?: string[]
  deadline?: number           // rounds to fix
  requiredCapital?: number
  warningCount?: number       // consecutive warnings
}

export interface TalentSearchRequest {
  id: string
  position: string  // PlayerPosition or 'any'
  maxAge: number
  maxSalary: number
  roundsRemaining: number
  createdRound: number
}

export interface TalentSuggestion {
  playerId: string
  scoutNotes: string
  estimatedCA: number
  estimatedValue: number
}

export interface TalentSearchResult {
  id: string
  requestId: string
  players: TalentSuggestion[]
  season: number
  round: number
}

// Sprint 1: RoundSummaryData
export interface RoundSummaryData {
  round: number
  date: string
  temperature?: number

  // Match
  matchPlayed: boolean
  matchResult?: string
  matchScorers?: string[]

  // Community
  communityStandingBefore: number
  communityStandingAfter: number
  communityStandingChanges: { reason: string; delta: number }[]
  communityNote?: string
  attendance?: number

  // Academy
  youthMatchResult?: string
  mentorEffect?: string

  // Economy
  financesBefore: number
  financesAfter: number

  // Events
  injuries: string[]
  newInboxCount: number
}

// Sprint 5: NamedCharacter
export interface NamedCharacter {
  id: string
  name: string
  role: string
  age?: number
  isAlive?: boolean
  morale?: number
}

// ── Mecenater — local power figures ──────────────────────────────────────

export type MecenatType =
  | 'brukspatron'
  | 'skogsägare'
  | 'lokal_handlare'
  | 'entrepreneur'
  | 'it_miljonär'
  | 'fastigheter'
  | 'jordbrukare'

export type MecenatPersonality =
  | 'tyst_kraft'
  | 'showman'
  | 'kalkylator'
  | 'nostalgiker'
  | 'kontrollfreak'
  | 'filantropen'

export interface MecenatDemand {
  type: 'buy_player' | 'change_tactic' | 'fire_player' | 'name_facility'
  description: string
  targetPlayerId?: string
}

export interface SocialEvent {
  type: 'jakt' | 'middag' | 'golfrunda' | 'bastu_affärssamtal' | 'vinkväll' | 'segelbåt' | 'hockeymatch' | 'vernissage'
  mecenatId: string
  season: number
  matchday: number
}

export interface Mecenat {
  id: string
  name: string
  gender: 'male' | 'female'
  business: string
  businessType: MecenatType
  wealth: number
  personality: MecenatPersonality
  influence: number
  happiness: number
  patience: number
  contribution: number
  totalContributed: number
  demands: MecenatDemand[]
  socialExpectations: SocialEvent[]
  isActive: boolean
  arrivedSeason: number
  favoritePlayerId?: string
  wantsStyle?: string
  silentShout: number
  lastSocialRound?: number
  lastInteractionRound?: number
}

// ── Anläggningsprojekt ──────────────────────────────────────────────────

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

export interface SaveGame {
  id: string
  managerName: string
  managedClubId: string

  currentDate: string    // ISO date
  currentSeason: number

  clubs: Club[]
  players: Player[]
  league: League
  fixtures: Fixture[]
  standings: StandingRow[]
  inbox: InboxItem[]

  transferState: TransferState
  youthIntakeHistory: YouthIntakeRecord[]
  matchWeathers: MatchWeather[]

  managedClubPendingLineup?: TeamSelection
  managedClubTraining: TrainingFocus
  trainingHistory: TrainingSession[]
  trainingProjects?: TrainingProject[]

  tutorialSeen?: boolean
  lastCompletedFixtureId?: string   // id of most recently completed managed-club fixture

  playoffBracket: PlayoffBracket | null
  cupBracket: CupBracket | null

  showSeasonSummary?: boolean
  showBoardMeeting?: boolean
  seasonSummaries: SeasonSummary[]
  seasonStartFinances?: number  // club finances at season start

  scoutReports: Record<string, ScoutReport>    // key = playerId
  activeScoutAssignment: ScoutAssignment | null
  scoutBudget: number

  pendingEvents: GameEvent[]
  transferBids: TransferBid[]
  handledContractPlayerIds: string[]

  sponsors: Sponsor[]
  fanMood?: number  // 0-100, starts 50

  boardPatience?: number         // 0–100, starts 70
  consecutiveFailures?: number   // seasons ended in bottom half without improvement
  managerFired?: boolean

  rivalryHistory?: Record<string, {
    wins: number
    losses: number
    draws: number
    lastResult?: 'win' | 'loss' | 'draw'
    currentStreak: number  // positive = win streak, negative = loss streak
  }>

  opponentAnalyses?: Record<string, OpponentAnalysis>  // key = opponentClubId

  activeTalentSearch: TalentSearchRequest | null
  talentSearchResults: TalentSearchResult[]

  doctorQuestionsUsed?: number  // resets each round, max 5

  playerConversations?: Record<string, number>  // playerId → roundNumber of last conversation

  showPreSeason?: boolean

  youthTeam?: YouthTeam
  academyLevel: AcademyLevel
  academyUpgradeInProgress?: boolean
  academyUpgradeSeason?: number
  facilityUpgradeSeason?: number
  mentorships: Mentorship[]
  loanDeals: LoanDeal[]
  version: string
  lastSavedAt: string   // ISO datetime

  communityActivities?: CommunityActivities
  volunteers?: string[]
  localPaperName?: string
  patron?: Patron
  localPolitician?: LocalPolitician
  previousKommunBidrag?: number
  politicianLastInteraction?: PoliticianInteractionLog
  boardPersonalities?: BoardMember[]
  hallDebateCount?: number
  lastHallDebateRound?: number
  budgetPriority?: 'squad' | 'balanced' | 'youth'
  resolvedEventIds?: string[]  // event IDs that have been resolved — prevents re-triggering

  // V1.0 — Named journalist with memory
  journalist?: Journalist

  // V0.9 NÄTET fields
  licenseReview?: LicenseReview
  licenseWarningCount?: number   // consecutive seasons with warning/continued_review
  communityStanding?: number     // 0-100, starts 50
  journalistRelationship?: number  // 0-100, starts 50
  sponsorNetworkMood?: number    // 0-100, collective mood

  // Sprint 5: named characters
  namedCharacters?: NamedCharacter[]

  // All-time records
  allTimeRecords?: AllTimeRecords

  // Finance log — last FINANCE_LOG_MAX entries for the managed club
  financeLog?: import('../services/economyService').FinanceEntry[]

  // V1.0 — Mecenater + Anläggning
  mecenater?: Mecenat[]
  facilityProjects?: FacilityProject[]

  // V1.0 — Storylines + Legacy
  storylines?: StorylineEntry[]
  clubLegends?: ClubLegend[]

  // V1.0 — Market value tracking (previous round values for delta display)
  previousMarketValues?: Record<string, number>  // playerId → last known marketValue

  // V1.0 — Follow-up system for event consequences
  pendingFollowUps?: import('../entities/GameEvent').FollowUp[]

  // V1.0 — Board objectives (secondary goals)
  boardObjectives?: BoardObjective[]
  boardObjectiveHistory?: Array<{
    season: number
    objectiveId: string
    result: 'met' | 'failed'
    ownerReaction: string
  }>

  // V1.0 — Trainer narrative arc
  trainerArc?: TrainerArc

  // V1.1 — Onboarding (0 = not started, 1-3 = guided rounds, 4+ = done)
  onboardingStep?: number
}

// ── Journalist — named media character with persona and memory ───────────

export type JournalistPersona = 'supportive' | 'critical' | 'analytical' | 'sensationalist'

export interface JournalistMemory {
  season: number
  matchday: number
  event: string       // 'refused_press', 'good_answer', 'bad_answer', 'big_win', 'crisis'
  sentiment: number   // -10 to +10
}

export interface Journalist {
  name: string
  outlet: string        // e.g. "Gefle Dagblad", from localPaperName
  persona: JournalistPersona
  relationship: number  // 0-100, replaces journalistRelationship
  memory: JournalistMemory[]  // last 10 interactions
  pressRefusals: number       // times manager refused press conference
  favoritePlayerId?: string   // player they write about most
  lastInteractionMatchday?: number
}

// ── Board Objectives — secondary goals per season ─────────────────────────

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

// ── Trainer narrative arc ─────────────────────────────────────────────────

export type ArcPhase =
  | 'newcomer'
  | 'honeymoon'
  | 'grind'
  | 'questioned'
  | 'crisis'
  | 'redemption'
  | 'established'
  | 'legendary'
  | 'farewell'

export interface ArcTransition {
  from: ArcPhase
  to: ArcPhase
  matchday: number
  season: number
  reason: string
}

export interface TrainerArc {
  current: ArcPhase
  history: ArcTransition[]
  seasonCount: number
  bestFinish: number
  titlesWon: number
  consecutiveLosses: number
  consecutiveWins: number
  boardWarningGiven: boolean
}

// ── Storylines — cross-system event memory ───────────────────────────────────

export type StorylineType =
  | 'rescued_from_unemployment'
  | 'went_fulltime_pro'
  | 'refused_to_go_pro'
  | 'left_for_bigger_club'
  | 'returned_to_club'
  | 'workplace_bond'
  | 'journalist_feud'
  | 'journalist_redemption'
  | 'promotion_sacrifice'
  | 'career_crossroads_stayed'
  | 'underdog_season'
  | 'relegation_escape'
  | 'gala_winner'
  | 'partner_moved_here'
  | 'captain_rallied_team'
  | 'captain_rallied_team'

export interface StorylineEntry {
  id: string
  type: StorylineType
  season: number
  matchday: number
  playerId?: string
  clubId?: string
  description: string
  displayText: string
  resolved: boolean
}

// ── Club Legends — retired players who mattered ──────────────────────────────

export interface ClubLegend {
  name: string
  position: string
  seasons: number
  totalGoals: number
  totalAssists: number
  titles: string[]
  memorableStory?: string
  retiredSeason: number
}

export interface AllTimeRecords {
  mostGoalsSeason: { playerName: string; goals: number; season: number } | null
  mostAssistsSeason: { playerName: string; assists: number; season: number } | null
  highestRatingSeason: { playerName: string; rating: number; season: number } | null
  bestFinish: { position: number; season: number } | null
  biggestWin: { score: string; opponent: string; season: number; round: number } | null
  championSeasons: number[]
  cupWinSeasons: number[]
}
