import { describe, expect, it } from 'vitest'
import type { Club } from '../../domain/entities/Club'
import type { CupBracket } from '../../domain/entities/Cup'
import { getCupJourney } from './finalJourneys'

describe('getCupJourney', () => {
  it('utelämnar bye och använder cupens riktiga fyrastegsnamn', () => {
    const clubs = [
      { id: 'managed', name: 'Slottsbron' },
      { id: 'qf', name: 'Söderfors' },
      { id: 'sf', name: 'Forsbacka' },
      { id: 'final', name: 'Målilla' },
    ] as Club[]
    const bracket: CupBracket = {
      season: 2025,
      completed: true,
      winnerId: 'managed',
      matches: [
        { id: 'bye', fixtureId: 'bye', round: 1, homeClubId: 'managed', awayClubId: '', winnerId: 'managed', isBye: true },
        { id: 'qf', fixtureId: 'qf', round: 2, homeClubId: 'managed', awayClubId: 'qf', winnerId: 'managed' },
        { id: 'sf', fixtureId: 'sf', round: 3, homeClubId: 'sf', awayClubId: 'managed', winnerId: 'managed' },
        { id: 'final', fixtureId: 'final', round: 4, homeClubId: 'managed', awayClubId: 'final', winnerId: 'managed' },
      ],
    }

    expect(getCupJourney(bracket, 'managed', clubs)).toBe([
      'KVARTSFINAL: Slog Söderfors',
      'SEMIFINAL: Slog Forsbacka',
      'FINAL: Slog Målilla',
    ].join('\n'))
  })
})
