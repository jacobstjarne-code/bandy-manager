import type { FixtureStatus, MatchEventType } from '../enums'
import type { Tactic } from './Club'

export interface TeamSelection {
  startingPlayerIds: string[]
  benchPlayerIds: string[]
  captainPlayerId?: string
  tactic: Tactic
  /**
   * SLUTTEST_KO.md 4.8 (andra halvan, 2026-08-18): true när laget valdes av
   * simulateRemainingStep()'s auto-pick (bästa 11 på currentAbility, kondition
   * ignorerad) istället för av spelaren. Läses av started_tired-loggningen i
   * roundProcessor.ts/matchActions.ts för att sätta attributionstexten.
   */
  autoSelected?: boolean
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
  /** B12 steg 2a (DOM_B12_STEG2_2026-08-19.md): numerärt läge vid eventets
   *  ögonblick, ur clubId:s eget perspektiv. Ren avläsning av redan beräknad
   *  state (homeActiveSuspensions/awayActiveSuspensions) — ingen ny
   *  sannolikhetsberäkning, ingen RNG-konsumtion. */
  manpowerState?: { ownSuspended: number; opponentSuspended: number }
  /** B12 steg 2, fält 2/4: etikettering av EGET lags taktikkonfiguration vid
   *  eventets ögonblick — exakt de villkor buildSequenceWeights (matchCore.ts)
   *  redan förgrenar på. Tom array = inget avvikande läge aktivt (default). */
  tacticalFactors?: string[]
  /** B12 steg 2, fält 3/4: motorförhållanden som faktiskt påverkade
   *  målchansen vid eventets ögonblick — bara de mekanismer koden verkligen
   *  läser (hot_hand, derby, weather, second_half_mode, equalizer_momentum).
   *  "second_half_mode" slår ihop andrahalvlekläge och post-paus-urgency
   *  eftersom motorn multiplicerar dem in i samma homeModeAttackMult/
   *  awayModeAttackMult utan separat spårning — att särskilja dem hade
   *  fabricerat precision motorn inte har. Tom array = inget avvikande
   *  villkor aktivt (default). */
  contributingFactors?: string[]
  /** B12 steg 2, fält 4/4: omskrivning av den redan avgjorda `seqType` som
   *  skapade eventet, till tre möjliga värden. INTE `'FREE_HIT'` — frislagsmål
   *  skrivs av `MatchLiveScreen`, inte av `matchCore` (DOM_B12_STEG2s
   *  uttryckliga begränsning: hellre tre sanna värden än fyra där ett aldrig
   *  sätts). Sätts bara på skott-/målutfall (Goal/Assist/Save/Corner) —
   *  Suspension/Substitution har inget "ursprung" i den bemärkelsen och
   *  lämnas `undefined`, inte ett gissat värde. */
  origin?: 'OPEN_PLAY' | 'CORNER' | 'PENALTY'
  /** B12 steg 2 — CLASS C, medvetet aldrig satt av matchCore i denna omgång.
   *  Kräver att motorn kan peka ut en enskild ansvarig spelare generellt
   *  (inte bara i den smala kontringsmåls-pathwayn), vilket den inte kan
   *  idag. Optional i typen, dokumenterat tomt — sätts av V2. */
  primaryCause?: string
  /** Se primaryCause ovan — samma skäl, samma V2-gräns. */
  responsiblePlayerId?: string
}

export interface ManagerChoiceEntry {
  type: 'halftime_tactic' | 'started_tired' | 'pep_talk' | 'captain' | 'bench_fit'
  playerId?: string
  /** Structured, not player text — e.g. 'lowered_tempo' or 'condition_38' */
  detail: string
  minute?: number
  /** 4.8 (andra halvan): kopierat från TeamSelection.autoSelected — bara satt på started_tired. */
  autoSelected?: boolean
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
