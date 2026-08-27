/**
 * PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26): `bestFinish` fick
 * tidigare den alfabetiska tie-break-positionen (alla klubbar på 0 poäng)
 * vid säsongens allra första `updateTrainerArc()`-anrop, innan en match
 * spelats — och eftersom fältet bara minskar blev det permanent. Se
 * RAPPORT_FYRA_UTREDNINGAR_2026-08-26.md.
 */
import { describe, it, expect } from 'vitest'
import { updateTrainerArc, createTrainerArc } from '../trainerArcService'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { StandingRow } from '../../entities/Standing'

function makeZeroPointsStandings(clubIds: string[], managedPosition: number): StandingRow[] {
  return clubIds.map((clubId, i) => ({
    clubId,
    played: 0,
    wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    position: clubId === clubIds[managedPosition - 1] ? managedPosition : i + 1,
  }))
}

describe('updateTrainerArc — bestFinish citerar inte position innan en match är spelad', () => {
  it('noll spelade matcher (matchday 0): bestFinish rörs INTE, trots att position=4 i den tomma tabellen', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
    const clubIds = game.clubs.map(c => c.id)
    const zeroStandings = makeZeroPointsStandings(clubIds, 4) // Heros "position 4" i en 0-poängstabell — spökposition
    const gameAtRoundZero = { ...game, standings: zeroStandings, trainerArc: createTrainerArc() }

    const updatedArc = updateTrainerArc(gameAtRoundZero)
    expect(updatedArc.bestFinish).toBe(12) // ORÖRT — inte 4
  })

  it('efter minst en spelad match: en verklig position 4 UPPDATERAR bestFinish', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_heros', season: 2025, seed: 1 })
    const clubIds = game.clubs.map(c => c.id)
    const realStandings: StandingRow[] = clubIds.map((clubId, i) => ({
      clubId,
      played: 3,
      wins: clubId === 'club_heros' ? 2 : 0, draws: 0, losses: clubId === 'club_heros' ? 1 : 3,
      goalsFor: 5, goalsAgainst: 3, goalDifference: 2,
      points: clubId === 'club_heros' ? 6 : 0,
      position: clubId === 'club_heros' ? 4 : i + 2,
    }))
    const gameAfterMatches = { ...game, standings: realStandings, trainerArc: createTrainerArc() }

    const updatedArc = updateTrainerArc(gameAfterMatches)
    expect(updatedArc.bestFinish).toBe(4) // uppdaterat — en verklig placering efter spelade matcher
  })
})
