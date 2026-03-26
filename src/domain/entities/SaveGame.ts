import type { InboxItemType } from '../enums'
import type { Club } from './Club'
import type { Player } from './Player'
import type { League } from './League'
import type { Fixture, TeamSelection } from './Fixture'
import type { MatchWeather } from './Weather'
import type { TrainingFocus, TrainingSession } from './Training'
import type { PlayoffBracket } from './Playoff'
import type { CupBracket } from './Cup'
import type { SeasonSummary } from './SeasonSummary'
import type { ScoutReport, ScoutAssignment } from './Scouting'
import type { GameEvent, TransferBid } from './GameEvent'
import type { OpponentAnalysis } from '../services/opponentAnalysisService'

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

  opponentAnalyses?: Record<string, OpponentAnalysis>  // key = opponentClubId

  activeTalentSearch: TalentSearchRequest | null
  talentSearchResults: TalentSearchResult[]

  version: string
  lastSavedAt: string   // ISO datetime
}
