import { describe, it, expect } from 'vitest'
import { checkEconomicCrisis } from '../economicCrisisService'
import type { SaveGame } from '../../entities/SaveGame'
import type { Sponsor } from '../../entities/Sponsor'

/**
 * PÅSTÅENDEKARTAN omsvep (2026-08-24), ÅTKOMST-FANNS-ANVÄNDES-INTE:
 * fas 2-texten ("Huvudsponsorn hotar lämna") hårdkodade "Holmström Bygg"
 * trots att game.sponsors fanns i scope. Verifierar att den nu citerar den
 * verkliga sponsorn med högst veckointäkt, och att "elva år" (aldrig
 * verifierbart) är struket.
 */
function makeSponsor(overrides: Partial<Sponsor>): Sponsor {
  return { id: 's1', name: 'Test AB', category: 'bygg', weeklyIncome: 1000, contractRounds: 10, signedRound: 1, ...overrides }
}

function makeGame(overrides: Partial<SaveGame>): SaveGame {
  return {
    managedClubId: 'club_a',
    clubs: [{ id: 'club_a', finances: -300_000 } as SaveGame['clubs'][number]],
    currentSeason: 3,
    resolvedEventIds: [],
    pendingEvents: [],
    economicCrisisState: { startedSeason: 3, startedMatchday: 5, phase: 'awareness', eventsFired: ['awareness'] },
    fixtures: [],
    sponsors: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('checkEconomicCrisis — fas 2, huvudsponsor-citat (ÅTKOMST-FANNS-ANVÄNDES-INTE-fix)', () => {
  it('citerar den aktiva sponsorn med högst veckointäkt, inte "Holmström Bygg"', () => {
    const game = makeGame({
      sponsors: [
        makeSponsor({ id: 's_small', name: 'Lilla Sponsorn', weeklyIncome: 500, contractRounds: 5 }),
        makeSponsor({ id: 's_big', name: 'Stora Sponsorn AB', weeklyIncome: 5000, contractRounds: 8 }),
        makeSponsor({ id: 's_expired', name: 'Utgången Sponsor', weeklyIncome: 9999, contractRounds: 0 }),
      ],
    })
    const result = checkEconomicCrisis(game, 8)
    expect(result.event?.sender?.name).toBe('Stora Sponsorn AB')
    expect(result.event?.body).not.toContain('Holmström Bygg')
    expect(result.event?.body).not.toContain('elva år')
  })

  it('faller tillbaka på en generisk etikett om klubben inte har någon aktiv sponsor', () => {
    const game = makeGame({ sponsors: [] })
    const result = checkEconomicCrisis(game, 8)
    expect(result.event?.sender?.name).toBe('Huvudsponsorn')
  })
})
