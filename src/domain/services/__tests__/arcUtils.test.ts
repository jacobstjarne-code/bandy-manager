import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../application/useCases/createNewGame'
import type { ActiveArc, StorylineEntry } from '../../entities/Narrative'
import { countActiveArcs, getAllActiveArcs } from '../arcUtils'

function makeGame() {
  return createNewGame({ managerName: 'Arc Test', clubId: 'club_forsbacka', seed: 17 })
}

const playerArc: ActiveArc = {
  id: 'player-arc',
  type: 'hungrig_breakthrough',
  playerId: 'player-1',
  startedMatchday: 2,
  phase: 'building',
  expiresMatchday: 8,
  eventsFired: [],
  decisionsMade: [],
}

function storyline(id: string, resolved: boolean): StorylineEntry {
  return {
    id,
    type: 'workplace_bond',
    season: 1,
    matchday: 3,
    description: 'En prövning i vardagen.',
    displayText: 'En prövning i vardagen.',
    resolved,
  }
}

describe('arcUtils', () => {
  it('samlar tränarbåge, spelararc och bara olösta storylines', () => {
    const game = makeGame()
    const activeStoryline = storyline('story-active', false)
    const resolvedStoryline = storyline('story-resolved', true)
    const withArcs = {
      ...game,
      activeArcs: [playerArc],
      storylines: [activeStoryline, resolvedStoryline],
    }

    const arcs = getAllActiveArcs(withArcs)

    expect(arcs).toContain(withArcs.trainerArc)
    expect(arcs).toContain(playerArc)
    expect(arcs).toContain(activeStoryline)
    expect(arcs).not.toContain(resolvedStoryline)
    expect(countActiveArcs(withArcs)).toBe(arcs.length)
  })

  it('är en ren läsprojektion och skapar inga saknade arrayer', () => {
    const game = { ...makeGame(), trainerArc: undefined, activeArcs: undefined, storylines: undefined }

    expect(getAllActiveArcs(game)).toEqual([])
    expect(countActiveArcs(game)).toBe(0)
    expect(game.activeArcs).toBeUndefined()
    expect(game.storylines).toBeUndefined()
  })
})
