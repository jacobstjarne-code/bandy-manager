import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { Fixture } from '../../entities/Fixture'
import { resolveEvent } from '../events/eventResolver'
import { classifyEventNature } from '../granskaEventClassifier'
import { generateInsandare } from '../insandareService'
import { generatePostMatchOpponentQuote } from '../opponentManagerService'
import { generatePostMatchEvents } from '../postMatchEventService'

function fixtureWithFanLetter(): { game: ReturnType<typeof createNewGame>; fixture: Fixture } {
  const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  const base = game.fixtures[0]
  if (!base) throw new Error('Testspel saknar fixture')

  for (let i = 0; i < 500; i++) {
    const fixture: Fixture = {
      ...base,
      id: `fan-letter-truth-${i}`,
      status: 'played',
      homeScore: base.homeClubId === game.managedClubId ? 4 : 1,
      awayScore: base.awayClubId === game.managedClubId ? 4 : 1,
    }
    if (generateInsandare(game, fixture)) return { game, fixture }
  }

  throw new Error('Kunde inte hitta deterministisk fanLetter-fixture')
}

describe('fanLetter content truth', () => {
  it('builds one deterministic ambient reaction from the same fixture truth', () => {
    const { game, fixture } = fixtureWithFanLetter()
    const source = generateInsandare(game, fixture)
    const first = generatePostMatchEvents(game, fixture).find(event => event.type === 'fanLetter')
    const second = generatePostMatchEvents(game, fixture).find(event => event.type === 'fanLetter')

    expect(source).not.toBeNull()
    expect(first).toEqual(second)
    expect(first).toMatchObject({
      id: `fanLetter_${fixture.id}`,
      type: 'fanLetter',
      choices: [],
      resolved: false,
      priority: 'low',
      body: `"${source!.text}" — ${source!.signature}`,
    })
    expect(classifyEventNature(first!)).toBe('reactions')
  })

  it('auto-resolution only consumes the ambient event', () => {
    const { game, fixture } = fixtureWithFanLetter()
    const event = generatePostMatchEvents(game, fixture).find(candidate => candidate.type === 'fanLetter')!
    const beforeChoices = game.resolvedChoices ?? []
    const beforeIds = game.resolvedEventIds ?? []
    const withEvent = { ...game, pendingEvents: [...(game.pendingEvents ?? []), event] }

    const resolved = resolveEvent(withEvent, event.id, 'auto', undefined, false)

    expect(resolved.pendingEvents).not.toContainEqual(event)
    expect(resolved.resolvedChoices ?? []).toEqual(beforeChoices)
    expect(resolved.resolvedEventIds ?? []).toEqual([...beforeIds, event.id])
    expect(resolved.clubs).toEqual(game.clubs)
    expect(resolved.players).toEqual(game.players)
  })

  it('anchors opponent quotes and reads an active opponent scandal', () => {
    const { game, fixture } = fixtureWithFanLetter()
    const opponentId = fixture.homeClubId === game.managedClubId
      ? fixture.awayClubId
      : fixture.homeClubId
    const opponent = game.clubs.find(club => club.id === opponentId)
    if (!opponent?.opponentManager) throw new Error('Testmotståndaren saknar tränare')

    const withScandal = {
      ...game,
      activeScandals: [{
        id: 'active-opponent-scandal',
        season: game.currentSeason,
        triggerRound: game.currentMatchday,
        type: 'coach_meltdown' as const,
        affectedClubId: opponent.id,
        resolutionRound: game.currentMatchday + 2,
        isResolved: false,
      }],
    }
    const quote = generatePostMatchEvents(withScandal, fixture)
      .find(event => event.type === 'opponentQuote')

    expect(quote).toMatchObject({
      id: `opponentQuote_${fixture.id}`,
      choices: [],
      relatedClubId: opponent.id,
      relatedFixtureId: fixture.id,
      body: generatePostMatchOpponentQuote(opponent, false, true, fixture.id),
    })
    expect(classifyEventNature(quote!)).toBe('reactions')
  })
})
