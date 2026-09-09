/**
 * DOM_MECENAT_PATRON_MODELLFORM_2026-09-08: en enda seedad rullning vid
 * säsongens första serieomgång. CS lutar sannolikheten; det diskreta taket
 * och den befintliga avhoppslogiken är oförändrade.
 */
import { describe, it, expect } from 'vitest'
import { applyMecenatSpawn, applyMecenatCapEviction, mecenatCapForCs } from '../eventProcessor'
import { createNewGame } from '../../createNewGame'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Mecenat } from '../../../../domain/entities/Mecenat'
import {
  passesSeasonalEmergenceRoll,
  seasonalEmergenceProbability,
} from '../../../../domain/services/mecenatPatronEmergenceService'

function makeMecenat(overrides: Partial<Mecenat>): Mecenat {
  return {
    id: 'mec_1', name: 'Test Testsson', gender: 'male', business: 'AB Test',
    businessType: 'brukspatron', wealth: 3, personality: 'stödjande',
    influence: 50, happiness: 50, goodwill: 50, contribution: 100000,
    totalContributed: 0, demands: [], socialExpectations: [], isActive: true,
    arrivedSeason: 2025, silentShout: 0,
    ...overrides,
  } as Mecenat
}

function makeGame(overrides: Partial<SaveGame>): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  return { ...game, ...overrides }
}

function gameWithPassingMecenatRoll(communityStanding: number): SaveGame {
  for (let worldSeed = 0; worldSeed < 10_000; worldSeed++) {
    const game = makeGame({ communityStanding, worldSeed })
    if (passesSeasonalEmergenceRoll(game, 'mecenat', communityStanding)) return game
  }
  throw new Error('kunde inte hitta seed med godkänd mecenatrullning')
}

describe('mecenatCapForCs — diskret, oförändrat golv på 1 (aldrig 0)', () => {
  it('golvet är 1, inte 0, även vid mycket lågt cs', () => {
    expect(mecenatCapForCs(0)).toBe(1)
    expect(mecenatCapForCs(40)).toBe(1)
  })
  it('2 vid cs>=70, 3 vid cs>=85', () => {
    expect(mecenatCapForCs(70)).toBe(2)
    expect(mecenatCapForCs(85)).toBe(3)
  })
})

describe('applyMecenatSpawn — en CS-skalerad säsongsrullning', () => {
  it('rampen är kontinuerlig, lutar och har ett verkligt golv', () => {
    expect(seasonalEmergenceProbability('mecenat', 0)).toBeCloseTo(0.02)
    expect(seasonalEmergenceProbability('mecenat', 40)).toBeCloseTo(0.14)
    expect(seasonalEmergenceProbability('mecenat', 100)).toBeCloseTo(0.32)
  })

  it('en klubb med lågt cs och lågt rykte kan fortfarande få en mecenat när säsongsrullningen lyckas', () => {
    const game = gameWithPassingMecenatRoll(40)
    const result = applyMecenatSpawn(game, false, 1, [], () => 0.01)
    expect(result.updatedMecenater.length).toBe(1)
  })

  it('samma godkända roll prövas inte igen efter första serieomgången', () => {
    const game = gameWithPassingMecenatRoll(100)
    const result = applyMecenatSpawn(game, false, 2, [], () => 0.01)
    expect(result.updatedMecenater.length).toBe(0)
  })

  it('taket respekteras — cs=40 (tak 1) med redan 1 aktiv spawnar inte en till', () => {
    const game = makeGame({ communityStanding: 40 })
    const existing = [makeMecenat({ id: 'mec_existing', isActive: true, arrivedSeason: 2024 })]
    const result = applyMecenatSpawn(game, false, 1, existing, () => 0.01)
    expect(result.updatedMecenater.length).toBe(1) // oförändrat — taket redan fullt
  })
})

describe('applyMecenatCapEviction — dubbelriktad: taket sjunker, någon lämnar', () => {
  it('tre aktiva mecenater, cs faller till 40 (tak 1): två tvingas ut, den minst nöjda FÖRST', () => {
    const game = makeGame({ communityStanding: 40 })
    const mecenater = [
      makeMecenat({ id: 'mec_happy', happiness: 90, isActive: true }),
      makeMecenat({ id: 'mec_medium', happiness: 50, isActive: true }),
      makeMecenat({ id: 'mec_sad', happiness: 10, isActive: true }),
    ]
    const result = applyMecenatCapEviction(game, mecenater)
    const evicted = result.updatedMecenater.find(m => m.id === 'mec_sad')
    expect(evicted?.isActive).toBe(false)
    expect(evicted?.permanentlyWithdrawn).toBe(true)
    expect(result.withdrawnSeason).toBe(game.currentSeason)
    expect(result.newEvents.length).toBe(1)
    // De två andra fortfarande aktiva — bara EN evictas per anrop denna omgång
    expect(result.updatedMecenater.find(m => m.id === 'mec_happy')?.isActive).toBe(true)
    expect(result.updatedMecenater.find(m => m.id === 'mec_medium')?.isActive).toBe(true)
  })

  it('taket räcker — ingen evictas, inget event', () => {
    const game = makeGame({ communityStanding: 90 }) // tak 3
    const mecenater = [
      makeMecenat({ id: 'mec_1', happiness: 50, isActive: true }),
      makeMecenat({ id: 'mec_2', happiness: 50, isActive: true }),
    ]
    const result = applyMecenatCapEviction(game, mecenater)
    expect(result.newEvents.length).toBe(0)
    expect(result.updatedMecenater.every(m => m.isActive)).toBe(true)
  })

  it('redan köad avhoppshändelse denna säsong — inte dubblerad', () => {
    const game = makeGame({
      communityStanding: 40,
      pendingEvents: [{ id: 'mecenat_cs_eviction_mec_sad_2025', type: 'mecenatWithdrawal', title: 't', body: 'b', choices: [], resolved: false }],
    })
    const mecenater = [
      makeMecenat({ id: 'mec_sad', happiness: 10, isActive: true }),
      makeMecenat({ id: 'mec_2', happiness: 50, isActive: true }),
    ]
    const result = applyMecenatCapEviction(game, mecenater)
    expect(result.newEvents.length).toBe(0)
  })
})
