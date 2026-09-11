import { describe, expect, it } from 'vitest'
import type { Fixture } from '../../entities/Fixture'
import type { SaveGame } from '../../entities/SaveGame'
import {
  generateVictoryEcho,
  shouldSurfaceVictoryEcho,
  VICTORY_ECHO_BIG_DERBY_WIN_KEY,
  VICTORY_ECHO_DERBY_WIN_KEY,
} from '../postVictoryNarrativeService'

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
    expect(first.coffeeCooldownSeasons).toBe(2)
  })

  it('roterar bort en storseger-rad även under nästa säsong', () => {
    const fixture = {
      id: 'fixture-one', homeClubId: 'managed', awayClubId: 'other',
      homeScore: 7, awayScore: 1,
    } as Fixture
    const firstSeason = {
      currentSeason: 2026, currentMatchday: 8, narrativeBeatLog: [],
    } as unknown as SaveGame
    const first = generateVictoryEcho('blowout', fixture, 'Motståndaren', 'managed', firstSeason)
    const nextSeason = {
      ...firstSeason,
      currentSeason: 2027,
      narrativeBeatLog: [{ semanticKey: first.coffeeSemanticKey!, season: 2026, round: 8 }],
    }
    const second = generateVictoryEcho('blowout', { ...fixture, id: 'fixture-two' }, 'Motståndaren', 'managed', nextSeason)

    expect(shouldSurfaceVictoryEcho(nextSeason, first)).toBe(false)
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

  it.each([
    ['derby_win', VICTORY_ECHO_DERBY_WIN_KEY],
    ['big_derby_win', VICTORY_ECHO_BIG_DERBY_WIN_KEY],
  ] as const)('låter den fasta %s-raden vila i två säsonger', (type, semanticKey) => {
    const fixture = {
      id: `fixture-${type}`,
      homeClubId: 'managed',
      awayClubId: 'rival',
      homeScore: type === 'big_derby_win' ? 5 : 2,
      awayScore: 1,
    } as Fixture
    const base = {
      currentSeason: 2030,
      currentMatchday: 12,
      narrativeBeatLog: [],
    } as unknown as SaveGame
    const echo = generateVictoryEcho(type, fixture, 'Rivalen', 'managed', base)

    expect(echo.coffeeSemanticKey).toBe(semanticKey)
    expect(echo.coffeeCooldownSeasons).toBe(2)
    const afterShown = {
      ...base,
      narrativeBeatLog: [{ semanticKey, season: 2030, round: 12 }],
    }
    expect(shouldSurfaceVictoryEcho(afterShown, echo)).toBe(false)
    expect(shouldSurfaceVictoryEcho({ ...afterShown, currentSeason: 2031 }, echo)).toBe(false)
    expect(shouldSurfaceVictoryEcho({ ...afterShown, currentSeason: 2032 }, echo)).toBe(true)
  })

  it('formulerar derbyekot ur managerklubbens perspektiv hemma och borta', () => {
    const home = {
      id: 'derby-home',
      homeClubId: 'managed',
      awayClubId: 'rival',
      homeScore: 4,
      awayScore: 1,
    } as Fixture
    const away = {
      ...home,
      id: 'derby-away',
      homeClubId: 'rival',
      awayClubId: 'managed',
      homeScore: 1,
      awayScore: 4,
    } as Fixture

    expect(generateVictoryEcho('big_derby_win', home, 'Rivalen', 'managed').diaryLine).toContain('4-1 mot Rivalen')
    expect(generateVictoryEcho('big_derby_win', away, 'Rivalen', 'managed').diaryLine).toContain('4-1 mot Rivalen')
    expect(generateVictoryEcho('derby_win', home, 'Rivalen', 'managed').coffeeLine).toContain('RIVALEN ÅKTE HEM')
    expect(generateVictoryEcho('derby_win', away, 'Rivalen', 'managed').coffeeLine).toContain('VI VANN BORTA MOT RIVALEN')
  })
})
