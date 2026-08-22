import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { FormStatusMinimal } from '../FormStatusMinimal'
import type { SaveGame } from '../../../../../domain/entities/SaveGame'
import type { Fixture } from '../../../../../domain/entities/Fixture'
import type { Club } from '../../../../../domain/entities/Club'
import type { Player } from '../../../../../domain/entities/Player'
import { FixtureStatus } from '../../../../../domain/enums'

/**
 * Medium 3 (Skutskär-auditen, 2026-08-22, text dömd av Jacob): "Form 94–98"
 * lästes som resultatkurva under en förlustsvit — talet är spelarnas
 * attributsnitt, inte lagets resultat. Etiketten byts till "Spelarform",
 * plus en separat "Form: V O F"-rad.
 */

function makeClub(id: string, shortName: string): Club {
  return { id, name: shortName, shortName, region: 'test', reputation: 50, finances: 0, wageBudget: 0, transferBudget: 0 } as Club
}

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    id: 'f', leagueId: 'L', season: 1, roundNumber: 1, matchday: 1,
    homeClubId: 'managed', awayClubId: 'opp', status: FixtureStatus.Completed, events: [], isCup: false,
    ...overrides,
  } as Fixture
}

function makePlayer(id: string, form: number): Player {
  return { id, clubId: 'managed', form } as Player
}

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    managedClubId: 'managed',
    clubs: [makeClub('managed', 'Test'), makeClub('opp', 'Skutskär')],
    players: [makePlayer('p1', 90), makePlayer('p2', 98)],
    fixtures: [],
    ...overrides,
  } as SaveGame
}

describe('FormStatusMinimal — Medium 3', () => {
  it('etiketten är "Spelarform", inte "Form"', () => {
    const html = renderToStaticMarkup(<FormStatusMinimal game={makeGame()} />)
    expect(html).toContain('Spelarform')
  })

  it('visar en separat "Form: V O F"-rad när resultat finns', () => {
    const game = makeGame({
      fixtures: [
        makeFixture({ id: 'f1', roundNumber: 1, homeScore: 3, awayScore: 1 }), // V
        makeFixture({ id: 'f2', roundNumber: 2, homeScore: 1, awayScore: 4 }), // F
      ],
    })
    const html = renderToStaticMarkup(<FormStatusMinimal game={game} />)
    expect(html).toContain('Form: V O F')
  })

  it('ingen "V O F"-rad när inga matcher är spelade (inget att visa)', () => {
    const html = renderToStaticMarkup(<FormStatusMinimal game={makeGame({ fixtures: [] })} />)
    expect(html).not.toContain('Form: V O F')
  })

  it('räknar fortfarande genomsnittligt attributsnitt korrekt (94 av 90+98)', () => {
    const html = renderToStaticMarkup(<FormStatusMinimal game={makeGame()} />)
    expect(html).toContain('94')
  })
})
