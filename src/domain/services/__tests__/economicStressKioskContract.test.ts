import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { createEconomicStressEvent } from '../events/eventFactories'
import { resolveEvent } from '../events/eventResolver'

function makeEligibleGame() {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  return {
    ...game,
    clubs: game.clubs.map(club =>
      club.id === game.managedClubId ? { ...club, finances: 0 } : club
    ),
  }
}

describe('economic_stress_kiosk — tvåårig bindning', () => {
  it('skriver avtalet, betalar marginalen och spärrar ny omförhandling i två säsonger', () => {
    const game = makeEligibleGame()
    const event = createEconomicStressEvent(game, 6, () => 0.99)!
    expect(event.id).toContain('economic_stress_kiosk')

    const before = game.clubs.find(club => club.id === game.managedClubId)!.finances
    const resolved = resolveEvent({ ...game, pendingEvents: [event] }, event.id, 'lock', () => 0.5, true)
    const after = resolved.clubs.find(club => club.id === resolved.managedClubId)!.finances

    expect(after - before).toBe(4_000)
    expect(resolved.kioskSupplyContractUntilSeason).toBe(2027)
    expect(createEconomicStressEvent({ ...resolved, lastEconomicStressRound: undefined }, 12, () => 0.99)?.id)
      .not.toContain('economic_stress_kiosk')
  })

  it('öppnar omförhandlingen igen när två säsonger har gått', () => {
    const game = {
      ...makeEligibleGame(),
      currentSeason: 2027,
      kioskSupplyContractUntilSeason: 2027,
    }

    expect(createEconomicStressEvent(game, 6, () => 0.99)?.id).toContain('economic_stress_kiosk')
  })
})
