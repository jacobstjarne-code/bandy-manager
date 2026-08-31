/**
 * C-B3 — Pensionsval-event
 * Väljer kandidat för pensionsbesluts-portal-kortet.
 * En kandidat per säsong, väljs baserat på ålder + kondition + skadehistorik.
 */

import type { SaveGame } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { PlayerPosition } from '../enums'
import { RETIREMENT_CARD_QUOTES } from '../data/retirementText'

const AGE_THRESHOLDS: Partial<Record<string, number>> = {
  [PlayerPosition.Goalkeeper]: 36,
  [PlayerPosition.Defender]:   34,
  [PlayerPosition.Half]:       33,
  [PlayerPosition.Forward]:    33,
}

export function getPositionThreshold(position: string): number {
  return AGE_THRESHOLDS[position] ?? 33
}

/**
 * Auditens critical #2 (Jacobs körorder 2026-08-31, kodläst): getCandidateScore
 * har inget golv — conditionScore ensam når upp till 4 (fitness 0) och
 * injuryScore lägger 0,5 per skadepost, så en 24-åring med dålig fitness och
 * skadehistorik kunde bli pensionskandidat trots att ageScore(24) = 0. Fitness/
 * skador ska kunna ACCELERERA en spelare som redan är i pensionsåldern, aldrig
 * TRIGGA en ung. Marginalen är en känslofråga (Jacobs, inte Codes) — 4 år
 * default ger forward/halv valbara från ~29, målvakt från ~32. Justera
 * konstanten, inte golv-logiken, om känslan är fel i spel.
 */
export const RETIREMENT_AGE_MARGIN = 4

/** Age component: how many years above the position-specific threshold */
export function ageScore(player: Player): number {
  const threshold = getPositionThreshold(player.position)
  return Math.max(0, player.age - threshold)
}

/** Fitness component: low fitness adds to score (proxy for declining condition) */
export function conditionScore(player: Player): number {
  const cond = player.fitness ?? 80
  return Math.max(0, (40 - cond) / 10)
}

/** Injury history component: injury entries in diary add risk */
export function injuryScore(player: Player): number {
  const injuryCount = (player.diary ?? []).filter(e => e.type === 'injury').length
  return injuryCount * 0.5
}

/** Combined retirement-candidacy score. Score >= 1 means eligible. */
export function getCandidateScore(player: Player): number {
  return ageScore(player) + conditionScore(player) + injuryScore(player)
}

/**
 * Returns the best retirement-decision candidate for the managed club,
 * or null if:
 * - a decision was already triggered this season
 * - no candidates score >= 1
 */
export function getRetirementCandidate(game: SaveGame): Player | null {
  // Only one candidate per season
  if (game.lastRetirementSeason === game.currentSeason) return null

  const candidates = game.players
    .filter(p => p.clubId === game.managedClubId)
    // Åldersgolvet FÖRE poängen (kritiskt — se RETIREMENT_AGE_MARGIN ovan):
    // exkluderar en spelare helt oavsett fitness/skadehistorik om de inte
    // ens är i närheten av pensionsåldern för sin position.
    .filter(p => p.age >= getPositionThreshold(p.position) - RETIREMENT_AGE_MARGIN)
    .map(p => ({ player: p, score: getCandidateScore(p) }))
    .filter(({ score }) => score >= 1)
    .sort((a, b) => b.score - a.score)

  return candidates[0]?.player ?? null
}

/** Returns an age-appropriate quote for the portal card */
export function getRetirementQuote(player: Player): string {
  const age = player.age
  const pool = age >= 37
    ? RETIREMENT_CARD_QUOTES.elder
    : age >= 35
      ? RETIREMENT_CARD_QUOTES.veteran
      : RETIREMENT_CARD_QUOTES.young
  const idx = player.age % pool.length
  return pool[idx]
}
