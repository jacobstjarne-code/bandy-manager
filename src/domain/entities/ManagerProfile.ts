import type { CoachPersonality } from '../data/managerKaraktarText'

export interface CoachRivalry {
  clubId: string
  personality: CoachPersonality
  h2hWins: number
  h2hDraws: number
  h2hLosses: number
}

export interface ManagerNarrativeEntry {
  season: number
  matchday: number
  type: 'arrival' | 'burnout_peak' | 'era_shift' | 'rivalry' | 'milestone'
  text: string
}

export interface ManagerProfile {
  firstName: string
  lastName: string
  age: number
  hometown: string
  burnoutScore: number       // 0-100
  burnoutHistory: number[]   // per-round scores, capped at 22 entries
  careerWins: number
  careerDraws: number
  careerLosses: number
  seasonsAtClub: number
  contractUntilSeason: number
  monthlySalary: number      // tkr/month
  coachRivalries: CoachRivalry[]
  // PÅSTÅENDEKARTAN (2026-08-24): döpt om från `narrativeLog` — namnkollision
  // med SaveGame.narrativeBeatLog (gating-logg, ingen text) och Player.diary.
  // Se registerfyndet i SLUTTEST_KO.md post 58.
  diary?: ManagerNarrativeEntry[]
}
