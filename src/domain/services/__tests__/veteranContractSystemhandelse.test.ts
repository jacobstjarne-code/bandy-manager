/**
 * O1 kandidat 2 (DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md, Jacobs dom
 * 2026-08-24) — "kontraktet med en veteran" som systemhandelse.
 *
 * Bygger ovanpå den redan existerande veteran_farewell-bågens peak-event
 * (arcService.ts) istället för ett parallellt nytt GameEventType: gaten
 * (trait==='veteran', ålder≥30, kontrakt löper ut, ej redan i annan båge)
 * fanns redan. Det som saknades: systemhandelse:true, och klackens mood
 * som KONSEKVENS av valet (inte ett villkor — favoritePlayerId mäter en
 * annan fråga, se rapporten till Jacob 2026-08-24) på båda riktningarna,
 * samt en riktig release-väg (spelaren blev tidigare aldrig faktiskt free
 * agent vid "Alla goda ting har ett slut" — samma klass av fel som
 * contract_drama-bågens let_go redan hade, fixad i samma O2 lager 1-pass).
 *
 * Magnituderna (+6 / −14 klackens stämning) är FÖRSLAG, inte kalibrerade —
 * rapporterade till Jacob i samma pass, inte gissade i tysthet.
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
    expect(event.choices?.map(c => c.id)).toEqual(['extend_veteran', 'farewell_veteran', 'wait_veteran'])
  })

  it('extend_veteran: kontraktet förlängs, klackens stämning stiger, spelaren markeras hanterad', () => {
    const { game, veteranId } = makeGameWithVeteranArc()
    const before = game.players.find(p => p.id === veteranId)!
    const startMood = game.supporterGroup?.mood ?? 60
    const generated = progressArcs(game, 16)
    let g = { ...game, pendingEvents: generated.newEvents }

    g = resolveEvent(g, generated.newEvents[0].id, 'extend_veteran')

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

    g = resolveEvent(g, generated.newEvents[0].id, 'farewell_veteran')

    const after = g.players.find(p => p.id === veteranId)!
    expect(after.clubId).toBe('free_agent')
    expect(after.morale).toBe(Math.min(100, before.morale - 20))
    const updatedClub = g.clubs.find(c => c.id === g.managedClubId)!
    expect(updatedClub.squadPlayerIds).not.toContain(veteranId)
    expect(updatedClub.squadPlayerIds.length).toBe(squadSizeBefore - 1)
    expect(g.supporterGroup?.mood).toBe(Math.max(0, startMood - 14))
  })

  it('wait_veteran: ingen effekt, arc-progressionen kan fortsätta senare', () => {
    const { game } = makeGameWithVeteranArc()
    const generated = progressArcs(game, 16)
    let g = { ...game, pendingEvents: generated.newEvents }

    const before = JSON.stringify(g.players)
    g = resolveEvent(g, generated.newEvents[0].id, 'wait_veteran')
    expect(JSON.stringify(g.players)).toBe(before)
    expect(g.supporterGroup?.mood).toBe(game.supporterGroup?.mood)
  })
})
