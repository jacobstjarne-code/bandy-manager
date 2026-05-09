export type ClubScenario =
  | 'underdog'
  | 'serie_giant'
  | 'kusinen_fran_landet'
  | 'storstadsutmanare'
  | 'newcomer'
  | 'established'

export type PrevResult =
  | 'cup_winner'
  | 'cup_eliminated_round1'
  | 'league_champion'
  | 'playoff_eliminated_quarter'
  | 'no_playoff'

export interface AnslagVariant {
  body: string
  weight?: number
  scenarios?: ClubScenario[]
  minSeason?: number
  prevResult?: PrevResult[]
}

export interface AnslagText {
  chapter: string
  variants: AnslagVariant[]
  bodyDirektkval?: string
}
