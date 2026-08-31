/**
 * O2 lager 3 (Jacobs dom 2026-08-24).
 *
 * individual dominerade tidigare team/system/silent fullständigt (vann eller
 * delade på båda mätta dimensionerna, se
 * O2_PAIRWISE_DOMINANCE_AUDIT_2026-08-23.md). "Individual förblir bäst i
 * förväntan men inte riskfri, och system/team får en äkta nisch":
 * - individual: oförändrad uppsida, men 18% risk att en slumpmässig
 *   lagkamrat tappar 4 moral (avundsjuka).
 * - team: hela truppen +2 moral (bredd, ingen risk) istället för tidigare 0.
 * - system: den overksamma −2 borttagen, journalistrelation +4 (bättre än
 *   individuals +3) istället för tidigare +3 — riskfri nisch.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../events/eventResolver'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'

function makeGame(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeCSPressEvent(playerId: string, fixtureId: string): GameEvent {
  return {
    id: 'cspress_1',
    type: 'csPress',
    title: 't', body: 'b',
    relatedPlayerId: playerId,
    relatedFixtureId: fixtureId,
    choices: [
      { id: 'individual', label: 'Han har varit avgörande', effect: { type: 'noOp' } },
      { id: 'team', label: 'Hela laget försvarar', effect: { type: 'noOp' } },
      { id: 'system', label: 'Det är systemet', effect: { type: 'noOp' } },
      { id: 'silent', label: 'Ingen kommentar', effect: { type: 'noOp' } },
    ],
    resolved: false,
  }
}

describe('csPress — individual: oförändrad uppsida, ny 18%-jealousyrisk', () => {
  it('spelaren får +5 moral, journalistrelation +3', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const before = game.players.find(p => p.id === playerId)!
    const beforeRel = game.journalist!.relationship
    const event = makeCSPressEvent(playerId, 'no_such_fixture')
    let g = { ...game, pendingCSPress: event }
    // rand() alltid högt — ingen jealousy-risk triggas
    g = resolveEvent(g, event.id, 'individual', () => 0.99, true)

    const after = g.players.find(p => p.id === playerId)!
    expect(after.morale).toBe(Math.min(100, before.morale + 5))
    expect(g.journalist!.relationship).toBe(Math.min(100, beforeRel + 3))
  })

  it('vid låg rand (<0.18): en annan lagkamrat tappar 4 moral, spelaren själv opåverkad av risken', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const teammateId = club.squadPlayerIds[1]
    const teammateBefore = game.players.find(p => p.id === teammateId)!
    const event = makeCSPressEvent(playerId, 'no_such_fixture')
    let g = { ...game, pendingCSPress: event }
    // Första rand()-anropet (<0.18) triggar risken, andra (0) väljer första lagkamraten i listan
    const calls: number[] = [0.1, 0]
    let i = 0
    g = resolveEvent(g, event.id, 'individual', () => calls[i++] ?? 0, true)

    const teammateAfter = g.players.find(p => p.id === teammateId)!
    expect(teammateAfter.morale).toBe(Math.max(0, teammateBefore.morale - 4))
  })

  it('vid hög rand (>=0.18): ingen lagkamrat förlorar moral', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const beforeMorales = new Map(game.players.map(p => [p.id, p.morale]))
    const event = makeCSPressEvent(playerId, 'no_such_fixture')
    let g = { ...game, pendingCSPress: event }
    g = resolveEvent(g, event.id, 'individual', () => 0.5, true)

    for (const p of g.players) {
      if (p.id === playerId) continue
      expect(p.morale).toBe(beforeMorales.get(p.id))
    }
  })
})

describe('csPress — team: bredd-nisch, hela truppen +2 moral', () => {
  it('varje spelare i truppen får +2 moral, journalistrelation opåverkad', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const beforeMorales = new Map(game.players.map(p => [p.id, p.morale]))
    const beforeRel = game.journalist!.relationship
    const event = makeCSPressEvent(playerId, 'no_such_fixture')
    let g = { ...game, pendingCSPress: event }
    g = resolveEvent(g, event.id, 'team', undefined, true)

    for (const pid of club.squadPlayerIds) {
      const after = g.players.find(p => p.id === pid)!
      expect(after.morale).toBe(Math.min(100, (beforeMorales.get(pid) ?? 50) + 2))
    }
    expect(g.journalist!.relationship).toBe(beforeRel)
  })
})

describe('csPress — system: riskfri journalistnisch, ingen overksam moral-penalty', () => {
  it('spelarens moral opåverkad, journalistrelation +4 (bättre än individuals +3)', () => {
    const game = makeGame()
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const playerId = club.squadPlayerIds[0]
    const before = game.players.find(p => p.id === playerId)!
    const beforeRel = game.journalist!.relationship
    const event = makeCSPressEvent(playerId, 'no_such_fixture')
    let g = { ...game, pendingCSPress: event }
    g = resolveEvent(g, event.id, 'system', undefined, true)

    const after = g.players.find(p => p.id === playerId)!
    expect(after.morale).toBe(before.morale)
    expect(g.journalist!.relationship).toBe(Math.min(100, beforeRel + 4))
  })
})
