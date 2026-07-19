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

import type { DemandCategory, PendingDemand } from './Demand'

// Kravmotor (2026-07-19): type-unionen bytt från de ursprungliga
// buy_player/change_tactic/fire_player/name_facility (noll konsumenter
// switchade på dem, verifierat) till de fyra kategorier Jacob specade i
// detalj (speltid/tabellplacering/ungdom/synliga pengar) — se
// entities/Demand.ts's DemandCategory. De gamla strängarna matchade inte
// den specade listan (buy_player/fire_player har ingen motsvarighet där);
// namngiven avvikelse, inte tyst gissning — flagga om fel tolkning.
export interface MecenatDemand {
  type: DemandCategory
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
  // M48 (textaudit 2026-07-04): var ALDRIG populerad — WIRAD 2026-07-19 av
  // kravmotorn (demandEngine.ts, generering+utvärdering i eventProcessor.ts).
  // eventProcessor.ts:s påminnelse- och withdrawal-events
  // (MECENAT_WITHDRAWAL_TEXT) läser denna arrayen och når nu spelaren.
  demands: MecenatDemand[]
  // Kravmotor (2026-07-19): kravet som väntar på sitt avgörande (deadline
  // ej nådd än). demands ovan är historiken av KONSEKUTIVT ouppfyllda krav
  // — rensas till [] vid varje uppfyllt krav, så .length>=3 (withdrawal-
  // tröskeln, redan byggd) betyder exakt "tre i rad", inte "tre totalt".
  pendingDemand?: PendingDemand
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
