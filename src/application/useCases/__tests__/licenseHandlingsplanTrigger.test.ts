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
import { resolveEvent } from '../../../domain/services/events/eventResolver'

describe('seasonEndProcessor — licenseHandlingsplan triggas av System B (licenseStatus)', () => {
  function warningGame(overrides: Partial<SaveGame> = {}): SaveGame {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
    const managedClub = base.clubs.find(c => c.id === base.managedClubId)!
    return {
      ...base,
      licenseStatus: 'clear',
      licenseRiskScore: 20,
      seasonStartSnapshot: { season: base.currentSeason, finalPosition: 12, finances: managedClub.finances + 100000, communityStanding: 50, squadSize: 16, supporterMembers: 100 },
      ...overrides,
    }
  }

  it('en säsong med negativt nettoresultat som ger first_warning (System B) skapar handlingsplan-händelsen', () => {
    const game = warningGame()
    const result = handleSeasonEnd(game, 1)

    const events = result.game.pendingEvents ?? []
    const handlingsplan = events.find(e => e.type === 'licenseHandlingsplan')
    expect(handlingsplan, 'handlingsplan-händelsen ska finnas när System B ger first_warning').toBeDefined()
  })

  it('alla visade val levererar exakt sitt deklarerade utfall', () => {
    const game = warningGame({
      patron: {
        name: 'Britta', business: 'Verkstaden', influence: 30, happiness: 50,
        contribution: 10000, isActive: true, hasBeenWarned: false,
        goodwill: 80, totalContributed: 0, demands: [],
      },
    })
    const prepared = handleSeasonEnd(game, 1).game
    const event = prepared.pendingEvents?.find(e => e.type === 'licenseHandlingsplan')
    expect(event).toBeDefined()
    expect(event?.deadlineRound).toBeGreaterThan(0)
    expect(event?.choices.map(c => c.id)).toEqual(['sparplan', 'membership', 'sponsors', 'patron'])

    const clubBefore = prepared.clubs.find(c => c.id === prepared.managedClubId)!

    const capital = resolveEvent(prepared, event!.id, 'sparplan', undefined, true)
    const capitalClub = capital.clubs.find(c => c.id === capital.managedClubId)!
    const declaredCapital = Number(event!.choices.find(c => c.id === 'sparplan')?.subtitle?.match(/(\d+) tkr/)?.[1]) * 1000
    expect(capitalClub.finances - clubBefore.finances).toBe(declaredCapital)

    const membership = resolveEvent(prepared, event!.id, 'membership', undefined, true)
    expect(membership.communityStanding).toBe(Math.min(100, (prepared.communityStanding ?? 50) + 8))

    const sponsors = resolveEvent(prepared, event!.id, 'sponsors', undefined, true)
    const sponsorClub = sponsors.clubs.find(c => c.id === sponsors.managedClubId)!
    expect(sponsorClub.reputation).toBe(Math.min(100, clubBefore.reputation + 3))

    const patron = resolveEvent(prepared, event!.id, 'patron', undefined, true)
    expect(patron.patron?.happiness).toBe(Math.min(100, (prepared.patron?.happiness ?? 0) + 15))
    expect(patron.clubs.find(c => c.id === patron.managedClubId)?.finances).toBe(clubBefore.finances)

    for (const resolved of [capital, membership, sponsors, patron]) {
      expect(resolved.pendingEvents?.some(e => e.id === event!.id)).toBe(false)
      expect(resolved.sourceCooldowns?.kommunen?.roundsLeft).toBe(8)
    }
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
