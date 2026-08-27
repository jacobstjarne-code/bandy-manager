/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, sjätte arten). Sex
 * bekräftade instanser (GRIND1-skriptet, cupProcessor.ts, bestFinish, och
 * fem till hittade i ett fullt svep) delade rotorsaken: standing.position
 * läst vid 0 spelade matcher är en alfabetisk skuggposition, inte en
 * verklig placering. safeStandingPosition är den kanoniska, säkra vägen.
 */
import { describe, it, expect } from 'vitest'
import { safeStandingPosition } from '../standingsService'
import type { StandingRow } from '../../entities/Standing'

function makeRow(overrides: Partial<StandingRow>): StandingRow {
  return {
    clubId: 'club_a', played: 0, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 1,
    ...overrides,
  }
}

describe('safeStandingPosition', () => {
  it('null vid played=0, oavsett vilken position tie-breaken råkat ge', () => {
    const standings = [makeRow({ clubId: 'club_a', played: 0, position: 4 })]
    expect(safeStandingPosition(standings, 'club_a')).toBeNull()
  })

  it('den verkliga positionen när minst en match är spelad', () => {
    const standings = [makeRow({ clubId: 'club_a', played: 5, position: 4 })]
    expect(safeStandingPosition(standings, 'club_a')).toBe(4)
  })

  it('null om klubben saknas i tabellen helt', () => {
    const standings = [makeRow({ clubId: 'club_b', played: 5, position: 1 })]
    expect(safeStandingPosition(standings, 'club_a')).toBeNull()
  })
})
