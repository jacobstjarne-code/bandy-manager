import { describe, it, expect } from 'vitest'
import {
  getFacilityNodeViews,
  getFacilityTreeByGren,
  canStartBuild,
  startFacilityBuild,
  advanceFacilityState,
  getPreSeasonChoices,
  FACILITY_NODE_DEFS,
} from '../facilityService'
import type { FacilityState } from '../../entities/Community'

const emptyState: FacilityState = { builtNodeIds: [] }

describe('getFacilityNodeViews', () => {
  it('all nodes available or locked in empty state (no active project)', () => {
    const views = getFacilityNodeViews(emptyState, 1)
    const noReqs = views.filter(v => v.def.requires.length === 0)
    const withReqs = views.filter(v => v.def.requires.length > 0)
    expect(noReqs.every(v => v.status === 'available')).toBe(true)
    expect(withReqs.every(v => v.status === 'locked')).toBe(true)
  })

  it('built nodes show status built', () => {
    const state: FacilityState = { builtNodeIds: ['varmestuga'] }
    const views = getFacilityNodeViews(state, 1)
    const varmestuga = views.find(v => v.def.id === 'varmestuga')
    expect(varmestuga?.status).toBe('built')
  })

  it('ongoing node shows correct eta and cooldown', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'kiosk', startedMatchday: 2, etaMatchday: 6 },
    }
    const views = getFacilityNodeViews(state, 4)
    const kiosk = views.find(v => v.def.id === 'kiosk')
    expect(kiosk?.status).toBe('ongoing')
    expect(kiosk?.etaMatchday).toBe(6)
    expect(kiosk?.cooldownTotal).toBe(4)
    expect(kiosk?.cooldownFilled).toBe(2)
  })

  it('locked when active project running (only one build at a time)', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'kiosk', startedMatchday: 1, etaMatchday: 5 },
    }
    const views = getFacilityNodeViews(state, 2)
    const belysning = views.find(v => v.def.id === 'belysning')
    expect(belysning?.status).toBe('locked')
  })

  it('laktare_ostra unlocks after varmestuga built', () => {
    const state: FacilityState = { builtNodeIds: ['varmestuga'] }
    const views = getFacilityNodeViews(state, 1)
    const laktare = views.find(v => v.def.id === 'laktare_ostra')
    expect(laktare?.status).toBe('available')
  })

  it('akademi_3 locked until both traningshall and akademi_2 built', () => {
    const onlyOne: FacilityState = { builtNodeIds: ['akademi_2'] }
    const views1 = getFacilityNodeViews(onlyOne, 1)
    expect(views1.find(v => v.def.id === 'akademi_3')?.status).toBe('locked')

    const both: FacilityState = { builtNodeIds: ['akademi_2', 'traningshall', 'kiosk'] }
    const views2 = getFacilityNodeViews(both, 1)
    expect(views2.find(v => v.def.id === 'akademi_3')?.status).toBe('available')
  })
})

describe('getFacilityTreeByGren', () => {
  it('returns all three branches', () => {
    const tree = getFacilityTreeByGren(emptyState, 1)
    expect(tree.anlaggning.length).toBeGreaterThan(0)
    expect(tree.verksamhet.length).toBeGreaterThan(0)
    expect(tree.akademi.length).toBeGreaterThan(0)
  })

  it('matchhall is in anlaggning', () => {
    const tree = getFacilityTreeByGren(emptyState, 1)
    expect(tree.anlaggning.some(v => v.def.id === 'matchhall')).toBe(true)
  })
})

describe('canStartBuild', () => {
  it('allows build when no active project and deps met', () => {
    expect(canStartBuild('kiosk', emptyState).ok).toBe(true)
  })

  it('blocks when active project running', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'kiosk', startedMatchday: 1, etaMatchday: 5 },
    }
    expect(canStartBuild('belysning', state).ok).toBe(false)
    expect(canStartBuild('belysning', state).reason).toBe('aktivt_bygge')
  })

  it('blocks when deps not met', () => {
    const result = canStartBuild('laktare_ostra', emptyState)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('krav_saknas')
  })

  it('blocks matchhall directly — kräver prövning', () => {
    const state: FacilityState = { builtNodeIds: ['varmestuga', 'laktare_ostra'] }
    const result = canStartBuild('matchhall', state)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('hall_kräver_prövning')
  })

  it('blocks already built node', () => {
    const state: FacilityState = { builtNodeIds: ['kiosk'] }
    expect(canStartBuild('kiosk', state).ok).toBe(false)
  })
})

describe('startFacilityBuild', () => {
  it('sets active project with correct eta', () => {
    const def = FACILITY_NODE_DEFS.find(d => d.id === 'kiosk')!
    const result = startFacilityBuild('kiosk', emptyState, 3)
    expect(result.activeProject?.nodeId).toBe('kiosk')
    expect(result.activeProject?.startedMatchday).toBe(3)
    expect(result.activeProject?.etaMatchday).toBe(3 + def.buildRounds)
  })
})

describe('advanceFacilityState', () => {
  it('no completion before eta', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'kiosk', startedMatchday: 1, etaMatchday: 5 },
    }
    const result = advanceFacilityState(state, 4, 1)
    expect(result.completedNodeId).toBeNull()
    expect(result.state.activeProject).toBeDefined()
  })

  it('completes at eta matchday', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'kiosk', startedMatchday: 1, etaMatchday: 5 },
    }
    const result = advanceFacilityState(state, 5, 1)
    expect(result.completedNodeId).toBe('kiosk')
    expect(result.state.builtNodeIds).toContain('kiosk')
    expect(result.state.activeProject).toBeUndefined()
    const def = FACILITY_NODE_DEFS.find(d => d.id === 'kiosk')!
    expect(result.facilitiesBonus).toBe(def.facilitiesBonus)
  })

  it('completes after eta (late check)', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'varmestuga', startedMatchday: 1, etaMatchday: 9 },
    }
    const result = advanceFacilityState(state, 12, 1)
    expect(result.completedNodeId).toBe('varmestuga')
  })
})

describe('getPreSeasonChoices', () => {
  it('returns nodes without deps in empty state (excluding matchhall)', () => {
    const choices = getPreSeasonChoices(emptyState)
    expect(choices.some(d => d.id === 'matchhall')).toBe(false)
    expect(choices.every(d => d.requires.length === 0)).toBe(true)
  })

  it('returns empty when active project running', () => {
    const state: FacilityState = {
      builtNodeIds: [],
      activeProject: { nodeId: 'kiosk', startedMatchday: 1, etaMatchday: 5 },
    }
    expect(getPreSeasonChoices(state)).toHaveLength(0)
  })

  it('unlocks laktare_ostra after varmestuga built', () => {
    const state: FacilityState = { builtNodeIds: ['varmestuga'] }
    const choices = getPreSeasonChoices(state)
    expect(choices.some(d => d.id === 'laktare_ostra')).toBe(true)
  })
})

describe('matchhall node definition', () => {
  const hallDef = FACILITY_NODE_DEFS.find(d => d.id === 'matchhall')!
  it('is marked isHall', () => expect(hallDef.isHall).toBe(true))
  it('has pris-före-vinst in consequences (publik↓ and sjal↓ first)', () => {
    const [first, second] = hallDef.consequences
    expect(first.dir).toBe('ned')
    expect(second.dir).toBe('ned')
  })
  it('requires laktare_ostra', () => {
    expect(hallDef.requires).toContain('laktare_ostra')
  })
})
