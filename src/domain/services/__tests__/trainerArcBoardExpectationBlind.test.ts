/**
 * sluttest-be-blind-trainerarc (DOM 2026-09-03, Jacob, "den viktigaste av
 * tio"): trainerArcService dömde klubbens läge med fasta placeringströsklar
 * utan att läsa boardExpectation. Fixat: trösklarna läser nu avstånd från
 * förväntans ankare (BOARD_EXPECTATION_ANCHOR_POSITION, boardService.ts —
 * samma källa som boardPatience-systemet, aldrig en egen kopia).
 *
 * Testar domens egna två exempel ordagrant: en Survive-klubb som blir sexa
 * är en triumf (honeymoon), en WinLeague-klubb som blir trea är ifrågasatt.
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { updateTrainerArc, createTrainerArc } from '../trainerArcService'
import { ClubExpectation } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'

function makeGame(expectation: ClubExpectation, position: number, matchday: number): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  const managedId = base.managedClubId
  const otherIds = base.clubs.map(c => c.id).filter(id => id !== managedId)

  // En avklarad match mellan två ANDRA klubbar vid önskad matchday, så md-
  // beräkningen ser rätt omgång utan att röra managedClubs streak-räkning
  // (som testet sätter direkt på trainerArc istället).
  const fixtures = base.fixtures.map((f, i) =>
    i === 0
      ? { ...f, homeClubId: otherIds[0], awayClubId: otherIds[1], status: 'completed' as const, matchday }
      : f,
  )

  return {
    ...base,
    clubs: base.clubs.map(c => c.id === managedId ? { ...c, boardExpectation: expectation } : c),
    standings: base.standings.map(s => s.clubId === managedId ? { ...s, position, played: 5 } : s),
    fixtures,
    trainerArc: { ...createTrainerArc(), current: 'newcomer' },
  }
}

describe('trainerArcService — läser boardExpectation via anchor-gap', () => {
  it('Survive-klubb på 6:e plats (gap = 12-6 = 6) är en triumf → honeymoon', () => {
    const game = makeGame(ClubExpectation.Survive, 6, 5)
    const arc = updateTrainerArc(game)
    expect(arc.current).toBe('honeymoon')
  })

  it('samma 3:e plats ger olika bågfas beroende på förväntan — kärnbeviset att bågen inte längre är blind för boardExpectation', () => {
    // MidTable (ankare 6): gap=+3, tydligt över förväntan → honeymoon.
    const midTableArc = updateTrainerArc(makeGame(ClubExpectation.MidTable, 3, 5))
    expect(midTableArc.current).toBe('honeymoon')
    // WinLeague (ankare 1): gap=-2, under förväntan (men inte det djupa
    // -4-steget newcomer-fasen kräver för 'questioned') → grind, INTE
    // honeymoon. Samma absoluta placering, olika dom — det är fixen.
    const winLeagueArc = updateTrainerArc(makeGame(ClubExpectation.WinLeague, 3, 5))
    expect(winLeagueArc.current).toBe('grind')
    expect(winLeagueArc.current).not.toBe(midTableArc.current)
  })

  it('MidTable-klubb mitt i tabellen (gap = 6-6 = 0) räknas som stabil start → grind, varken triumf eller kris', () => {
    const game = makeGame(ClubExpectation.MidTable, 6, 5)
    const arc = updateTrainerArc(game)
    expect(arc.current).toBe('grind')
  })
})
