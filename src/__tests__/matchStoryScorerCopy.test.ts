import { describe, expect, it } from 'vitest'
import type { Fixture } from '../domain/entities/Fixture'
import type { SaveGame } from '../domain/entities/SaveGame'
import { MatchEventType } from '../domain/enums'
import { generateMatchStory } from '../domain/utils/matchStory'

const game = {
  managedClubId: 'home',
  clubs: [{ id: 'home', shortName: 'Lesjöfors' }, { id: 'away', shortName: 'Målilla' }],
  players: [
    { id: 'carlberg', firstName: 'Sven', lastName: 'Carlberg' },
    { id: 'gran', firstName: 'Rune', lastName: 'Gran' },
  ],
} as unknown as SaveGame

function story(scorers: string[]): string {
  const fixture = {
    homeClubId: 'home', awayClubId: 'away', homeScore: scorers.length, awayScore: 4,
    status: 'completed',
    events: scorers.map((playerId, i) => ({
      minute: 10 + i, type: MatchEventType.Goal, clubId: 'home', playerId, description: 'Mål',
    })),
  } as Fixture
  return generateMatchStory(fixture, game)
}

describe('matchberättelsens målskyttstext', () => {
  it('beskriver en av flera målskyttar med etablerad svenska', () => {
    expect(story(['carlberg', 'gran'])).toContain('Carlberg var en av målskyttarna.')
  })

  it('beskriver lagets enda mål i singular', () => {
    expect(story(['carlberg'])).toContain('Carlberg gjorde målet.')
  })

  it('behåller målantalet för en flermålsskytt', () => {
    expect(story(['carlberg', 'carlberg'])).toContain('Carlberg stod för 2 mål.')
  })

  it('tillskriver ingen ett mål när laget inte gjort något', () => {
    expect(story([])).not.toContain('Carlberg')
    expect(story([])).not.toContain('målskyttarna')
  })
})
