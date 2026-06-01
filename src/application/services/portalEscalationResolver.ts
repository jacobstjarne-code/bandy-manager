/**
 * portalEscalationResolver — avgör upptakt-sub-state inför slutspelet (C-SD2).
 *
 * Upptakt visas exakt sista 3 omgångarna av grundserien OCH bara om något
 * matematiskt står på spel. Cementerat mittfält → ingen upptakt (ingen falsk signal).
 *
 * Ren funktion. Bygger på computeManagedStanding.
 */

import type { SaveGame } from '../../domain/entities/SaveGame'
import { computeManagedStanding, REGULAR_SEASON_ROUNDS } from './clubStandingService'
import { isManagedClubInPlayoff } from '../../domain/data/seasonPhases'
import { getPlayoffSeriesContext } from '../../domain/services/portal/playoffSeriesContext'
import { PlayoffRound } from '../../domain/enums'

export type EscalationSubState = 'sakrat' | 'farozon' | 'mittfalt' | 'bottenstrid' | null

const PLAYOFF_CUTOFF = 8      // topp 8 till slutspel
const RELEGATION_CUTOFF = 11  // plats 11–12 (av 12) till kval/nedflyttning
const UPPTAKT_WINDOW = 3      // sista 3 omgångarna

export function getEscalationSubState(game: SaveGame): EscalationSubState {
  // Bara grundserien — inte under slutspel/åskådarläge
  if (isManagedClubInPlayoff(game)) return null

  const standing = computeManagedStanding(game)
  if (!standing) return null

  const { remainingRounds, minPossiblePlace, maxPossiblePlace } = standing
  // Upptakt-fönster: exakt sista 3 omgångarna (1–3 kvar)
  if (remainingRounds < 1 || remainingRounds > UPPTAKT_WINDOW) return null

  const safePlayoff = maxPossiblePlace <= PLAYOFF_CUTOFF      // garanterad slutspelsplats
  const outOfPlayoff = minPossiblePlace > PLAYOFF_CUTOFF      // matematiskt utom räckhåll för slutspel
  const relegationRisk = maxPossiblePlace >= RELEGATION_CUTOFF // kan halka ner i kvalzonen

  // bottenstrid: slutspelet borta men kvalplatsen på spel
  if (outOfPlayoff) {
    return relegationRisk ? 'bottenstrid' : 'mittfalt'
  }

  // säkrat: garanterad slutspelsplats — kämpar bara om seedning om placering kan röra sig
  if (safePlayoff) {
    return minPossiblePlace < maxPossiblePlace ? 'sakrat' : 'mittfalt'
  }

  // farozon: slutspelet matematiskt på spel (nåbart men ej säkrat)
  return 'farozon'
}

/** Återstående grundserie-omgångar (för countdown). */
export function getRemainingRegularRounds(game: SaveGame): number {
  const standing = computeManagedStanding(game)
  return standing?.remainingRounds ?? Math.max(0, REGULAR_SEASON_ROUNDS - game.currentMatchday)
}

/** Visar vi upptakt-portalen? (sub-state aktiv och inte mittfält). */
export function shouldShowUpptakt(game: SaveGame): boolean {
  const s = getEscalationSubState(game)
  return s !== null && s !== 'mittfalt'
}

/**
 * Primary-vikt-klass för eskaleringens warm-mellansteg (C-SD2 4:e axeln).
 * Returnerar warm-klassen ENBART för semifinal + upptakt — kvart/final/grundserie
 * får null (befintlig vikt-logik i NextMatchCard behålls oförändrad).
 *
 *   Upptakt (säkrat/farozon/bottenstrid) → primary-weight-2-warm
 *   Semifinal                            → primary-weight-2-warm
 *   Kvart / Final / Grundserie           → null (befintlig: w2/w3/w1)
 */
export function getEscalationPrimaryWeightClass(game: SaveGame): string | null {
  const ctx = getPlayoffSeriesContext(game)
  if (ctx) {
    return ctx.round === PlayoffRound.SemiFinal ? 'primary-weight-2-warm' : null
  }
  return shouldShowUpptakt(game) ? 'primary-weight-2-warm' : null
}
