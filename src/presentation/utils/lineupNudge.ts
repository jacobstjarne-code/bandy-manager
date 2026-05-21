/**
 * lineupNudge.ts — B10 Ticket 2
 *
 * Hjälpfunktioner för lineup-nudge: förfyll PREFILL_COUNT spelare,
 * lämna EMPTY_SLOTS positioner tomma (deterministiskt seedat per fixture).
 */
import { PlayerPosition } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import type { FormationTemplate } from '../../domain/entities/Formation'
import { autoAssignFormation } from '../../domain/entities/Formation'
import { fixtureSeed, mulberry32 } from '../../domain/utils/random'

export const PREFILL_COUNT = 8
export const EMPTY_SLOTS = 3

/**
 * Spelklarhet-formel:
 * Kombinerar currentAbility (dominant, 70%), form (20%) och fitness (10%).
 * Ren form vore fel — en lågklassig spelare i bra form ska inte tränga ut en stjärna.
 */
export function spelklarhet(p: Player): number {
  return p.currentAbility * 0.7 + p.form * 0.2 + p.fitness * 0.1
}

export interface NudgeLineup {
  starterIds: string[]
  lineupSlots: Record<string, string | null>
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

  // Sortera på spelklarhet, bästa först
  const sorted = [...available].sort((a, b) => spelklarhet(b) - spelklarhet(a))
  const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)

  // Ta de bästa 11 (med MV) för autoAssignFormation
  const best11: Player[] = gkPool.length > 0 ? [gkPool[0]] : []
  for (const p of outfieldPool) {
    if (best11.length >= 11) break
    best11.push(p)
  }
  for (const p of gkPool.slice(1)) {
    if (best11.length >= 11) break
    best11.push(p)
  }

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
