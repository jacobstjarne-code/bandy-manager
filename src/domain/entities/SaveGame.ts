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

import type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent } from './Mecenat'
import type { CommunityActivities, BoardMember, BoardPersonality, BoardRole, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityProject, BoardObjective, LicenseReview } from './Community'
import type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc } from './Narrative'

// ── Re-exports so existing `import from '../entities/SaveGame'` still works ──
export type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent }
export type { CommunityActivities, BoardMember, BoardPersonality, BoardRole, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityProject, BoardObjective, LicenseReview }
export type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc }

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
  lineupConfirmedThisRound?: boolean
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
  volunteerMorale?: Record<string, number>  // name → morale 0-100
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
  communityStandingDelta?: number  // delta since last round (positive = up, negative = down)
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

  // V1.2 — Screen visit tracking (for nudge progress in dashboard agenda)
  visitedScreensThisRound?: string[]  // e.g. ['squad', 'transfers', 'club']

  // V1.3 — Player Arc Controller
  activeArcs?: ActiveArc[]

  // V1.3 — Halvtidssummering (visas efter liga-omgång 11)
  showHalfTimeSummary?: boolean

  // V1.4 — Nemesis tracker (opponent player who keeps scoring against us)
  nemesisTracker?: Record<string, {
    playerId: string
    name: string
    clubId: string
    goalsAgainstUs: number
    inboxSentAt?: number  // goalsAgainstUs count when inbox was last sent
    signedBy?: string     // our clubId if signed
  }>
}
