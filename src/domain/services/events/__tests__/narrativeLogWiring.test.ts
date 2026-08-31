import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * U5 (SLUTTEST_KO.md, 2026-08-17) — narrativeBeatLog-skrivväg 1/9 (resolvedEventIds)
 * och 6/9 (sourceCooldowns), båda i eventResolver.ts:s resolveEvent().
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

function pendingWith(type: string, effect: unknown): GameEvent {
  return {
    id: 'test_narrativelog_event',
    type: type as GameEvent['type'],
    title: 't', body: 'b',
    choices: [{ id: 'go', label: 'Go', effect: effect as never }],
    resolved: false,
  }
}

describe('resolveEvent skriver till narrativeBeatLog (U5, skrivväg 1/9)', () => {
  it('en resolverad event loggas med event.type som semanticKey', () => {
    let game = makeGame()
    game = { ...game, pendingEvents: [pendingWith('communityEvent', { type: 'noOp' })] }
    game = resolveEvent(game, 'test_narrativelog_event', 'go', undefined, true)

    expect(game.narrativeBeatLog).toBeDefined()
    const entry = game.narrativeBeatLog!.find(e => e.semanticKey === 'communityEvent')
    expect(entry).toBeDefined()
    expect(entry!.season).toBe(game.currentSeason)
  })

  it('systemhandelse-flaggan följer med om eventet är taggat (O19)', () => {
    let game = makeGame()
    const event = { ...pendingWith('detOmojligaValet', { type: 'noOp' }), systemhandelse: true }
    game = { ...game, pendingEvents: [event] }
    game = resolveEvent(game, 'test_narrativelog_event', 'go', undefined, true)

    const entry = game.narrativeBeatLog!.find(e => e.semanticKey === 'detOmojligaValet')
    expect(entry?.systemhandelse).toBe(true)
  })

  it('ett icke-systemhandelse-event loggas utan flaggan satt', () => {
    let game = makeGame()
    game = { ...game, pendingEvents: [pendingWith('communityEvent', { type: 'noOp' })] }
    game = resolveEvent(game, 'test_narrativelog_event', 'go', undefined, true)

    const entry = game.narrativeBeatLog!.find(e => e.semanticKey === 'communityEvent')
    expect(entry?.systemhandelse).toBeUndefined()
  })
})
