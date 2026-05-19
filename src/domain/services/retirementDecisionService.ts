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

function getPositionThreshold(position: string): number {
  return AGE_THRESHOLDS[position] ?? 33
}

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

/** Injury history component: injury entries in narrativeLog add risk */
export function injuryScore(player: Player): number {
  const injuryCount = (player.narrativeLog ?? []).filter(e => e.type === 'injury').length
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
