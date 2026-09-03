import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { generateCharacterPlayerEvents } from '../characterPlayerService'

describe('veteranens kontraktsfråga har en enda ägare', () => {
  it('characterPlayerService skapar inte den gamla falska pensionskedjan', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 7 })
    const base = game.players.find(player => player.clubId === game.managedClubId)!
    const veteran = {
      ...base,
      age: 35,
      isCharacterPlayer: true,
      trait: 'veteran' as const,
      loyaltyScore: 5,
    }

    const events = generateCharacterPlayerEvents([veteran], 1, new Set(), () => 0.5)

    expect(events.some(event => event.id === `veteran_retirement_${veteran.id}`)).toBe(false)
    expect(events.some(event => /stanna ett år till/i.test(event.choices?.[0]?.label ?? ''))).toBe(false)
  })
})
