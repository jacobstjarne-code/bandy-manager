import { describe, it, expect } from 'vitest'
import { getPortalPhase, getFunctionaryPhase, getCurrentLeagueRound } from '../seasonPhases'
import type { SaveGame } from '../../entities/SaveGame'

describe('getPortalPhase — B1 (2026-07-19)', () => {
  it('returnerar spectator/playoff oavsett rundnummer', () => {
    expect(getPortalPhase(5, 6, 12, false, true)).toBe('spectator')
    expect(getPortalPhase(5, 6, 12, true, false)).toBe('playoff')
  })

  it('faller igenom till getFunctionaryPhase när varken playoff eller spectator', () => {
    expect(getPortalPhase(2, 6, 12, false, false)).toBe(getFunctionaryPhase(2, 6, 12))
    expect(getPortalPhase(2, 6, 12, false, false)).toBe('höststart')
  })

  it('vinterkris nås genom getPortalPhase när tabellplaceringen är i botten 40%', () => {
    // round 14 (12-16 spannet), position 8 av 12 (>60%) → vinterkris
    expect(getPortalPhase(14, 8, 12, false, false)).toBe('vinterkris')
    // round 14, position 3 av 12 → vinter (ingen kris)
    expect(getPortalPhase(14, 3, 12, false, false)).toBe('vinter')
  })

  it('playoff vinner över allt annat, även om rundnumret skulle ge vinterkris', () => {
    expect(getPortalPhase(14, 10, 12, true, false)).toBe('playoff')
  })
})

describe('getCurrentLeagueRound', () => {
  it('ignorerar slutspelsmatcher när ligarundan bestäms', () => {
    const game = {
      fixtures: [
        { status: 'completed', isCup: false, isKnockout: false, roundNumber: 22 },
        { status: 'completed', isCup: false, isKnockout: true, roundNumber: 27 },
      ],
    } as SaveGame
    expect(getCurrentLeagueRound(game)).toBe(22)
  })
})
