/**
 * Jacobs dom 2026-08-26 (RAPPORT_ATERKOPPLINGSSLINGAN_HITTAD_2026-08-26.md):
 * "Kaskaden ska bort, inte mjukas." Det gamla beteendet vid licenseReview
 * status='denied' (finances < -200 000 eller 3 varningar i rad) tog bort 3
 * SLUMPADE spelare utan spelarval, drog rykte med ett fast -15, och tog bort
 * 60% av sponsorerna på en gång. Ersatt med kontinuerliga, skalande
 * konsekvenser — och spelare tas ALDRIG bort av systemet längre.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Sponsor } from '../../../domain/entities/SaveGame'

function makeSponsor(id: string, weeklyIncome: number): Sponsor {
  return { id, name: `Sponsor ${id}`, category: 'Test', weeklyIncome, contractRounds: 20, signedRound: 0 }
}

function makeCrisisGame(finances: number, sponsors: Sponsor[]): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
  return {
    ...base,
    clubs: base.clubs.map(c => c.id === base.managedClubId ? { ...c, finances } : c),
    sponsors,
  }
}

describe('seasonEndProcessor — licenseReview-kaskaden borttagen (2026-08-26)', () => {
  it('tar ALDRIG bort spelare pga licenskaskaden — kris- och frisk klubb tappar lika många (retirement/kontrakt, inte kaskaden)', () => {
    // Samma seed, enda skillnaden är finanserna — normal säsongsslutsaktivitet
    // (pensionering, kontraktsutgång, truppkomplettering) rör truppstorleken
    // oavsett licensläge. Om kaskaden fortfarande fanns skulle kris-klubben
    // tappa ~3 spelare EXTRA jämfört med den friska — den skillnaden ska nu vara noll.
    const crisisGame = makeCrisisGame(-900_000, [makeSponsor('a', 5000)])
    const healthyGame = makeCrisisGame(300_000, [makeSponsor('a', 5000)])

    const crisisResult = handleSeasonEnd(crisisGame, 1)
    const healthyResult = handleSeasonEnd(healthyGame, 1)

    const crisisSquad = crisisResult.game.players.filter(p => p.clubId === crisisGame.managedClubId).length
    const healthySquad = healthyResult.game.players.filter(p => p.clubId === healthyGame.managedClubId).length

    expect(crisisSquad).toBe(healthySquad)
  })

  it('tar bort HÖGST en sponsor per säsong, inte 60%', () => {
    const sponsors = [makeSponsor('a', 5000), makeSponsor('b', 3000), makeSponsor('c', 8000), makeSponsor('d', 1000), makeSponsor('e', 6000)]
    const game = makeCrisisGame(-250_000, sponsors)
    const result = handleSeasonEnd(game, 1)
    expect(result.game.sponsors?.length).toBe(sponsors.length - 1)
  })

  it('sponsorn med LÄGST veckointäkt lämnar först', () => {
    const sponsors = [makeSponsor('a', 5000), makeSponsor('cheapest', 500), makeSponsor('c', 8000)]
    const game = makeCrisisGame(-250_000, sponsors)
    const result = handleSeasonEnd(game, 1)
    expect(result.game.sponsors?.some(s => s.id === 'cheapest')).toBe(false)
    expect(result.game.sponsors?.some(s => s.id === 'a')).toBe(true)
    expect(result.game.sponsors?.some(s => s.id === 'c')).toBe(true)
  })

  it('inget att ta bort — noll sponsorer är inte en krasch', () => {
    const game = makeCrisisGame(-900_000, [])
    expect(() => handleSeasonEnd(game, 1)).not.toThrow()
  })

  it('ryktesförlust skalar med underskottets djup — djupare underskott kostar mer', () => {
    const shallow = makeCrisisGame(-210_000, [makeSponsor('a', 5000)])  // precis över tröskeln
    const deep = makeCrisisGame(-900_000, [makeSponsor('a', 5000)])     // långt under

    const repBefore = shallow.clubs.find(c => c.id === shallow.managedClubId)!.reputation

    const shallowResult = handleSeasonEnd(shallow, 1)
    const deepResult = handleSeasonEnd(deep, 1)

    const shallowRep = shallowResult.game.clubs.find(c => c.id === shallow.managedClubId)!.reputation ?? 0
    const deepRep = deepResult.game.clubs.find(c => c.id === deep.managedClubId)!.reputation ?? 0

    expect(shallowRep).toBeLessThan(repBefore!)  // kostar något
    expect(deepRep).toBeLessThan(shallowRep)     // djupare kostar MER
  })

  it('ryktesförlusten är aldrig det gamla fasta talet -15 rakt av vid ett djupt underskott', () => {
    const deep = makeCrisisGame(-900_000, [])
    const repBefore = deep.clubs.find(c => c.id === deep.managedClubId)!.reputation!
    const result = handleSeasonEnd(deep, 1)
    const repAfter = result.game.clubs.find(c => c.id === deep.managedClubId)!.reputation!
    expect(repBefore - repAfter).not.toBe(15)
    expect(repBefore - repAfter).toBeGreaterThan(15)  // djupt underskott ska kosta MER än det gamla fasta talet
  })
})
