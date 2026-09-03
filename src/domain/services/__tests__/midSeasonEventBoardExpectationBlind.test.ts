/**
 * sluttest-be-blind-midseason (DOM 2026-09-03, Jacob): mittsäsongens
 * händelser berättar om tränarens ställning och ska läsa förväntan
 * (över/under) — tidigare fasta placeringsband, oavsett boardExpectation.
 * Gäller de VÄRDERANDE triggarna (halvtidsdomen, styrelseoro, fanfrustration),
 * inte de rent faktiska tabelltriggarna (title/tightrace/playoffjakt/topp3).
 */
import { describe, it, expect } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import { checkMidSeasonEvents } from '../midSeasonEventService'
import { ClubExpectation } from '../../enums'
import type { SaveGame } from '../../entities/SaveGame'

function makeGame(expectation: ClubExpectation, position: number, matchday: number): SaveGame {
  const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
  const managedId = base.managedClubId
  const fixtures = base.fixtures.map((f, i) => i === 0 ? { ...f, status: 'completed' as const, matchday } : f)
  return {
    ...base,
    clubs: base.clubs.map(c => c.id === managedId ? { ...c, boardExpectation: expectation } : c),
    standings: base.standings.map(s => s.clubId === managedId ? { ...s, position } : s),
    fixtures,
    inbox: [],
  }
}

describe('midSeasonEventService — halvtidsdomen läser boardExpectation', () => {
  it('MidTable-klubb på 3:e plats (gap=+3) får den mest positiva halvtidsdomen', () => {
    const events = checkMidSeasonEvents(makeGame(ClubExpectation.MidTable, 3, 11))
    const halftime = events.find(e => e.id.startsWith('mse-halvtid'))
    expect(halftime?.body).toContain('Bättre start kan man knappt ha')
  })

  it('WinLeague-klubb på samma 3:e plats (gap=-2) får en svagare dom — inte den positiva', () => {
    const events = checkMidSeasonEvents(makeGame(ClubExpectation.WinLeague, 3, 11))
    const halftime = events.find(e => e.id.startsWith('mse-halvtid'))
    expect(halftime?.body).not.toContain('Bättre start kan man knappt ha')
    expect(halftime?.body).toContain('Halva serien klar')
  })

  it('styrelseoro (mse-bottom) kräver klart under förväntan, inte bara absolut bottenplacering', () => {
    // Survive-klubb (ankare 12) på plats 10: gap = 12-10 = +2, över förväntan — INGEN oro.
    const survivorEvents = checkMidSeasonEvents(makeGame(ClubExpectation.Survive, 10, 10))
    expect(survivorEvents.find(e => e.id.startsWith('mse-bottom'))).toBeUndefined()

    // WinLeague-klubb (ankare 1) på plats 10: gap = 1-10 = -9, djupt under förväntan — oro.
    const titleContenderEvents = checkMidSeasonEvents(makeGame(ClubExpectation.WinLeague, 10, 10))
    expect(titleContenderEvents.find(e => e.id.startsWith('mse-bottom'))).toBeDefined()
  })
})
