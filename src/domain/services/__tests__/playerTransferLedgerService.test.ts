import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { EventLedgerEntry } from '../../entities/Narrative'
import { buildPlayerLedger, buildTransferRivalryWarning } from '../playerTransferLedgerService'
import { getRivalry } from '../../data/rivalries'

describe('playerTransferLedgerService', () => {
  it('returnerar 0 rader för en rotlös spelare och fabricerar ingen verdict', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 41 })
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const player = {
      ...game.players.find(candidate => candidate.clubId === club.id)!,
      joinedClubSeason: undefined,
      dayJob: undefined,
      isFullTimePro: true,
      transferPersonality: 'default' as const,
    }

    expect(buildPlayerLedger({ ...game, eventLedger: [] }, player, club, 'renew'))
      .toEqual({ rows: [], verdict: undefined })
  })

  it('prioriterar riktig Triumf, blodslinje och klubbår och kapar vid tre', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 42 })
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const player = game.players.find(candidate => candidate.clubId === club.id)!
    const junior = game.players.find(candidate => candidate.clubId === club.id && candidate.id !== player.id)!
    const eventLedger: EventLedgerEntry[] = [
      {
        type: 'academy_promotion', semanticKey: 'promo', clubId: club.id,
        season: 2026, matchday: 4, subject: { kind: 'player', id: player.id }, significance: 80,
      },
      {
        type: 'mentorship_started', semanticKey: 'mentor', clubId: club.id,
        season: 2025, matchday: 2,
        subject: { kind: 'player', id: junior.id },
        subject2: { kind: 'player', id: player.id },
        mentorship: { mentorId: player.id, juniorCaAtStart: 40, developmentRateAtStart: 70 },
        significance: 55,
      },
    ]
    const rooted = {
      ...player,
      joinedClubSeason: 2020,
      isFullTimePro: false,
      dayJob: { title: 'Vaktmästare', flexibility: 70, weeklyIncome: 1_000 },
      transferPersonality: 'homebound' as const,
    }

    const result = buildPlayerLedger({ ...game, eventLedger }, rooted, club, 'renew')

    expect(result.rows).toHaveLength(3)
    expect(result.rows.map(row => row.family)).toEqual(['⚔️', '👤', '🏟️'])
    expect(result.rows[0].isTriumf).toBe(true)
    expect(result.rows[1].text).toContain(junior.lastName)
    expect(result.rows[2].text).toContain('7 säsonger')
    expect(result.verdict).toBeTruthy()
  })

  it('visar faktisk dagjobbstitel utan att hitta på arbetsgivare', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2027, seed: 43 })
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const player = {
      ...game.players.find(candidate => candidate.clubId === club.id)!,
      joinedClubSeason: undefined,
      isFullTimePro: false,
      dayJob: { title: 'Svetsare', flexibility: 65, weeklyIncome: 1_500 },
      transferPersonality: 'default' as const,
    }

    const result = buildPlayerLedger({ ...game, eventLedger: [] }, player, club, 'bid')
    expect(result.rows).toEqual([expect.objectContaining({ text: 'Svetsare på vardagarna.' })])
  })

  it('interpolerar rival och derby i den låsta varningen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_slottsbron', seed: 44 })
    const seller = game.clubs.find(candidate => candidate.id === 'club_lesjofors')!
    const player = game.players.find(candidate => candidate.clubId === seller.id)!
    const rivalry = { ...getRivalry(game.managedClubId, seller.id)!, intensity: 2 }

    const text = buildTransferRivalryWarning(player, seller, rivalry)
    expect(text).not.toContain('{rival}')
    expect(text).not.toContain('{derby}')
    expect(text.includes(seller.shortName) || text.includes(rivalry.name)).toBe(true)
  })
})
