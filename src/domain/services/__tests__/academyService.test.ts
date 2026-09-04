import { describe, it, expect } from 'vitest'
import { getPromotionTiming, simulateYouthMatch, generateYouthTeam } from '../academyService'
import { mulberry32 } from '../../utils/random'
import type { Club } from '../../entities/Club'
import type { YouthTeam } from '../../entities/Academy'

const club = { id: 'club_x', youthQuality: 60, youthDevelopment: 60 } as unknown as Club

describe('getPromotionTiming — samma readiness-sanning som Akademi', () => {
  it('klassar en icke-redo spelare som tidig även när CA/confidence annars låg i good-intervallet', () => {
    expect(getPromotionTiming({
      currentAbility: 30,
      confidence: 60,
      age: 18,
      readyForPromotion: false,
    })).toBe('early')
  })
})

/**
 * PÅSTÅENDEKARTAN SANNINGEN-SAKNAS-fix (2026-08-25, Jacobs dom: "bygg
 * räknaren"): roundsReadyForPromotion ska tick:a upp varje P19-omgång
 * spelaren är redo, och nollställas så fort readyForPromotion faller
 * tillbaka — verifierat direkt, inte antaget.
 */
describe('simulateYouthMatch — roundsReadyForPromotion', () => {
  it('tickar upp för varje omgång spelaren förblir redo', () => {
    const base = generateYouthTeam(club, 'elite', 2025, 1)
    let team: YouthTeam = {
      ...base,
      players: base.players.map((p, i) => i === 0
        ? { ...p, currentAbility: 30, potentialAbility: 60, confidence: 95, readyForPromotion: true, roundsReadyForPromotion: 0 }
        : p),
    }
    const rand = mulberry32(42)

    for (let round = 1; round <= 3; round++) {
      const result = simulateYouthMatch(team, 'elite', rand, round)
      team = { ...team, players: result.updatedPlayers }
      const tracked = team.players[0]
      expect(tracked.readyForPromotion).toBe(true)
      expect(tracked.roundsReadyForPromotion).toBe(round)
    }
  })

  it('nollställer räknaren så fort readyForPromotion blir falskt', () => {
    const base = generateYouthTeam(club, 'elite', 2025, 1)
    let team: YouthTeam = {
      ...base,
      players: base.players.map((p, i) => i === 0
        ? { ...p, currentAbility: 30, potentialAbility: 60, confidence: 95, readyForPromotion: true, roundsReadyForPromotion: 5 }
        : p),
    }
    const rand = mulberry32(1)
    // Tvinga spelaren under tröskeln (newConf < 50) genom att sätta confidence lågt innan nästa körning.
    team = { ...team, players: team.players.map((p, i) => i === 0 ? { ...p, confidence: 10 } : p) }

    const result = simulateYouthMatch(team, 'elite', rand, 1)
    const tracked = result.updatedPlayers[0]
    expect(tracked.readyForPromotion).toBe(false)
    expect(tracked.roundsReadyForPromotion).toBe(0)
  })
})
