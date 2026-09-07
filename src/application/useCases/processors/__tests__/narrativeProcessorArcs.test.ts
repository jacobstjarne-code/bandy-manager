import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameEvent } from '../../../../domain/entities/GameEvent'
import type { ActiveArc, StorylineEntry } from '../../../../domain/entities/Narrative'
import { InboxItemType } from '../../../../domain/enums'
import { detectArcTriggers, progressArcs } from '../../../../domain/services/arcService'
import { createNewGame } from '../../createNewGame'
import { processPlayerArcs } from '../narrativeProcessor'

vi.mock('../../../../domain/services/arcService', () => ({
  detectArcTriggers: vi.fn(),
  progressArcs: vi.fn(),
}))

const mockedDetectArcTriggers = vi.mocked(detectArcTriggers)
const mockedProgressArcs = vi.mocked(progressArcs)

function arc(id: string, overrides: Partial<ActiveArc> = {}): ActiveArc {
  return {
    id,
    type: 'hungrig_breakthrough',
    startedMatchday: 1,
    phase: 'building',
    expiresMatchday: 20,
    eventsFired: [],
    decisionsMade: [],
    ...overrides,
  }
}

function event(id: string, priority: GameEvent['priority']): GameEvent {
  return {
    id,
    type: 'playerArc',
    title: id,
    body: id,
    choices: [],
    resolved: false,
    priority,
  }
}

const storyline: StorylineEntry = {
  id: 'storyline_arc_resolved',
  type: 'hungrig_breakthrough',
  season: 2,
  matchday: 7,
  description: 'Bågen avgjordes.',
  displayText: 'Bågen avgjordes.',
  resolved: true,
}

describe('narrativeProcessor — player arcs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedDetectArcTriggers.mockReturnValue([])
  })

  it('håller trigger och progression i samma processorgräns', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const existing = arc('existing')
    const detected = arc('detected')
    mockedDetectArcTriggers.mockReturnValue([detected])
    mockedProgressArcs.mockReturnValue({
      updatedArcs: [existing, detected],
      newEvents: [],
      newInboxItems: [],
      newStorylines: [],
    })

    processPlayerArcs({ ...game, activeArcs: [existing] }, undefined, 7)

    expect(mockedProgressArcs).toHaveBeenCalledWith(
      expect.objectContaining({ activeArcs: [existing, detected] }),
      7,
    )
  })

  it('bevarar kötak, stale-pruning, inbox och cooldown-logg efter uttaget', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2026, seed: 17 })
    const existingLow = Array.from({ length: 5 }, (_, index) => event(`existing_low_${index}`, 'low'))
    const expired = arc('expired', { phase: 'resolving', expiresMatchday: 4 })
    const active = arc('active')
    const droppedLow = event('new_low', 'low')
    const keptHigh = event('new_high', 'high')
    mockedProgressArcs.mockReturnValue({
      updatedArcs: [expired, active],
      newEvents: [droppedLow, keptHigh],
      newInboxItems: [{
        id: 'arc_inbox',
        type: InboxItemType.Media,
        title: 'Arc-notis',
        body: 'Arc-notis.',
        isRead: false,
        date: base.currentDate,
      }],
      newStorylines: [storyline],
    })

    const result = processPlayerArcs({
      ...base,
      activeArcs: [expired, active],
      pendingEvents: existingLow,
      storylines: [],
      narrativeBeatLog: [],
    }, undefined, 7)

    expect(result.activeArcs).toEqual([active])
    expect(result.pendingEvents).toEqual([...existingLow, keptHigh])
    expect(result.inbox).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'arc_inbox' }),
      expect.objectContaining({ id: 'inbox_arc_drop_new_low' }),
    ]))
    expect(result.storylines).toEqual([storyline])
    expect(result.narrativeBeatLog).toContainEqual({
      semanticKey: 'hungrig_breakthrough',
      season: 2,
      round: 7,
    })
  })
})
