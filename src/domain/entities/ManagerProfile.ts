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

/**
 * O13 (DOM_TRANARMARKNADEN_2026-08-26) — en avslutad eller pågående period i
 * en klubb. Skrivs vid klubbyte (switchManagedClub.ts) och är den enda
 * platsen som vet HUR en period tog slut; `seasonSummaries` vet bara vilka
 * säsonger som spelades var.
 */
export interface ManagerClubSpell {
  clubId: string
  clubName: string
  fromSeason: number
  /** Säsongen perioden tog slut. Utelämnad = perioden pågår. */
  toSeason?: number
  endedBy?: 'fired'
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
  /**
   * Säsonger i NUVARANDE klubb. O13: nollställs till 1 vid klubbyte —
   * fältet hette redan "AtClub" men var i praktiken en karriärräknare
   * eftersom en karriär bara kunde ha en klubb. Ytorna som läser det
   * ("Säsong N i klubben", ClubScreen/TranareTab/SeasonTransitionScene)
   * menade alltid klubben, inte karriären.
   */
  seasonsAtClub: number
  contractUntilSeason: number
  monthlySalary: number      // tkr/month
  coachRivalries: CoachRivalry[]
  // PÅSTÅENDEKARTAN (2026-08-24): döpt om från `narrativeLog` — namnkollision
  // med SaveGame.narrativeBeatLog (gating-logg, ingen text) och Player.diary.
  // Se registerfyndet i SLUTTEST_KO.md post 58.
  diary?: ManagerNarrativeEntry[]

  // ── O13, tränarmarknaden (DOM_TRANARMARKNADEN_2026-08-26) ────────────────
  /**
   * Antal avsked. Domens skärpning 3 ("Karriären ska kunna ta slut") hänger
   * på detta — efter tredje avskedet ringer ingen. Kan inte härledas ur
   * seasonSummaries: de vet vad som hände sportsligt, inte vad styrelsen
   * beslutade. Saknas på gamla saves ⇒ läs som 0.
   */
  firings?: number
  /**
   * Totalt antal säsonger som huvudtränare, ÖVER klubbgränser. Skild från
   * seasonsAtClub, som nollställs vid byte. Saknas på gamla saves ⇒ läs som
   * seasonsAtClub (som då per definition är hela karriären).
   */
  careerSeasons?: number
  /** Klubbperioder, äldst först. Den nuvarande perioden saknar toSeason. */
  clubSpells?: ManagerClubSpell[]
}
