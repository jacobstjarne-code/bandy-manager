import { describe, it, expect } from 'vitest'
import { generatePostAdvanceEvents } from '../postAdvanceEvents'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { SaveGame } from '../../../entities/SaveGame'

/**
 * 4.3 (SLUTTEST_KO.md, 2026-08-17) — varsel-eventets "en gång per säsong"-
 * spärr kollade `event_varsel_s{season}` men det faktiska eventet byggde
 * sitt id ur `event_varsel_{employer}_{season}` — de matchade aldrig,
 * så spärren var verkningslös. Gemensam ID-funktion (varselEventId) löser
 * det. Se eventFactories.ts.
 */
function makeGameWithVarselCandidate(): SaveGame {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const squad = game.players.filter(p => p.clubId === game.managedClubId)
  const target = squad[0]
  return {
    ...game,
    players: game.players.map(p =>
      p.id === target.id
        ? { ...p, isFullTimePro: false, dayJob: { title: 'Lärare', flexibility: 70, weeklyIncome: 1000 } }
        : p
    ),
  }
}

describe('varsel — en gång per säsong-spärren', () => {
  it('genererar ett varsel-event när villkoren är uppfyllda', () => {
    const game = makeGameWithVarselCandidate()
    // 0.07: under varselns 0.10-tröskel men över 5b-promotion-offerns 0.05
    // (samma spelares flexibility=70 matchar bara varsel/5b:s villkor,
    // inte 5/5c/5d — se kommentarerna i postAdvanceEvents.ts:190-280).
    const events = generatePostAdvanceEvents(game, [], 8, () => 0.07)
    expect(events.some(e => e.type === 'varsel')).toBe(true)
  })

  it('genererar INTE ett andra varsel-event samma säsong, ens för en annan omgång inom fönstret', () => {
    const game = makeGameWithVarselCandidate()
    const firstBatch = generatePostAdvanceEvents(game, [], 8, () => 0.07)
    const varselEvent = firstBatch.find(e => e.type === 'varsel')!
    expect(varselEvent).toBeTruthy()

    // Simulera att eventet nu är resolvat (samma sätt alreadyQueued byggs:
    // pendingEvents-id:n eller resolvedEventIds).
    const gameAfterResolve: SaveGame = {
      ...game,
      resolvedEventIds: [...(game.resolvedEventIds ?? []), varselEvent.id],
    }

    const secondBatch = generatePostAdvanceEvents(gameAfterResolve, [], 12, () => 0.07)
    expect(secondBatch.some(e => e.type === 'varsel')).toBe(false)
  })
})
