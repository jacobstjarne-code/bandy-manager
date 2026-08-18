import { describe, it, expect } from 'vitest'
import { getBoardPatienceZone } from '../boardPatienceZone'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import type { BoardObjective } from '../../../entities/Community'

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

function makeObjective(overrides: Partial<BoardObjective>): BoardObjective {
  return {
    id: 'obj1', type: 'sporting', label: 'Toppfyra', description: '', ownerId: 'ordforande-0',
    ownerPersonality: 'traditionalist', targetValue: 4, currentValue: 8, measureFn: 'position',
    status: 'failed', assignedSeason: 1, successReward: '', failureConsequence: '', carryOver: false,
    ...overrides,
  }
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

  it('stabilt har headline men ingen orsaksrad eller väg tillbaka', () => {
    const info = getBoardPatienceZone(makeGame(70))
    expect(info.headline).toBe('Styrelsen har inget att invända.')
    expect(info.causeLine).toBeUndefined()
    expect(info.pathBackLine).toBeUndefined()
  })

  it('under press: headline + orsaksrad, ingen väg tillbaka', () => {
    const game = { ...makeGame(40), boardObjectives: [makeObjective({ type: 'sporting', status: 'failed' })] }
    const info = getBoardPatienceZone(game)
    expect(info.headline).toBe('Styrelsen är orolig.')
    expect(info.causeLine).toBe('Ni ligger under det de begärde.')
    expect(info.pathBackLine).toBeUndefined()
  })

  it('ultimatum: headline + orsaksrad + väg tillbaka med målets label', () => {
    const game = {
      ...makeGame(20),
      boardObjectives: [makeObjective({ type: 'economic', status: 'failed', label: 'Positivt resultat' })],
    }
    const info = getBoardPatienceZone(game)
    expect(info.headline).toBe('Styrelsen har tappat tålamodet.')
    expect(info.causeLine).toBe('Kassan går åt fel håll.')
    expect(info.pathBackLine).toBe('Det som återstår: Positivt resultat.')
  })

  it('prioritetsordning: sporting före economic även om båda är failed', () => {
    const game = {
      ...makeGame(40),
      boardObjectives: [
        makeObjective({ id: 'o1', type: 'economic', status: 'failed' }),
        makeObjective({ id: 'o2', type: 'sporting', status: 'failed' }),
      ],
    }
    expect(getBoardPatienceZone(game).causeLine).toBe('Ni ligger under det de begärde.')
  })

  it('upprepning (punkt 3) kräver både aktuellt problem och ett failed förra säsongen', () => {
    const game = {
      ...makeGame(40),
      currentSeason: 3,
      boardObjectives: [makeObjective({ type: 'identity', status: 'failed' })],  // matchar varken sporting/economic/community
      boardObjectiveHistory: [{ season: 2, objectiveId: 'x', result: 'failed' as const, ownerReaction: '' }],
    }
    expect(getBoardPatienceZone(game).causeLine).toBe('Andra året i rad utan det de bad om.')
  })

  it('klack/publik (punkt 4) när inget annat matchar', () => {
    const game = {
      ...makeGame(40),
      currentSeason: 3,
      boardObjectives: [makeObjective({ type: 'community', status: 'at_risk' })],
      boardObjectiveHistory: [],
    }
    expect(getBoardPatienceZone(game).causeLine).toBe('Det syns på läktaren, och de ser det.')
  })

  it('ingen matchande orsak → ingen orsaksrad, trots under_press-zon', () => {
    const game = { ...makeGame(40), boardObjectives: [] }
    const info = getBoardPatienceZone(game)
    expect(info.causeLine).toBeUndefined()
  })
})
