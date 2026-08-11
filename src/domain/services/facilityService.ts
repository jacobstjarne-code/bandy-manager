import type { FacilityFinancingMode } from '../entities/Community'
import type { FacilityState, FacilityNodeView, FacilityNodeDef, FacilityGren } from '../entities/Community'
import { FACILITY_NODE_DEFS } from '../data/facilityNodes'

// ── B1 Facility tree — new model ─────────────────────────────────────────

export { FACILITY_NODE_DEFS }

// ── B1 §2 — finansieringsval ──────────────────────────────────────────────

export interface FinancingContext {
  relationship: number                          // politician.relationship (0 om ingen)
  standing: number                              // communityStanding
  mecenat?: { name: string; willing: boolean }  // aktiv mecenat + om den vill bidra
}

export interface FinancingOption {
  mode: FacilityFinancingMode   // 'club' | 'kommun' | 'mecenat'
  available: boolean
  clubCost: number              // vad klubben drar ur kassan
  contribution: number          // vad den externa källan står för
  contributorName?: string      // mecenatens namn (för konsekvensraden §4)
  reason?: string               // varför otillgänglig
}

/**
 * B1 §2 — tillgängliga finansieringskällor för en nod givet nuläget. Egen kassa
 * alltid; kommun gated på relation (+ ev. standing); mecenat på villig aktiv mecenat.
 * Driver välj-mode-UI, gaten i bygg-actionen, och den dynamiska konsekvensraden (§4).
 */
export function getFinancingOptions(def: FacilityNodeDef, ctx: FinancingContext): FinancingOption[] {
  const options: FinancingOption[] = [
    { mode: 'club', available: true, clubCost: def.cost, contribution: 0 },
  ]
  const fin = def.financing
  if (fin?.kommun) {
    const { share, minRelation, minStanding } = fin.kommun
    const relOk = ctx.relationship >= minRelation
    const standingOk = minStanding == null || ctx.standing >= minStanding
    options.push({
      mode: 'kommun',
      available: relOk && standingOk,
      clubCost: Math.round(def.cost * (1 - share)),
      contribution: Math.round(def.cost * share),
      reason: !relOk ? `Kommunrelation ${ctx.relationship}/${minRelation}`
        : !standingOk ? `Lokalt stöd ${ctx.standing}/${minStanding}` : undefined,
    })
  }
  if (fin?.mecenat) {
    const { share } = fin.mecenat
    const willing = ctx.mecenat?.willing ?? false
    options.push({
      mode: 'mecenat',
      available: willing,
      clubCost: Math.round(def.cost * (1 - share)),
      contribution: Math.round(def.cost * share),
      contributorName: ctx.mecenat?.name,
      reason: !willing ? 'Ingen villig mecenat' : undefined,
    })
  }
  return options
}

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
  if (def.isHall && state.hallTrial?.stage !== 'bygge' && state.hallTrial?.stage !== 'klar') return { ok: false, reason: 'hall_kräver_prövning' }
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
  season: number,
): { state: FacilityState; completedNodeId: string | null; facilitiesBonus: number; capacityBonus: number } {
  const { activeProject } = state
  if (!activeProject || currentMatchday < activeProject.etaMatchday) {
    return { state, completedNodeId: null, facilitiesBonus: 0, capacityBonus: 0 }
  }
  const def = FACILITY_NODE_DEFS.find(d => d.id === activeProject.nodeId)
  const newState: FacilityState = {
    ...state,
    builtNodeIds: [...state.builtNodeIds, activeProject.nodeId],
    // AUDIT DEL 3 (2026-08-11): builtSeason skrivs vid completion — kan bara
    // fyllas framåt, se Community.ts:s kommentar ovanför FacilityState.builtSeasons.
    builtSeasons: { ...state.builtSeasons, [activeProject.nodeId]: season },
    activeProject: undefined,
    lastCompleted: { nodeId: activeProject.nodeId, matchday: currentMatchday },
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
  return { builtNodeIds: [], builtSeasons: {} }
}

