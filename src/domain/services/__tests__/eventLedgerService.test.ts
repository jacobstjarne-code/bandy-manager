import { describe, it, expect } from 'vitest'
import { logEvent } from '../eventLedgerService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../worldGenerator'
import type { EventLedgerEntry } from '../../entities/Narrative'

/**
 * DOM_HANDELSELIGGAREN_2026-09-01.md / MIGRATIONSPLAN_HANDELSELIGGAREN_
 * 2026-09-01.md — Fas 0. Samma disciplin som narrativeLogService.test.ts:s
 * logNarrativeBeat-svit: ren funktion, ingen mutation, append-only.
 */
function makeGame() {
  const template = CLUB_TEMPLATES[0]
  return createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
}

const minimalEntry: EventLedgerEntry = {
  type: 'derby_result',
  semanticKey: 'derby_win',
  season: 3,
  matchday: 12,
  significance: 60,
}

describe('logEvent', () => {
  it('lägger till en post utan att mutera game.eventLedger', () => {
    const game = makeGame()
    const updated = logEvent(game, minimalEntry)
    expect(game.eventLedger).toBeUndefined()
    expect(updated).toHaveLength(1)
    expect(updated[0]).toEqual(minimalEntry)
  })

  it('bygger vidare på en befintlig liggare', () => {
    let game = { ...makeGame(), eventLedger: logEvent(makeGame(), minimalEntry) }
    const second: EventLedgerEntry = { ...minimalEntry, type: 'big_win', semanticKey: 'big_win', matchday: 20 }
    game = { ...game, eventLedger: logEvent(game, second) }
    expect(game.eventLedger).toHaveLength(2)
    expect(game.eventLedger?.[1]).toEqual(second)
  })

  it('bär hela fältschemat (subject/outcome/consequences/madeByPlayer) utan att tappa något', () => {
    const game = makeGame()
    const full: EventLedgerEntry = {
      type: 'decision',
      semanticKey: 'sell_academy_product',
      season: 4,
      matchday: 15,
      subjectPlayerId: 'player_1',
      subjectClubId: 'club_a',
      outcome: 'neutral',
      significance: 80,
      consequences: [
        { field: 'communityStanding', dir: 'down', magnitude: 'tydligt' },
        { field: 'boardPatience', dir: 'down', magnitude: 'knappt' },
      ],
      madeByPlayer: true,
    }
    const updated = logEvent(game, full)
    expect(updated[0]).toEqual(full)
  })

  it('game.eventLedger är valfritt — en färsk spel har ingen liggare alls', () => {
    const game = makeGame()
    expect(game.eventLedger).toBeUndefined()
  })
})
