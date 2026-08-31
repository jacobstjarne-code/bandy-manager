/**
 * O1 kandidat 2 (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md, Jacobs dom
 * 2026-08-24) — "kontraktet med en veteran" som systemhandelse.
 *
 * Bygger ovanpå den redan existerande veteran_farewell-bågens peak-event
 * (arcService.ts) istället för ett parallellt nytt GameEventType: gaten
 * (trait==='veteran', ålder≥30, kontrakt löper ut, ej redan i annan båge)
 * fanns redan. Det som saknades: systemhandelse:true, klackens mood som
 * KONSEKVENS av valet (inte ett villkor — favoritePlayerId mäter en annan
 * fråga, se rapporten till Jacob 2026-08-24), en riktig release-väg
 * (spelaren blev tidigare aldrig faktiskt free agent vid "ett slut" — samma
 * klass av fel som contract_drama-bågens let_go redan hade), och Jacobs
 * låsta text (2026-08-24) — två brödtextvarianter (homegrown skriver ut
 * {år}, värvad gör det inte), två val (wait_veteran borttaget — Jacobs text
 * gav bara två, och auto-resolve efter 4 omgångar i peak-fas redan gav
 * samma icke-förlängd-utfall som ett obesvarat "vänta" hade gjort).
 *
 * Magnituderna (+6 / −14 klackens stämning) godkända av Jacob 2026-08-24 —
 * avskedet väger tyngre: att behålla någon är förväntat, att släppa någon
 * är en händelse.
 */
import { describe, it, expect } from 'vitest'
import { progressArcs } from '../arcService'
import { resolveEvent } from '../events/eventResolver'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { ActiveArc } from '../../entities/Narrative'

function makeGameWithVeteranArc(): { game: SaveGame; veteranId: string; arcId: string } {
  const template = CLUB_TEMPLATES[0]
  let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const club = game.clubs.find(c => c.id === game.managedClubId)!
  const veteranId = club.squadPlayerIds[0]

  game = {
    ...game,
    players: game.players.map(p =>
      p.id === veteranId
        ? { ...p, trait: 'veteran', age: 32, contractUntilSeason: game.currentSeason }
        : p
    ),
  }

  const arcId = 'arc_veteran_test'
  const arc: ActiveArc = {
    id: arcId,
    type: 'veteran_farewell',
    playerId: veteranId,
    startedMatchday: 15,
    phase: 'peak',
    expiresMatchday: 23,
    eventsFired: [],
    decisionsMade: [],
  }
  game = { ...game, activeArcs: [arc] }

  return { game, veteranId, arcId }
}

describe('veteran_farewell peak event — O1 kandidat 2', () => {
  it('genererar en systemhandelse:true peak-event för veteranen', () => {
    const { game, veteranId } = makeGameWithVeteranArc()
    const result = progressArcs(game, 16)
    expect(result.newEvents).toHaveLength(1)
    const event = result.newEvents[0]
    expect(event.systemhandelse).toBe(true)
    expect(event.relatedPlayerId).toBe(veteranId)
    expect(event.choices?.map(c => c.id)).toEqual(['extend_veteran', 'farewell_veteran'])
    expect(event.title).toBe(`${game.players.find(p => p.id === veteranId)!.firstName} ${game.players.find(p => p.id === veteranId)!.lastName} vill stanna`)
  })

  it('brödtext: homegrown skriver ut {år}, värvad gör det inte', () => {
    const { game: homegrown, veteranId: id1 } = makeGameWithVeteranArc()
    const gHome = { ...homegrown, players: homegrown.players.map(p => p.id === id1 ? { ...p, isHomegrown: true, careerStats: { ...p.careerStats, seasonsPlayed: 12 } } : p) }
    const homeEvent = progressArcs(gHome, 16).newEvents[0]
    expect(homeEvent.body).toContain('12 år')
    expect(homeEvent.body).toContain('den som väntar')

    const { game: transferred, veteranId: id2 } = makeGameWithVeteranArc()
    const gTransferred = { ...transferred, players: transferred.players.map(p => p.id === id2 ? { ...p, isHomegrown: false } : p) }
    const transferredEvent = progressArcs(gTransferred, 16).newEvents[0]
    expect(transferredEvent.body).not.toMatch(/\d+ år/)
    expect(transferredEvent.body).toContain('länge nog att folk vet var han bor')
  })

  it('extend_veteran: kontraktet förlängs, klackens stämning stiger, spelaren markeras hanterad', () => {
    const { game, veteranId } = makeGameWithVeteranArc()
    const before = game.players.find(p => p.id === veteranId)!
    const startMood = game.supporterGroup?.mood ?? 60
    const generated = progressArcs(game, 16)
    let g = { ...game, pendingEvents: generated.newEvents }

    g = resolveEvent(g, generated.newEvents[0].id, 'extend_veteran', undefined, true)

    const after = g.players.find(p => p.id === veteranId)!
    expect(after.contractUntilSeason).toBe(g.currentSeason + 2)
    expect(after.salary).toBe(before.salary)
    expect(after.morale).toBe(Math.min(100, before.morale + 10))
    expect(g.supporterGroup?.mood).toBe(Math.min(100, startMood + 6))
    expect(g.handledContractPlayerIds).toContain(veteranId)
  })

  it('farewell_veteran: spelaren blir faktiskt free agent, klackens stämning faller', () => {
    const { game, veteranId } = makeGameWithVeteranArc()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const before = game.players.find(p => p.id === veteranId)!
    const startMood = game.supporterGroup?.mood ?? 60
    const squadSizeBefore = club.squadPlayerIds.length
    const generated = progressArcs(game, 16)
    let g = { ...game, pendingEvents: generated.newEvents }

    g = resolveEvent(g, generated.newEvents[0].id, 'farewell_veteran', undefined, true)

    const after = g.players.find(p => p.id === veteranId)!
    expect(after.clubId).toBe('free_agent')
    expect(after.morale).toBe(Math.min(100, before.morale - 20))
    const updatedClub = g.clubs.find(c => c.id === g.managedClubId)!
    expect(updatedClub.squadPlayerIds).not.toContain(veteranId)
    expect(updatedClub.squadPlayerIds.length).toBe(squadSizeBefore - 1)
    expect(g.supporterGroup?.mood).toBe(Math.max(0, startMood - 14))
  })

})
