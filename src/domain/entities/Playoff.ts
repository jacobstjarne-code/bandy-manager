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

// A2 (långspelsaudit, 10 säsonger, 2026-08-17): resolved motståndare/resultat för
// den serie som slog ut managed club — satt EN gång i playoffProcessor.ts vid
// elimineringstillfället (samma stund inbox-raden skapas), inte härlett ur
// game.playoffBracket vid render. Rotorsak till buggen den ersätter: AnslagOverlay
// härledde samma data på nytt vid render OCH kastade bort resultatet av den
// substitutionen (finalBody var redan frusen som const innan playoff-blocket körde)
// — {motståndare}/{resultat} rendrades alltid bokstavligt för playoff_eliminated_*.
export interface PlayoffEliminationInfo {
  season: number
  round: PlayoffRound
  opponentName: string
  resultat: string  // t.ex. "3–2" — den avgörande matchens slutresultat
}
