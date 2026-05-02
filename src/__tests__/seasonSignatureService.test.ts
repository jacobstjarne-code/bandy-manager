import { describe, it, expect } from 'vitest'
import {
  pickSeasonSignature,
  createSeasonSignature,
  recordSignatureFact,
  summarizeSignature,
} from '../domain/services/seasonSignatureService'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { SeasonSignature } from '../domain/entities/SeasonSignature'

function makeGame(opts: { region?: string; scandalHistory?: { season: number }[]; currentSeason?: number } = {}): SaveGame {
  return {
    managedClubId: 'club_1',
    currentSeason: opts.currentSeason ?? 2026,
    clubs: [
      {
        id: 'club_1',
        region: opts.region ?? 'Uppland',
      },
    ],
    scandalHistory: opts.scandalHistory ?? [],
  } as unknown as SaveGame
}

function seededRand(seed: number) {
  let s = seed
  return () => {
    s = ((s * 1664525 + 1013904223) | 0) >>> 0
    return s / 0xffffffff
  }
}

describe('pickSeasonSignature', () => {
  it('returns calm_season ~50% over 1000 runs', () => {
    const game = makeGame()
    let calmCount = 0
    for (let i = 0; i < 1000; i++) {
      const rand = seededRand(i * 7919 + 42)
      if (pickSeasonSignature(game, rand) === 'calm_season') calmCount++
    }
    // expect ~500, allow ±10% margin (400-600)
    expect(calmCount).toBeGreaterThan(400)
    expect(calmCount).toBeLessThan(600)
  })

  it('Norrbotten club gets cold_winter more often than southern club', () => {
    const gameNorth = makeGame({ region: 'Norrbotten' })
    const gameSouth = makeGame({ region: 'Uppland' })
    let northCold = 0, southCold = 0
    for (let i = 0; i < 1000; i++) {
      const randN = seededRand(i * 7919 + 1)
      const randS = seededRand(i * 7919 + 1)
      if (pickSeasonSignature(gameNorth, randN) === 'cold_winter') northCold++
      if (pickSeasonSignature(gameSouth, randS) === 'cold_winter') southCold++
    }
    expect(northCold).toBeGreaterThan(southCold)
  })

  it('recent scandals increase scandal_season probability', () => {
    const gameNoScandal = makeGame()
    const gameScandal = makeGame({ scandalHistory: [{ season: 2025 }] as any })
    let noScandalCount = 0, scandalCount = 0
    for (let i = 0; i < 1000; i++) {
      const randA = seededRand(i * 1337 + 5)
      const randB = seededRand(i * 1337 + 5)
      if (pickSeasonSignature(gameNoScandal, randA) === 'scandal_season') noScandalCount++
      if (pickSeasonSignature(gameScandal, randB) === 'scandal_season') scandalCount++
    }
    expect(scandalCount).toBeGreaterThan(noScandalCount)
  })

  it('returns a valid SeasonSignatureId each time', () => {
    const valid = new Set(['calm_season', 'cold_winter', 'scandal_season', 'hot_transfer_market', 'injury_curve', 'dream_round'])
    const game = makeGame()
    for (let i = 0; i < 100; i++) {
      const rand = seededRand(i)
      expect(valid.has(pickSeasonSignature(game, rand))).toBe(true)
    }
  })
})

describe('createSeasonSignature', () => {
  it('returns a SeasonSignature with correct season', () => {
    const game = makeGame({ currentSeason: 2027 })
    const rand = seededRand(42)
    const sig = createSeasonSignature(game, rand)
    expect(sig.startedSeason).toBe(2027)
    expect(sig.observedFacts).toEqual([])
    expect(sig.modifiers).toBeDefined()
  })
})

describe('recordSignatureFact', () => {
  it('appends a fact to observedFacts', () => {
    const game = makeGame()
    const gameWithSig = {
      ...game,
      currentSeasonSignature: {
        id: 'cold_winter',
        modifiers: { threeBy30Probability: 0.30 },
        startedSeason: 2026,
        observedFacts: [],
      } as SeasonSignature,
    }
    const updated = recordSignatureFact(gameWithSig as SaveGame, 'tre matcher i 3x30')
    expect(updated.currentSeasonSignature?.observedFacts).toContain('tre matcher i 3x30')
  })

  it('returns game unchanged when no currentSeasonSignature', () => {
    const game = makeGame()
    const updated = recordSignatureFact(game, 'test')
    expect(updated).toBe(game)
  })

  it('caps observedFacts at 5 entries', () => {
    const game = makeGame()
    const gameWithSig = {
      ...game,
      currentSeasonSignature: {
        id: 'cold_winter',
        modifiers: {},
        startedSeason: 2026,
        observedFacts: ['a', 'b', 'c', 'd', 'e'],
      } as SeasonSignature,
    }
    const updated = recordSignatureFact(gameWithSig as SaveGame, 'f')
    expect(updated.currentSeasonSignature?.observedFacts.length).toBe(5)
    expect(updated.currentSeasonSignature?.observedFacts).toContain('f')
  })
})

describe('summarizeSignature', () => {
  it('returns correct Swedish text for cold_winter', () => {
    const sig: SeasonSignature = { id: 'cold_winter', modifiers: {}, startedSeason: 2027, observedFacts: [] }
    expect(summarizeSignature(sig)).toContain('köldvintern 2027')
  })

  it('returns correct Swedish text for scandal_season', () => {
    const sig: SeasonSignature = { id: 'scandal_season', modifiers: {}, startedSeason: 2028, observedFacts: [] }
    expect(summarizeSignature(sig)).toContain('Skandalsäsongen 2028')
  })

  it('returns correct Swedish text for hot_transfer_market', () => {
    const sig: SeasonSignature = { id: 'hot_transfer_market', modifiers: {}, startedSeason: 2029, observedFacts: [] }
    expect(summarizeSignature(sig)).toContain('transfersommaren 2029')
  })

  it('returns correct Swedish text for injury_curve', () => {
    const sig: SeasonSignature = { id: 'injury_curve', modifiers: {}, startedSeason: 2030, observedFacts: [] }
    expect(summarizeSignature(sig)).toContain('Skadekurvan 2030')
  })

  it('returns correct Swedish text for dream_round', () => {
    const sig: SeasonSignature = { id: 'dream_round', modifiers: {}, startedSeason: 2031, observedFacts: [] }
    expect(summarizeSignature(sig)).toContain('Drömrundan 2031')
  })

  it('returns null for calm_season — no rubric added to SeasonSummary', () => {
    const sig: SeasonSignature = { id: 'calm_season', modifiers: {}, startedSeason: 2032, observedFacts: [] }
    expect(summarizeSignature(sig)).toBeNull()
  })

  it('uses observedFacts[0] in summary when available', () => {
    const sig: SeasonSignature = { id: 'cold_winter', modifiers: {}, startedSeason: 2027, observedFacts: ['9 matcher i 3x30'] }
    const result = summarizeSignature(sig)
    expect(result).toContain('9 matcher i 3x30')
  })
})
