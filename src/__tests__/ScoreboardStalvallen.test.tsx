/**
 * ScoreboardStalvallen — BATCH A-04
 * Tests verify component exports, prop contracts, and sevenSegment logic.
 * @testing-library/react is not installed — tests use vitest + type checks.
 */
import { describe, it, expect } from 'vitest'
import { SEG_MAP, SevenSegDigit, SevenSegText, SevenSegColon } from '../presentation/components/match/scoreboard/sevenSegment'
import { ScoreboardStalvallen } from '../presentation/components/match/scoreboard/ScoreboardStalvallen'
import type { ScoreboardStalvallenProps } from '../presentation/components/match/scoreboard/ScoreboardStalvallen'

describe('sevenSegment — SEG_MAP', () => {
  it('digit 0 renders segments a,b,c,d,e,f (not g)', () => {
    expect(SEG_MAP['0']).toContain('a')
    expect(SEG_MAP['0']).toContain('b')
    expect(SEG_MAP['0']).toContain('f')
    expect(SEG_MAP['0']).not.toContain('g')
  })

  it('digit 1 renders only b and c', () => {
    expect(SEG_MAP['1']).toBe('bc')
  })

  it('digit 8 renders all 7 segments', () => {
    expect(SEG_MAP['8']).toBe('abcdefg')
  })

  it('maps all digits 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(SEG_MAP[String(i)]).toBeDefined()
      expect(SEG_MAP[String(i)].length).toBeGreaterThan(0)
    }
  })

  it('dash renders only middle segment g', () => {
    expect(SEG_MAP['-']).toBe('g')
  })

  it('space renders no segments', () => {
    expect(SEG_MAP[' ']).toBe('')
  })
})

describe('SevenSegDigit — component export', () => {
  it('is a function (React component)', () => {
    expect(typeof SevenSegDigit).toBe('function')
  })
})

describe('SevenSegText — component export', () => {
  it('is a function (React component)', () => {
    expect(typeof SevenSegText).toBe('function')
  })
})

describe('SevenSegColon — component export', () => {
  it('is a function (React component)', () => {
    expect(typeof SevenSegColon).toBe('function')
  })
})

describe('ScoreboardStalvallen — component export and prop contract', () => {
  it('is a function (React component)', () => {
    expect(typeof ScoreboardStalvallen).toBe('function')
  })

  it('accepts full prop set without TypeScript errors at compile time', () => {
    // This test serves as a type-check contract.
    // If any required prop is missing, TypeScript compilation fails (caught by npm run build).
    const _props: ScoreboardStalvallenProps = {
      homeCode: 'FOR',
      awayCode: 'VÄS',
      homeScore: 2,
      awayScore: 1,
      managedSide: 'home',
      period: 'HL2',
      minute: 45,
      second: 22,
      penalties: [],
      ticker: ['Forsbacka leder', 'Stå på'],
      events: [],
      showNowMarker: true,
    }
    expect(_props.homeCode).toBe('FOR')
    expect(_props.awayCode).toBe('VÄS')
  })

  it('period accepts FT value', () => {
    const _props: ScoreboardStalvallenProps = {
      homeCode: 'FOR', awayCode: 'VÄS',
      homeScore: 2, awayScore: 1,
      managedSide: null,
      period: 'FT',
      minute: 90, second: 0,
      penalties: [], ticker: [], events: [],
      showNowMarker: false,
    }
    expect(_props.period).toBe('FT')
  })

  it('period accepts FT · ETT value', () => {
    const _props: ScoreboardStalvallenProps = {
      homeCode: 'FOR', awayCode: 'VÄS',
      homeScore: 1, awayScore: 1,
      managedSide: 'away',
      period: 'FT · ETT',
      minute: 90, second: 0,
      penalties: [], ticker: [], events: [],
      showNowMarker: false,
    }
    expect(_props.period).toBe('FT · ETT')
  })

  it('isPlayoffFinal and finalTier are optional', () => {
    const _props: ScoreboardStalvallenProps = {
      homeCode: 'FOR', awayCode: 'VÄS',
      homeScore: 0, awayScore: 0,
      managedSide: 'home',
      period: 'HL1',
      minute: 12, second: 0,
      penalties: [], ticker: [], events: [],
    }
    expect(_props.isPlayoffFinal).toBeUndefined()
    expect(_props.finalTier).toBeUndefined()
  })

  it('penalty entry contract is correct', () => {
    const _props: ScoreboardStalvallenProps = {
      homeCode: 'FOR', awayCode: 'VÄS',
      homeScore: 1, awayScore: 1,
      managedSide: 'home',
      period: 'HL2',
      minute: 50, second: 0,
      penalties: [{ team: 'home', num: 7, name: 'Lindström', secondsLeft: 420 }],
      ticker: [], events: [],
    }
    expect(_props.penalties[0].team).toBe('home')
    expect(_props.penalties[0].num).toBe(7)
    expect(_props.penalties[0].secondsLeft).toBe(420)
  })

  it('events array accepts goal entries', () => {
    const _props: ScoreboardStalvallenProps = {
      homeCode: 'FOR', awayCode: 'VÄS',
      homeScore: 1, awayScore: 0,
      managedSide: 'home',
      period: 'HL1',
      minute: 20, second: 0,
      penalties: [],
      ticker: [],
      events: [{ minute: 15, type: 'goal', team: 'home' }],
    }
    expect(_props.events[0].type).toBe('goal')
    expect(_props.events[0].team).toBe('home')
  })
})
