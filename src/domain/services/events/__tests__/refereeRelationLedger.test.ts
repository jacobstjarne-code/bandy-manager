/**
 * DOM_DOMARRELATION_2026-09-02, nivå 3 — clubReaction-valet ska bli sant på
 * riktigt: när den ackumulerade domarattityden korsar en tröskel (-2 = genuin
 * fejd, +2 = genuint förtroende) skrivs en liggarpost (referee_feud/trust),
 * subject.kind='referee'. Skriven vid TRÖSKELKORSNING, inte varje gång
 * attityden råkar redan ligga där.
 */
import { describe, expect, it } from 'vitest'
import { resolveEvent } from '../eventResolver'
import { resolveSubjectName } from '../../momentLedgerService'
import type { SaveGame } from '../../../entities/SaveGame'
import type { GameEvent } from '../../../entities/GameEvent'

function makeMeetingEvent(refereeId: string): GameEvent {
  return {
    id: 'referee_meeting_test',
    type: 'refereeMeeting',
    title: 'Domaren vill träffas',
    body: 'test',
    sender: { name: 'Domare Testsson', role: 'Domare' },
    choices: [
      { id: 'respect', label: 'Respektera', effect: { type: 'refereeRelationship', refereeId, value: 1 } },
      { id: 'neutral', label: 'Neutral', effect: { type: 'refereeRelationship', refereeId, value: 0 } },
      { id: 'protest', label: 'Protestera', effect: { type: 'refereeRelationship', refereeId, value: -1 } },
    ],
    resolved: false,
  } as GameEvent
}

function baseGame(): SaveGame {
  return {
    currentSeason: 2025,
    currentMatchday: 5,
    managedClubId: 'c1',
    clubs: [],
    players: [],
    fixtures: [],
    referees: [{ id: 'ref1', firstName: 'Domare', lastName: 'Testsson', homeTown: 'Test', yearsOfExperience: 10, style: 'strict', personality: 'neutral', managedMatches: 0 }],
    refereeRelations: [],
    eventLedger: [],
  } as unknown as SaveGame
}

function protest(game: SaveGame, matchday: number): SaveGame {
  return resolveEvent(
    { ...game, currentMatchday: matchday, pendingRefereeMeeting: makeMeetingEvent('ref1') },
    'referee_meeting_test',
    'protest',
    () => 0.5,
    true,
  )
}

function respect(game: SaveGame, matchday: number): SaveGame {
  return resolveEvent(
    { ...game, currentMatchday: matchday, pendingRefereeMeeting: makeMeetingEvent('ref1') },
    'referee_meeting_test',
    'respect',
    () => 0.5,
    true,
  )
}

describe('DOM_DOMARRELATION_2026-09-02 — tröskelkorsning skriver liggaren', () => {
  it('första protesten (0→-1) skriver INGEN liggarpost — inte tröskeln än', () => {
    let game = baseGame()
    game = protest(game, 1)
    const relation = game.refereeRelations!.find(r => r.refereeId === 'ref1')!
    expect(relation.clubReaction).toBe(-1)
    expect(game.eventLedger ?? []).toHaveLength(0)
  })

  it('andra protesten i rad (-1→-2) korsar tröskeln — skriver referee_feud', () => {
    let game = baseGame()
    game = protest(game, 1)
    game = protest(game, 2)
    const relation = game.refereeRelations!.find(r => r.refereeId === 'ref1')!
    expect(relation.clubReaction).toBe(-2)
    const feudEntries = (game.eventLedger ?? []).filter(e => e.type === 'referee_feud')
    expect(feudEntries).toHaveLength(1)
    expect(feudEntries[0].subject).toEqual({ kind: 'referee', id: 'ref1' })
    expect(feudEntries[0].madeByPlayer).toBe(true)
  })

  it('en TREDJE protest (ligger kvar på -2, klampad) skriver INTE en ny post', () => {
    let game = baseGame()
    game = protest(game, 1)
    game = protest(game, 2)
    game = protest(game, 3)
    const relation = game.refereeRelations!.find(r => r.refereeId === 'ref1')!
    expect(relation.clubReaction).toBe(-2)
    const feudEntries = (game.eventLedger ?? []).filter(e => e.type === 'referee_feud')
    expect(feudEntries).toHaveLength(1)
  })

  it('en RELAPS (återhämtning till -1, sedan tillbaka till -2) skriver en ANDRA post', () => {
    let game = baseGame()
    game = protest(game, 1)
    game = protest(game, 2)  // -2, feud #1
    game = respect(game, 3)  // -1
    game = protest(game, 4)  // -2 igen, en genuin återkorsning
    const feudEntries = (game.eventLedger ?? []).filter(e => e.type === 'referee_feud')
    expect(feudEntries).toHaveLength(2)
  })

  it('förtroende (0→+1→+2) korsar tröskeln uppåt — skriver referee_trust', () => {
    let game = baseGame()
    game = respect(game, 1)
    game = respect(game, 2)
    const relation = game.refereeRelations!.find(r => r.refereeId === 'ref1')!
    expect(relation.clubReaction).toBe(2)
    const trustEntries = (game.eventLedger ?? []).filter(e => e.type === 'referee_trust')
    expect(trustEntries).toHaveLength(1)
    expect(trustEntries[0].subject).toEqual({ kind: 'referee', id: 'ref1' })
  })

  it('resolveSubjectName slår upp domarens namn ur subject.kind=referee', () => {
    const game = baseGame()
    const name = resolveSubjectName(game, { kind: 'referee', id: 'ref1' })
    expect(name).toBe('Domare Testsson')
  })

  it('resolveSubjectName ger undefined för okänt domar-id', () => {
    const game = baseGame()
    const name = resolveSubjectName(game, { kind: 'referee', id: 'unknown' })
    expect(name).toBeUndefined()
  })
})
