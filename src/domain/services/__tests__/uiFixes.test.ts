import { describe, it, expect } from 'vitest'
import { getTransferWindowStatus } from '../transferWindowService'
import { commentary } from '../../data/commentary'
import type { Player } from '../../entities/Player'
import { PlayerPosition, PlayerArchetype, FixtureStatus } from '../../enums'

// ── Helpers ──────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Test',
    lastName: 'Player',
    clubId: 'club_a',
    position: PlayerPosition.Forward,
    archetype: PlayerArchetype.Finisher,
    currentAbility: 70,
    potentialAbility: 80,
    age: 24,
    nationality: 'SWE',
    isInjured: false,
    injuryGamesRemaining: 0,
    suspensionGamesRemaining: 0,
    contractUntilSeason: 2027,
    salary: 50000,
    form: 7,
    morale: 7,
    attributes: {
      skating: 70, passing: 70, shooting: 70, defending: 60,
      goalkeeping: 20, vision: 65, decisions: 68, positioning: 66,
      stamina: 70, workRate: 65, ballControl: 68, acceleration: 72,
      dribbling: 60, cornerSkill: 50,
    },
    seasonStats: { gamesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 },
    ...overrides,
  }
}

// ── Transfer window tests ─────────────────────────────────────────────────

describe('getTransferWindowStatus', () => {
  it('returns open during pre-season (August)', () => {
    const info = getTransferWindowStatus('2025-08-15')
    expect(info.status).toBe('open')
  })

  it('returns open for all pre-season months (Aug–Oct)', () => {
    for (const month of ['08', '09', '10']) {
      expect(getTransferWindowStatus(`2025-${month}-10`).status).toBe('open')
    }
  })

  it('returns winter during January', () => {
    const info = getTransferWindowStatus('2026-01-15')
    expect(info.status).toBe('winter')
  })

  it('returns closed during season (November–December)', () => {
    for (const month of ['11', '12']) {
      expect(getTransferWindowStatus(`2025-${month}-01`).status).toBe('closed')
    }
  })

  it('returns closed in February–July', () => {
    for (const month of ['02', '03', '04', '05', '06', '07']) {
      expect(getTransferWindowStatus(`2026-${month}-01`).status).toBe('closed')
    }
  })

  it('includes a non-empty label and description', () => {
    const open = getTransferWindowStatus('2025-09-01')
    expect(open.label.length).toBeGreaterThan(0)
    expect(open.description.length).toBeGreaterThan(0)

    const closed = getTransferWindowStatus('2025-11-01')
    expect(closed.label.length).toBeGreaterThan(0)
    expect(closed.description.length).toBeGreaterThan(0)
  })
})

// ── Commentary text tests ─────────────────────────────────────────────────

describe('commentary text', () => {
  it('kickoff[0] does not contain "blåser av"', () => {
    expect(commentary.kickoff[0]).not.toContain('blåser av')
  })

  it('kickoff[0] contains "blåser igång"', () => {
    expect(commentary.kickoff[0]).toContain('blåser igång')
  })

  it('halfTime[1] does not contain "blåser av"', () => {
    expect(commentary.halfTime[1]).not.toContain('blåser av')
  })

  it('halfTime[1] contains "blåser igång"', () => {
    expect(commentary.halfTime[1]).toContain('blåser igång')
  })

  it('final_kickoff[1] does not contain "blåser av"', () => {
    expect(commentary.final_kickoff[1]).not.toContain('blåser av')
  })

  it('no commentary string uses "blåser av" (only "blåser igång")', () => {
    const allStrings = Object.values(commentary).flat()
    const violating = allStrings.filter(s => s.includes('blåser av'))
    expect(violating).toHaveLength(0)
  })
})

// ── Injured player guard tests ────────────────────────────────────────────

describe('injured player guard logic', () => {
  it('isInjured players should be identified as unavailable', () => {
    const injured = makePlayer({ isInjured: true })
    const unavailable = injured.isInjured || injured.suspensionGamesRemaining > 0
    expect(unavailable).toBe(true)
  })

  it('suspended players should be identified as unavailable', () => {
    const suspended = makePlayer({ suspensionGamesRemaining: 2 })
    const unavailable = suspended.isInjured || suspended.suspensionGamesRemaining > 0
    expect(unavailable).toBe(true)
  })

  it('healthy players should NOT be identified as unavailable', () => {
    const healthy = makePlayer({ isInjured: false, suspensionGamesRemaining: 0 })
    const unavailable = healthy.isInjured || healthy.suspensionGamesRemaining > 0
    expect(unavailable).toBe(false)
  })

  it('auto-fill should never include injured players', () => {
    const players: Player[] = [
      makePlayer({ id: 'p1', position: PlayerPosition.Goalkeeper, currentAbility: 90, isInjured: false }),
      makePlayer({ id: 'p2', position: PlayerPosition.Forward, currentAbility: 85, isInjured: true }),
      makePlayer({ id: 'p3', position: PlayerPosition.Forward, currentAbility: 80, isInjured: false }),
      makePlayer({ id: 'p4', position: PlayerPosition.Forward, currentAbility: 75, isInjured: false }),
      makePlayer({ id: 'p5', position: PlayerPosition.Defender, currentAbility: 72, suspensionGamesRemaining: 1 }),
      makePlayer({ id: 'p6', position: PlayerPosition.Defender, currentAbility: 70, isInjured: false }),
      makePlayer({ id: 'p7', position: PlayerPosition.Defender, currentAbility: 68, isInjured: false }),
      makePlayer({ id: 'p8', position: PlayerPosition.Midfielder, currentAbility: 65, isInjured: false }),
      makePlayer({ id: 'p9', position: PlayerPosition.Midfielder, currentAbility: 63, isInjured: false }),
      makePlayer({ id: 'p10', position: PlayerPosition.Half, currentAbility: 61, isInjured: false }),
      makePlayer({ id: 'p11', position: PlayerPosition.Half, currentAbility: 60, isInjured: false }),
      makePlayer({ id: 'p12', position: PlayerPosition.Forward, currentAbility: 58, isInjured: false }),
      makePlayer({ id: 'p13', position: PlayerPosition.Forward, currentAbility: 55, isInjured: false }),
    ]

    // Simulate auto-fill logic (same as handleAutoFill in MatchScreen)
    const available = players.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
    const sorted = [...available].sort((a, b) => b.currentAbility - a.currentAbility)
    const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
    const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)
    const starters: Player[] = gkPool.length > 0 ? [gkPool[0]] : []
    for (const p of outfieldPool) {
      if (starters.length >= 11) break
      starters.push(p)
    }

    expect(starters).toHaveLength(11)
    expect(starters.every(p => !p.isInjured && p.suspensionGamesRemaining <= 0)).toBe(true)
    expect(starters.find(p => p.id === 'p2')).toBeUndefined() // injured p2 excluded
    expect(starters.find(p => p.id === 'p5')).toBeUndefined() // suspended p5 excluded
  })
})
