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
  // M48 (textaudit 2026-07-04): ALDRIG populerad någonstans i src/ — sätts till
  // [] vid skapande (mecenatService.ts) och rörs aldrig igen. eventProcessor.ts:s
  // påminnelse- och withdrawal-events (MECENAT_WITHDRAWAL_TEXT, tre rika
  // personlighetsgated avsked-texter) kräver demands.length > 0/>= 3 — helt
  // onåbara. Se BACKLOG.md "BYGGT MEN OSYNLIGT".
  demands: MecenatDemand[]
  socialExpectations: SocialEvent[]
  isActive: boolean
  arrivedSeason: number
  favoritePlayerId?: string
  wantsStyle?: string
  silentShout: number
  lastSocialRound?: number
  lastInteractionRound?: number
  backstory?: string
  // NARR-001: aging + retirement
  age?: number                       // 45-72 vid skapande
  yearsActive?: number               // ökar varje säsongsslut
  retirementThreshold?: number       // 5-8 år beroende på personlighet
  hasAnnouncedRetirement?: boolean   // förhindrar upprepat trigger
}
