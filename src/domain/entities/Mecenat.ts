export type MecenatType =
  | 'brukspatron'
  | 'skogsägare'
  | 'lokal_handlare'
  | 'entrepreneur'
  | 'it_miljonär'
  | 'fastigheter'
  | 'jordbrukare'

export type MecenatPersonality =
  | 'tyst_kraft'
  | 'showman'
  | 'kalkylator'
  | 'nostalgiker'
  | 'kontrollfreak'
  | 'filantropen'

export interface MecenatDemand {
  type: 'buy_player' | 'change_tactic' | 'fire_player' | 'name_facility'
  description: string
  targetPlayerId?: string
}

export interface SocialEvent {
  type: 'jakt' | 'middag' | 'golfrunda' | 'bastu_affärssamtal' | 'vinkväll' | 'segelbåt' | 'hockeymatch' | 'vernissage'
  mecenatId: string
  season: number
  matchday: number
}

export interface Mecenat {
  id: string
  name: string
  gender: 'male' | 'female'
  business: string
  businessType: MecenatType
  wealth: number
  personality: MecenatPersonality
  influence: number
  happiness: number
  patience: number
  contribution: number
  totalContributed: number
  demands: MecenatDemand[]
  socialExpectations: SocialEvent[]
  isActive: boolean
  arrivedSeason: number
  favoritePlayerId?: string
  wantsStyle?: string
  silentShout: number
  lastSocialRound?: number
  lastInteractionRound?: number
}
