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
}

export interface ScoutAssignment {
  targetPlayerId: string
  targetClubId: string
  startedDate: string
  roundsRemaining: number  // 1 or 2
}
