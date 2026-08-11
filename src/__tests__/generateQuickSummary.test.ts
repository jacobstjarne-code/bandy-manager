import { describe, it, expect } from 'vitest'
import { generateQuickSummary } from '../presentation/screens/granska/helpers'
import type { Fixture } from '../domain/entities/Fixture'

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fx-1', leagueId: 'liga', season: 8, roundNumber: 10, matchday: 10,
    homeClubId: 'home', awayClubId: 'away', status: 'completed' as never,
    homeScore: 2, awayScore: 1, events: [],
    ...overrides,
  }
}

describe('generateQuickSummary — GRANSKA DEL 4 steg 4 (2026-08-11)', () => {
  it('liga (inga axlar skickade) — befintlig default-prosa, oförändrad', () => {
    const out = generateQuickSummary(makeFixture(), true, [])
    expect(out).toContain('seger')
    expect(out).not.toBe('[Opus]')
  })

  it('cup, icke-final (skede satt men inte final) — samma default-prosa som liga', () => {
    const out = generateQuickSummary(makeFixture(), true, [], 'cup', 'kvartsfinal')
    expect(out).toContain('seger')
    expect(out).not.toBe('[Opus]')
  })

  it('skede:final — [Opus]-platshållare, oavsett tävlingstyp cup eller slutspel', () => {
    expect(generateQuickSummary(makeFixture(), true, [], 'cup', 'final')).toBe('[Opus]')
    expect(generateQuickSummary(makeFixture(), true, [], 'slutspel', 'final')).toBe('[Opus]')
  })

  it('tavlingstyp:slutspel, icke-final — [Opus]-platshållare', () => {
    expect(generateQuickSummary(makeFixture(), true, [], 'slutspel', 'kvartsfinal')).toBe('[Opus]')
  })

  it('tavlingstyp:avsked — [Opus]-platshållare', () => {
    expect(generateQuickSummary(makeFixture(), true, [], 'avsked', undefined)).toBe('[Opus]')
  })
})
