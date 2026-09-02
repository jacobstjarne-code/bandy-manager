import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { ActiveArc, ArcType } from '../../entities/Narrative'
import type { TransferBid } from '../../entities/GameEvent'
import { CLUB_TEMPLATES } from '../worldGenerator'
import { FixtureStatus, MatchEventType } from '../../enums'
import { getRolloverPolicy } from '../deferredRolloverService'
import { detectArcTriggers, progressArcs } from '../arcService'
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

    const releasedProgress = progressArcs(released, 7)
    const waitedProgress = progressArcs(waited, 7)
    expect(releasedProgress.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${arc.id}_resolved`,
      type: 'contract_drama_resolved',
      playerId: player.id,
      clubId: base.managedClubId,
      description: `${player.firstName} ${player.lastName} lämnade klubben efter kontraktsstriden. En bitter upplösning.`,
      displayText: `📋 ${player.firstName} ${player.lastName} lämnade`,
      resolved: true,
    })])
    expect(waitedProgress.newStorylines).toEqual([])
  })

  it('contract_drama använder spelets globala matchday när ingen managed fixture följer med', () => {
    const { base, player } = makePeak('contract_drama')
    const candidate = {
      ...player,
      form: 70,
      contractUntilSeason: base.currentSeason,
    }
    const bid: TransferBid = {
      id: 'bid_global_clock', playerId: player.id, buyingClubId: 'other', sellingClubId: base.managedClubId,
      offerAmount: 100000, offeredSalary: 10000, contractYears: 2,
      direction: 'incoming', status: 'pending', createdRound: 14, expiresRound: 20,
    }
    const game = {
      ...base,
      currentMatchday: 17,
      players: base.players.map(item => item.id === player.id ? candidate : item),
      transferBids: [bid],
    }
    const detected = detectArcTriggers(game).find(item => item.type === 'contract_drama')

    expect(detected).toMatchObject({
      playerId: player.id,
      startedMatchday: 17,
      expiresMatchday: 23,
    })
    expect(detected?.id).toContain('_md17')
  })

  it('jokerbänkning använder befintlig enmatchsvila och deklarerar disciplinpriset på stödvalet', () => {
    const { base, player, arc } = makePeak('joker_redemption', {
      data: { sourceFixtureId: 'joker_suspension' },
    })
    const suspensionFixture = {
      ...base.fixtures[0],
      id: 'joker_suspension',
      status: FixtureStatus.Completed,
      homeClubId: base.managedClubId,
      matchday: arc.startedMatchday,
      events: [{
        type: MatchEventType.Suspension,
        minute: 44,
        clubId: base.managedClubId,
        playerId: player.id,
      }],
    }
    const game = { ...base, currentMatchday: 6, fixtures: [suspensionFixture], activeArcs: [arc] }
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
    expect(result.activeArcs?.[0].data?.decisionMatchday).toBe(6)
  })

  it('joker-triggern kräver en completed managed suspension och fryser källfixturen', () => {
    const { base, player } = makePeak('joker_redemption')
    const joker = { ...player, trait: 'joker' as const }
    const fixture = {
      ...base.fixtures[0],
      id: 'joker_trigger_source',
      status: FixtureStatus.Completed,
      homeClubId: base.managedClubId,
      awayClubId: 'club_other',
      matchday: 5,
      events: [{
        type: MatchEventType.Suspension,
        minute: 44,
        clubId: base.managedClubId,
        playerId: player.id,
      }],
    }
    const game = {
      ...base,
      players: base.players.map(candidate => candidate.id === player.id ? joker : candidate),
    }
    const detected = detectArcTriggers(game, fixture).find(candidate => candidate.type === 'joker_redemption')

    expect(detected).toEqual(expect.objectContaining({
      playerId: player.id,
      startedMatchday: 5,
      data: { sourceFixtureId: fixture.id },
    }))
    expect(detectArcTriggers(game, { ...fixture, status: FixtureStatus.Scheduled })
      .some(candidate => candidate.type === 'joker_redemption')).toBe(false)
    expect(detectArcTriggers(game, {
      ...fixture,
      id: 'joker_unmanaged',
      homeClubId: 'club_soderfors',
      awayClubId: 'club_skutskar',
    }).some(candidate => candidate.type === 'joker_redemption')).toBe(false)
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

  it('hungrig-resolutionen fryser exakt målskytt, klubb och bara den bevisade islossningen', () => {
    const { base, player, arc } = makePeak('hungrig_breakthrough', { phase: 'resolving' })
    const fixture = base.fixtures.find(candidate => !candidate.isCup && !candidate.isKnockout)!
    const completedFixture = {
      ...fixture,
      status: FixtureStatus.Completed,
      matchday: 5,
      roundNumber: 2,
      events: [{
        type: MatchEventType.Goal,
        minute: 12,
        clubId: base.managedClubId,
        playerId: player.id,
      }],
    }
    const result = progressArcs({ ...base, fixtures: [completedFixture], activeArcs: [arc] }, 7)

    expect(result.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${arc.id}_resolved`,
      type: 'hungrig_breakthrough',
      season: base.currentSeason,
      matchday: 2,
      playerId: player.id,
      clubId: base.managedClubId,
      description: `${player.firstName} ${player.lastName} bröt isen`,
      displayText: `${player.firstName} ${player.lastName} bröt isen`,
      resolved: true,
    })])
  })

  it('joker-resolutionen kräver både back_joker och en verklig egen målpoäng', () => {
    const { base, player, arc } = makePeak('joker_redemption', {
      phase: 'resolving',
      decisionsMade: ['back_joker'],
      data: { decisionMatchday: 6 },
    })
    const fixture = base.fixtures.find(candidate =>
      !candidate.isCup
      && !candidate.isKnockout
      && (candidate.homeClubId === base.managedClubId || candidate.awayClubId === base.managedClubId),
    )!
    const completedFixture = {
      ...fixture,
      status: FixtureStatus.Completed,
      roundNumber: 4,
      matchday: 8,
      events: [{
        type: MatchEventType.Assist,
        minute: 20,
        clubId: base.managedClubId,
        playerId: player.id,
        description: 'Assist',
      }],
    }
    const game = { ...base, fixtures: [completedFixture] }

    const backed = progressArcs({ ...game, activeArcs: [arc] }, 8)
    const notBacked = progressArcs({
      ...game,
      activeArcs: [{ ...arc, decisionsMade: [] }],
    }, 8)

    expect(backed.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${arc.id}_resolved`,
      type: 'joker_vindicated',
      season: base.currentSeason,
      matchday: 4,
      playerId: player.id,
      clubId: base.managedClubId,
      description: `${player.firstName} ${player.lastName} — joker i hjärtat`,
      displayText: `${player.firstName} ${player.lastName} — joker i hjärtat`,
      resolved: true,
    })])
    expect(notBacked.newStorylines).toEqual([])
  })

  it('joker-resolutionen minns en målpoäng efter stödvalet även när den inte kom i sista tickens fixture', () => {
    const { base, player, arc } = makePeak('joker_redemption', {
      phase: 'resolving',
      decisionsMade: ['back_joker'],
      data: { decisionMatchday: 5 },
    })
    const fixture = base.fixtures.find(candidate =>
      candidate.homeClubId === base.managedClubId || candidate.awayClubId === base.managedClubId,
    )!
    const contributionFixture = {
      ...fixture,
      id: 'joker_contribution',
      status: FixtureStatus.Completed,
      roundNumber: 3,
      matchday: 6,
      events: [{
        type: MatchEventType.Goal,
        minute: 15,
        clubId: base.managedClubId,
        playerId: player.id,
        description: 'Mål',
      }],
    }
    const laterFixture = {
      ...fixture,
      id: 'joker_later',
      status: FixtureStatus.Completed,
      roundNumber: 4,
      matchday: 7,
      events: [],
    }
    const game = { ...base, fixtures: [contributionFixture, laterFixture], activeArcs: [arc] }

    const result = progressArcs(game, 7)

    expect(result.newStorylines.some(story => story.type === 'joker_vindicated')).toBe(true)
  })

  it('veteranens kontraktsavsked kräver explicit val och en verklig release', () => {
    const { base, player, arc } = makePeak('veteran_farewell')
    const generated = progressArcs({ ...base, currentMatchday: 6, activeArcs: [arc] }, 6)
    const event = generated.newEvents[0]
    const resolved = resolveEvent({
      ...base,
      currentMatchday: 6,
      activeArcs: generated.updatedArcs,
      pendingEvents: [event],
    }, event.id, 'farewell_veteran', undefined, true)
    const progressed = progressArcs(resolved, 7)
    const noDecision = progressArcs({
      ...base,
      activeArcs: [{ ...arc, phase: 'resolving', decisionsMade: [] }],
    }, 7)

    expect(progressed.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${arc.id}_resolved`,
      type: 'veteran_farewell',
      playerId: player.id,
      clubId: base.managedClubId,
      description: `${player.firstName} ${player.lastName} tömde skåpet själv. Han sa att han förstod.`,
      displayText: `${player.firstName} ${player.lastName} tömde skåpet själv. Han sa att han förstod.`,
      resolved: true,
    })])
    expect(resolved.players.find(candidate => candidate.id === player.id)?.clubId).toBe('free_agent')
    expect(noDecision.newStorylines).toEqual([])
  })

  it('veteranens stannande kräver explicit val och en verklig tvåårsförlängning', () => {
    const { base, player, arc } = makePeak('veteran_farewell')
    const generated = progressArcs({ ...base, currentMatchday: 6, activeArcs: [arc] }, 6)
    const event = generated.newEvents[0]
    const resolved = resolveEvent({
      ...base,
      currentMatchday: 6,
      activeArcs: generated.updatedArcs,
      pendingEvents: [event],
    }, event.id, 'extend_veteran', undefined, true)
    const progressed = progressArcs(resolved, 7)

    expect(progressed.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${arc.id}_resolved`,
      type: 'veteran_stayed',
      playerId: player.id,
      clubId: base.managedClubId,
      description: `${player.firstName} ${player.lastName} skriver på i omklädningsrummet. Någon hade tagit med tårta.`,
      displayText: `🏅 ${player.firstName} ${player.lastName} stannar — legenden lever`,
      resolved: true,
    })])
    expect(resolved.players.find(candidate => candidate.id === player.id)).toMatchObject({
      clubId: base.managedClubId,
      contractUntilSeason: base.currentSeason + 2,
    })
  })

  it('lokalhjälten kräver exakt derby-mål och fryser spelare och klubb utan obelagda superlativ', () => {
    const { base, player, arc } = makePeak('lokal_hero', {
      phase: 'resolving',
      data: { sourceFixtureId: 'local_derby' },
    })
    const derby = {
      ...base.fixtures[0],
      id: 'local_derby',
      season: base.currentSeason,
      status: FixtureStatus.Completed,
      homeClubId: base.managedClubId,
      awayClubId: 'club_gagnef',
      matchday: 5,
      roundNumber: 2,
      events: [{
        type: MatchEventType.Goal,
        minute: 19,
        clubId: base.managedClubId,
        playerId: player.id,
      }],
    }
    const verified = progressArcs({ ...base, fixtures: [derby], activeArcs: [arc] }, 7)
    const unverified = progressArcs({
      ...base,
      fixtures: [{ ...derby, events: [] }],
      activeArcs: [arc],
    }, 7)

    expect(verified.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${arc.id}_resolved`,
      type: 'lokal_hero_moment',
      playerId: player.id,
      clubId: base.managedClubId,
      season: base.currentSeason,
      matchday: 2,
      description: `🏠 ${player.firstName} ${player.lastName} — ortens hjälte`,
      displayText: `🏠 ${player.firstName} ${player.lastName} — ortens hjälte`,
      resolved: true,
    })])
    expect(unverified.newStorylines).toEqual([])
  })

  it('lokalhjälte-triggern sparar exakt derbyfixture och ignorerar derby utanför managed club', () => {
    const { base, player } = makePeak('lokal_hero')
    const localPlayer = { ...player, trait: 'lokal' as const }
    const derby = {
      ...base.fixtures[0],
      id: 'local_derby_trigger',
      season: base.currentSeason,
      status: FixtureStatus.Completed,
      homeClubId: base.managedClubId,
      awayClubId: 'club_gagnef',
      matchday: 5,
      roundNumber: 2,
      events: [{
        type: MatchEventType.Goal,
        minute: 19,
        clubId: base.managedClubId,
        playerId: player.id,
      }],
    }
    const game = {
      ...base,
      players: base.players.map(candidate => candidate.id === player.id ? localPlayer : candidate),
    }

    expect(detectArcTriggers(game, derby).find(candidate => candidate.type === 'lokal_hero')).toEqual(expect.objectContaining({
      type: 'lokal_hero',
      playerId: player.id,
      startedMatchday: 5,
      data: { sourceFixtureId: derby.id },
    }))
    const detected = detectArcTriggers(game, derby).find(candidate => candidate.type === 'lokal_hero')!
    const peak = progressArcs({ ...game, fixtures: [derby], activeArcs: [detected] }, 7)
    const resolved = progressArcs({ ...game, fixtures: [derby], activeArcs: peak.updatedArcs }, 9)
    expect(peak.updatedArcs[0]?.phase).toBe('peak')
    expect(resolved.newStorylines.some(story => story.type === 'lokal_hero_moment')).toBe(true)
    expect(detectArcTriggers(game, {
      ...derby,
      id: 'unmanaged_derby',
      homeClubId: 'club_soderfors',
      awayClubId: 'club_skutskar',
    }).some(candidate => candidate.type === 'lokal_hero')).toBe(false)
  })

  it('derbyekot fryser källfixturen och återger oavgjort som oavgjort, inte förlust', () => {
    const { base } = makePeak('derby_echo')
    const fixture = {
      ...base.fixtures[0],
      id: 'echo_draw',
      season: base.currentSeason,
      status: FixtureStatus.Completed,
      homeClubId: base.managedClubId,
      awayClubId: 'club_gagnef',
      homeScore: 2,
      awayScore: 2,
      matchday: 5,
      roundNumber: 2,
      events: [],
    }
    const detected = detectArcTriggers(base, fixture).find(candidate => candidate.type === 'derby_echo')!
    const building = progressArcs({ ...base, fixtures: [fixture], activeArcs: [detected] }, 5)
    const result = progressArcs({ ...base, fixtures: [fixture], activeArcs: building.updatedArcs }, 7)

    expect(detected.data).toMatchObject({ derbyResult: 'draw', sourceFixtureId: fixture.id })
    expect(building.updatedArcs[0]?.phase).toBe('building')
    expect(building.newInboxItems).toHaveLength(1)
    expect(result.newStorylines).toEqual([expect.objectContaining({
      id: `storyline_${detected.id}_resolved`,
      type: 'derby_echo_resolved',
      clubId: base.managedClubId,
      matchday: 2,
      description: 'Oavgjort mot Gagnef.',
      displayText: 'Oavgjort mot Gagnef.',
      resolved: true,
    })])
    expect(detectArcTriggers(base, {
      ...fixture,
      id: 'unmanaged_echo',
      homeClubId: 'club_soderfors',
      awayClubId: 'club_skutskar',
    }).some(candidate => candidate.type === 'derby_echo')).toBe(false)
  })

  it('obesvarade playerArc-val rinner ut och auto-väljs inte', () => {
    expect(getRolloverPolicy('playerArc')).toBe('expire')
  })
})
