import { describe, it, expect } from 'vitest'
import {
  computeSponsorReservation,
  computeWalkAwayProbability,
  resolveSponsorCounter,
  PERSONALITY_RESERVATION_MULT,
  PERSONALITY_WALKAWAY_SENSITIVITY,
  STAND_FIRM_BAND,
} from '../sponsorCounterService'

describe('computeSponsorReservation', () => {
  it('local har lägst tak, regional högst, vid samma CS', () => {
    const cs = 50
    const local = computeSponsorReservation(1000, 'local', cs)
    const regional = computeSponsorReservation(1000, 'regional', cs)
    const foundation = computeSponsorReservation(1000, 'foundation', cs)
    expect(local).toBeLessThan(foundation)
    expect(foundation).toBeLessThan(regional)
  })

  it('reservationen skalar upp med communityStanding (hävstång)', () => {
    const low = computeSponsorReservation(1000, 'regional', 50)
    const high = computeSponsorReservation(1000, 'regional', 90)
    expect(high).toBeGreaterThan(low)
  })

  it('reservationen är alltid över originalerbjudandet (X)', () => {
    for (const p of ['local', 'regional', 'foundation'] as const) {
      expect(computeSponsorReservation(1000, p, 50)).toBeGreaterThan(1000)
    }
  })
})

describe('computeWalkAwayProbability', () => {
  it('noll under stand-firm-bandet', () => {
    const reservation = 1000
    expect(computeWalkAwayProbability(reservation * STAND_FIRM_BAND, reservation, 'local')).toBe(0)
    expect(computeWalkAwayProbability(reservation, reservation, 'regional')).toBe(0)
  })

  it('stiger med avståndet över bandet', () => {
    const reservation = 1000
    const near = computeWalkAwayProbability(reservation * STAND_FIRM_BAND * 1.1, reservation, 'regional')
    const far = computeWalkAwayProbability(reservation * STAND_FIRM_BAND * 2, reservation, 'regional')
    expect(far).toBeGreaterThan(near)
  })

  it('regional bryter lättare än local vid samma överskott', () => {
    const reservation = 1000
    const y = reservation * STAND_FIRM_BAND * 1.5
    expect(computeWalkAwayProbability(y, reservation, 'regional')).toBeGreaterThan(
      computeWalkAwayProbability(y, reservation, 'local'),
    )
  })

  it('aldrig 100% — ett tak finns', () => {
    const reservation = 1000
    expect(computeWalkAwayProbability(reservation * 100, reservation, 'regional')).toBeLessThan(1)
  })
})

describe('resolveSponsorCounter — enkelrunda, tre utfall', () => {
  it('under reservationen: alltid accepterat, oavsett rand()', () => {
    const alwaysWalk = () => 0 // lägsta möjliga rand-värde, "mest sannolikt att slå in" om koden ändå testade
    const result = resolveSponsorCounter(1050, 1000, 'local', 50, alwaysWalk)
    expect(result.outcome).toBe('accepted')
  })

  it('strax över reservationen, inom bandet: står fast, aldrig walked_away', () => {
    const reservation = computeSponsorReservation(1000, 'local', 50)
    const y = Math.round(reservation * (STAND_FIRM_BAND - 0.001))
    const result = resolveSponsorCounter(y, 1000, 'local', 50, () => 0)
    expect(result.outcome).toBe('stood_firm')
  })

  it('långt över: walked_away när rand() faller under sannolikheten', () => {
    const reservation = computeSponsorReservation(1000, 'regional', 50)
    const aggressive = Math.round(reservation * 3)
    const result = resolveSponsorCounter(aggressive, 1000, 'regional', 50, () => 0)
    expect(result.outcome).toBe('walked_away')
    expect(result.walkAwayProbability).toBeGreaterThan(0)
  })

  it('långt över: stood_firm när rand() faller över sannolikheten (chansen slog inte in)', () => {
    const reservation = computeSponsorReservation(1000, 'regional', 50)
    const aggressive = Math.round(reservation * 1.3)
    const result = resolveSponsorCounter(aggressive, 1000, 'regional', 50, () => 0.999)
    expect(result.outcome).toBe('stood_firm')
  })
})

describe('PERSONALITY-tabellerna — sanity', () => {
  it('regional har högre reservationsmultiplikator än local', () => {
    expect(PERSONALITY_RESERVATION_MULT.regional).toBeGreaterThan(PERSONALITY_RESERVATION_MULT.local)
  })
  it('regional har högre walkaway-känslighet än local', () => {
    expect(PERSONALITY_WALKAWAY_SENSITIVITY.regional).toBeGreaterThan(PERSONALITY_WALKAWAY_SENSITIVITY.local)
  })
})
