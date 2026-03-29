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
}

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
}
