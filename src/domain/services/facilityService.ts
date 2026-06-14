import type { FacilityProject } from '../entities/Community'
import type { FacilityState, FacilityNodeView, FacilityNodeDef, FacilityGren } from '../entities/Community'
import { FACILITY_NODE_DEFS } from '../data/facilityNodes'

// ── B1 Facility tree — new model ─────────────────────────────────────────

export { FACILITY_NODE_DEFS }

/** Derive the view state of all nodes from saved FacilityState. */
export function getFacilityNodeViews(
  state: FacilityState,
  currentMatchday: number,
): FacilityNodeView[] {
  const built = new Set(state.builtNodeIds)
  const activeId = state.activeProject?.nodeId

  return FACILITY_NODE_DEFS.map(def => {
    if (built.has(def.id)) {
      return { def, status: 'built' as const }
    }
    if (activeId === def.id && state.activeProject) {
      const { startedMatchday, etaMatchday } = state.activeProject
      const total = etaMatchday - startedMatchday
      const filled = Math.min(total, currentMatchday - startedMatchday)
      return {
        def,
        status: 'ongoing' as const,
        etaMatchday,
        cooldownTotal: total,
        cooldownFilled: Math.max(0, filled),
      }
    }
    const depsBuilt = def.requires.every(r => built.has(r))
    const hasActiveProject = activeId !== undefined
    if (!depsBuilt || hasActiveProject) {
      return { def, status: 'locked' as const }
    }
    return { def, status: 'available' as const }
  })
}

/** Group node views by gren for tree rendering. */
export function getFacilityTreeByGren(
  state: FacilityState,
  currentMatchday: number,
): Record<FacilityGren, FacilityNodeView[]> {
  const views = getFacilityNodeViews(state, currentMatchday)
  return {
    anlaggning: views.filter(v => v.def.gren === 'anlaggning'),
    verksamhet: views.filter(v => v.def.gren === 'verksamhet'),
    akademi: views.filter(v => v.def.gren === 'akademi'),
  }
}

/** Available nodes at season start (for PreSeason Valet). */
export function getPreSeasonChoices(state: FacilityState): FacilityNodeDef[] {
  const built = new Set(state.builtNodeIds)
  const hasActive = state.activeProject !== undefined
  if (hasActive) return []
  return FACILITY_NODE_DEFS.filter(def =>
    !built.has(def.id) &&
    !def.isHall &&
    def.requires.every(r => built.has(r))
  )
}

/** Check whether a node can be started. */
export function canStartBuild(
  nodeId: string,
  state: FacilityState,
): { ok: boolean; reason?: string } {
  if (state.activeProject) return { ok: false, reason: 'aktivt_bygge' }
  const def = FACILITY_NODE_DEFS.find(d => d.id === nodeId)
  if (!def) return { ok: false, reason: 'okänd_nod' }
  if (state.builtNodeIds.includes(nodeId)) return { ok: false, reason: 'redan_byggd' }
  if (def.isHall) return { ok: false, reason: 'hall_kräver_prövning' }
  const built = new Set(state.builtNodeIds)
  if (!def.requires.every(r => built.has(r))) return { ok: false, reason: 'krav_saknas' }
  return { ok: true }
}

/** Start a build. Caller must verify canStartBuild first and deduct cost. */
export function startFacilityBuild(
  nodeId: string,
  state: FacilityState,
  currentMatchday: number,
): FacilityState {
  const def = FACILITY_NODE_DEFS.find(d => d.id === nodeId)
  if (!def) return state
  return {
    ...state,
    activeProject: {
      nodeId,
      startedMatchday: currentMatchday,
      etaMatchday: currentMatchday + def.buildRounds,
    },
  }
}

/** Advance facility state by one round. Returns null for completedNodeId if nothing completed. */
export function advanceFacilityState(
  state: FacilityState,
  currentMatchday: number,
  _season: number,
): { state: FacilityState; completedNodeId: string | null; facilitiesBonus: number; capacityBonus: number } {
  const { activeProject } = state
  if (!activeProject || currentMatchday < activeProject.etaMatchday) {
    return { state, completedNodeId: null, facilitiesBonus: 0, capacityBonus: 0 }
  }
  const def = FACILITY_NODE_DEFS.find(d => d.id === activeProject.nodeId)
  const newState: FacilityState = {
    builtNodeIds: [...state.builtNodeIds, activeProject.nodeId],
    activeProject: undefined,
  }
  return {
    state: newState,
    completedNodeId: activeProject.nodeId,
    facilitiesBonus: def?.facilitiesBonus ?? 0,
    capacityBonus: def?.capacityBonus ?? 0,
  }
}

/** Empty initial state for new saves. */
export function createInitialFacilityState(): FacilityState {
  return { builtNodeIds: [] }
}

// ── Legacy model — kept until old callers are migrated ───────────────────

export function getAvailableProjects(facilities: number, existingProjects: FacilityProject[]): FacilityProject[] {
  const completedIds = new Set(existingProjects.filter(p => p.status === 'completed').map(p => p.id))
  const inProgressIds = new Set(existingProjects.filter(p => p.status === 'in_progress').map(p => p.id))

  const all: FacilityProject[] = []

  if (facilities < 40) {
    all.push({
      id: 'omkladningsrum', name: 'Förbättra omklädningsrum',
      description: 'Duscharna läcker och bänkarna är från 80-talet.',
      cost: 50000, duration: 4, facilitiesBonus: 10, otherEffects: ['+5 morale vid hemmamatcher'],
      requiresKommun: false, kommunCostShare: 0, status: 'available',
    })
    all.push({
      id: 'stralkastare', name: 'Uppgradera strålkastare',
      description: 'Bättre ljus = bättre TV-bilder = bättre sponsoravtal.',
      cost: 80000, duration: 6, facilitiesBonus: 8, otherEffects: ['+10% sponsorintäkter'],
      requiresKommun: false, kommunCostShare: 0, status: 'available',
    })
  }

  if (facilities >= 30 && facilities < 70) {
    all.push({
      id: 'varmestuga_legacy', name: 'Bygg värmestuga',
      description: 'Kaffe, korv och värme. Folk stannar längre.',
      cost: 120000, duration: 8, facilitiesBonus: 5, otherEffects: ['+1000 publikkapacitet'],
      requiresKommun: false, kommunCostShare: 0, status: 'available',
    })
  }

  if (facilities >= 60 && facilities < 90) {
    all.push({
      id: 'laktare_legacy', name: 'Renovera läktare',
      description: 'Sittplatser med tak. Som en riktig arena.',
      cost: 300000, duration: 12, facilitiesBonus: 10, otherEffects: ['+2000 publikkapacitet'],
      requiresKommun: true, kommunCostShare: 0.3, status: 'available',
    })
    all.push({
      id: 'gym', name: 'Bygga gym',
      description: 'Spelarna behöver inte längre träna hemma.',
      cost: 150000, duration: 8, facilitiesBonus: 8, otherEffects: ['+15% träningseffekt'],
      requiresKommun: false, kommunCostShare: 0, status: 'available',
    })
  }

  if (facilities >= 80) {
    all.push({
      id: 'ny_arena', name: 'Ny arena',
      description: 'En ny modern bandyarena med uppvärmd läktare och förbättrad isbana.',
      cost: 2000000, duration: 20, facilitiesBonus: 30,
      otherEffects: ['+5000 publikkapacitet', 'Hemmaplansfördel +10%', 'Sponsorer +20%'],
      requiresKommun: true, kommunCostShare: 0.6, status: 'available',
    })
  }

  return all.filter(p => !completedIds.has(p.id) && !inProgressIds.has(p.id))
}

export function startFacilityProject(
  project: FacilityProject,
  currentMatchday: number,
): FacilityProject {
  return { ...project, status: 'in_progress', startedMatchday: currentMatchday }
}

export function checkProjectCompletion(
  project: FacilityProject,
  currentMatchday: number,
  completedSeason?: number,
): FacilityProject {
  if (project.status !== 'in_progress') return project
  const elapsed = currentMatchday - (project.startedMatchday ?? 0)
  if (elapsed >= project.duration) {
    return { ...project, status: 'completed', completedMatchday: currentMatchday, completedSeason }
  }
  return project
}
