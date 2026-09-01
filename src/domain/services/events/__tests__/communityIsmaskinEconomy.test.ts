import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { generateCommunityActivitiesEvents } from '../communityActivitiesEvents'
import { resolveEvent } from '../eventResolver'

describe('Ismaskinen krånglar — kostnad och ekonomispår', () => {
  it('reparationen kostar exakt 15 tkr, förbättrar anläggningen och loggas', () => {
    let game = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
    const event = generateCommunityActivitiesEvents(game, 10, new Set(), () => 0.1)
      .find(e => e.id === 'community_ismaskin')!
    game = { ...game, pendingEvents: [event], financeLog: [] }

    const before = game.clubs.find(c => c.id === game.managedClubId)!
    const resolved = resolveEvent(game, event.id, 'repair', () => 0.5, true)
    const after = resolved.clubs.find(c => c.id === resolved.managedClubId)!

    expect(after.finances).toBe(before.finances - 15000)
    expect(after.facilities).toBe(Math.min(100, before.facilities + 5))
    expect(resolved.financeLog).toContainEqual(expect.objectContaining({
      amount: -15000,
      reason: 'event',
      label: 'Beslut: Ismaskinen krånglar',
    }))
  })
})
