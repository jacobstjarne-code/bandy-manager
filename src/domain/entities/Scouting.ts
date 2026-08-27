import type { PlayerAttributes } from './Player'

export interface ScoutReport {
  playerId: string
  clubId: string
  scoutedDate: string
  scoutedSeason: number
  accuracy: number   // 0-100
  revealedAttributes: Partial<Record<keyof PlayerAttributes, number>>
  estimatedCA: number
  estimatedPA: number
  notes: string
  attributeProfile?: {
    offensive: number
    defensive: number
    physical: number
    mental: number
  }
  isRumorBased?: boolean  // true if generated from transfer rumor (low accuracy)
  /** L3 (mobil speltest-audit, 2026-08-26): "Scoutrapporter" i ScoutingTab.tsx
   *  växte okapat — på mobil kunde en spelare med 15-20 scoutade spelare
   *  behöva scrolla långt förbi rapportlistan för att nå "Spelare att
   *  utvärdera". Ett favoritmärke låter spelaren nåla fast de rapporter som
   *  faktiskt är aktuella (bevakas inför bud) — de undantas från kapningen,
   *  resten kollapsar bakom samma "+N fler"-mönster som redan finns för
   *  positionsgrupperna längre ned i samma fil. */
  shortlisted?: boolean
}

export interface ScoutAssignment {
  targetPlayerId: string
  targetClubId: string
  startedDate: string
  roundsRemaining: number  // 1 or 2
}
