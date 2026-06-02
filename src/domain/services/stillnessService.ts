/**
 * stillnessService — väljer stillness-beat + mikrohändelser för NU-fliken (C-N1).
 *
 * Rena funktioner, deterministiska per (säsong, matchday). Ingen Date.now/Math.random.
 * Konsumerar STILLNESS_BEATS + STILLNESS_MICRO. Enbart narrativa — inga mood-effekter
 * (per Designs Q3, bekräftat).
 */

import type { SaveGame } from '../entities/SaveGame'
import { STILLNESS_BEATS, type StillnessBeat } from '../data/stillnessText'
import { STILLNESS_MICRO, type StillnessMicro } from '../data/stillnessMicroPool'
import type { StillnessSeasonTime, StillnessForm, StillnessProximity } from '../data/stillnessText'
import { getFormResults } from '../../presentation/utils/formUtils'

export interface StillnessContext {
  seasonTime: StillnessSeasonTime
  form?: StillnessForm
  proximity: StillnessProximity
}

function seasonTimeOf(matchday: number): StillnessSeasonTime {
  if (matchday >= 27) return 'playoff'
  if (matchday <= 7) return 'early'
  if (matchday <= 16) return 'mid'
  return 'late'
}

export function buildStillnessContext(game: SaveGame): StillnessContext {
  const md = game.currentMatchday
  // Form: senaste 5 ligaresultat
  const recent = getFormResults(game.managedClubId, game.fixtures, game.clubs).slice(-5)
  const wins = recent.filter(r => r.result === 'V').length
  const losses = recent.filter(r => r.result === 'F').length
  const form: StillnessForm | undefined =
    recent.length >= 3 ? (wins >= 3 ? 'good' : losses >= 3 ? 'poor' : undefined) : undefined

  // Proximity: finns en omatchad managed-fixture nästa matchday?
  const nextManaged = game.fixtures
    .filter(f => f.status !== 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0]
  const proximity: StillnessProximity = nextManaged && nextManaged.matchday - md <= 1 ? 'eve' : 'rest'

  return { seasonTime: seasonTimeOf(md), form, proximity }
}

/** Matchar en taggad post mot kontext: otaggade fält matchar allt. */
function matchesContext(item: { seasonTime?: StillnessSeasonTime; form?: StillnessForm; proximity?: StillnessProximity }, ctx: StillnessContext): boolean {
  if (item.seasonTime && item.seasonTime !== ctx.seasonTime) return false
  if (item.form && item.form !== ctx.form) return false
  if (item.proximity && item.proximity !== ctx.proximity) return false
  return true
}

/** En stillness-beat per dag, deterministiskt per (säsong, matchday).
 *  ctx kan förberäknas av anroparen för att undvika dubbla getFormResults per render. */
export function pickStillnessBeat(game: SaveGame, ctx: StillnessContext = buildStillnessContext(game)): StillnessBeat {
  const candidates = STILLNESS_BEATS.filter(b => matchesContext(b, ctx))
  const pool = candidates.length > 0 ? candidates : STILLNESS_BEATS
  const seed = game.currentSeason * 7919 + game.currentMatchday * 31
  return pool[Math.abs(seed) % pool.length]
}

/** 1–3 mikrohändelser, deterministiskt, utan upprepning inom rundan. */
export function pickStillnessMicro(game: SaveGame, count = 2, ctx: StillnessContext = buildStillnessContext(game)): StillnessMicro[] {
  const candidates = STILLNESS_MICRO.filter(m => matchesContext(m, ctx))
  const pool = candidates.length > 0 ? candidates : STILLNESS_MICRO
  const n = Math.min(count, pool.length)
  const seed = game.currentSeason * 104729 + game.currentMatchday * 1301
  const picked: StillnessMicro[] = []
  const used = new Set<number>()
  let step = 0
  while (picked.length < n && used.size < pool.length) {
    const idx = Math.abs(seed + step * 569) % pool.length
    step++
    if (used.has(idx)) continue
    used.add(idx)
    picked.push(pool[idx])
  }
  return picked
}

/** Stämningspuls per teamFitnessHistory-post (0–100). Återanvänder befintlig data. */
export function computeTeamPulse(game: SaveGame): number[] {
  const hist = (game.teamFitnessHistory ?? []).slice(-7)
  return hist.map(h => {
    const injuryFree = Math.max(0, 100 - (h.injuryCount ?? 0) * 15)
    return Math.round((h.avgMorale + h.avgFitness + injuryFree) / 3)
  })
}
