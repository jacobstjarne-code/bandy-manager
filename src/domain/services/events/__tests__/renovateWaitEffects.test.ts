import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { GameEvent } from '../../../entities/GameEvent'

/**
 * DOMLOGG_2026-08-31.md §3-A (D-2026-08-31-A) — communityActivitiesEvents.ts's
 * "Anläggningsrenovering" lovade i undertexten "-25 tkr · 🏗️ +15 faciliteter"
 * (renovate) och "faciliteter försämras" (wait), men gav bara reputation +5
 * respektive noOp. Undertexten ÄR speccen — regressionstest på faktisk effekt.
 */
function makeGameWithRenovationEvent() {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  const event: GameEvent = {
    id: 'community_anlaggning', type: 'communityEvent', title: 't', body: 'b',
    choices: [
      {
        id: 'renovate', label: 'l',
        effect: { type: 'multiEffect', subEffects: JSON.stringify([
          { type: 'income', amount: -25000 },
          { type: 'facilitiesUpgrade', amount: 15 },
        ]) },
      },
      { id: 'wait', label: 'l', effect: { type: 'facilitiesUpgrade', amount: -5 } },
    ],
    resolved: false,
  }
  return { game: { ...game, pendingEvents: [event] } }
}

describe('Anläggningsrenovering — renovate/wait matchar undertexten (DOMLOGG §3-A)', () => {
  it('renovate: -25 000 kr och +15 faciliteter, inte reputation', () => {
    const { game } = makeGameWithRenovationEvent()
    const before = game.clubs.find(c => c.id === game.managedClubId)!
    const resolved = resolveEvent(game, 'community_anlaggning', 'renovate', undefined, true)
    const after = resolved.clubs.find(c => c.id === resolved.managedClubId)!

    expect(after.finances).toBe(before.finances - 25000)
    expect(after.facilities).toBe(Math.min(100, (before.facilities ?? 50) + 15))
    expect(after.reputation).toBe(before.reputation)
  })

  it('wait: faciliteterna sjunker, ingen längre en tyst noOp', () => {
    const { game } = makeGameWithRenovationEvent()
    const before = game.clubs.find(c => c.id === game.managedClubId)!
    const resolved = resolveEvent(game, 'community_anlaggning', 'wait', undefined, true)
    const after = resolved.clubs.find(c => c.id === resolved.managedClubId)!

    expect(after.facilities).toBe((before.facilities ?? 50) - 5)
    expect(after.finances).toBe(before.finances)
  })

  it('renovate: facilities-taket 100 respekteras via multiEffect (samma matte som top-level-caset)', () => {
    const { game } = makeGameWithRenovationEvent()
    const gameAtCap = {
      ...game,
      clubs: game.clubs.map(c => c.id === game.managedClubId ? { ...c, facilities: 92 } : c),
    }
    const resolved = resolveEvent(gameAtCap, 'community_anlaggning', 'renovate', undefined, true)
    const after = resolved.clubs.find(c => c.id === resolved.managedClubId)!
    expect(after.facilities).toBe(100)
  })
})
