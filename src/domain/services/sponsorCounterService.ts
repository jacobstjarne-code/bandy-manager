import { csLinearRamp } from './communityStandingScaling'
import type { Sponsor } from '../entities/Sponsor'

/**
 * sponsorCounterService — DOM_SPONSOR_MOTBUD_2026-08-31.md.
 *
 * "Motbudet är ett SPEL, inte en förhandling." Ett sponsorerbjudande har
 * fasta villkor (X kr/omg). Motbudet lägger till: kräv bättre villkor (Y >
 * X) — och riskera att sponsorn drar sig ur helt. Enkelrunda, tre utfall,
 * avgjorda av Y mot sponsorns DOLDA reservationsnivå R:
 *   Y ≤ R           → accepterar (till Y)
 *   R < Y ≤ R×BAND   → står fast (originalet X finns kvar, ingen förlust)
 *   Y > R×BAND       → drar sig ur, sannolikhet stigande med avståndet
 *
 * "Modest motbud lyckas nästan alltid" (GODKÄNT NÄR 2) förutsätter att R
 * ligger en bit ovanför X för alla personligheter — annars är ALLA motbud
 * riskabla och spaken aldrig värd att dra. Se PERSONALITY_RESERVATION_MULT.
 *
 * personality var deklarerad på Sponsor men ALDRIG satt av någon generator
 * (verifierat: 0 skrivställen i sponsorService.ts/contextualSponsorService.ts
 * före denna leverans) — tilldelas nu i generateSponsorOffer (sponsorService.ts).
 */

export type SponsorPersonality = NonNullable<Sponsor['personality']>
export type SponsorCounterOutcome = 'accepted' | 'stood_firm' | 'walked_away'

export interface SponsorCounterResult {
  outcome: SponsorCounterOutcome
  reservation: number
  walkAwayProbability: number
}

/** "local = lojal, grund ficka, låg reservation... regional = djupare ficka,
 *  högre tak... foundation = kalibreras" (domen). Multiplikator på X. */
export const PERSONALITY_RESERVATION_MULT: Record<SponsorPersonality, number> = {
  local: 1.15,
  regional: 1.35,
  foundation: 1.25,
}

/** "regional... går lättare" — hur snabbt walkaway-chansen stiger per andel
 *  över reservationsbandet. Högre = bryter lättare. */
export const PERSONALITY_WALKAWAY_SENSITIVITY: Record<SponsorPersonality, number> = {
  local: 0.55,
  regional: 1.30,
  foundation: 0.90,
}

/** "hög CS / framgång = du har hävstång, sponsorer... går mer sällan" —
 *  reservationen skalar upp med communityStanding, samma csLinearRamp-
 *  disciplin som resten av anspråk 4 (golv/tak, aldrig en binär tröskel). */
export const RESERVATION_CS_FLOOR = 50
export const RESERVATION_CS_CEIL = 90
export const RESERVATION_CS_LEVERAGE_CEIL = 1.20

/** Bandet ovanför reservationen där sponsorn "står fast" utan risk — under
 *  R är det redan ett accept, ovanför bandet börjar walkaway-chansen. */
export const STAND_FIRM_BAND = 1.15

/** Tak på walkaway-sannolikheten — aldrig en garanterad förlust, ett
 *  extremt bud har ändå en liten chans att tas emot av en desperat sponsor. */
export const MAX_WALKAWAY_PROBABILITY = 0.90

export function computeSponsorReservation(
  originalWeeklyIncome: number,
  personality: SponsorPersonality,
  communityStanding: number,
): number {
  const leverage = csLinearRamp(communityStanding, RESERVATION_CS_FLOOR, RESERVATION_CS_CEIL, 1.0, RESERVATION_CS_LEVERAGE_CEIL)
  return originalWeeklyIncome * PERSONALITY_RESERVATION_MULT[personality] * leverage
}

export function computeWalkAwayProbability(
  requestedWeeklyIncome: number,
  reservation: number,
  personality: SponsorPersonality,
): number {
  const standFirmCeiling = reservation * STAND_FIRM_BAND
  if (requestedWeeklyIncome <= standFirmCeiling) return 0
  const excessRatio = (requestedWeeklyIncome - standFirmCeiling) / reservation
  return Math.min(MAX_WALKAWAY_PROBABILITY, excessRatio * PERSONALITY_WALKAWAY_SENSITIVITY[personality])
}

/**
 * Enkelrunda: ETT bud, ETT slutbesked. `rand` är den seedade generatorn
 * (aldrig Math.random direkt — samma disciplin som resten av spelet).
 */
export function resolveSponsorCounter(
  requestedWeeklyIncome: number,
  originalWeeklyIncome: number,
  personality: SponsorPersonality,
  communityStanding: number,
  rand: () => number,
): SponsorCounterResult {
  const reservation = computeSponsorReservation(originalWeeklyIncome, personality, communityStanding)
  if (requestedWeeklyIncome <= reservation) {
    return { outcome: 'accepted', reservation, walkAwayProbability: 0 }
  }
  const walkAwayProbability = computeWalkAwayProbability(requestedWeeklyIncome, reservation, personality)
  const outcome: SponsorCounterOutcome = walkAwayProbability > 0 && rand() < walkAwayProbability ? 'walked_away' : 'stood_firm'
  return { outcome, reservation, walkAwayProbability }
}
