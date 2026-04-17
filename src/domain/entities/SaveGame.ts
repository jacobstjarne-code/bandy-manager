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
import type { StandingRow } from './Standing'
import type { InboxItem } from './Inbox'
import type { TransferOffer, TransferState } from './Transfer'
import type { Sponsor } from './Sponsor'
import type { TalentSearchRequest, TalentSuggestion, TalentSearchResult } from './TalentSearch'
import type { RoundSummaryData } from './RoundSummary'

import type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent } from './Mecenat'
import type { CommunityActivities, BoardMember, BoardPersonality, BoardRole, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityProject, FacilityFinancingMode, BoardObjective, LicenseReview, SupporterGroup, SupporterCharacter, SupporterRole, MediaProfile, PersonalInterest } from './Community'
import type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc, BandyLetter, SchoolAssignmentRecord } from './Narrative'

// ── Re-exports so existing `import from '../entities/SaveGame'` still works ──
export type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent }
export type { CommunityActivities, BoardMember, BoardPersonality, BoardRole, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityProject, FacilityFinancingMode, BoardObjective, LicenseReview, SupporterGroup, SupporterCharacter, SupporterRole, MediaProfile, PersonalInterest }
export type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc, BandyLetter, SchoolAssignmentRecord }
export type { StandingRow }
export type { InboxItem }
export type { TransferOffer, TransferState }
export type { Sponsor }
export type { TalentSearchRequest, TalentSuggestion, TalentSearchResult }
export type { RoundSummaryData }

export interface YouthIntakeRecord {
  season: number
  clubId: string
  date: string
  playerIds: string[]
  topProspectId?: string
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

  tutorialSeen?: boolean          // deprecated — migration: if true, skip coachMarksSeen
  coachMarksSeen?: boolean
  dismissedHints?: string[]
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
  lastEconomicStressRound?: number
  pendingPressConference?: import('../entities/GameEvent').GameEvent
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

  // Sprint 2 — Supporter group (klack)
  supporterGroup?: SupporterGroup

  // Sprint 3 — Veckans beslut
  pendingWeeklyDecision?: import('../services/weeklyDecisionService').WeeklyDecision
  resolvedWeeklyDecisions?: string[]  // `${id}_${season}` — prevents re-picking same decision

  // Sprint 4 — Visuell progression
  aiCoaches?: Record<string, import('../services/aiCoachService').AICoach>
  averageAttendance?: number      // rolling average across completed home matches
  previousAverageAttendance?: number  // previous round's average (for delta)

  // V1.3 — Player Arc Controller
  activeArcs?: ActiveArc[]

  // V1.3 — Halvtidssummering (visas efter liga-omgång 11)
  showHalfTimeSummary?: boolean

  // V1.5 — Slutspelsintro (visas när grundserien avslutas och slutspelslottning är klar)
  showPlayoffIntro?: boolean

  // V1.5 — Kvartsfinalsammanfattning (visas när alla kvartsfinaler är klara)
  showQFSummary?: boolean

  // V1.5 — Senast processade matchdag (sätts av roundProcessor — förhindrar dubbelprocess vid cup)
  lastProcessedMatchday?: number

  // V1.5 — Kafferumscitat (förhindrar samma citat två omgångar i rad)
  lastCoffeeQuoteHash?: number

  // Kapten
  captainPlayerId?: string

  // THE_BOMB 3.1 — State of the Club (visas i PreSeasonScreen säsong 2+)
  seasonStartSnapshot?: {
    season: number
    finalPosition: number
    finances: number
    communityStanding: number
    squadSize: number
    supporterMembers: number
    academyPromotions: number
  }

  // V1.4 — Nemesis tracker (opponent player who keeps scoring against us)
  nemesisTracker?: Record<string, {
    playerId: string
    name: string
    clubId: string
    goalsAgainstUs: number
    inboxSentAt?: number  // goalsAgainstUs count when inbox was last sent
    signedBy?: string     // our clubId if signed
  }>

  // Sprint G — preferred match mode (persists between matches)
  preferredMatchMode?: 'full' | 'commentary' | 'quicksim' | 'silent'

  // Sprint 12 — Segrarens eko (WEAK-014)
  pendingVictoryEcho?: import('../services/postVictoryNarrativeService').VictoryEcho
  victoryEchoExpires?: number  // matchday after which echo is cleared

  // Sprint 11 — Truppledarskap (NARR-005)
  leadershipActions?: Array<{
    playerId: string
    action: 'lower_tempo' | 'mentor' | 'private_talk' | 'public_praise'
    fromRound: number
    expiresRound: number
    effect: { stat: string; delta: number }
  }>

  // Sprint 9 — Away trip microdecision (WEAK-019)
  awayTrip?: {
    fixtureId: string
    hotel: 'pensionat' | 'mellanklass' | 'nice'
    extraMeal: boolean
    weatherWarning?: string
    mikrobeslut: 'stay_home' | 'book_nice' | 'ask_foundation' | null
  }

  // DREAM-010 — Bandybrev till klubben
  bandyLetters?: BandyLetter[]
  bandyLetterThisSeason?: number  // season when last letter was sent — prevents duplicates

  // DREAM-002 — Ekonomisk kris narrativ bana
  economicCrisisState?: {
    startedSeason: number
    startedMatchday: number
    phase: 'awareness' | 'pressure' | 'decision' | 'resolved'
    eventsFired: string[]
    outcome?: 'sold_star' | 'loan' | 'mecenat' | 'natural_recovery'
  }

  // DREAM-014 — Tyst mode (extend preferredMatchMode handled here)
  // Uses preferredMatchMode: 'silent' (existing field extended)

  // DREAM-016 — Bandyhistorisk skoluppgift
  schoolAssignmentThisSeason?: number  // season of last assignment
  schoolAssignmentArchive?: SchoolAssignmentRecord[]

  // DREAM-013 — Lagfotografiet (photos stored in IndexedDB, here just track last generated)
  lastTeamPhotoSeason?: number
}
