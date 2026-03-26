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

  homeClubId: string
  awayClubId: string

  status: FixtureStatus

  isCup?: boolean

  homeScore: number
  awayScore: number

  homeLineup?: TeamSelection
  awayLineup?: TeamSelection

  events: MatchEvent[]
  report?: MatchReport
}
