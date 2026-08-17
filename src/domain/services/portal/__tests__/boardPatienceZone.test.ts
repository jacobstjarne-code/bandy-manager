import { describe, it, expect } from 'vitest'
import { getBoardPatienceZone } from '../boardPatienceZone'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'

/**
 * 3.2 (SLUTTEST_KO.md, 2026-08-17) — kvalitativa zoner för boardPatience.
 * Trösklarna (30/50) matchar portalBeats.ts's board_failure-beat exakt —
 * regressionstest om någon av filerna kalibreras om utan den andra.
 */
function makeGame(boardPatience: number | undefined) {
  const template = CLUB_TEMPLATES[0]
  const game = createNewGame({ managerName: 'Test', clubId: template.id, seed: 1 })
  return { ...game, boardPatience }
}

describe('getBoardPatienceZone', () => {
  it('saknat värde faller tillbaka på 70 (default) → stabilt', () => {
    expect(getBoardPatienceZone(makeGame(undefined)).zone).toBe('stabilt')
  })

  it('>= 50 är stabilt', () => {
    expect(getBoardPatienceZone(makeGame(50)).label).toBe('Stabilt')
    expect(getBoardPatienceZone(makeGame(100)).label).toBe('Stabilt')
  })

  it('30-49 är under press', () => {
    expect(getBoardPatienceZone(makeGame(49)).label).toBe('Under press')
    expect(getBoardPatienceZone(makeGame(30)).label).toBe('Under press')
  })

  it('< 30 är ultimatum', () => {
    expect(getBoardPatienceZone(makeGame(29)).label).toBe('Ultimatum')
    expect(getBoardPatienceZone(makeGame(0)).label).toBe('Ultimatum')
  })

  it('avskedsgränsen (15) ligger inom ultimatum-zonen, inte på dess kant', () => {
    // Verklig avsked-gräns: seasonEndProcessor.ts, newBoardPatience <= 15.
    // Ultimatum (< 30) ska alltså redan ha varnat innan avsked är möjligt.
    expect(getBoardPatienceZone(makeGame(15)).zone).toBe('ultimatum')
  })
})
