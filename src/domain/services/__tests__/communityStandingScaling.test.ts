/**
 * H4-uppföljning, tröskelsvepet (RAPPORT_COMMUNITYSTANDING_TROSKELSVEP_
 * 2026-08-26, fynd #1-#3 + #11, Jacobs dom 2026-08-26): fem system delade
 * exakt samma cs=70/71-klippa. Detta testar att alla fyra nu är
 * kontinuerliga — ingen av dem ger en synligt olika utdata mellan
 * communityStanding 70 och 71.
 */
import { describe, it, expect } from 'vitest'
import {
  csLinearRamp,
  getCsDiminishingFactor,
  getCsNeighborContactAmount,
  getCsPoliticianGrantBonus,
  getCsDetOmojligaValetProbability,
  csUpkeepFactor,
  csExpectationDrag,
  CS_UPKEEP_REP_FLOOR,
  CS_UPKEEP_REP_CEIL,
  CS_UPKEEP_FACTOR_CEIL,
  CS_EXPECTATION_DRAG_CEIL,
} from '../communityStandingScaling'

describe('csLinearRamp', () => {
  it('klampar under golvet och över taket', () => {
    expect(csLinearRamp(0, 50, 90, 0, 100)).toBe(0)
    expect(csLinearRamp(200, 50, 90, 0, 100)).toBe(100)
  })
  it('interpolerar linjärt mittemellan', () => {
    expect(csLinearRamp(70, 50, 90, 0, 100)).toBe(50)
  })
})

describe('getCsDiminishingFactor — #1, tidigare 4-stegstrappa på 70/71', () => {
  it('cs=70 och cs=71 ger nästan identisk faktor, inte en halvering', () => {
    expect(Math.abs(getCsDiminishingFactor(71) - getCsDiminishingFactor(70))).toBeLessThan(0.02)
  })
  it('full effekt (1.0) vid/under golvet 55', () => {
    expect(getCsDiminishingFactor(55)).toBe(1.0)
    expect(getCsDiminishingFactor(30)).toBe(1.0)
  })
  it('minsta effekt (0.25) vid/över taket 100', () => {
    expect(getCsDiminishingFactor(100)).toBe(0.25)
  })
})

describe('getCsNeighborContactAmount — #2, tidigare fast +2 vid cs>70', () => {
  it('cs=70 och cs=71 ger samma avrundade belopp, ingen klippa', () => {
    expect(Math.abs(getCsNeighborContactAmount(71) - getCsNeighborContactAmount(70))).toBeLessThanOrEqual(1)
  })
  it('golvet (55) ger det lägsta beloppet (1), taket (90+) det högsta (3)', () => {
    expect(getCsNeighborContactAmount(55)).toBe(1)
    expect(getCsNeighborContactAmount(95)).toBe(3)
  })
})

describe('getCsPoliticianGrantBonus — #3, tidigare fast +10 000 kr vid cs>70', () => {
  it('cs=70 och cs=71 ger nästan identiskt tillägg, inte ett 10 000 kr-hopp', () => {
    expect(Math.abs(getCsPoliticianGrantBonus(71) - getCsPoliticianGrantBonus(70))).toBeLessThan(1000)
  })
  it('golvet (50) ger 0 kr, taket (90+) ger hela 10 000 kr', () => {
    expect(getCsPoliticianGrantBonus(50)).toBe(0)
    expect(getCsPoliticianGrantBonus(95)).toBe(10_000)
  })
})

describe('getCsDetOmojligaValetProbability — #11, tidigare cs>60 en absolut vägg', () => {
  it('en klubb under 60 har ALDRIG noll sannolikhet längre', () => {
    expect(getCsDetOmojligaValetProbability(0)).toBeGreaterThan(0)
    expect(getCsDetOmojligaValetProbability(30)).toBeGreaterThan(0)
    expect(getCsDetOmojligaValetProbability(59)).toBeGreaterThan(0)
  })
  it('cs=60 och cs=61 ger nästan identisk sannolikhet, ingen klippa', () => {
    expect(Math.abs(getCsDetOmojligaValetProbability(61) - getCsDetOmojligaValetProbability(60))).toBeLessThan(0.01)
  })
  it('aldrig garanterat (100%) ens vid taket', () => {
    expect(getCsDetOmojligaValetProbability(100)).toBeLessThan(1)
  })
})

// ── ANSPRÅK 4 (DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md, D037) ──────────────

describe('csUpkeepFactor — knapp 1, ortsunderhållets storleksskalning', () => {
  it('full effekt (1,0) för en liten klubb — H4/Survive-golvet', () => {
    // De sex minsta klubbarnas startrykte (CLUB_TEMPLATES): Heros 45,
    // Slottsbron 48, Rögle 50, Skutskär 52, Söderfors 55, Hälleforsnäs 60.
    for (const rep of [0, 45, 48, 50, 52, 55, 60, 70, CS_UPKEEP_REP_FLOOR]) {
      expect(csUpkeepFactor(rep)).toBe(1.0)
    }
  })

  it('reducerad för en stor klubb, som mest CS_UPKEEP_FACTOR_CEIL', () => {
    expect(csUpkeepFactor(CS_UPKEEP_REP_CEIL)).toBeCloseTo(CS_UPKEEP_FACTOR_CEIL, 10)
    expect(csUpkeepFactor(200)).toBeCloseTo(CS_UPKEEP_FACTOR_CEIL, 10)
    expect(csUpkeepFactor(CS_UPKEEP_REP_CEIL)).toBeLessThan(1.0)
  })

  it('är KONTINUERLIG, inte en tröskel — inget hopp mellan två intilliggande rykten', () => {
    // D031: felklassen är en diskret omslagspunkt på ett kontinuerligt fält.
    // Ett hopp får aldrig överstiga rampens egen lutning per ryktepoäng.
    const maxStep = (1.0 - CS_UPKEEP_FACTOR_CEIL) / (CS_UPKEEP_REP_CEIL - CS_UPKEEP_REP_FLOOR)
    for (let rep = 0; rep < 120; rep++) {
      expect(Math.abs(csUpkeepFactor(rep + 1) - csUpkeepFactor(rep))).toBeLessThanOrEqual(maxStep + 1e-12)
    }
  })

  it('faller monotont med rykte och når aldrig noll (holdbarheten, SKYDDAT)', () => {
    for (let rep = 0; rep < 120; rep++) {
      expect(csUpkeepFactor(rep + 1)).toBeLessThanOrEqual(csUpkeepFactor(rep))
    }
    // Kombinerad med den hårdaste CS-dämpningen (getCsDiminishingFactor vid
    // cs=100) måste produkten fortfarande vara klart skild från noll — en
    // faktor nära noll är samma fel som en hård vägg, bara gömd bakom en kurva.
    expect(csUpkeepFactor(100) * getCsDiminishingFactor(100)).toBeGreaterThan(0.15)
  })
})

describe('csExpectationDrag — knapp 2, ortens stigande förväntan', () => {
  it('noll för en liten klubb — Survive-golvet orört', () => {
    for (const rep of [0, 45, 50, 60, 70, CS_UPKEEP_REP_FLOOR]) {
      expect(csExpectationDrag(rep)).toBe(0)
    }
  })

  it('når CS_EXPECTATION_DRAG_CEIL vid rykte-taket och stannar där', () => {
    expect(csExpectationDrag(CS_UPKEEP_REP_CEIL)).toBeCloseTo(CS_EXPECTATION_DRAG_CEIL, 10)
    expect(csExpectationDrag(200)).toBeCloseTo(CS_EXPECTATION_DRAG_CEIL, 10)
  })

  it('är kontinuerlig och stiger monotont med rykte', () => {
    const maxStep = CS_EXPECTATION_DRAG_CEIL / (CS_UPKEEP_REP_CEIL - CS_UPKEEP_REP_FLOOR)
    for (let rep = 0; rep < 120; rep++) {
      expect(csExpectationDrag(rep + 1)).toBeGreaterThanOrEqual(csExpectationDrag(rep))
      expect(Math.abs(csExpectationDrag(rep + 1) - csExpectationDrag(rep))).toBeLessThanOrEqual(maxStep + 1e-12)
    }
  })

  it('delar golv och tak med csUpkeepFactor — en storleksaxel, inte två', () => {
    // Två ramper med olika brytpunkter hade blivit två olika svar på frågan
    // "när är klubben stor?" — samma sorts drift som cs=70-familjen.
    expect(csUpkeepFactor(CS_UPKEEP_REP_FLOOR)).toBe(1.0)
    expect(csExpectationDrag(CS_UPKEEP_REP_FLOOR)).toBe(0)
  })
})
