import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FixtureStatus } from '../../../../../domain/enums'
import type { SaveGame } from '../../../../../domain/entities/SaveGame'
import { OpponentFormSecondary } from '../OpponentFormSecondary'

function makeGame(): SaveGame {
  const opponentIds = ['a', 'b', 'c', 'd', 'e']
  return {
    id: 'opponent-form-test',
    managedClubId: 'managed',
    currentSeason: 1,
    currentMatchday: 8,
    currentDate: '2026-01-01',
    clubs: [
      { id: 'managed', name: 'Målilla Bandy', shortName: 'Målilla' },
      { id: 'opponent', name: 'Söderfors GoIF', shortName: 'Söderfors' },
      ...opponentIds.map(id => ({ id, name: `Klubb ${id.toUpperCase()}`, shortName: id.toUpperCase() })),
    ],
    players: [],
    standings: [{ clubId: 'opponent', position: 3, points: 17 }],
    fixtures: [
      ...opponentIds.map((id, index) => ({
        id: `played-${id}`,
        season: 1,
        roundNumber: index + 1,
        matchday: index + 1,
        status: FixtureStatus.Completed,
        isCup: false,
        isKnockout: false,
        homeClubId: 'opponent',
        awayClubId: id,
        homeScore: index % 3 === 0 ? 4 : index % 3 === 1 ? 2 : 1,
        awayScore: index % 3 === 0 ? 1 : index % 3 === 1 ? 2 : 3,
        events: [],
      })),
      {
        id: 'next',
        season: 1,
        roundNumber: 8,
        matchday: 8,
        status: FixtureStatus.Scheduled,
        isCup: false,
        isKnockout: false,
        homeClubId: 'managed',
        awayClubId: 'opponent',
        events: [],
      },
    ],
    inbox: [],
  } as unknown as SaveGame
}

describe('OpponentFormSecondary', () => {
  it('ger motståndaren en tydlig rubrik och fem resultat i en stabil rad', () => {
    const html = renderToStaticMarkup(<OpponentFormSecondary game={makeGame()} />)

    expect(html).toContain('Motståndaren')
    expect(html).toContain('Söderfors GoIF')
    expect(html).toContain('3:e')
    expect(html).toContain('17 p')
    expect((html.match(/class="opponent-form-result"/g) ?? [])).toHaveLength(5)
    expect(html).toContain('Senaste matchen först')
  })
})
