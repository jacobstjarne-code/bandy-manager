import { describe, it, expect } from 'vitest'
import { handlePlayoffStart } from '../playoffTransition'
import { createNewGame } from '../createNewGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { FixtureStatus } from '../../../domain/enums'
import type { SaveGame } from '../../../domain/entities/SaveGame'

/**
 * 4.1 (SLUTTEST_KO.md, 2026-08-17) — "dashboard 5:e, bracket 6:a, årsbok 5:e,
 * samma säsong och 21 poäng". Rotorsak: roundProcessor.ts skickar
 * game.pointDeductions till calculateStandings, men fem andra anropsställen
 * (playoffTransition.ts, seasonEndProcessor.ts, TabellScreen.tsx,
 * matchActions.ts×3) gjorde det inte — en klubb under poängavdrag (licens-
 * beslut) fick fel platsordning på alla ytor UTOM den löpande tabellen.
 *
 * Detta test bevisar fixet i det mest konsekvensrika anropsstället:
 * handlePlayoffStart, som avgör den FAKTISKA slutspelsseedningen — fel här
 * betyder att spelaren möter fel motståndare i kvartsfinal, inte bara en
 * missvisande siffra.
 */
function makeTiedGame(): { game: SaveGame; clubA: string; clubB: string } {
  const template = CLUB_TEMPLATES[0]
  let game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })

  const round1 = game.fixtures.filter(f => f.roundNumber === 1 && !f.isCup)
  expect(round1.length).toBeGreaterThanOrEqual(2)

  // Två klubbar (round1[0].homeClubId, round1[1].homeClubId) vinner sina
  // matcher med identiskt målskillnad — helt tie:ade utan avdrag.
  const clubA = round1[0].homeClubId
  const clubB = round1[1].homeClubId

  const updatedFixtures = game.fixtures.map(f => {
    if (f.id === round1[0].id) return { ...f, status: FixtureStatus.Completed, homeScore: 5, awayScore: 2 }
    if (f.id === round1[1].id) return { ...f, status: FixtureStatus.Completed, homeScore: 5, awayScore: 2 }
    return f
  })

  game = { ...game, fixtures: updatedFixtures }
  return { game, clubA, clubB }
}

describe('handlePlayoffStart — pointDeductions måste beaktas i slutspelsseedningen', () => {
  it('utan avdrag: två klubbar helt tie:ade (poäng, målskillnad, mål gjorda)', () => {
    const { game, clubA, clubB } = makeTiedGame()
    const result = handlePlayoffStart(game)
    const rowA = result.game.standings.find(s => s.clubId === clubA)!
    const rowB = result.game.standings.find(s => s.clubId === clubB)!
    expect(rowA.points).toBe(rowB.points)
    expect(rowA.goalDifference).toBe(rowB.goalDifference)
  })

  it('med avdrag på klubbA: klubbA rankas lägre än klubbB i den faktiska slutspelsseedningen', () => {
    const { game, clubA, clubB } = makeTiedGame()
    const gameWithDeduction = { ...game, pointDeductions: { [clubA]: 5 } }
    const result = handlePlayoffStart(gameWithDeduction)

    const rowA = result.game.standings.find(s => s.clubId === clubA)!
    const rowB = result.game.standings.find(s => s.clubId === clubB)!

    expect(rowA.points).toBe(0) // 2 - 5, golvat vid 0
    expect(rowB.points).toBe(2)
    expect(rowB.position).toBeLessThan(rowA.position)
  })
})
