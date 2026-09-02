import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { ActiveArc, ArcType } from '../../entities/Narrative'
import type { TransferBid } from '../../entities/GameEvent'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { getRolloverPolicy } from '../deferredRolloverService'
import { progressArcs } from '../arcService'
import { resolveEvent } from '../events/eventResolver'

function makePeak(type: ArcType, overrides: Partial<ActiveArc> = {}) {
  const template = CLUB_TEMPLATES[0]
  const base = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
  const arc: ActiveArc = {
    id: `arc_${type}_truth`,
    type,
    playerId: player.id,
    startedMatchday: 3,
    phase: 'peak',
    eventsFired: [],
    decisionsMade: [],
    expiresMatchday: 12,
    ...overrides,
  }
  return { base, player, arc }
}

describe('playerArc — produktionsvalens text motsvarar state', () => {
  it('contract_drama förlänger faktiskt ett år, väntan lämnar kontraktet och let_go släpper spelaren', () => {
    const { base, player, arc } = makePeak('contract_drama')
    const bid: TransferBid = {
      id: 'bid_truth', playerId: player.id, buyingClubId: 'other', sellingClubId: base.managedClubId,
      offerAmount: 100000, offeredSalary: 10000, contractYears: 2,
      direction: 'incoming', status: 'pending', createdRound: 3, expiresRound: 9,
    }
    const game = { ...base, currentMatchday: 6, activeArcs: [arc], transferBids: [bid] }
    const progress = progressArcs(game, 6)
    const event = progress.newEvents.find(candidate => candidate.id === `contract_peak_event_${arc.id}`)!
    expect(event.choices).toMatchObject([
      { id: 'extend_now', subtitle: 'Kontrakt +1 år · moral +10', effect: { type: 'extendContract', contractYears: 1 } },
      { id: 'wait_drama', subtitle: 'Kontraktet oförändrat · moral −5' },
      { id: 'let_go', subtitle: 'Spelaren lämnar · moral −25' },
    ])

    const pending = { ...game, activeArcs: progress.updatedArcs, pendingEvents: [event] }
    const extended = resolveEvent(pending, event.id, 'extend_now', undefined, true)
    const waited = resolveEvent(pending, event.id, 'wait_drama', undefined, true)
    const released = resolveEvent(pending, event.id, 'let_go', undefined, true)
    expect(extended.players.find(candidate => candidate.id === player.id)).toMatchObject({
      contractUntilSeason: base.currentSeason + 1,
      morale: Math.min(100, player.morale + 10),
    })
    expect(waited.players.find(candidate => candidate.id === player.id)).toMatchObject({
      contractUntilSeason: player.contractUntilSeason,
      morale: Math.max(0, player.morale - 5),
    })
    expect(released.players.find(candidate => candidate.id === player.id)?.clubId).toBe('free_agent')
    expect(released.clubs.find(club => club.id === base.managedClubId)?.squadPlayerIds).not.toContain(player.id)
  })

  it('jokerbänkning använder befintlig enmatchsvila och deklarerar disciplinpriset på stödvalet', () => {
    const { base, player, arc } = makePeak('joker_redemption')
    const game = { ...base, currentMatchday: 6, activeArcs: [arc] }
    const progress = progressArcs(game, 6)
    const event = progress.newEvents.find(candidate => candidate.id === `joker_peak_event_${arc.id}`)!
    expect(event.choices.find(choice => choice.id === 'back_joker')?.subtitle)
      .toBe('💛 Moral +8 · disciplin −4')
    expect(event.choices.find(choice => choice.id === 'bench_joker')?.subtitle)
      .toBe('Vilar nästa match · moral −10')

    const result = resolveEvent({ ...game, activeArcs: progress.updatedArcs, pendingEvents: [event] }, event.id, 'bench_joker', undefined, true)
    expect(result.players.find(candidate => candidate.id === player.id)).toMatchObject({
      morale: Math.max(0, player.morale - 10),
      restGamesRemaining: 1,
    })
    expect(result.activeArcs?.[0].decisionsMade).toContain('bench_joker')
  })

  it('hungrig- och veteranvalen visar samtliga faktiska deltan', () => {
    const hungry = makePeak('hungrig_breakthrough')
    const hungryResult = progressArcs({ ...hungry.base, activeArcs: [hungry.arc] }, 6)
    expect(hungryResult.newEvents[0].choices.find(choice => choice.id === 'back_him')?.subtitle)
      .toBe('💛 Moral +5 · utvecklingstakt −4')

    const veteran = makePeak('veteran_farewell')
    const veteranResult = progressArcs({ ...veteran.base, activeArcs: [veteran.arc] }, 6)
    const veteranEvent = veteranResult.newEvents[0]
    expect(veteranEvent.choices.find(choice => choice.id === 'extend_veteran')?.subtitle)
      .toBe('Kontrakt +2 år · klackens stämning +6')
    expect(veteranEvent.choices.find(choice => choice.id === 'farewell_veteran')?.subtitle)
      .toBe('Spelaren lämnar · moral −20 · klackens stämning −14')
  })

  it('obesvarade playerArc-val rinner ut och auto-väljs inte', () => {
    expect(getRolloverPolicy('playerArc')).toBe('expire')
  })
})
