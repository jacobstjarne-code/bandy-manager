import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../entities/Fixture'
import type { SaveGame } from '../../entities/SaveGame'
import { generateVictoryEcho } from '../postVictoryNarrativeService'

describe('segrarens kafferumseko', () => {
  it('använder visningsloggen så två storsegrar inte ger exakt samma rad', () => {
    const fixture = {
      id: 'fixture-one',
      homeClubId: 'managed',
      awayClubId: 'other',
      homeScore: 6,
      awayScore: 0,
    } as Fixture
    const base = {
      currentSeason: 2026,
      currentMatchday: 8,
      narrativeBeatLog: [],
    } as unknown as SaveGame

    const first = generateVictoryEcho('blowout', fixture, 'Motståndaren', 'managed', base)
    const afterShown = {
      ...base,
      narrativeBeatLog: [{ semanticKey: first.coffeeSemanticKey!, season: 2026, round: 8 }],
    }
    const second = generateVictoryEcho('blowout', { ...fixture, id: 'fixture-two' }, 'Motståndaren', 'managed', afterShown)

    expect(second.coffeeSemanticKey).not.toBe(first.coffeeSemanticKey)
    expect(second.coffeeLine).not.toBe(first.coffeeLine)
  })
})
