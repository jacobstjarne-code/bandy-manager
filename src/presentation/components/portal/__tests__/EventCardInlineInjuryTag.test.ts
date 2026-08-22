import { describe, it, expect } from 'vitest'
import { getInjuryTag } from '../EventCardInline'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../../../domain/services/worldGenerator'
import type { GameEvent } from '../../../../domain/entities/GameEvent'

/**
 * High 6 (Skutskär-auditen, 2026-08-22): EventCardInline visade "Han vill
 * spela ..." utan spelarnamn för playThroughInjury-kort — flera samtidiga
 * kort gick inte att skilja åt. getInjuryTag() bär namn, skada och dagar
 * kvar, samma tre fält auditen efterfrågade.
 */

function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function makeEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'e1', type: 'playThroughInjury', title: 't', body: 'b',
    choices: [], resolved: false,
    ...overrides,
  }
}

describe('getInjuryTag', () => {
  it('bygger namn · skada · dagar kvar för ett playThroughInjury-kort', () => {
    const game = makeGame()
    const player = game.players[0]
    const players = game.players.map(p => p.id === player.id ? { ...p, firstName: 'Erik', lastName: 'Svensson', injuryDaysRemaining: 8 } : p)
    const event = makeEvent({ relatedPlayerId: player.id })

    const tag = getInjuryTag(event, players)

    expect(tag).toContain('Erik Svensson')
    expect(tag).toContain('8 dagar kvar')
    expect(tag).toContain('Mjuk skada') // <=13 dagar → 'mjuk' (getInjurySeverity)
  })

  it('mild skada (14-27 dagar) ger etiketten "Mild skada"', () => {
    const game = makeGame()
    const player = game.players[0]
    const players = game.players.map(p => p.id === player.id ? { ...p, injuryDaysRemaining: 20 } : p)
    const event = makeEvent({ relatedPlayerId: player.id })

    expect(getInjuryTag(event, players)).toContain('Mild skada')
  })

  it('två olika spelare ger två olika, urskiljbara taggar', () => {
    const game = makeGame()
    const [p1, p2] = game.players
    const players = game.players.map(p =>
      p.id === p1.id ? { ...p, firstName: 'Erik', lastName: 'Svensson' } :
      p.id === p2.id ? { ...p, firstName: 'Johan', lastName: 'Karlsson' } : p
    )
    const tag1 = getInjuryTag(makeEvent({ id: 'e1', relatedPlayerId: p1.id }), players)
    const tag2 = getInjuryTag(makeEvent({ id: 'e2', relatedPlayerId: p2.id }), players)

    expect(tag1).not.toBe(tag2)
    expect(tag1).toContain('Erik Svensson')
    expect(tag2).toContain('Johan Karlsson')
  })

  it('ingen tagg för andra event-typer (t.ex. hallDebate)', () => {
    const game = makeGame()
    const event = makeEvent({ type: 'hallDebate', relatedPlayerId: game.players[0].id })
    expect(getInjuryTag(event, game.players)).toBeUndefined()
  })

  it('ingen tagg om relatedPlayerId saknas eller spelaren inte hittas', () => {
    const game = makeGame()
    expect(getInjuryTag(makeEvent({ relatedPlayerId: undefined }), game.players)).toBeUndefined()
    expect(getInjuryTag(makeEvent({ relatedPlayerId: 'unknown_id' }), game.players)).toBeUndefined()
  })
})
