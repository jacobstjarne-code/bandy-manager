/**
 * Ommätning för DOM_MECENAT_PATRON_MODELLFORM_2026-09-08.
 *
 * Samma isolerade form som mätningen 2026-08-26: CS hålls konstant och
 * avhopp modelleras inte, så tabellen mäter just ankomstmodellen. Skillnaden
 * är att produktionskodens riktiga, deterministiska save+säsong-rullning
 * används en gång per säsong i stället för 13/22 gånger per säsong.
 *
 * Kör: node_modules/.bin/vite-node scripts/mecenat-patron-sasongsrullning-matning-2026-09-09.ts
 */
import {
  passesSeasonalEmergenceRoll,
  seasonalEmergenceProbability,
} from '../src/domain/services/mecenatPatronEmergenceService'

const SEASONS = 10
const TRIALS = 2000
const CLUB_ID = 'club_forsbacka'

function mecenatCapForCs(cs: number): number {
  return cs >= 85 ? 3 : cs >= 70 ? 2 : 1
}

function rollInput(worldSeed: number, season: number) {
  return {
    id: `measurement_${worldSeed}`,
    worldSeed,
    managedClubId: CLUB_ID,
    currentSeason: season,
  }
}

function simulateMecenatCount(cs: number, worldSeed: number): number {
  let active = 0
  for (let offset = 0; offset < SEASONS; offset++) {
    if (active >= mecenatCapForCs(cs)) continue
    const game = rollInput(worldSeed, 2026 + offset)
    if (passesSeasonalEmergenceRoll(game, 'mecenat', cs)) active++
  }
  return active
}

function simulatePatronFirstArrivalSeason(cs: number, worldSeed: number): number | null {
  for (let offset = 0; offset < SEASONS; offset++) {
    const game = rollInput(worldSeed, 2026 + offset)
    if (passesSeasonalEmergenceRoll(game, 'patron', cs)) return offset + 1
  }
  return null
}

function countStats(values: number[]): string {
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return `medel=${mean.toFixed(2)} median=${sorted[Math.floor(sorted.length / 2)]} min=${sorted[0]} max=${sorted.at(-1)}`
}

console.log(`\n=== Seedad mecenat-/patronrullning: ${TRIALS} körningar × ${SEASONS} säsonger ===\n`)

console.log('--- MECENAT: antal anlända över tio säsonger ---')
for (const cs of [40, 60, 80, 100]) {
  const arrivals = Array.from({ length: TRIALS }, (_, seed) => simulateMecenatCount(cs, seed))
  const never = arrivals.filter(value => value === 0).length / TRIALS
  console.log(
    `cs=${cs} · ${(seasonalEmergenceProbability('mecenat', cs) * 100).toFixed(1)}%/säsong · tak=${mecenatCapForCs(cs)} · ${countStats(arrivals)} · noll=${(never * 100).toFixed(1)}%`,
  )
}

console.log('\n--- PATRON: första ankomstsäsong, givet upplåst era ---')
for (const cs of [40, 60, 80, 100]) {
  const arrivals = Array.from({ length: TRIALS }, (_, seed) => simulatePatronFirstArrivalSeason(cs, seed))
  const arrived = arrivals.filter((value): value is number => value !== null)
  const ever = arrived.length / TRIALS
  const meanSeason = arrived.reduce((sum, value) => sum + value, 0) / Math.max(1, arrived.length)
  console.log(
    `cs=${cs} · ${(seasonalEmergenceProbability('patron', cs) * 100).toFixed(1)}%/säsong · inom tio=${(ever * 100).toFixed(1)}% · medel-ankomst=${meanSeason.toFixed(1)} · aldrig=${((1 - ever) * 100).toFixed(1)}%`,
  )
}

console.log('\n=== SLUT ===\n')
