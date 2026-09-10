import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../entities/Fixture'
import type { SaveGame } from '../../entities/SaveGame'
import { generateVictoryEcho, shouldSurfaceVictoryEcho } from '../postVictoryNarrativeService'

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

  it('låter den fasta slutspelsraden vila samma och följande säsong efter visning', () => {
    const fixture = {
      id: 'playoff-one',
      homeClubId: 'managed',
      awayClubId: 'other',
      homeScore: 4,
      awayScore: 2,
      isKnockout: true,
    } as Fixture
    const base = {
      currentSeason: 2030,
      currentMatchday: 31,
      narrativeBeatLog: [],
    } as unknown as SaveGame
    const echo = generateVictoryEcho('playoff_win', fixture, 'Motståndaren', 'managed', base)

    expect(shouldSurfaceVictoryEcho(base, echo)).toBe(true)
    expect(echo.coffeeSemanticKey).toBeTruthy()

    const afterShown = {
      ...base,
      narrativeBeatLog: [{ semanticKey: echo.coffeeSemanticKey!, season: 2030, round: 31 }],
    }
    expect(shouldSurfaceVictoryEcho(afterShown, echo)).toBe(false)
    expect(shouldSurfaceVictoryEcho({ ...afterShown, currentSeason: 2031 }, echo)).toBe(false)
    expect(shouldSurfaceVictoryEcho({ ...afterShown, currentSeason: 2032 }, echo)).toBe(true)
  })
})
