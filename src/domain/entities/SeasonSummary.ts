import type { ClubExpectation } from '../enums'

export interface SeasonSummary {
  season: number
  clubId: string
  clubName: string

  finalPosition: number
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  playoffResult: 'champion' | 'finalist' | 'semifinal' | 'quarterfinal' | 'didNotQualify' | null

  boardExpectation: ClubExpectation
  metExpectation: boolean
  expectationVerdict: 'exceeded' | 'met' | 'failed'

  topScorer: { playerId: string; name: string; goals: number; assists: number } | null
  topAssister: { playerId: string; name: string; assists: number } | null
  topRated: { playerId: string; name: string; avgRating: number; games: number } | null
  mostImproved: { playerId: string; name: string; caGain: number; startCA: number; endCA: number } | null
  youngPlayer: { playerId: string; name: string; age: number; goals: number; avgRating: number } | null

  totalGoals: number
  totalAssists: number
  totalCornerGoals: number
  totalCleanSheets: number
  longestWinStreak: number
  longestLossStreak: number
  biggestWin: { opponent: string; score: string; round: number } | null
  worstLoss: { opponent: string; score: string; round: number } | null

  homeRecord: { wins: number; draws: number; losses: number }
  awayRecord: { wins: number; draws: number; losses: number }
  firstHalfPoints: number
  secondHalfPoints: number
  formTrend: 'improving' | 'stable' | 'declining'

  totalInjuries: number
  mostInjuredPlayer: { name: string; injuries: number } | null

  startFinances: number
  endFinances: number
  financialChange: number

  youthIntakeCount: number
  bestYouthProspect: { name: string; position: string; potential: number } | null

  roundPoints: number[]   // points per round for chart (cumulative)

  narrativeSummary: string

  cupResult?: 'winner' | 'finalist' | 'semifinal' | 'quarter' | 'eliminated' | null
  standingsSnapshot?: Array<{ clubId: string; position: number; points: number }>
  storyTriggers?: Array<{
    type: 'academyStarBorn' | 'rivalBoughtOurPlayer' | 'veteranFarewell' | 'hatTrickHero' | 'topScorerDebut' | 'comebackKing'
    headline: string
    body: string
    relatedPlayerId?: string
    relatedClubId?: string
  }>
}
