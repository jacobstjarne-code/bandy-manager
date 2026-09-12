import { describe, expect, it } from 'vitest'
import { createNewGame } from '../createNewGame'
import { handleSeasonEnd } from '../seasonEndProcessor'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'

/**
 * liggare-ny-license-event (docs/rapport/RAPPORT_OMSPARNING_SYSTEM_2026-09-04.md §3):
 * licensnämndens dom skrivs nu som en license_event-post, men BARA vid en
 * faktisk zonövergång (samma villkor som inbox-brevet checkLicenseStatus
 * redan styr — ingen ny tröskel).
 */
describe('handleSeasonEnd — license_event-post', () => {
  it('skriver INGEN license_event-post när ingen zonövergång sker (färsk klubb, oförändrad ekonomi)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const result = handleSeasonEnd(game, 1).game
    const entry = result.eventLedger?.find(e => e.type === 'license_event')
    expect(entry).toBeUndefined()
  })

  it('skriver en license_event-post vid en faktisk zonövergång (clear→first_warning)', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    // Oförändrad ekonomi → netResult 0 → +20 straff. licenseRiskScore 20→40
    // korsar 40-tröskeln (licenseZoneFromScore) rakt in i first_warning.
    const result = handleSeasonEnd({ ...game, licenseRiskScore: 20, licenseStatus: 'clear' }, 1).game
    const entry = result.eventLedger?.find(e => e.type === 'license_event')
    expect(entry).toBeDefined()
    expect(entry?.clubId).toBe(game.managedClubId)
    expect(entry?.licenseEvent?.status).toBe('first_warning')
    expect(entry?.significance).toBe(50)
    expect(entry?.licenseEvent?.deficitKr).toBeUndefined()
  })

  it('bär pointsDeducted (3) och deficitKr vid en försämring till point_deduction under ett underskottsår', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
    const gameWithDeficit = {
      ...game,
      licenseRiskScore: 40,
      licenseStatus: 'first_warning' as const,
      // Frusen säsongsstart 50 000 rikare än nuvarande kassa → netResult -50 000.
      seasonStartSnapshot: {
        season: game.currentSeason, finalPosition: 6, finances: managedClub.finances + 50_000,
        communityStanding: 50, squadSize: 20, supporterMembers: 100, academyPromotions: 0,
      },
    }
    const result = handleSeasonEnd(gameWithDeficit, 1).game
    const entry = result.eventLedger?.find(e => e.type === 'license_event')
    expect(entry?.licenseEvent?.status).toBe('point_deduction')
    expect(entry?.significance).toBe(75)
    expect(entry?.licenseEvent?.pointsDeducted).toBe(3)
    expect(entry?.licenseEvent?.deficitKr).toBe(50_000)
    expect(result.pointDeductions?.[game.managedClubId]).toBe(3)
    expect(result.pendingPointDeductions).toBeUndefined()
  })

  it('aktiverar och summerar tidigare väntande avdrag med den nya licensdomen i nästa säsong', () => {
    const game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, season: 2025, seed: 1 })
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)!
    const otherClubId = game.clubs.find(c => c.id !== game.managedClubId)!.id
    const result = handleSeasonEnd({
      ...game,
      licenseRiskScore: 40,
      licenseStatus: 'first_warning',
      pendingPointDeductions: { [game.managedClubId]: 2, [otherClubId]: 1 },
      seasonStartSnapshot: {
        season: game.currentSeason, finalPosition: 6, finances: managedClub.finances + 50_000,
        communityStanding: 50, squadSize: 20, supporterMembers: 100, academyPromotions: 0,
      },
    }, 1).game

    expect(result.currentSeason).toBe(game.currentSeason + 1)
    expect(result.pointDeductions).toEqual({
      [game.managedClubId]: 5,
      [otherClubId]: 1,
    })
    expect(result.pendingPointDeductions).toBeUndefined()
  })
})
