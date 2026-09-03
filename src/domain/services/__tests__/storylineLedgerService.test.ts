import { describe, expect, it } from 'vitest'
import type { SaveGame } from '../../entities/SaveGame'
import type { StorylineEntry } from '../../entities/Narrative'
import {
  appendNewlyResolvedStorylines,
  buildStorylineResolutionLedgerEntry,
  getResolvedStorylineProjections,
  getStorylineIdFromLedger,
  getStorylineTypeFromLedger,
} from '../storylineLedgerService'

function makeGame(overrides: Partial<SaveGame> = {}): SaveGame {
  return {
    id: 'storyline-ledger-test',
    currentSeason: 2026,
    currentMatchday: 18,
    currentDate: '2027-01-20',
    managedClubId: 'club-a',
    clubs: [],
    players: [],
    fixtures: [],
    standings: [],
    inbox: [],
    storylines: [],
    eventLedger: [],
    ...overrides,
  } as unknown as SaveGame
}

function storyline(overrides: Partial<StorylineEntry> = {}): StorylineEntry {
  return {
    id: 'story-captain-2026',
    type: 'captain_rallied_team',
    season: 2026,
    matchday: 12,
    playerId: 'player-a',
    clubId: 'club-a',
    description: 'Kaptenen samlade laget.',
    displayText: 'Kaptenen samlade laget.',
    resolved: true,
    ...overrides,
  }
}

describe('storylineLedgerService', () => {
  it('bygger en prosa-fri post med global matchday och strukturerade subjekt', () => {
    const entry = buildStorylineResolutionLedgerEntry(storyline(), 21)

    expect(entry).toEqual({
      type: 'storyline_resolution',
      semanticKey: 'storyline_resolution:captain_rallied_team:story-captain-2026',
      season: 2026,
      matchday: 21,
      subject: { kind: 'player', id: 'player-a' },
      subject2: { kind: 'club', id: 'club-a' },
      significance: 55,
    })
    expect(entry).not.toHaveProperty('text')
    expect(entry).not.toHaveProperty('displayText')
    expect(getStorylineTypeFromLedger(entry!)).toBe('captain_rallied_team')
    expect(getStorylineIdFromLedger(entry!)).toBe('story-captain-2026')
  })

  it('vägrar skriva en aktiv storyline', () => {
    expect(buildStorylineResolutionLedgerEntry(storyline({ resolved: false }), 21)).toBeNull()
  })

  it('skriver bara en ny eller nyss löst storyline och är idempotent', () => {
    const active = storyline({ resolved: false })
    const before = makeGame({ storylines: [active] })
    const after = makeGame({ storylines: [{ ...active, resolved: true }] })

    const first = appendNewlyResolvedStorylines(before, after, 23)
    const second = appendNewlyResolvedStorylines(after, first, 24)

    expect(first.eventLedger).toHaveLength(1)
    expect(first.eventLedger?.[0]).toMatchObject({ matchday: 23, season: 2026 })
    expect(second.eventLedger).toEqual(first.eventLedger)
  })

  it('daterar inte om en gammal löst fickpost vid en orelaterad mutation', () => {
    const old = storyline({ season: 2025, resolved: true })
    const before = makeGame({ storylines: [old], eventLedger: undefined })
    const after = { ...before, currentMatchday: 19 }

    const result = appendNewlyResolvedStorylines(before, after, 19)

    expect(result).toBe(after)
    expect(result.eventLedger).toBeUndefined()
  })

  it('låter liggaren ensam avgöra vilka lösta poster historikvyn ser', () => {
    const canonical = storyline()
    const pocketOnly = storyline({ id: 'story-pocket-only', type: 'promotion_sacrifice' })
    const entry = buildStorylineResolutionLedgerEntry(canonical, 18)!
    const game = makeGame({
      storylines: [canonical, pocketOnly],
      eventLedger: [entry, { ...entry }],
    })

    expect(getResolvedStorylineProjections(game)).toEqual([canonical])
  })

  it('bevarar två spelare som två kanoniska subjekt utan separat gruppfält', () => {
    const entry = buildStorylineResolutionLedgerEntry(storyline({
      id: 'story-workmates',
      type: 'workplace_bond',
      playerId: undefined,
      playerIds: ['player-a', 'player-b'],
    }), 9)

    expect(entry?.subject).toEqual({ kind: 'player', id: 'player-a' })
    expect(entry?.subject2).toEqual({ kind: 'player', id: 'player-b' })
  })
})
