import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PortalEventSlot } from '../PortalEventSlot'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'

// Batch-av-tre (D1 punkt 4, 2026-08-21) — verifierar att PortalEventSlot
// faktiskt slår in i BatchStack-kromet när syskon finns, och INTE gör det
// för ett enskilt event. @testing-library/react är inte installerat —
// renderToStaticMarkup räcker för att verifiera renderad HTML (samma
// mönster som BoardObjectivesListHideProgress.test.tsx).

function makeGame(pendingEvents: GameEvent[]): SaveGame {
  return {
    id: 'test', managerName: 'Test', managedClubId: 'club_forsbacka',
    currentDate: '2026-10-15', currentSeason: 1, currentMatchday: 1,
    clubs: [], players: [], league: {} as never, fixtures: [], standings: [],
    inbox: [], transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [],
    playoffBracket: null, cupBracket: null, pendingEvents, transferBids: [],
    handledContractPlayerIds: [], sponsors: [], activeTalentSearch: null,
    talentSearchResults: [], mentorships: [], loanDeals: [], academyLevel: 'none' as never,
    scoutReports: {}, activeScoutAssignment: null, scoutBudget: 0, seasonSummaries: [],
    rivalryHistory: {}, nemesisTracker: {}, storylines: [], clubLegends: [],
    previousMarketValues: {}, financeLog: [], pendingFollowUps: [], mecenater: [],
    boardObjectives: [], boardObjectiveHistory: [], version: '0.2.0',
    lastSavedAt: '2026-10-15T00:00:00Z',
  } as SaveGame
}

function makeEvent(id: string, overrides: Partial<GameEvent> = {}): GameEvent {
  return {
    id, type: 'academyEvent', title: `Titel ${id}`, body: 'Brödtext',
    choices: [{ id: 'c', label: 'Ett val', effect: { type: 'noOp' } }],
    resolved: false,
    ...overrides,
  }
}

describe('PortalEventSlot — Batch-av-tre', () => {
  it('enskilt event (inget triggerGroupId) renderar utan batch-chrome', () => {
    const game = makeGame([makeEvent('a')])
    const html = renderToStaticMarkup(<PortalEventSlot game={game} />)
    expect(html).not.toContain('batch-stack')
    expect(html).not.toContain('ATT TA STÄLLNING TILL')
  })

  it('två events med samma triggerGroupId renderar batch-chrome med "En till"', () => {
    const game = makeGame([
      makeEvent('a', { triggerGroupId: 'window-open' }),
      makeEvent('b', { triggerGroupId: 'window-open' }),
    ])
    const html = renderToStaticMarkup(<PortalEventSlot game={game} />)
    expect(html).toContain('batch-stack')
    expect(html).toContain('ATT TA STÄLLNING TILL')
    expect(html).toContain('En till')
    // Två punkter totalt (aktiv + 1 syskon)
    const dotMatches = html.match(/batch-stack-dot(?!s)/g) ?? []
    expect(dotMatches.length).toBe(2)
  })

  it('tre events med samma triggerGroupId visar "2 till" och tre punkter', () => {
    const game = makeGame([
      makeEvent('a', { triggerGroupId: 'window-open' }),
      makeEvent('b', { triggerGroupId: 'window-open' }),
      makeEvent('c', { triggerGroupId: 'window-open' }),
    ])
    const html = renderToStaticMarkup(<PortalEventSlot game={game} />)
    expect(html).toContain('2 till')
    const dotMatches = html.match(/batch-stack-dot(?!s)/g) ?? []
    expect(dotMatches.length).toBe(3)
  })

  it('orelaterade events (olika triggerGroupId) batchas inte ihop', () => {
    const game = makeGame([
      makeEvent('a', { triggerGroupId: 'window-open' }),
      makeEvent('b', { triggerGroupId: 'other-cause' }),
    ])
    const html = renderToStaticMarkup(<PortalEventSlot game={game} />)
    expect(html).not.toContain('batch-stack')
  })
})
