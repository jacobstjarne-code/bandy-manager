import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import type { Sponsor } from '../../../domain/entities/SaveGame'

/**
 * SPEC_FORHANDLING_TERMER_2026-09-04 (C-T8) §3C — jobbgarantins sponsor-/
 * patronkapacitet (max 2/sponsor, 3/patron per säsong) nollställs vid
 * säsongsrollover, inte vid sponsorbyte.
 */
describe('seasonEndProcessor — jobbgarantins kapacitet nollställs vid rollover', () => {
  it('sponsorers jobsUsedThisSeason går till 0', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const sponsor: Sponsor = {
      id: 'sponsor_1', name: 'ICA Maxi', category: 'retail', weeklyIncome: 2_000,
      contractRounds: 20, signedRound: 0, jobsUsedThisSeason: 2,
    }
    const result = handleSeasonEnd({ ...game, sponsors: [sponsor] }, 123).game

    const carried = result.sponsors?.find(s => s.id === 'sponsor_1')
    expect(carried?.jobsUsedThisSeason).toBe(0)
  })

  it('patronens jobsUsedThisSeason går till 0', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const patron = {
      id: 'patron_1', name: 'Annika', business: 'Sågverket', influence: 50,
      happiness: 60, contribution: 50_000, isActive: true, jobsUsedThisSeason: 3,
    }
    const result = handleSeasonEnd({ ...game, patron }, 123).game

    expect(result.patron?.jobsUsedThisSeason).toBe(0)
  })
})
