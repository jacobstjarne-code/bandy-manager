/**
 * "Takmodellen" (Jacobs dom 2026-08-26, RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md
 * punkt 3-4): sannolikhetsrampen mättes och kastades (konvergerar mot
 * säkerhet över en karriär, communityStanding blev irrelevant). Ersatt:
 * ortstödet avgör HUR MÅNGA (det redan diskreta taket), inte HUR OFTA
 * (sannolikheten oförändrad, 15%, `cs>=65`-försöksgrindet borttaget — en
 * klubb kan alltid ha minst 1 mecenat, bara långsammare). Relationen är nu
 * dubbelriktad: om taket sjunker under antalet aktiva, tvingas ett avhopp.
 */
import { describe, it, expect } from 'vitest'
import { applyMecenatSpawn, applyMecenatCapEviction, mecenatCapForCs } from '../eventProcessor'
import { createNewGame } from '../../createNewGame'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { Mecenat } from '../../../../domain/entities/Mecenat'

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

describe('applyMecenatSpawn — cs>=65-försöksgrindet borttaget', () => {
  it('en klubb med lågt cs (40) kan fortfarande spawna (given en lyckad slump) — inte längre en vägg', () => {
    const game = makeGame({ communityStanding: 40 })
    const club = { ...game.clubs.find(c => c.id === game.managedClubId)!, reputation: 60 }
    const clubs = game.clubs.map(c => c.id === club.id ? club : c)
    const result = applyMecenatSpawn(game, clubs, false, 10, [], () => 0.01) // rand=0.01 < 0.15 → lyckad
    expect(result.updatedMecenater.length).toBe(1)
  })

  it('rep<55 blockerar fortfarande, oavsett cs', () => {
    const game = makeGame({ communityStanding: 100 })
    const club = { ...game.clubs.find(c => c.id === game.managedClubId)!, reputation: 40 }
    const clubs = game.clubs.map(c => c.id === club.id ? club : c)
    const result = applyMecenatSpawn(game, clubs, false, 10, [], () => 0.01)
    expect(result.updatedMecenater.length).toBe(0)
  })

  it('taket respekteras — cs=40 (tak 1) med redan 1 aktiv spawnar inte en till', () => {
    const game = makeGame({ communityStanding: 40 })
    const club = { ...game.clubs.find(c => c.id === game.managedClubId)!, reputation: 60 }
    const clubs = game.clubs.map(c => c.id === club.id ? club : c)
    const existing = [makeMecenat({ id: 'mec_existing', isActive: true, arrivedSeason: 2024 })]
    const result = applyMecenatSpawn(game, clubs, false, 10, existing, () => 0.01)
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
