/**
 * lineupNudge.ts — B10 Ticket 2
 *
 * Hjälpfunktioner för lineup-nudge: förfyll PREFILL_COUNT spelare,
 * lämna EMPTY_SLOTS positioner tomma (deterministiskt seedat per fixture).
 */
import { PlayerPosition } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import type { FormationTemplate } from '../../domain/entities/Formation'
import { FORMATIONS, autoAssignFormation } from '../../domain/entities/Formation'
import type { Tactic } from '../../domain/entities/Club'
import type { TeamSelection } from '../../domain/entities/Fixture'
import { fixtureSeed, mulberry32 } from '../../domain/utils/random'
import {
  assessFatigueFloorBreach,
  FATIGUE_AVAILABILITY_FLOOR,
  getSelectionScore,
  pickBestEleven,
  prioritizeLineupCandidates,
  type BestElevenSelection,
  type LineupSelectionMode,
} from '../../domain/services/squadEvaluator'

export { assessFatigueFloorBreach, pickBestEleven }

export const PREFILL_COUNT = 8
export const EMPTY_SLOTS = 3

/**
 * High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom). En spelare under detta
 * fitness-golv utesluts ur "bästa 11"-poolen om ett rimligt alternativ finns.
 * C-FT1 flyttade 2026-09-08 hela urvalet till domain-lagret, så spelarens
 * autofyllnad och AI:n nu lyder samma golv och matchformskurva. En tunn trupp
 * (Skutskär-scenariot) tvingas ändå
 * välja NÅGON — poolen under golvet finns kvar som fallback, den kastas
 * aldrig, bara nedprioriteras.
 *
 * A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): re-export av
 * `FATIGUE_AVAILABILITY_FLOOR` (squadEvaluator.ts) — flyttad dit så
 * application-lagret (setLineup.ts, playerStateProcessor.ts) kan dela EXAKT
 * samma konstant utan att importera från presentation. Namnet här behålls
 * oförändrat för att inte bryta befintliga imports/tester.
 */
export const SPELKLARHET_FITNESS_FLOOR = FATIGUE_AVAILABILITY_FLOOR

/**
 * High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom): partitionerar i två
 * block (fitness ≥ golvet, fitness < golvet), sorterade var för sig efter
 * `getSelectionScore()` (samma currentAbility×playerModifier-viktning
 * matchmotorn faktiskt använder — se squadEvaluator.ts). Blocket under
 * golvet läggs sist, inte bort — `pickBestEleven()` fyller därifrån bara om
 * poolen ovanför golvet inte räcker till 11 spelare.
 *
 * Exporterad 2026-08-31 (A3-residualen, Jacobs körorder): FormationView.tsx:s
 * egen "Fyll bästa elvan" hade en TREDJE, oberoende sortering (rå
 * currentAbility, ingen golv-medvetenhet alls) — exakt det HIGH 2:s
 * kommentar ovan redan en gång stängde två kopior av. Nu delar alla tre
 * "Fyll bästa elvan"-ytor EN funktion, som `pickBestEleven`-docstringen
 * redan påstod.
 */
export type AutoFillMode = LineupSelectionMode

export const AUTOFILL_MODE_LABELS: Record<AutoFillMode, string> = {
  strongest: 'Starkast',
  rested: 'Mest utvilad',
  matchfit: 'Bäst för dagens match',
}

export function prioritizeByFitnessFloor(players: Player[], mode: AutoFillMode = 'matchfit'): Player[] {
  return prioritizeLineupCandidates(players, mode)
}

export type BestElevenResult = BestElevenSelection

export interface NudgeLineup {
  starterIds: string[]
  lineupSlots: Record<string, string | null>
}

/**
 * För nästa match vidare den elva som faktiskt spelade senast. Pending-lineup
 * rensas medvetet efter avslag (den betyder "bekräftad för nästa match"), men
 * det ska inte samtidigt radera spelarens arbetsutkast. Otillgängliga spelare
 * tas bort och lämnar riktiga hål; resten behåller sina platser.
 */
export function buildCarryForwardLineup(
  previous: TeamSelection,
  available: Player[],
  currentTactic: Tactic,
): TeamSelection {
  const availableById = new Map(available.map(player => [player.id, player]))
  const startingPlayerIds = previous.startingPlayerIds.filter(id => availableById.has(id))
  const startingSet = new Set(startingPlayerIds)
  const formation = currentTactic.formation ?? previous.tactic.formation ?? '532_tvatoppar'
  const sameFormation = formation === previous.tactic.formation
  const previousSlots = previous.tactic.lineupSlots

  const lineupSlots = sameFormation && previousSlots && Object.keys(previousSlots).length > 0
    ? Object.fromEntries(Object.entries(previousSlots).map(([slotId, playerId]) => [
        slotId,
        playerId && startingSet.has(playerId) ? playerId : null,
      ]))
    : autoAssignFormation(
        FORMATIONS[formation],
        startingPlayerIds.map(id => availableById.get(id)).filter((player): player is Player => !!player),
      )

  const previousBench = previous.benchPlayerIds.filter(id => availableById.has(id) && !startingSet.has(id))
  const previousBenchSet = new Set(previousBench)
  const remaining = available
    .filter(player => !startingSet.has(player.id) && !previousBenchSet.has(player.id))
    .sort((a, b) => getSelectionScore(b) - getSelectionScore(a))
    .map(player => player.id)

  return {
    startingPlayerIds,
    benchPlayerIds: [...previousBench, ...remaining].slice(0, 5),
    captainPlayerId: previous.captainPlayerId && startingSet.has(previous.captainPlayerId)
      ? previous.captainPlayerId
      : startingPlayerIds[0],
    tactic: { ...currentTactic, formation, lineupSlots },
  }
}

/**
 * Bygg en initial lineup med PREFILL_COUNT spelare + EMPTY_SLOTS tomma positioner.
 * - Fyll alla 11 slots med de bästa spelarna via autoAssignFormation.
 * - Slumpa sedan bort EMPTY_SLOTS icke-MV-slots (deterministiskt seedat på fixtureId).
 * - Målvaktsslot förfylls alltid (lämnas aldrig som nudge).
 */
export function buildNudgeLineup(
  available: Player[],
  formation: FormationTemplate,
  fixtureId: string,
): NudgeLineup {
  const rand = mulberry32(fixtureSeed(fixtureId, 77))

  const best11 = pickBestEleven(available).starters

  // Fyll alla slots med de bästa 11
  const allSlots = autoAssignFormation(formation, best11)

  // Hitta icke-MV-slots som är fyllda — slumpa bort EMPTY_SLOTS av dem (= nudge-tomma)
  const filledNonGkSlotIds = Object.entries(allSlots)
    .filter(([slotId, pid]) => {
      if (!pid) return false
      const slotDef = formation.slots.find(s => s.id === slotId)
      return slotDef?.position !== PlayerPosition.Goalkeeper
    })
    .map(([slotId]) => slotId)

  // Fisher-Yates shuffle (seedat) för att välja vilka slots som ska vara tomma
  const shuffled = [...filledNonGkSlotIds]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const emptySlotIds = new Set(shuffled.slice(0, Math.min(EMPTY_SLOTS, shuffled.length)))

  // Ta bort de slumpade spelarna från slots och starterIds
  const removedPids = new Set<string>()
  for (const slotId of emptySlotIds) {
    const pid = allSlots[slotId]
    if (pid) {
      removedPids.add(pid)
      allSlots[slotId] = null
    }
  }

  const finalStarterIds = best11.filter(p => !removedPids.has(p.id)).map(p => p.id)

  return { starterIds: finalStarterIds, lineupSlots: allSlots }
}
