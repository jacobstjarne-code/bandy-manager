/**
 * 2026-08-26 (RAPPORT_LICENSVARNING_RENDERING_2026-08-26.md, Jacobs dom):
 * licenseHandlingsplan-händelsen triggades tidigare av licenseReview (System
 * A, det system som INTE avskedar) — kunde dyka upp eller utebli helt
 * oberoende av var klubben faktiskt stod i den räknare som avgör avsked.
 * Flyttad till att trigga av game.licenseStatus (System B, checkLicenseStatus).
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import type { SaveGame } from '../../../domain/entities/SaveGame'

describe('seasonEndProcessor — licenseHandlingsplan triggas av System B (licenseStatus)', () => {
  it('en säsong med negativt nettoresultat som ger first_warning (System B) skapar handlingsplan-händelsen', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
    const managedClub = base.clubs.find(c => c.id === base.managedClubId)!
    const game: SaveGame = {
      ...base,
      licenseStatus: 'clear',
      licenseRiskScore: 20,  // ett dåligt år redan räknat — denna säsongs +20 korsar 40-tröskeln (first_warning)
      seasonStartSnapshot: { season: base.currentSeason, finalPosition: 12, finances: managedClub.finances + 100000, communityStanding: 50, squadSize: 16, supporterMembers: 100 },
    }
    const result = handleSeasonEnd(game, 1)

    const events = result.game.pendingEvents ?? []
    const handlingsplan = events.find(e => e.type === 'licenseHandlingsplan')
    expect(handlingsplan, 'handlingsplan-händelsen ska finnas när System B ger first_warning').toBeDefined()
  })

  it('en säsong med positivt nettoresultat (clear, System B) skapar INTE handlingsplan-händelsen', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
    const managedClub = base.clubs.find(c => c.id === base.managedClubId)!
    const game: SaveGame = {
      ...base,
      licenseStatus: 'clear',
      licenseRiskScore: 0,
      seasonStartSnapshot: { season: base.currentSeason, finalPosition: 12, finances: managedClub.finances - 100000, communityStanding: 50, squadSize: 16, supporterMembers: 100 },
    }
    const result = handleSeasonEnd(game, 1)

    const events = result.game.pendingEvents ?? []
    const handlingsplan = events.find(e => e.type === 'licenseHandlingsplan')
    expect(handlingsplan).toBeUndefined()
  })
})
