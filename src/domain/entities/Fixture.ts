import type { FixtureStatus, MatchEventType } from '../enums'
import type { Tactic } from './Club'

export interface TeamSelection {
  startingPlayerIds: string[]
  benchPlayerIds: string[]
  captainPlayerId?: string
  tactic: Tactic
}

export interface MatchEvent {
  minute: number
  type: MatchEventType
  clubId: string
  playerId?: string
  secondaryPlayerId?: string
  description: string
  isCornerGoal?: boolean
}

export interface MatchReport {
  playerRatings: Record<string, number>
  shotsHome: number
  shotsAway: number
  cornersHome: number
  cornersAway: number
  penaltiesHome: number
  penaltiesAway: number
  possessionHome: number
  possessionAway: number
  playerOfTheMatchId?: string
}

export interface Fixture {
  id: string
  leagueId: string
  season: number
  roundNumber: number
  matchday: number  // global play order — sort by this, set once at fixture creation

  homeClubId: string
  awayClubId: string

  status: FixtureStatus

  isCup?: boolean
  isNeutralVenue?: boolean  // true for SM-final at neutral ground (Studenternas IP, Uppsala)
  isKnockout?: boolean      // true for all playoff + cup matches (enables overtime/penalties on draw)

  // Set after the match if it went to overtime/penalties
  wentToOvertime?: boolean
  wentToPenalties?: boolean
  overtimeResult?: 'home' | 'away'
  penaltyResult?: { home: number; away: number }

  homeScore: number
  awayScore: number

  homeLineup?: TeamSelection
  awayLineup?: TeamSelection

  events: MatchEvent[]
  report?: MatchReport
  attendance?: number
}
