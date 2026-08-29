/**
 * fitnessRecoveryService.test.ts — A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md).
 *
 * Låser de tre egenskaper som gjorde att den GAMLA modellen spiralerade, så
 * att en återgång blir ett rött test och inte ett playtest-fynd om ett halvår:
 *
 *   1. Återhämtningen är PROPORTIONELL mot gapet till taket (den gamla var
 *      platt — och en platt drän mot en platt återhämtning har ingen inre
 *      jämvikt, den faller alltid mot 0 eller stiger mot taket).
 *   2. En STARTARE återhämtar också något. Den gamla modellen gav honom rent
 *      −15..−25, vilket gjorde trupploopen strukturellt negativ oavsett
 *      truppstorlek.
 *   3. Sommaren återställer BÅDE kondition och seasonForm, och sänker aldrig
 *      någon. seasonForm nollställdes tidigare aldrig alls.
 *
 * Plus uthållighetstest B:s kärnkrav som en sluten simulering av
 * trupploopen (se `beskriver trupploopen` nedan) — full 5-säsongersmätning
 * ligger i scripts/a3-konditionsspiral-matning-2026-08-29.ts.
 */
import { describe, it, expect } from 'vitest'
import {
  recoveryGain,
  projectFitnessAfterRound,
  getFitnessProjection,
  summerFitnessTarget,
  summerSeasonForm,
  staminaRecoveryFactor,
  calendarRecoveryFactor,
  RECOVERY_RATE_STARTED,
  RECOVERY_RATE_BENCH,
  RECOVERY_RATE_RESTED,
  FITNESS_RECOVERY_CEILING,
  SUMMER_SEASON_FORM_BASE,
  EXPECTED_MATCH_FITNESS_COST,
} from '../fitnessRecoveryService'
import { FATIGUE_AVAILABILITY_FLOOR } from '../squadEvaluator'

describe('fitnessRecoveryService — A3 återhämtningskurvan', () => {
  it('takterna står i rätt ordning: startare < bänk < vilande', () => {
    expect(RECOVERY_RATE_STARTED).toBeLessThan(RECOVERY_RATE_BENCH)
    expect(RECOVERY_RATE_BENCH).toBeLessThan(RECOVERY_RATE_RESTED)
    expect(RECOVERY_RATE_STARTED).toBeGreaterThan(0)
    expect(RECOVERY_RATE_RESTED).toBeLessThan(1)
  })

  it('rotorsak 3 — återhämtningen är proportionell: en utsliten spelare får MER tillbaka än en nästan pigg', () => {
    const utsliten = recoveryGain(10, 'rested')
    const nastanPigg = recoveryGain(90, 'rested')
    expect(utsliten).toBeGreaterThan(nastanPigg)
    // Och den avtar mot taket — en spelare i taket får ingenting.
    expect(recoveryGain(FITNESS_RECOVERY_CEILING, 'rested')).toBe(0)
  })

  it('rotorsak 3 — proportionaliteten ger en INRE jämvikt: nettot byter tecken någonstans mellan 0 och taket', () => {
    // En ständig startare: matchkostnad varje omgång, aldrig vilad.
    const netAt = (f: number) => projectFitnessAfterRound(f, 'started', EXPECTED_MATCH_FITNESS_COST) - f
    // Högt upp är nettot negativt (matchen kostar mer än veckan ger tillbaka)...
    expect(netAt(90)).toBeLessThan(0)
    // ...och botten är absorberande, inte genomfallande: konditionen kan
    // aldrig gå under 0 och kurvan planar ut där.
    expect(projectFitnessAfterRound(0, 'started', EXPECTED_MATCH_FITNESS_COST)).toBeGreaterThanOrEqual(0)
    // Nettot är monotont: ju lägre kondition, desto mindre negativt netto.
    expect(netAt(30)).toBeGreaterThan(netAt(90))
  })

  it('rotorsak 2 — en STARTARE återhämtar också: matchkostnaden är inte längre hela hans omgång', () => {
    const before = 60
    const after = projectFitnessAfterRound(before, 'started', EXPECTED_MATCH_FITNESS_COST)
    // Han går back — trötthet ska kosta...
    expect(after).toBeLessThan(before)
    // ...men inte hela matchkostnaden, för veckan mellan matcherna ger tillbaka.
    expect(after).toBeGreaterThan(before - EXPECTED_MATCH_FITNESS_COST)
  })

  it('rotorsak 1 — INGEN klamp neråt: en vilande spelare kan aldrig SÄNKAS av att vila', () => {
    for (const f of [0, 10, 22, 50, 80, 99, 100]) {
      expect(projectFitnessAfterRound(f, 'rested', 0)).toBeGreaterThanOrEqual(f)
      expect(projectFitnessAfterRound(f, 'bench', 0)).toBeGreaterThanOrEqual(f)
    }
  })

  it('taket hålls: ingen arbetsbelastning kan ta en spelare över 100', () => {
    for (const w of ['started', 'bench', 'rested'] as const) {
      expect(projectFitnessAfterRound(99, w, 0)).toBeLessThanOrEqual(FITNESS_RECOVERY_CEILING)
    }
  })

  it('uthållighet och kalender skalar återhämtningen i rätt riktning', () => {
    expect(staminaRecoveryFactor(100)).toBeGreaterThan(staminaRecoveryFactor(0))
    expect(calendarRecoveryFactor(14)).toBeGreaterThan(calendarRecoveryFactor(7))
    // Kalenderfaktorn har tak 3.0 — en oändlig lucka ger inte oändlig vila.
    expect(calendarRecoveryFactor(999)).toBe(3.0)
    expect(recoveryGain(40, 'rested', { stamina: 100 })).toBeGreaterThan(recoveryGain(40, 'rested', { stamina: 0 }))
  })

  it('periodiseringens extrapoäng är additiva ovanpå den proportionella basen (Vila blir netto-positiv)', () => {
    const utan = recoveryGain(50, 'rested')
    const medVila = recoveryGain(50, 'rested', { modeBonus: 5 })
    expect(medVila).toBeGreaterThan(utan)
  })
})

describe('fitnessRecoveryService — A3 sommaråterställningen (domens krav 2)', () => {
  it('sommarmålet ligger på rimlig matchberedskap och skalar med uthållighet', () => {
    expect(summerFitnessTarget(0)).toBeGreaterThan(FATIGUE_AVAILABILITY_FLOOR * 3)
    expect(summerFitnessTarget(100)).toBeGreaterThan(summerFitnessTarget(0))
    expect(summerFitnessTarget(100)).toBeLessThanOrEqual(100)
  })

  it('sommaren SÄNKER aldrig en spelare — den är ett golv, inte en normalisering', () => {
    // Så seasonEndProcessor använder den: Math.max(fitness, target).
    const target = summerFitnessTarget(70)
    expect(Math.max(95, target)).toBe(95)
    expect(Math.max(12, target)).toBe(target)
  })

  it('seasonForm dras tillbaka mot försäsongsbaslinjen — den gamla modellen nollställde den ALDRIG', () => {
    // En Vila-manager vars seasonForm körts i botten får en begriplig återställning...
    const efterVilaSasong = summerSeasonForm(5)
    expect(efterVilaSasong).toBeGreaterThan(5)
    expect(efterVilaSasong).toBeLessThan(SUMMER_SEASON_FORM_BASE)
    // ...och en som byggt högt får behålla en del av det, men inte allt.
    const efterByggSasong = summerSeasonForm(95)
    expect(efterByggSasong).toBeLessThan(95)
    expect(efterByggSasong).toBeGreaterThan(SUMMER_SEASON_FORM_BASE)
    // Baslinjen är sin egen fixpunkt.
    expect(summerSeasonForm(SUMMER_SEASON_FORM_BASE)).toBe(SUMMER_SEASON_FORM_BASE)
  })

  it('seasonForm konvergerar mot ett STABILT band över flera säsonger av Vila — inte mot noll', () => {
    // Rotorsaken bakom "säsong två inleddes kring 40 %": seasonForm föll
    // ~29 poäng per säsong av Vila och nollställdes aldrig, så playerModifiers
    // effekttak (seasonForm+3) drog hela truppen mot några få procent.
    let sf = 62
    const VILA_DECAY_PER_SEASON = 29
    for (let season = 0; season < 10; season++) {
      sf = summerSeasonForm(Math.max(0, sf - VILA_DECAY_PER_SEASON))
    }
    expect(sf).toBeGreaterThan(FATIGUE_AVAILABILITY_FLOOR)
  })
})

describe('fitnessRecoveryService — A3 prognosen (domens krav 3)', () => {
  const base = { fitness: 40, attributes: { stamina: 60 } }

  it('visar både "startar han" och "vilas han", och vila är alltid det bättre talet', () => {
    const p = getFitnessProjection(base)
    expect(p.ifRested).toBeGreaterThan(p.ifStarting)
    expect(p.costOfStarting).toBe(p.ifRested - p.ifStarting)
    expect(p.costOfStarting).toBeGreaterThan(0)
  })

  it('prognosen delar formel med motorn — den är inte en avskrift', () => {
    const p = getFitnessProjection(base)
    expect(p.ifStarting).toBe(
      projectFitnessAfterRound(base.fitness, 'started', EXPECTED_MATCH_FITNESS_COST, { stamina: 60, daysBetweenFixtures: 7 }),
    )
    expect(p.ifRested).toBe(
      projectFitnessAfterRound(base.fitness, 'rested', 0, { stamina: 60, daysBetweenFixtures: 7 }),
    )
  })

  it('"tillgänglig igen" tar den LÄNGSTA av de tre skilda otillgänglighetsorsakerna', () => {
    expect(getFitnessProjection({ ...base }).availableInRounds).toBe(0)
    expect(getFitnessProjection({ ...base, restGamesRemaining: 1 }).availableInRounds).toBe(1)
    expect(getFitnessProjection({ ...base, suspensionGamesRemaining: 3 }).availableInRounds).toBe(3)
    // Skada mäts i dagar, ≈7 per omgång — 21 dagar = 3 omgångar.
    expect(getFitnessProjection({ ...base, isInjured: true, injuryDaysRemaining: 21 }).availableInRounds).toBe(3)
    // Staplade orsaker → den längsta vinner, aldrig summan.
    expect(
      getFitnessProjection({ ...base, isInjured: true, injuryDaysRemaining: 21, suspensionGamesRemaining: 1, restGamesRemaining: 1 })
        .availableInRounds,
    ).toBe(3)
  })
})

describe('A3 — uthållighetstest B, trupploopens netto (sluten simulering)', () => {
  /**
   * Den fulla mätningen (5–8 säsonger, riktiga trupper och scheman) ligger i
   * scripts/a3-konditionsspiral-matning-2026-08-29.ts. Detta test låser
   * KÄRNEGENSKAPEN som scriptet mätte, i en form som kan köras i CI: att
   * trupploopen konvergerar mot ett stabilt band över golvet i stället för
   * att falla mot noll — för 18-, 20- OCH 24-mannatrupper.
   *
   * Modellen: 11 startar, 5 på bänk, resten vilar. Den som har lägst
   * kondition roteras ut (samma effekt som pickBestEleven ger, eftersom
   * fitness väger 60 % i urvalspoängen).
   */
  function simulateSquad(squadSize: number, rounds: number): number[] {
    let fitness = Array.from({ length: squadSize }, () => 85)
    for (let r = 0; r < rounds; r++) {
      const order = fitness
        .map((f, i) => ({ f, i }))
        .sort((a, b) => b.f - a.f)
        .map(x => x.i)
      const starters = new Set(order.slice(0, 11))
      const bench = new Set(order.slice(11, 16))
      fitness = fitness.map((f, i) =>
        starters.has(i)
          ? projectFitnessAfterRound(f, 'started', EXPECTED_MATCH_FITNESS_COST, { stamina: 60 })
          : bench.has(i)
          ? projectFitnessAfterRound(f, 'bench', 0, { stamina: 60 })
          : projectFitnessAfterRound(f, 'rested', 0, { stamina: 60 }),
      )
    }
    return [...fitness].sort((a, b) => a - b)
  }

  const X = 25 // D036 — satt av mätningen, inte antagen

  for (const size of [18, 20, 24]) {
    it(`${size}-mannatrupp: medianen konvergerar över produktkravet X=${X} % och stannar där`, () => {
      const efterEnSasong = simulateSquad(size, 30)
      const efterFemSasonger = simulateSquad(size, 150)
      const median = (xs: number[]) => xs[Math.floor(xs.length / 2)]

      expect(median(efterEnSasong)).toBeGreaterThan(X)
      // Ingen stabil negativ spiral: fem säsonger senare ligger banan kvar.
      expect(median(efterFemSasonger)).toBeGreaterThan(X)
      // Jämvikt, inte fritt fall — banan har planat ut mellan säsong 1 och 5.
      expect(Math.abs(median(efterFemSasonger) - median(efterEnSasong))).toBeLessThan(10)
    })

    it(`${size}-mannatrupp: djupare trupp ger friskare trupp (jämvikten skalar med truppdjupet)`, () => {
      const median = (xs: number[]) => xs[Math.floor(xs.length / 2)]
      if (size > 18) {
        expect(median(simulateSquad(size, 150))).toBeGreaterThanOrEqual(median(simulateSquad(18, 150)))
      }
    })
  }

  it('den som VÄGRAR rotera betalar fortfarande fullt pris — trötthet är inte bortlagad', () => {
    // Ständig startare, aldrig vilad: ska falla under golvet och stanna där.
    let f = 85
    for (let r = 0; r < 30; r++) {
      f = projectFitnessAfterRound(f, 'started', EXPECTED_MATCH_FITNESS_COST, { stamina: 60 })
    }
    expect(f).toBeLessThan(FATIGUE_AVAILABILITY_FLOOR)
  })
})
