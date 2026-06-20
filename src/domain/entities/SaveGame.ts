import type { PendingScreen } from '../enums'
import type { MatchdaySlot } from '../services/scheduleGenerator'
import type { NotableEventType } from '../data/klackEchoText'
import type { SeasonPhase } from '../data/seasonPhases'
import type { SeasonSignature } from './SeasonSignature'
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
import type { Moment, MomentSource } from './Moment'
import type { AssistantCoach } from './AssistantCoach'
import type { PendingScene, SceneId } from './Scene'

import type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent } from './Mecenat'
import type { Referee, RefereeRelation } from './Referee'
import type { CommunityActivities, BoardMember, BoardPersonality, BoardRole, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityFinancingMode, BoardObjective, LicenseReview, SupporterGroup, SupporterCharacter, SupporterRole, MediaProfile, PersonalInterest, FacilityGren, FacilityConsequence, NodeFinancing, FacilityNodeDef, FacilityNodeView, FacilityNodeStatus, FacilityState } from './Community'
import type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc, BandyLetter, SchoolAssignmentRecord } from './Narrative'

// ── Re-exports so existing `import from '../entities/SaveGame'` still works ──
export type { Mecenat, MecenatType, MecenatPersonality, MecenatDemand, SocialEvent }
export type { CommunityActivities, BoardMember, BoardPersonality, BoardRole, Patron, PatronPersonality, LocalPolitician, PoliticalAgenda, PoliticianInteractionLog, FacilityFinancingMode, BoardObjective, LicenseReview, SupporterGroup, SupporterCharacter, SupporterRole, MediaProfile, PersonalInterest, FacilityGren, FacilityConsequence, NodeFinancing, FacilityNodeDef, FacilityNodeView, FacilityNodeStatus, FacilityState }
export type { Journalist, JournalistPersona, JournalistMemory, TrainerArc, ArcPhase, ArcTransition, StorylineEntry, StorylineType, ClubLegend, AllTimeRecords, NamedCharacter, ArcType, ActiveArc, BandyLetter, SchoolAssignmentRecord }
export type { StandingRow }
export type { InboxItem }
export type { TransferOffer, TransferState }
export type { Sponsor }
export type { TalentSearchRequest, TalentSuggestion, TalentSearchResult }
export type { RoundSummaryData }

export type { Moment, MomentSource }
export type { AssistantCoach, CoachPersonality, CoachBackground } from './AssistantCoach'

export type ClubEra = 'survival' | 'fotfaste' | 'establishment' | 'legacy'

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
  currentMatchday: number   // Aktuell matchdag (för portal-seed) — alltid satt sedan A1-fix
  // Scene-system (SPEC_SCENES_FAS_1 + SPEC_KAFFERUMMET_FAS_1)
  pendingScene?: PendingScene          // Sätts av sceneTriggerService
  shownScenes?: SceneId[]              // Permanent historik (gäller ej recurring coffee_room)
  valetShownSeason?: number            // B1 — säsong då Valet-ceremonin visades (engångs/säsong, idiom som upptaktPhaseMarkSeenSeason). shownScenes duger ej — Valet är recurring per säsong från säsong 2.
  sceneChoices?: Record<string, string> // Spelarens val per sceneId
  lastCoffeeSceneRound?: number        // Round när senaste coffee_room visades
  lastCoffeeSceneIndices?: number[]    // B9 T1 — index i GENERIC_EXCHANGES som visades senast (undviks i nästa scen)

  // Portal-beats (lättviktiga engångsmoment)
  shownBeats?: string[]                // Beat-nycklar som visats (format: beatId eller beatId_season)

  // Portal fas-markeringar (visas en gång per fas per säsong)
  phaseMarksSeen: SeasonPhase[]        // default []
  upptaktPhaseMarkSeenSeason?: number  // C-SD2: säsong då upptakt-PhaseMark visats (engångs/säsong)

  // Fas-anslag (säsongskapitel-overlay)
  seenAnslag?: import('../services/anslagService').AnslagKey[]

  /** Season calendar built once at season creation. Single source of truth for all date lookups. */
  seasonCalendar?: MatchdaySlot[]

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
  chemistryStats?: Record<string, number>  // key = sortedId1|sortedId2, value = shared minutes

  playoffBracket: PlayoffBracket | null
  cupBracket: CupBracket | null

  pendingScreen?: PendingScreen | null
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
  lastRivalSaleMatchday?: number  // C-T9 — matchday of most recent rival sale
  lastRivalSaleInfo?: { soldPlayerName: string; buyerClubName: string }  // B1 — för Efterklang-premiss
  lastIncomingBidMatchday?: number  // C-O2 — matchday when AI last bid on managed club's player

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
  pendingCSPress?: import('../entities/GameEvent').GameEvent
  lastCSPressMatchday?: number  // for C-B1 cooldown tracking
  budgetPriority?: 'squad' | 'balanced' | 'youth'
  resolvedEventIds?: string[]  // event IDs that have been resolved — prevents re-triggering

  // V1.0 — Named journalist with memory
  journalist?: Journalist

  // V0.9 NÄTET fields
  licenseReview?: LicenseReview
  licenseWarningCount?: number   // consecutive seasons with warning/continued_review
  financeWarningGivenThisSeason?: boolean  // true once warning/license-denial inbox sent; reset at season end
  previousRecommendedFormation?: string    // last known coach recommendation; inbox sent when it changes
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
  facilityState?: FacilityState          // B1: facility tree state

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
    label?: string   // måletikett för BoardMeeting-eval (tillagd 2026-06-01)
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
  weeklyDecisionLastRound?: number    // round when last decision was generated — enforces cooldown

  // Beslutsekonomi — throttling (decisionBudgetService)
  pendingDecisions?: unknown[]       // reserved for future use (deferred display)
  deferredDecisions: GameEvent[]     // queue for decisions blocked by budget cap (max 10)
  lastRumorRound?: number            // round when last transfer rumor was generated (cooldown: 3)
  lastEventQueueRound?: number       // round when last community event was generated (cooldown: 2)

  // Sprint 4 — Visuell progression
  aiCoaches?: Record<string, import('../services/aiCoachService').AICoach>
  averageAttendance?: number      // rolling average across completed home matches
  previousAverageAttendance?: number  // previous round's average (for delta)

  // V1.3 — Player Arc Controller
  activeArcs?: ActiveArc[]

  // V1.5 — Senast processade matchdag (sätts av roundProcessor — förhindrar dubbelprocess vid cup)
  lastProcessedMatchday?: number

  // V1.5 — Kafferumscitat (förhindrar samma citat två omgångar i rad)
  lastCoffeeQuoteHash?: number

  // Kapten
  captainPlayerId?: string

  // T3 — Halvtidsbeslut (temporärt fält, rensas i saveLiveMatchResult)
  lastHalftimeDecision?: 'lugna' | 'pressa' | 'prata'

  // THE_BOMB 3.1 — State of the Club (visas i PreSeasonScreen säsong 2+)
  seasonStartSnapshot?: {
    season: number
    finalPosition: number
    finances: number
    communityStanding: number
    squadSize: number
    supporterMembers: number
    academyPromotions: number
    era?: ClubEra | 'unknown'   // Klubbminne B6 — era vid säsongsstarten (migration: 'unknown')
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

  // Sprint 18 — Assistenttränare
  assistantCoach?: AssistantCoach

  // Sprint 12 — Segrarens eko (WEAK-014)
  pendingVictoryEcho?: import('../services/postVictoryNarrativeService').VictoryEcho
  victoryEchoExpires?: number  // matchday after which echo is cleared

  // C-K1 — Landslagsuttagning
  activeNationalTeamCamp?: { startRound: number; endRound: number; playerIds: string[] }
  lastNationalSnub?: { playerId: string; season: number; round: number }

  // Sprint 11 — Truppledarskap (NARR-005)
  leadershipActions?: Array<{
    playerId: string
    action: 'lower_tempo' | 'mentor' | 'private_talk' | 'public_praise'
    fromRound: number
    expiresRound: number
    effect: { stat: string; delta: number }
    mentoredPlayerId?: string   // PC-6: mentor-åtgärden länkar mentorn till en ung spelare (CA-bonus medan aktiv)
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
    // `outcome` = resolutionsvägen (sold_star/loan/mecenat/natural_recovery). Återanvänds
    // som Efterklang-efterdyningens resolutionType — inget separat resolutionType-fält (dublett).
    outcome?: 'sold_star' | 'loan' | 'mecenat' | 'natural_recovery'
    resolvedMatchday?: number          // efterdyning — counter-oberoende stämpel vid resolution
    soldToSurvivePlayerName?: string   // endast sold_star — fångas FÖRE removePlayerId
  }

  // DREAM-014 — Tyst mode (extend preferredMatchMode handled here)
  // Uses preferredMatchMode: 'silent' (existing field extended)

  // DREAM-016 — Bandyhistorisk skoluppgift
  schoolAssignmentThisSeason?: number  // season of last assignment
  schoolAssignmentArchive?: SchoolAssignmentRecord[]

  // DREAM-013 — Lagfotografiet (photos stored in IndexedDB, here just track last generated)
  lastTeamPhotoSeason?: number

  // M7 — Orten feed: rolling window of narrative moments (max 5, newest first)
  recentMoments?: Moment[]

  // M14 — Klubbens era (beräknas varje säsongsstart)
  currentEra?: ClubEra

  // Sprint 25g — Domarsystem
  referees?: Referee[]
  refereeRelations?: RefereeRelation[]
  pendingRefereeMeeting?: import('./GameEvent').GameEvent

  // Sprint 25h — Bandyskandaler (Lager 1)
  activeScandals?: import('../services/scandalService').Scandal[]
  scandalHistory?: import('../services/scandalService').Scandal[]
  // Point deductions applied in calculateStandings (current season)
  pointDeductions?: Record<string, number>
  // Point deductions applied at next season start
  pendingPointDeductions?: Record<string, number>

  // Sprint 25h — Lager 3: Licensnämnden
  licenseStatus?: import('../services/licenseService').LicenseStatus
  consecutiveLossSeasons?: number      // consecutive seasons with net deficit

  // Säsongssignatur (SPEC_SAESONGSSIGNATUR_KAPITEL_C)
  currentSeasonSignature?: SeasonSignature
  pastSeasonSignatures?: SeasonSignature[]
  shownSeasonSignatureRevealSeason?: number  // season when reveal was last shown

  // Sprint 25h — Lager 2: Egna beslut med risk
  wageBudgetOverrunRounds?: number     // consecutive rounds above wageBudget
  wageBudgetWarningSent?: boolean      // first Licensnämnden warning sent
  riskySponsorContract?: {
    sponsorId: string
    riskMaturityRound: number          // earliest round when risk can fire
    acceptedRound: number
    season: number
  }
  riskySponsorOfferSentThisSeason?: number  // season when last offer was generated
  patronWithdrawnSeason?: number       // patron re-emergence cooldown: blocks new patron for 2 seasons after patron withdrawal
  mecenatWithdrawnSeason?: number       // lock new mecenat spawn for 2 seasons after a mecenat withdrawal

  // F1 Stage 2 — per-source cooldowns (shown on SourceSecondaryCard)
  sourceCooldowns?: Partial<Record<string, { roundsLeft: number; totalRounds: number }>>

  // C-P1 — Stale-bias per portal-kort
  // firstShownAt: matchday when card first entered layout (B9 T2B: gap halverar, ej nollställer)
  // lastShownAt: most recent matchday when card was in layout (used to detect gaps)
  // shownCount: B9 T2 — total visningsfrekvens (frekvensgolv för maxvikt)
  cardStaleTracking?: Record<string, { firstShownAt: number; lastShownAt: number; shownCount?: number }>

  // C-B2 — Klack-echo (notable result memory)
  klackEcho?: {
    type: NotableEventType
    resultMatchday: number
    initialWeight: number
    currentWeight: number
    decayPerRound: number
  }

  // B6 — Klubbminne anniversary-system
  activeAnniversaries?: import('../services/clubMemoryService').ActiveAnniversary[]
  anniversariesSeen?: string[]       // eventIds som dismissats

  // C-B3 — Pensionsval
  pendingRetirementDecision?: {
    playerId: string
    quote: string  // player quote shown on card
  }
  lastRetirementSeason?: number       // season when last retirement decision was triggered
  retirementCeremonyCounter?: number  // increments each time a player retires via portal card

  // Score steg 5 — snapshot-pipeline (rullande ligaomgångar, senaste 22)
  scoreSnapshots?: {
    standingsPosition: number[]   // managed klubbs tabellplacering per liga-omgång
    journalistRelation: number[]  // journalist.relationship per liga-omgång
    playerForm: number[]          // managed klubbs avg form per liga-omgång
  }

  // R1 — Decision-fatigue (kö-åldring + tryckindikator)
  fatigueHistory?: number[]   // rullande 7 omgångars meter-värde (matar Sparkline)
  fatigueHotStreak?: number   // consecutive hot-pressure-omgångar (driver fatigue-scen)

  // Squad-pulse (Tier 2C) — rullande 10 omgångars trupp-hälsa
  teamFitnessHistory?: Array<{
    matchday: number
    avgFitness: number
    avgMorale: number
    injuryCount: number
    avgSeasonForm?: number   // ny axel — undefined på äldre poster
    avgSharpness?: number    // ny axel — undefined på äldre poster
  }>

  // Periodisering — säsongsbåge
  managedClubPeriodisation?: 'bygg' | 'hall' | 'toppa' | 'vila'
  managedClubPeriodisationSince?: number  // matchday när läget sattes (för Toppa-spike-tracking)

  // Portal-kurering — story-slot rotation
  lastStorySlotType?: string     // kind från FÖREGÅENDE matchdag — läses av buildPortal, fryst under matchdagen
  currentStorySlotType?: string  // kind visad UNDER pågående matchdag — skrivs vid render, promotas vid omgångsövergång

  // P1 — Annandagsplanering val-mekanik
  annandagsValGjort?: 'A' | 'B' | 'C' | 'D' | null  // val gjort denna säsong
  pendingAnnandagsVal?: boolean                        // trigger: 2 omgångar innan hemmamatch
  pendingAnnandagsGratisentreVal?: boolean             // val C: nollsätt biljettintäkt på matchdagen
  pendingAnnandagsMediaRubrik?: {                      // konsekvensledja: mediarubrik omg+1
    val: 'A' | 'B' | 'C' | 'D'
    triggerRound: number
  }
  pendingAnnandagsKlack?: {                            // konsekvensledja: klack-reaktion omg+2
    val: 'A' | 'B' | 'C' | 'D'
    triggerRound: number
  }

  // C-MK1 — Manager som karaktär (Fas 1)
  managerProfile?: import('./ManagerProfile').ManagerProfile

  // A3 — Match-laddning svit-förändrings-markör
  matchLaddningBandShown?: {
    matchday: number
    streakLength: number
    stateType: 'winning_streak' | 'losing_streak'
  }
}
