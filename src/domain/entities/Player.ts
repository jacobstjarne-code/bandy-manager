import type { PlayerPosition, PlayerArchetype } from '../enums'
import type { PlayerTrait } from '../data/playerTraits'
export type { PlayerTrait }

export interface PlayerAttributes {
  skating: number         // 0-100
  acceleration: number    // 0-100
  stamina: number         // 0-100
  ballControl: number     // 0-100
  passing: number         // 0-100
  shooting: number        // 0-100
  dribbling: number       // 0-100
  vision: number          // 0-100
  decisions: number       // 0-100
  workRate: number        // 0-100
  positioning: number     // 0-100
  defending: number       // 0-100
  cornerSkill: number     // 0-100
  goalkeeping: number     // 0-100
  // Hidden attribute — visible in player development screen, not in match view.
  // How fast the player recovers defensive position after an offensive corner.
  // Low = team is exposed in post-corner counter window.
  cornerRecovery: number  // 0-100
}

// Hidden suspension profile — never shown as a label. Surfaces through match patterns.
// Distribution: situation 24%, volym 4%, intensitet 6%, ren 21%, neutral 45%
export type SuspensionProfile = 'situation' | 'volym' | 'intensitet' | 'ren' | 'neutral'

export interface PlayerSeasonStats {
  gamesPlayed: number
  goals: number
  assists: number
  cornerGoals: number
  penaltyGoals: number
  yellowCards: number
  redCards: number
  suspensions: number
  averageRating: number
  minutesPlayed: number
}

export interface PlayerCareerStats {
  totalGames: number
  totalGoals: number
  totalAssists: number
  seasonsPlayed: number
}

export interface CareerMilestone {
  type: 'debutGoal' | 'hatTrick' | 'games100' | 'goals50' | 'promoted' | 'cupWinner'
  season: number
  round: number
  description: string
}

export interface PlayerDayJob {
  title: string        // e.g. "Lärare", "Snickare", "Systemutvecklare"
  flexibility: number  // 50-100 (how compatible with training/matches)
  weeklyIncome: number // 500-3000 SEK extra
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  age: number
  nationality: string
  clubId: string
  academyClubId?: string
  isHomegrown: boolean
  position: PlayerPosition
  archetype: PlayerArchetype

  salary: number
  contractUntilSeason: number
  marketValue: number

  morale: number       // 0-100
  form: number         // 0-100
  fitness: number      // 0-100
  sharpness: number    // 0-100

  dayJob?: PlayerDayJob
  isFullTimePro: boolean // true = no day job, full focus

  currentAbility: number    // 0-100
  startSeasonCA?: number    // CA at start of season (for most improved tracking)
  caHistory?: Array<{ season: number; ca: number }>
  potentialAbility: number  // 0-100
  developmentRate: number   // 0-100

  injuryProneness: number   // 0-100
  discipline: number        // 0-100
  suspensionProfile?: SuspensionProfile  // hidden — not shown to player

  attributes: PlayerAttributes

  isInjured: boolean
  injuryDaysRemaining: number
  suspensionGamesRemaining: number

  seasonStats: PlayerSeasonStats
  careerStats: PlayerCareerStats
  careerMilestones?: CareerMilestone[]
  isOnLoan?: boolean
  loanClubName?: string
  promotedFromAcademy?: boolean
  promotionRound?: number
  isCharacterPlayer?: boolean
  trait?: PlayerTrait
  loyaltyScore?: number  // 0–10
  shirtNumber?: number
  availability?: PlayerAvailability
  lowMoraleDays?: number  // consecutive matchdays with morale < 30
  seasonHistory?: Array<{ season: number; goals: number; assists: number; games: number; rating: number; clubId: string }>

  // Sprint 9 — DREAM-012: injury narrative
  familyContext?: string    // generated once, persists across injuries
  injuryNarrative?: string  // current injury story text

  // V1.4 — Player narrative diary (auto-generated)
  narrativeLog?: Array<{
    season: number
    matchday: number
    text: string
    type: 'milestone' | 'form' | 'injury' | 'transfer' | 'storyline'
  }>
}

export type PlayerAvailability =
  | 'unavailable'
  | 'contract_expiring'
  | 'unhappy'
  | 'surplus'
  | 'financial'
  | 'want_to_leave'
