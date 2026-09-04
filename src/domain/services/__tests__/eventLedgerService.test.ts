import { describe, it, expect } from 'vitest'
import { logEvent, readManagerLedger } from '../eventLedgerService'
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
    expect(updated[0]).toEqual({ ...minimalEntry, clubId: game.managedClubId })
  })

  it('bygger vidare på en befintlig liggare', () => {
    let game = { ...makeGame(), eventLedger: logEvent(makeGame(), minimalEntry) }
    const second: EventLedgerEntry = { ...minimalEntry, type: 'big_win', semanticKey: 'big_win', matchday: 20 }
    game = { ...game, eventLedger: logEvent(game, second) }
    expect(game.eventLedger).toHaveLength(2)
    expect(game.eventLedger?.[1]).toEqual({ ...second, clubId: game.managedClubId })
  })

  it('bär hela fältschemat (subject/outcome/consequences/beslutsnatur/madeByPlayer) utan att tappa något', () => {
    const game = makeGame()
    const full: EventLedgerEntry = {
      type: 'decision',
      semanticKey: 'sell_academy_product',
      season: 4,
      matchday: 15,
      subject: { kind: 'player', id: 'player_1' },
      outcome: 'neutral',
      significance: 80,
      consequences: [
        { field: 'communityStanding', dir: 'down', magnitude: 'tydligt' },
        { field: 'boardPatience', dir: 'down', magnitude: 'knappt' },
      ],
      irreversible: true,
      tension: true,
      systemsAffectedCount: 2,
      moneyAmount: 180000,
      madeByPlayer: true,
    }
    const updated = logEvent(game, full)
    expect(updated[0]).toEqual({ ...full, clubId: game.managedClubId, managerId: game.id })
  })

  it('stämplar bara managerägda beslut och burnout centralt', () => {
    const game = makeGame()
    const burnout = logEvent(game, { ...minimalEntry, type: 'manager_burnout' })[0]
    const clubEvent = logEvent(game, minimalEntry)[0]

    expect(burnout.managerId).toBe(game.id)
    expect(clubEvent.managerId).toBeUndefined()
    expect(readManagerLedger({ id: game.id, eventLedger: [burnout, clubEvent] })).toEqual([burnout])
  })

  it('bevarar en explicit ursprungsklubb vid historisk import', () => {
    const game = makeGame()
    const updated = logEvent(game, { ...minimalEntry, clubId: 'club_old' })
    expect(updated[0].clubId).toBe('club_old')
  })

  it('game.eventLedger är valfritt — en färsk spel har ingen liggare alls', () => {
    const game = makeGame()
    expect(game.eventLedger).toBeUndefined()
  })
})
