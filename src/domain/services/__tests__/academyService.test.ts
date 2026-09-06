import { describe, it, expect } from 'vitest'
import { carryOverYouthTeam, getPromotionTiming, simulateYouthMatch, generateYouthTeam, starsForPotential, buildPromotedPlayerFromYouth } from '../academyService'
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

describe('carryOverYouthTeam — readiness över sommaren', () => {
  it('räknar om readiness med samma regel och bevarar en giltig readiness-svit', () => {
    const base = generateYouthTeam(club, 'developing', 2025, 7)
    const trackedId = base.players[0].id
    const team: YouthTeam = {
      ...base,
      players: base.players.map((p, i) => i === 0
        ? { ...p, age: 17, currentAbility: 26, potentialAbility: 60, confidence: 70, readyForPromotion: true, roundsReadyForPromotion: 4 }
        : p),
    }

    const carried = carryOverYouthTeam(team, club, 'developing', 2026, 8)
    const tracked = carried.players.find(p => p.id === trackedId)!

    expect(tracked.readyForPromotion).toBe(true)
    expect(tracked.roundsReadyForPromotion).toBe(4)
  })

  it('sätter joinedSeason på kvarvarande spelare (akademi-junior-fyller-20 — {seasons}-token)', () => {
    const base = generateYouthTeam(club, 'developing', 2025, 7)
    const carried = carryOverYouthTeam(base, club, 'developing', 2026, 8)
    for (const p of carried.players) {
      expect(typeof p.joinedSeason).toBe('number')
    }
  })
})

describe('starsForPotential — akademins kanoniska stjärnformel', () => {
  it('mappar potentialAbility till 1-4 stjärnor, samma trösklar som AkademiTab tidigare hade inline', () => {
    expect(starsForPotential(90)).toBe(4)
    expect(starsForPotential(70)).toBe(4)
    expect(starsForPotential(69)).toBe(3)
    expect(starsForPotential(55)).toBe(3)
    expect(starsForPotential(54)).toBe(2)
    expect(starsForPotential(45)).toBe(2)
    expect(starsForPotential(44)).toBe(1)
    expect(starsForPotential(10)).toBe(1)
  })
})

describe('buildPromotedPlayerFromYouth — delad konstruktion (EN SANNING, ETT STÄLLE)', () => {
  it('bygger en Player som bär P19-spelarens identitet, CA/PA och akademiflagga', () => {
    const base = generateYouthTeam(club, 'elite', 2025, 3)
    const youth = base.players[0]

    const promoted = buildPromotedPlayerFromYouth(youth, club.id, 2025, 12)

    expect(promoted.id).toBe(`player_promoted_${youth.id}_2025`)
    expect(promoted.firstName).toBe(youth.firstName)
    expect(promoted.lastName).toBe(youth.lastName)
    expect(promoted.currentAbility).toBe(youth.currentAbility)
    expect(promoted.potentialAbility).toBe(youth.potentialAbility)
    expect(promoted.clubId).toBe(club.id)
    expect(promoted.academyClubId).toBe(club.id)
    expect(promoted.isHomegrown).toBe(true)
    expect(promoted.promotedFromAcademy).toBe(true)
    expect(promoted.promotionRound).toBe(12)
    expect(promoted.promotionSeason).toBe(2025)
  })

  it('är deterministisk för samma spelare (samma id-hash → samma lön/attribut)', () => {
    const base = generateYouthTeam(club, 'elite', 2025, 3)
    const youth = base.players[0]

    const a = buildPromotedPlayerFromYouth(youth, club.id, 2025, 12)
    const b = buildPromotedPlayerFromYouth(youth, club.id, 2025, 12)

    expect(a.salary).toBe(b.salary)
    expect(a.attributes).toEqual(b.attributes)
  })
})
