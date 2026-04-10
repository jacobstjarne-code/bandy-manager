export interface NamedCharacter {
  id: string
  name: string
  role: string
  age?: number
  isAlive?: boolean
  morale?: number
}

export type JournalistPersona = 'supportive' | 'critical' | 'analytical' | 'sensationalist'

export interface JournalistMemory {
  season: number
  matchday: number
  event: string       // 'refused_press', 'good_answer', 'bad_answer', 'big_win', 'crisis'
  sentiment: number   // -10 to +10
}

export interface Journalist {
  name: string
  outlet: string        // e.g. "Gefle Dagblad", from localPaperName
  persona: JournalistPersona
  relationship: number  // 0-100, replaces journalistRelationship
  memory: JournalistMemory[]  // last 10 interactions
  pressRefusals: number       // times manager refused press conference
  favoritePlayerId?: string   // player they write about most
  lastInteractionMatchday?: number
}

export type ArcPhase =
  | 'newcomer'
  | 'honeymoon'
  | 'grind'
  | 'questioned'
  | 'crisis'
  | 'redemption'
  | 'established'
  | 'legendary'
  | 'farewell'

export interface ArcTransition {
  from: ArcPhase
  to: ArcPhase
  matchday: number
  season: number
  reason: string
}

export interface TrainerArc {
  current: ArcPhase
  history: ArcTransition[]
  seasonCount: number
  bestFinish: number
  titlesWon: number
  consecutiveLosses: number
  consecutiveWins: number
  boardWarningGiven: boolean
  lastCountedFixtureId?: string
}

export type StorylineType =
  | 'rescued_from_unemployment'
  | 'went_fulltime_pro'
  | 'refused_to_go_pro'
  | 'left_for_bigger_club'
  | 'returned_to_club'
  | 'workplace_bond'
  | 'journalist_feud'
  | 'journalist_redemption'
  | 'promotion_sacrifice'
  | 'career_crossroads_stayed'
  | 'underdog_season'
  | 'relegation_escape'
  | 'gala_winner'
  | 'partner_moved_here'
  | 'captain_rallied_team'
  // Arc resolutions
  | 'hungrig_breakthrough'
  | 'joker_vindicated'
  | 'veteran_farewell'
  | 'veteran_stayed'
  | 'lokal_hero_moment'
  | 'contract_drama_resolved'
  | 'derby_echo_resolved'

export interface StorylineEntry {
  id: string
  type: StorylineType
  season: number
  matchday: number
  playerId?: string
  clubId?: string
  description: string
  displayText: string
  resolved: boolean
}

export interface ClubLegend {
  name: string
  position: string
  seasons: number
  totalGoals: number
  totalAssists: number
  titles: string[]
  memorableStory?: string
  retiredSeason: number
}

export interface AllTimeRecords {
  mostGoalsSeason: { playerName: string; goals: number; season: number } | null
  mostAssistsSeason: { playerName: string; assists: number; season: number } | null
  highestRatingSeason: { playerName: string; rating: number; season: number } | null
  bestFinish: { position: number; season: number } | null
  biggestWin: { score: string; opponent: string; season: number; round: number } | null
  championSeasons: number[]
  cupWinSeasons: number[]
}

export type ArcType =
  | 'hungrig_breakthrough'    // Ung hungrig spelare som kämpar för genombrott
  | 'joker_redemption'        // Joker som kostar/räddar — oförutsägbar
  | 'veteran_farewell'        // Veteran med utgående kontrakt, sista säsongen?
  | 'ledare_crisis'           // Kapten/ledare under krisperiod
  | 'lokal_hero'              // Lokalhjälte som gör något stort
  | 'contract_drama'          // Bygger på transfer-spekulationsinkorg
  | 'derby_echo'              // POST-derby efterdyningar (2 omgångar)

export interface ActiveArc {
  id: string
  type: ArcType
  playerId?: string
  opponentClubId?: string     // derby_echo
  startedMatchday: number
  phase: 'building' | 'peak' | 'resolving'
  eventsFired: string[]       // event IDs redan genererade
  decisionsMade: string[]     // choice IDs spelaren valt
  expiresMatchday: number
  data?: Record<string, unknown>
}
