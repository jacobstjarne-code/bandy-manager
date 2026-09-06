import { describe, it, expect } from 'vitest'
import { buildMemoryEventFromLedger } from '../domain/services/clubMemoryService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { EventLedgerEntry } from '../domain/entities/Narrative'

const MANAGED_CLUB_ID = 'club_test'

function makeMinimalGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'test',
    currentSeason: 1,
    currentMatchday: 1,
    currentDate: '2026-01-01',
    managedClubId: MANAGED_CLUB_ID,
    leagueId: 'league_test',
    clubs: [],
    players: [],
    fixtures: [],
    inbox: [],
    ...overrides,
  } as unknown as SaveGame
}

describe('buildMemoryEventFromLedger — youth_aged_out (DOM_AKADEMI_LIGGARE §4, Krönikan)', () => {
  it('läser namnet ur subjectSnapshot — spelaren finns aldrig i game.players', () => {
    const game = makeMinimalGame()
    const entry: EventLedgerEntry = {
      type: 'youth_aged_out',
      semanticKey: 'youth_aged_out_youth_1_s1',
      season: 1,
      matchday: 22,
      clubId: MANAGED_CLUB_ID,
      subject: { kind: 'player', id: 'youth_1' },
      subjectSnapshot: { name: 'Gabriel Bengtsson', position: 'FWD' as any, age: 20 },
      significance: 60,
      youthAgedOut: { outcome: 'released', stars: 3, caAtExit: 42 },
    }

    const memory = buildMemoryEventFromLedger(game, entry, MANAGED_CLUB_ID)
    expect(memory).toEqual({
      type: 'youth_aged_out',
      season: 1,
      matchday: 22,
      text: 'Gabriel Bengtsson, 3 stjärnor, lämnade akademin vid tjugo.',
      emoji: '👤',
      significance: 60,
      subjectPlayerId: 'youth_1',
    })
  })

  it('returnerar null utan subjectSnapshot eller youthAgedOut-payload (ingen gissning)', () => {
    const game = makeMinimalGame()
    const entry: EventLedgerEntry = {
      type: 'youth_aged_out',
      semanticKey: 'youth_aged_out_youth_2_s1',
      season: 1,
      matchday: 22,
      clubId: MANAGED_CLUB_ID,
      subject: { kind: 'player', id: 'youth_2' },
      significance: 60,
    }

    expect(buildMemoryEventFromLedger(game, entry, MANAGED_CLUB_ID)).toBeNull()
  })
})
