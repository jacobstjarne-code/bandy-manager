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
  isPenaltyGoal?: boolean
  /** Utvisningens längd (5 eller 10 min) — sätts bara på MatchEventType.Suspension. */
  durationMinutes?: 5 | 10
}

export interface ManagerChoiceEntry {
  type: 'halftime_tactic' | 'started_tired' | 'pep_talk' | 'captain' | 'bench_fit'
  playerId?: string
  /** Structured, not player text — e.g. 'lowered_tempo' or 'condition_38' */
  detail: string
  minute?: number
}

export interface MatchReport {
  playerRatings: Record<string, number>
  shotsHome: number
  shotsAway: number
  onTargetHome: number
  onTargetAway: number
  savesHome: number
  savesAway: number
  cornersHome: number
  cornersAway: number
  penaltiesHome: number
  penaltiesAway: number
  possessionHome: number
  possessionAway: number
  playerOfTheMatchId?: string
  matchProfile?: string
  /** Manager choices logged during the match — raw data for after-match receipt (Ticket #4). */
  managerChoiceLog?: ManagerChoiceEntry[]
}

export interface Fixture {
  id: string
  leagueId: string
  season: number
  roundNumber: number
  matchday: number  // global play order — sort by this, set once at fixture creation
  /** ISO date string (YYYY-MM-DD) stamped at fixture creation from seasonCalendar. */
  date?: string
  /** Hour of tipoff (13-19) stamped at fixture creation from seasonCalendar. */
  tipoffHour?: number

  homeClubId: string
  awayClubId: string

  status: FixtureStatus

  isCup?: boolean
  isNeutralVenue?: boolean  // mekaniskt: nollar hemmafördel i matchCore.ts. Satt av playoffService.ts
                             // (SM-final, Studenternas IP) och cupService.ts (cupens finalhelg, Bollnäs).
  isKnockout?: boolean      // true for all playoff + cup matches (enables overtime/penalties on draw)
  isFinaldag?: boolean       // true for the SM-final fixture
  arenaName?: string         // neutral venue-namn för final/cup-final
  venueCity?: string         // stad för neutral venue
  isCupFinalhelgen?: boolean // true for cup semi + final weekend fixtures
  isAnnandagen?: boolean     // true for the Boxing Day (Dec 26) match
  isNyarsbandy?: boolean     // true for the New Year's Day (Jan 1) match
  isWindowDeadlineDay?: boolean  // true for the transfer window deadline day (Jan 31)

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
  matchStartedAt?: number  // timestamp set when live simulation begins, cleared on completion
  refereeId?: string
  farewellMatchForPlayerId?: string  // C-B3: set for farewell matches
}
