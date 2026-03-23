import type { PlayoffStatus, PlayoffRound } from '../enums'

export interface PlayoffSeries {
  id: string
  round: PlayoffRound
  homeClubId: string
  awayClubId: string
  fixtures: string[]       // fixture IDs
  homeWins: number
  awayWins: number
  winnerId: string | null
  loserId: string | null
}

export interface PlayoffBracket {
  season: number
  status: PlayoffStatus
  quarterFinals: PlayoffSeries[]
  semiFinals: PlayoffSeries[]
  final: PlayoffSeries | null
  champion: string | null
}
