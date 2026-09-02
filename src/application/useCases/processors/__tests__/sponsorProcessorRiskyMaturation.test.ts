import { describe, it, expect } from 'vitest'
import { applyRiskySponsorMaturation } from '../sponsorProcessor'
import { createNewGame } from '../../createNewGame'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import type { Sponsor, SaveGame } from '../../../../domain/entities/SaveGame'
import { InboxItemType } from '../../../../domain/enums'

/**
 * O1-uppföljning (SLUTTEST_KO.md, 2026-08-22) — riskySponsorOffers
 * maturation-konsekvens. Text lovade tre effekter (sponsorn tas bort,
 * claw-back, anseendekostnad), koden gav noll. Konsoliderad till en ren
 * funktion så RNG kan styras deterministiskt istället för att fejka hela
 * omgångspipelinen.
 */

function baseGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeRiskySponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return {
    id: 'sponsor_risky',
    name: 'Borgvik Bygg AB',
    category: 'Bygg & Fastighet',
    weeklyIncome: 550,
    contractRounds: 40, // 44 - 4 rundor betalda
    signedRound: 8,
    tier: 'risky',
    triggeredBy: 'risky_offer',
    triggeredSeason: 1,
    expiresSeason: 3,
    ...overrides,
  }
}

const ALWAYS_FIRES = () => 0 // < 0.25
const NEVER_FIRES = () => 0.99

describe('applyRiskySponsorMaturation', () => {
  it('inget riskySponsorContract → oförändrat', () => {
    const game = baseGame()
    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', ALWAYS_FIRES)
    expect(result).toBe(game)
  })

  it('mognadsrunda inte nådd (samma säsong) → ingen effekt trots att tärningen skulle slagit', () => {
    let game = baseGame()
    game = {
      ...game,
      sponsors: [makeRiskySponsor()],
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }
    const result = applyRiskySponsorMaturation(game, 10, '2026-01-01', ALWAYS_FIRES)
    expect(result).toBe(game)
    expect(result.riskySponsorContract).toBeTruthy()
  })

  it('mognadsrunda nådd men tärningen missar → ingen effekt, kontraktet kvarstår', () => {
    let game = baseGame()
    game = {
      ...game,
      sponsors: [makeRiskySponsor()],
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }
    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', NEVER_FIRES)
    expect(result.sponsors!.find(s => s.id === 'sponsor_risky')).toBeTruthy()
    expect(result.riskySponsorContract).toBeTruthy()
  })

  it('utlöst: sponsorn tas bort, claw-back = HÄLFTEN av betalt, communityStanding -4, kontraktet rensas', () => {
    let game = baseGame()
    const startFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    const startCS = game.communityStanding ?? 50
    game = {
      ...game,
      sponsors: [makeRiskySponsor({ contractRounds: 40, weeklyIncome: 550 })], // 4 rundor betalda (44-40)
      communityStanding: startCS,
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }

    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', ALWAYS_FIRES)

    expect(result.sponsors!.find(s => s.id === 'sponsor_risky')).toBeUndefined()
    expect(result.riskySponsorContract).toBeUndefined()
    // paidSoFar = 550 * 4 = 2200, claw-back = hälften = 1100
    const endFinances = result.clubs.find(c => c.id === game.managedClubId)!.finances
    expect(endFinances).toBe(startFinances - 1100)
    expect(result.communityStanding).toBe(startCS - 4)
    expect(result.inbox.some(i => i.id === 'risky_sponsor_exposed_sponsor_risky')).toBe(true)
  })

  it('claw-back är HÄLFTEN, inte allt av vad som betalats', () => {
    let game = baseGame()
    const startFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    game = {
      ...game,
      sponsors: [makeRiskySponsor({ contractRounds: 34, weeklyIncome: 1000 })], // 10 rundor betalda
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }
    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', ALWAYS_FIRES)
    // paidSoFar = 1000 * 10 = 10000, hälften = 5000 — INTE alla 10000
    const endFinances = result.clubs.find(c => c.id === game.managedClubId)!.finances
    expect(endFinances).toBe(startFinances - 5000)
  })

  it('anseendekostnaden (-4) är mildare än O1-konfliktkortets (-6)', () => {
    let game = baseGame()
    game = {
      ...game,
      sponsors: [makeRiskySponsor()],
      communityStanding: 50,
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }
    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', ALWAYS_FIRES)
    expect(result.communityStanding).toBe(46)
    expect(50 - result.communityStanding!).toBeLessThan(6)
  })

  it('communityStanding clampas till 0, dras inte under', () => {
    let game = baseGame()
    game = {
      ...game,
      sponsors: [makeRiskySponsor()],
      communityStanding: 2,
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }
    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', ALWAYS_FIRES)
    expect(result.communityStanding).toBe(0)
  })

  it('sponsorn löpte ut naturligt innan risken utlöstes → kontraktet rensas, inget krävs tillbaka', () => {
    let game = baseGame()
    const startFinances = game.clubs.find(c => c.id === game.managedClubId)!.finances
    game = {
      ...game,
      sponsors: [], // sponsorn redan borta (contractRounds nådde 0 och filtrerades bort av processSponsors)
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
    }
    const result = applyRiskySponsorMaturation(game, 20, '2026-01-01', ALWAYS_FIRES)
    expect(result.riskySponsorContract).toBeUndefined()
    expect(result.clubs.find(c => c.id === game.managedClubId)!.finances).toBe(startFinances)
    expect(result.inbox.length).toBe(game.inbox.length)
  })

  it('legacy-save från en tidigare säsong är fortfarande kontrollerbar (inte permanent tyst)', () => {
    let game = baseGame()
    game = {
      ...game,
      sponsors: [makeRiskySponsor()],
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
      currentSeason: game.currentSeason + 1, // säsongen har rullat över, kontraktet fick aldrig utlösas förra säsongen
    }
    // Canonical rollover rebasar numera mognadsmålet och season. Detta täcker
    // äldre saves som redan hunnit sparas med den gamla säsongen kvar.
    const result = applyRiskySponsorMaturation(game, 1, '2027-01-01', ALWAYS_FIRES)
    expect(result.riskySponsorContract).toBeUndefined()
    expect(result.sponsors!.find(s => s.id === 'sponsor_risky')).toBeUndefined()
  })

  it('ett rebasat avtal väntar den återstående tiden efter säsongsskiftet', () => {
    const game = {
      ...baseGame(),
      currentSeason: 2,
      sponsors: [makeRiskySponsor()],
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 4, season: 2 },
    }
    expect(applyRiskySponsorMaturation(game, 1, '2027-01-01', ALWAYS_FIRES)).toBe(game)
    expect(applyRiskySponsorMaturation(game, 4, '2027-01-01', ALWAYS_FIRES).riskySponsorContract).toBeUndefined()
  })

  it('redan exponerad denna matId → ingen dubbel-effekt (idempotent)', () => {
    let game = baseGame()
    game = {
      ...game,
      sponsors: [makeRiskySponsor()],
      riskySponsorContract: { sponsorId: 'sponsor_risky', riskMaturityRound: 14, acceptedRound: 8, season: game.currentSeason },
      inbox: [...game.inbox, {
        id: 'risky_sponsor_exposed_sponsor_risky',
        date: '2026-01-01',
        type: InboxItemType.BoardFeedback,
        title: 'redan skickat',
        body: '',
        isRead: false,
      }],
    }
    const result = applyRiskySponsorMaturation(game, 14, '2026-01-01', ALWAYS_FIRES)
    expect(result).toBe(game)
  })
})
