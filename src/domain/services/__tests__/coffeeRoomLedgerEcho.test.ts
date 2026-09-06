import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { SaveGame } from '../../entities/SaveGame'
import { ledgerPostKey, markLedgerPostTold, toldMarksFor } from '../ledgerToldService'
import { getCoffeeRoomScene, recordCoffeeRoomLedgerEchoShown } from '../coffeeRoomService'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 42 })
  const completed = { ...base.fixtures[0], status: 'completed' as const, homeScore: 1, awayScore: 1 }
  return {
    ...base,
    currentMatchday: 4,
    fixtures: [completed],
    eventLedger: [],
    ledgerTold: {},
    ...overrides,
  }
}

function post(
  game: SaveGame,
  value: Partial<EventLedgerEntry> & Pick<EventLedgerEntry, 'type' | 'semanticKey' | 'significance'>,
): EventLedgerEntry {
  return {
    season: game.currentSeason,
    matchday: 4,
    clubId: game.managedClubId,
    ...value,
  }
}

describe('getCoffeeRoomScene — Berättaren steg 8', () => {
  it('lägger agendans högst viktade namngivna post som låst liten slutrad', () => {
    const base = makeGame()
    const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
    const club = base.clubs.find(candidate => candidate.id === base.managedClubId)!
    const peoplePost = post(base, {
      type: 'player_milestone',
      semanticKey: `player_milestone:${player.id}:s2025:m4`,
      significance: 60,
      subject: { kind: 'player', id: player.id },
    })
    const clubPost = post(base, {
      type: 'era_shift',
      semanticKey: 'era_shift:s2025:m4',
      significance: 70,
      subject: { kind: 'club', id: club.id },
    })

    const scene = getCoffeeRoomScene({ ...base, eventLedger: [clubPost, peoplePost] })

    expect(scene?.ledgerEcho).toEqual({
      text: `Det pratas om ${player.firstName} ${player.lastName}.`,
      postKey: ledgerPostKey(peoplePost),
    })
  })

  it('kräver vikt 60, rätt klubb, känt namn och en otald post', () => {
    const base = makeGame()
    const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
    const valid = post(base, {
      type: 'player_milestone',
      semanticKey: `valid:${player.id}`,
      significance: 60,
      subject: { kind: 'player', id: player.id },
    })
    const invalid = [
      post(base, {
        type: 'player_milestone', semanticKey: 'too-light', significance: 42,
        subject: { kind: 'player', id: player.id },
      }),
      post(base, {
        type: 'player_milestone', semanticKey: 'wrong-club', significance: 100,
        clubId: 'another-club', subject: { kind: 'player', id: player.id },
      }),
      post(base, {
        type: 'player_milestone', semanticKey: 'unknown-person', significance: 100,
        subject: { kind: 'player', id: 'missing' },
      }),
    ]
    const ledgerTold = markLedgerPostTold({}, valid, 'coffee_room', {
      season: base.currentSeason,
      matchday: base.currentMatchday,
    })

    expect(getCoffeeRoomScene({ ...base, eventLedger: [...invalid, valid], ledgerTold })?.ledgerEcho).toBeUndefined()
  })

  it('skriver exakt och idempotent kvitto först när scenens post rapporteras visad', () => {
    const base = makeGame()
    const player = base.players.find(candidate => candidate.clubId === base.managedClubId)!
    const entry = post(base, {
      type: 'player_milestone', semanticKey: `receipt:${player.id}`, significance: 60,
      subject: { kind: 'player', id: player.id },
    })
    const game = { ...base, eventLedger: [entry] }
    const scene = getCoffeeRoomScene(game)
    const once = recordCoffeeRoomLedgerEchoShown(game, scene?.ledgerEcho?.postKey)
    const twice = recordCoffeeRoomLedgerEchoShown(once, scene?.ledgerEcho?.postKey)

    expect(toldMarksFor(once.ledgerTold, entry)).toEqual([{
      surface: 'coffee_room', season: game.currentSeason, matchday: game.currentMatchday,
    }])
    expect(twice).toBe(once)
    expect(recordCoffeeRoomLedgerEchoShown(game, 'not-a-post')).toBe(game)
  })
})
