import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PortalQueueRail } from '../PortalQueueRail'
import type { SaveGame } from '../../../../domain/entities/SaveGame'
import type { GameEvent } from '../../../../domain/entities/GameEvent'

// SEXSÄSONGSAUDITEN 2026-08-26, "Språk": auditen observerade den grammatiskt
// trasiga texten "1 nästa veckan" i kö-räknaren. Auditens egen föreslagna
// ersättning — "{N} beslut i kö" — används här ordagrant (ingen ny prosa
// uppfunnen). @testing-library/react är inte installerat i detta repo
// (se PortalEventSlotBatch.test.tsx) — renderToStaticMarkup + en sträng-
// kontroll i den renderade HTML:en räcker för att bevisa/hindra regression.

function makeGame(deferredDecisions: GameEvent[]): SaveGame {
  return {
    id: 'test', managerName: 'Test', managedClubId: 'club_forsbacka',
    currentDate: '2026-10-15', currentSeason: 1, currentMatchday: 3,
    clubs: [], players: [], league: {} as never, fixtures: [], standings: [],
    inbox: [], transferState: {} as never, youthIntakeHistory: [], matchWeathers: [],
    managedClubTraining: 'balanced' as never, trainingHistory: [],
    playoffBracket: null, cupBracket: null, pendingEvents: [], transferBids: [],
    handledContractPlayerIds: [], sponsors: [], activeTalentSearch: null,
    talentSearchResults: [], mentorships: [], loanDeals: [], academyLevel: 'none' as never,
    scoutReports: {}, activeScoutAssignment: null, scoutBudget: 0, seasonSummaries: [],
    rivalryHistory: {}, nemesisTracker: {}, storylines: [], clubLegends: [],
    previousMarketValues: {}, financeLog: [], pendingFollowUps: [], mecenater: [],
    boardObjectives: [], boardObjectiveHistory: [], version: '0.2.0',
    lastSavedAt: '2026-10-15T00:00:00Z',
    deferredDecisions,
  } as unknown as SaveGame
}

function makeDeferred(id: string, source: string): GameEvent {
  return {
    id, type: 'academyEvent', source, title: `Titel ${id}`, body: 'Brödtext',
    choices: [{ id: 'c', label: 'Ett val', effect: { type: 'noOp' } }],
    resolved: false, deferredAt: 1,
  } as unknown as GameEvent
}

describe('PortalQueueRail — kö-räknarens etikett', () => {
  it('visar "1 beslut i kö", inte det grammatiskt trasiga "1 nästa veckan"', () => {
    const game = makeGame([makeDeferred('d1', 'sponsorOffer')])
    const html = renderToStaticMarkup(PortalQueueRail({ game }))
    expect(html).toContain('beslut i kö')
    expect(html).not.toContain('nästa veckan')
  })

  it('räknaren visar totalCount (deferred + demoted marks), inte bara deferred', () => {
    const game = makeGame([makeDeferred('d1', 'sponsorOffer')])
    const html = renderToStaticMarkup(
      PortalQueueRail({ game, demotedMarks: [{ icon: '📣', label: 'Klacken' }] })
    )
    expect(html).toContain('<strong>2</strong>')
  })
})
