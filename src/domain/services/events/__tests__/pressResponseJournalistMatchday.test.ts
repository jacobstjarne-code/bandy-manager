/**
 * A-L1 (SLUTTEST_KO.md): Efterklang visade "omg 0" för journalist-premissen.
 *
 * Rotorsak: eventResolver.ts:s 'pressResponse'-hantering härledde "matchen
 * presskonferensen gäller" genom att skanna HELA game.fixtures (alla
 * säsonger, ingen season-filtrering) efter högsta .roundNumber — fel fält
 * (roundNumber nollställs varje säsong 1-22, är INTE den globala
 * spelordningen; CLAUDE.md: använd aldrig roundNumber för ordning, bara
 * matchday) och en gissning som kunde missa helt. När skanningen inte hittade
 * något föll den till en hårdkodad 0 — som journalistService.recordInteraction
 * sparade rakt in i JournalistMemory.matchday, och som sedan renderades
 * ordagrant som "omg 0" i pickEfterklang.ts:s premiss.
 *
 * Fix: generatePressConference sätter nu event.relatedFixtureId = fixture.id
 * (pressConferenceService.ts) — eventResolver läser matchen direkt därifrån
 * och använder dess .matchday (kanoniska fältet), aldrig .roundNumber.
 * Fallbacken (äldre pending events utan relatedFixtureId) scopas till
 * innevarande säsong och faller i sista hand till updatedGame.currentMatchday
 * — aldrig en hårdkodad 0-sentinel.
 */
import { describe, it, expect } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { FixtureStatus } from '../../../enums'
import type { SaveGame } from '../../../entities/SaveGame'
import type { GameEvent } from '../../../entities/GameEvent'

const MANAGED = 'club_managed'

function baseGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 3,
    currentMatchday: 23,
    currentDate: '2026-01-01',
    managedClubId: MANAGED,
    clubs: [{ id: 'club_x', name: 'Söderfors IF', shortName: 'Söderfors' }],
    players: [],
    fixtures: [],
    inbox: [],
    journalist: {
      name: 'Britta Sandström',
      outlet: 'Lokaltidningen',
      relationship: 50,
      pressRefusals: 0,
      memory: [],
    },
    ...overrides,
  } as unknown as SaveGame
}

function pressEvent(overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id: 'event_press_test',
    type: 'pressConference',
    title: 'Presskonferens',
    body: '"Fråga?"',
    resolved: false,
    choices: [
      {
        id: 'good',
        label: 'Svara ärligt',
        effect: { type: 'pressResponse', value: 3, mediaQuote: 'Citat' },
      },
    ],
    ...overrides,
  } as GameEvent
}

describe('resolveEvent — pressResponse läser matchday via relatedFixtureId, inte roundNumber', () => {
  it('läser fixture.matchday (globalt) — inte roundNumber, inte fel säsongs match', () => {
    // Föregående säsongs sista omgång har HÖGRE roundNumber (22) än den
    // faktiska matchen (roundNumber 1, ny säsong) — den gamla buggen (skanna
    // roundNumber över ALLA säsonger) skulle plocka fel match. matchday (den
    // globala spelordningen) skiljer dem korrekt: 22 (förra säsongen) vs 23
    // (den faktiska matchen presskonferensen gäller).
    const prevSeasonFixture = {
      id: 'prev-season-last', season: 2, roundNumber: 22, matchday: 22,
      status: FixtureStatus.Completed, isCup: false,
      homeClubId: MANAGED, awayClubId: 'club_x', events: [],
    }
    const theMatch = {
      id: 'this-match', season: 3, roundNumber: 1, matchday: 23,
      status: FixtureStatus.Completed, isCup: false,
      homeClubId: MANAGED, awayClubId: 'club_x', events: [],
    }
    let game = baseGame({ fixtures: [prevSeasonFixture, theMatch] as never })
    const event = pressEvent({ relatedFixtureId: 'this-match' })
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'good')

    const entry = game.journalist!.memory.at(-1)!
    expect(entry.matchday).toBe(23)
    expect(entry.matchday).not.toBe(22)
    expect(entry.matchday).not.toBe(0)
  })

  it('fallback utan relatedFixtureId: aldrig hårdkodad 0 — faller till currentMatchday', () => {
    let game = baseGame({ fixtures: [] as never, currentMatchday: 12 })
    const event = pressEvent() // ingen relatedFixtureId (äldre pending event)
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'good')

    const entry = game.journalist!.memory.at(-1)!
    expect(entry.matchday).toBe(12)
    expect(entry.matchday).not.toBe(0)
  })

  it('fallback scopas till innevarande säsong — plockar inte en annan säsongs completed-match', () => {
    const otherSeasonFixture = {
      id: 'other-season', season: 1, roundNumber: 5, matchday: 5,
      status: FixtureStatus.Completed, isCup: false,
      homeClubId: MANAGED, awayClubId: 'club_x', events: [],
    }
    let game = baseGame({ fixtures: [otherSeasonFixture] as never, currentSeason: 3, currentMatchday: 30 })
    const event = pressEvent() // ingen relatedFixtureId, ingen match i säsong 3
    game = { ...game, pendingEvents: [event] }

    game = resolveEvent(game, event.id, 'good')

    const entry = game.journalist!.memory.at(-1)!
    expect(entry.matchday).toBe(30) // currentMatchday, inte den gamla säsongens 5
  })
})
