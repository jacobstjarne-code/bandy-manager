import { describe, it, expect } from 'vitest'
import { progressArcs } from '../arcService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { FixtureStatus, MatchEventType } from '../../enums'
import type { ActiveArc } from '../../entities/Narrative'
import type { Fixture } from '../../entities/Fixture'
import type { TransferBid } from '../../entities/GameEvent'

/**
 * mutationVerificationGate-utökning (2026-08-25, Jacobs order: "30-60 min,
 * gör den"). hungrig_breakthrough och contract_dramas peak-event verifierade
 * tidigare bara sitt villkor vid TRIGGER (building-fasen) — inte igen vid
 * AVFYRNING (peak-fasen, 2 omgångar senare). Dessa test reproducerar
 * staleness-buggen direkt (utan fixen hade båda fallit) och bevisar den
 * friska vägen (peak-eventet FÅR fortfarande fyras när villkoret fortfarande
 * håller).
 */
describe('progressArcs — peak-event reverifierar sitt triggervillkor', () => {
  const template = CLUB_TEMPLATES[0]

  it('hungrig_breakthrough: peak-eventet fyras INTE om spelaren redan gjort mål sedan arcen startade', () => {
    const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const player = base.players.find(p => p.clubId === base.managedClubId)!

    const goalFixture: Fixture = {
      id: 'fx_goal', leagueId: 'liga', season: base.currentSeason, roundNumber: 5, matchday: 5,
      homeClubId: base.managedClubId, awayClubId: 'club_other',
      status: FixtureStatus.Completed,
      homeScore: 1, awayScore: 0,
      events: [{ type: MatchEventType.Goal, playerId: player.id, clubId: base.managedClubId, minute: 30, description: 'Mål' }],
    }

    const arc: ActiveArc = {
      id: 'arc_hungrig_1', type: 'hungrig_breakthrough', playerId: player.id,
      startedMatchday: 3, phase: 'peak', expiresMatchday: 9,
      eventsFired: [], decisionsMade: [], data: { gamesWithoutGoal: 3 },
    }
    const game = { ...base, activeArcs: [arc], fixtures: [...base.fixtures, goalFixture] }

    const result = progressArcs(game, 6)
    const peakEvent = result.newEvents.find(e => e.id === `hungrig_peak_event_${arc.id}`)
    expect(peakEvent).toBeUndefined()
  })

  it('hungrig_breakthrough: peak-eventet FYRAS när villkoret fortfarande håller (ingen mellanliggande fixture)', () => {
    const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const player = base.players.find(p => p.clubId === base.managedClubId)!

    const arc: ActiveArc = {
      id: 'arc_hungrig_2', type: 'hungrig_breakthrough', playerId: player.id,
      startedMatchday: 3, phase: 'peak', expiresMatchday: 9,
      eventsFired: [], decisionsMade: [], data: { gamesWithoutGoal: 3 },
    }
    const game = { ...base, activeArcs: [arc] }

    const result = progressArcs(game, 6)
    const peakEvent = result.newEvents.find(e => e.id === `hungrig_peak_event_${arc.id}`)
    expect(peakEvent).toBeDefined()
  })

  it('contract_drama: peak-eventet fyras INTE om det utlösande budet inte längre är pending', () => {
    const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const player = base.players.find(p => p.clubId === base.managedClubId)!

    const arc: ActiveArc = {
      id: 'arc_contract_1', type: 'contract_drama', playerId: player.id,
      startedMatchday: 3, phase: 'peak', expiresMatchday: 9,
      eventsFired: [], decisionsMade: [],
    }
    // Budet som en gång utlöste arcen har sedan dess accepterats/gått ut — inte längre pending.
    const staleBid: TransferBid = {
      id: 'bid1', playerId: player.id, buyingClubId: 'club_other', sellingClubId: base.managedClubId,
      offerAmount: 300000, offeredSalary: 15000, contractYears: 2,
      direction: 'incoming', status: 'expired', createdRound: 3, expiresRound: 5,
    }
    const game = { ...base, activeArcs: [arc], transferBids: [staleBid] }

    const result = progressArcs(game, 6)
    const peakEvent = result.newEvents.find(e => e.id === `contract_peak_event_${arc.id}`)
    expect(peakEvent).toBeUndefined()
  })

  it('contract_drama: peak-eventet FYRAS när budet fortfarande är pending', () => {
    const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
    const player = base.players.find(p => p.clubId === base.managedClubId)!

    const arc: ActiveArc = {
      id: 'arc_contract_2', type: 'contract_drama', playerId: player.id,
      startedMatchday: 3, phase: 'peak', expiresMatchday: 9,
      eventsFired: [], decisionsMade: [],
    }
    const activeBid: TransferBid = {
      id: 'bid2', playerId: player.id, buyingClubId: 'club_other', sellingClubId: base.managedClubId,
      offerAmount: 300000, offeredSalary: 15000, contractYears: 2,
      direction: 'incoming', status: 'pending', createdRound: 3, expiresRound: 8,
    }
    const game = { ...base, activeArcs: [arc], transferBids: [activeBid] }

    const result = progressArcs(game, 6)
    const peakEvent = result.newEvents.find(e => e.id === `contract_peak_event_${arc.id}`)
    expect(peakEvent).toBeDefined()
  })
})
