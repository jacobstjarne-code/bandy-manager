import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { processSponsors } from '../../../application/useCases/processors/sponsorProcessor'
import { applyPatronHappinessTransition } from '../patronWithdrawalService'
import { jobbetForsvannEvent } from '../events/eventFactories'
import { resolveEvent } from '../events/eventResolver'
import type { SaveGame, Sponsor } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import type { Patron } from '../../entities/Community'

/**
 * SPEC_FORHANDLING_TERMER_2026-09-04 (C-T8) §3C/§6 — jobbet_forsvann: en
 * bunden jobbgaranti försvinner när sponsorn/patronen bakom den lämnar.
 * Se contentContract.ts:s jobbet_forsvann-rad för de tre medvetna
 * förenklingarna mot specen (flaggade i MASTER_OPPET.md).
 */

function sponsor(overrides: Partial<Sponsor> = {}): Sponsor {
  return { id: 'sponsor_1', name: 'ICA Maxi', category: 'retail', weeklyIncome: 2_000, contractRounds: 10, signedRound: 0, ...overrides }
}

function baseGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
  return { ...game, ...overrides }
}

function boundPlayer(game: SaveGame, sponsorId: string) {
  const target = game.players.find(p => p.clubId === game.managedClubId)!
  return { ...target, jobGuaranteeSponsorId: sponsorId }
}

describe('processSponsors — jobbet_forsvann-trigger', () => {
  it('naturlig sponsorutgång (contractRounds→0) ger jobbet_forsvann för en bunden spelare', () => {
    const s = sponsor({ contractRounds: 1 })
    const game = baseGame({ sponsors: [s] })
    const player = boundPlayer(game, s.id)
    const players = game.players.map(p => p.id === player.id ? player : p)

    const result = processSponsors(game, null, players, 2, game.currentDate, 1, () => 0.99)

    expect(result.updatedSponsors).toEqual([])
    expect(result.jobLossEvents).toHaveLength(1)
    expect(result.jobLossEvents[0].type).toBe('jobbet_forsvann')
    expect(result.jobLossEvents[0].relatedPlayerId).toBe(player.id)
    expect(result.jobLossEvents[0].body).toContain('ICA Maxi')
  })

  it('licensutlöst omedelbart sponsoravhopp ger också jobbet_forsvann (samma departed-mängd, annan väg)', () => {
    const s = sponsor({ id: 'license_sponsor', contractRounds: 20 })
    const game = baseGame({ sponsors: [s], licenseStatus: 'first_warning' })
    const player = boundPlayer(game, s.id)
    const players = game.players.map(p => p.id === player.id ? player : p)

    const result = processSponsors(game, null, players, 2, game.currentDate, 1, () => 0.99)

    expect(result.updatedSponsors).toEqual([])
    expect(result.jobLossEvents).toHaveLength(1)
    expect(result.jobLossEvents[0].relatedPlayerId).toBe(player.id)
  })

  it('en spelare bunden till en sponsor som INTE lämnar får inget kort', () => {
    const staying = sponsor({ id: 'staying', contractRounds: 10 })
    const game = baseGame({ sponsors: [staying] })
    const player = boundPlayer(game, staying.id)
    const players = game.players.map(p => p.id === player.id ? player : p)

    const result = processSponsors(game, null, players, 2, game.currentDate, 1, () => 0.5)

    expect(result.updatedSponsors).toHaveLength(1)
    expect(result.jobLossEvents).toEqual([])
  })
})

describe('applyPatronHappinessTransition — jobbet_forsvann-trigger', () => {
  function patron(overrides: Partial<Patron> = {}): Patron {
    return {
      id: 'patron_1', name: 'Annika', business: 'Sågverket', influence: 30,
      happiness: 10, contribution: 50_000, isActive: true, ...overrides,
    } as Patron
  }

  it('happiness till exakt noll ger jobbet_forsvann för en spelare bunden till patronen', () => {
    const p = patron({ happiness: 10 })
    const game = baseGame({ patron: p })
    const player = boundPlayer(game, p.id)
    const gameWithPlayer = { ...game, players: game.players.map(pl => pl.id === player.id ? player : pl) }

    const transition = applyPatronHappinessTransition(gameWithPlayer, -10)

    expect(transition.patron?.isActive).toBe(false)
    expect(transition.jobLossEvents).toHaveLength(1)
    expect(transition.jobLossEvents![0].body).toContain('Annika')
  })

  it('happiness som stannar över noll ger inget jobbet_forsvann', () => {
    const p = patron({ happiness: 50 })
    const game = baseGame({ patron: p })
    const player = boundPlayer(game, p.id)
    const gameWithPlayer = { ...game, players: game.players.map(pl => pl.id === player.id ? player : pl) }

    const transition = applyPatronHappinessTransition(gameWithPlayer, -10)

    expect(transition.patron?.isActive).toBe(true)
    expect(transition.jobLossEvents ?? []).toEqual([])
  })
})

describe('jobbetForsvannEvent — återfallstext', () => {
  it('lägger relapsePrefix när spelaren redan haft ett jobbet_forsvann-kort', () => {
    const game = baseGame()
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const gameWithHistory = { ...game, resolvedEventIds: [`jobbet_forsvann_${player.id}_2024_10`] }

    const event = jobbetForsvannEvent(player, 'ICA Maxi', gameWithHistory)

    expect(event.body.startsWith('Andra jobbet han förlorat på ditt löfte.')).toBe(true)
  })

  it('ingen relapsePrefix första gången', () => {
    const game = baseGame()
    const player = game.players.find(p => p.clubId === game.managedClubId)!

    const event = jobbetForsvannEvent(player, 'ICA Maxi', game)

    expect(event.body.startsWith('Andra jobbet')).toBe(false)
  })
})

describe('eventResolver — jobbet_forsvann-valens effekter', () => {
  function withPendingEvent(game: SaveGame, event: GameEvent): SaveGame {
    return { ...game, pendingEvents: [...(game.pendingEvents ?? []), event] }
  }

  it("'Höj lönen' höjer lönen med exakt 4000, rör inte moralen", () => {
    const game = baseGame()
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const event = jobbetForsvannEvent(player, 'ICA Maxi', game)
    const before = game.players.find(p => p.id === player.id)!

    const after = resolveEvent(withPendingEvent(game, event), event.id, 'raiseSalary', undefined, true)
    const updated = after.players.find(p => p.id === player.id)!

    expect(updated.salary).toBe(before.salary + 4000)
    expect(updated.morale).toBe(before.morale)
  })

  it("'Vi hittar något' rebindar till en annan kapabel sponsor och drar moral −15", () => {
    const another = sponsor({ id: 'another', name: 'Bergström El', contractRounds: 10 })
    const game = baseGame({ sponsors: [another] })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const boundBefore = { ...player, jobGuaranteeSponsorId: 'gone_sponsor' }
    const gameWithPlayer = { ...game, players: game.players.map(p => p.id === player.id ? boundBefore : p) }
    const event = jobbetForsvannEvent(boundBefore, 'Den gamla sponsorn', gameWithPlayer)

    const after = resolveEvent(withPendingEvent(gameWithPlayer, event), event.id, 'findAnother', undefined, true)
    const updated = after.players.find(p => p.id === player.id)!
    const updatedSponsor = after.sponsors!.find(s => s.id === 'another')!

    expect(updated.jobGuaranteeSponsorId).toBe('another')
    expect(updated.morale).toBe(boundBefore.morale - 15)
    expect(updatedSponsor.jobsUsedThisSeason).toBe(1)
  })

  it("'Vi hittar något' nollställer jobbgarantin när ingen kapacitet finns", () => {
    const full = sponsor({ id: 'full', contractRounds: 10, jobsUsedThisSeason: 2 })
    const game = baseGame({ sponsors: [full] })
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const boundBefore = { ...player, jobGuaranteeSponsorId: 'gone_sponsor' }
    const gameWithPlayer = { ...game, players: game.players.map(p => p.id === player.id ? boundBefore : p) }
    const event = jobbetForsvannEvent(boundBefore, 'Den gamla sponsorn', gameWithPlayer)

    const after = resolveEvent(withPendingEvent(gameWithPlayer, event), event.id, 'findAnother', undefined, true)
    const updated = after.players.find(p => p.id === player.id)!

    expect(updated.jobGuaranteeSponsorId).toBeUndefined()
    expect(updated.morale).toBe(boundBefore.morale - 15)
  })

  it("'Det var inte vårt löfte att hålla' drar moral −25", () => {
    const game = baseGame()
    const player = game.players.find(p => p.clubId === game.managedClubId)!
    const event = jobbetForsvannEvent(player, 'ICA Maxi', game)
    const before = game.players.find(p => p.id === player.id)!

    const after = resolveEvent(withPendingEvent(game, event), event.id, 'honest', undefined, true)
    const updated = after.players.find(p => p.id === player.id)!

    expect(updated.morale).toBe(Math.max(0, before.morale - 25))
  })
})
