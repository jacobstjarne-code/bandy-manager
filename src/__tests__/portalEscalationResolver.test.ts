/**
 * portalEscalationResolver — tester för upptakt-sub-state-detektion (C-SD2).
 *
 * Verifierar de fem edge-casen ur specen vid 3 omgångar kvar (played=19/22):
 *  - säkrad topp → sakrat
 *  - på strecket → farozon
 *  - cementerad mittfält → mittfalt
 *  - utom räckhåll + kvalrisk → bottenstrid
 *  - utom räckhåll utan kvalrisk → mittfalt
 */

import { describe, it, expect } from 'vitest'
import { getEscalationSubState } from '../application/services/portalEscalationResolver'
import type { SaveGame } from '../domain/entities/SaveGame'
import type { StandingRow } from '../domain/entities/Standing'

const MANAGED = 'managed'

/** Bygg en 12-lags-tabell. managedPoints + 11 others-points, alla played=19. */
function makeGame(managedPoints: number, otherPoints: number[], played = 19): SaveGame {
  const rows: StandingRow[] = [
    { clubId: MANAGED, played, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: managedPoints, position: 0 },
    ...otherPoints.map((p, i) => ({ clubId: `c${i}`, played, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: p, position: 0 })),
  ]
  // Sätt position efter poäng
  rows.sort((a, b) => b.points - a.points).forEach((r, i) => { r.position = i + 1 })
  return {
    managedClubId: MANAGED,
    currentSeason: 3,
    currentMatchday: played,
    standings: rows,
  } as unknown as SaveGame
}

describe('getEscalationSubState — upptakt-fönster (3 omg kvar)', () => {
  it('säkrad topp som kämpar om seedning → sakrat', () => {
    // managed 34 (max 40). 5 andra ≥28 (kan nå men ej passera säkert) → max ≤8, min=1
    const g = makeGame(34, [38, 36, 30, 28, 28, 20, 18, 16, 14, 12, 10])
    expect(getEscalationSubState(g)).toBe('sakrat')
  })

  it('slutspelsplats matematiskt på spel → farozon', () => {
    // managed 20 (max 26). 6 lag >26 (säkert över), 3 lag 22-26 (kan passera) → min=7, max=10
    const g = makeGame(20, [30, 30, 28, 28, 28, 28, 26, 24, 22, 12, 10])
    expect(getEscalationSubState(g)).toBe('farozon')
  })

  it('cementerad mittfält (säker plats, kan ej röra sig) → mittfalt', () => {
    // managed 30 (myMin 30, myMax 36). 4 lag säkert över (pts>36). Övriga pts<24
    // → kan ej nå myMin(30) ens med +6. canFinishAbove=4, couldBeAbove=4 → min=max=5
    const g = makeGame(30, [44, 42, 40, 38, 22, 20, 18, 16, 14, 12, 10])
    expect(getEscalationSubState(g)).toBe('mittfalt')
  })

  it('slutspelet utom räckhåll men kvalrisk → bottenstrid', () => {
    // managed 8 (max 14). 9 lag >14 (säkert över) → min=10. +1 lag i [8,14] → max=11
    const g = makeGame(8, [32, 30, 28, 26, 24, 22, 20, 18, 16, 10, 6])
    expect(getEscalationSubState(g)).toBe('bottenstrid')
  })

  it('utom räckhåll men säker från kval → mittfalt', () => {
    // managed 14 (myMin 14, myMax 20). 8 lag säkert över (pts>20) → min=9 (utom slutspel).
    // 3 lag pts<8 → kan ej nå myMin(14) ens med +6 → couldBeAbove=8, max=9 (<11, ingen kvalrisk)
    const g = makeGame(14, [36, 34, 32, 30, 28, 26, 24, 22, 6, 4, 2])
    expect(getEscalationSubState(g)).toBe('mittfalt')
  })

  it('utanför fönstret (mer än 3 omg kvar) → null', () => {
    const g = makeGame(20, [30, 30, 28, 28, 28, 28, 26, 24, 22, 12, 10], 15)
    expect(getEscalationSubState(g)).toBeNull()
  })
})
