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
import { getSelectionScore, FATIGUE_AVAILABILITY_FLOOR } from '../../domain/services/squadEvaluator'

export const PREFILL_COUNT = 8
export const EMPTY_SLOTS = 3

/**
 * High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom). En spelare under detta
 * fitness-golv utesluts ur "bästa 11"-poolen om ett rimligt alternativ finns
 * — samma etablerade idiom som `AI_FITNESS_FLOOR=40` (matchSimProcessor.ts)
 * redan använder för AI-lagens rotation. Spelaren ska lyda samma regel som
 * AI:n, inte en mildare. En tunn trupp (Skutskär-scenariot) tvingas ändå
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
 */
function prioritizeByFitnessFloor(players: Player[]): Player[] {
  const byScore = (a: Player, b: Player) => getSelectionScore(b) - getSelectionScore(a)
  const aboveFloor = players.filter(p => p.fitness >= SPELKLARHET_FITNESS_FLOOR).sort(byScore)
  const belowFloor = players.filter(p => p.fitness < SPELKLARHET_FITNESS_FLOOR).sort(byScore)
  return [...aboveFloor, ...belowFloor]
}

export interface BestElevenResult {
  starters: Player[]
  /** Resten, sorterad bästa-först — anroparen trimmar till bänkstorlek själv. */
  rest: Player[]
  /**
   * A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md), krav 1. Blocket under golvet
   * fanns redan som fallback (HIGH2) — men fyllningen därifrån var TYST. Nu
   * rapporteras den: vilka som togs under golvet, och hur många spelare över
   * golvet som saknades. `forced` är sant exakt när urvalet inte hade elva
   * spelklara över golvet att välja bland.
   */
  belowFloorStarters: Player[]
  shortfall: number
  forced: boolean
}

/**
 * A3 krav 1 — samma bedömning som `pickBestEleven` gör internt, men körbar mot
 * en GODTYCKLIG elva. Behövs för att grinden ska sitta på beslutet ("dessa elva
 * startar"), inte bara på autofyll-knappen: en manuellt ihopsatt elva under
 * golvet är exakt samma dolda straff, och skulle annars gå obemärkt förbi.
 */
export function assessFatigueFloorBreach(
  starters: Player[],
  available: Player[],
): { belowFloorStarters: Player[]; shortfall: number; forced: boolean } {
  const belowFloorStarters = starters.filter(p => p.fitness < SPELKLARHET_FITNESS_FLOOR)
  const aboveFloorAvailable = available.filter(p => p.fitness >= SPELKLARHET_FITNESS_FLOOR).length
  const shortfall = Math.max(0, 11 - aboveFloorAvailable)
  return { belowFloorStarters, shortfall, forced: shortfall > 0 }
}

/**
 * High 2 (Skutskär-auditen, 2026-08-22, Jacobs dom): DEN gemensamma "bästa
 * 11"-urvalslogiken. Fanns tidigare duplicerad två gånger (denna fil OCH
 * useLineupEditor.ts:s handleAutoFill — "Fyll bästa elvan"-knappen auditen
 * testade) med en TREDJE, oberoende formel (spelklarhet) än den matchmotorn
 * faktiskt använder. Nu: en källa, en formel (getSelectionScore), delad.
 */
export function pickBestEleven(available: Player[]): BestElevenResult {
  const sorted = prioritizeByFitnessFloor(available)
  const gkPool = sorted.filter(p => p.position === PlayerPosition.Goalkeeper)
  const outfieldPool = sorted.filter(p => p.position !== PlayerPosition.Goalkeeper)

  const starters: Player[] = gkPool.length > 0 ? [gkPool[0]] : []
  for (const p of outfieldPool) {
    if (starters.length >= 11) break
    starters.push(p)
  }
  for (const p of gkPool.slice(1)) {
    if (starters.length >= 11) break
    starters.push(p)
  }

  const starterSet = new Set(starters.map(p => p.id))
  const rest = sorted.filter(p => !starterSet.has(p.id))
  return { starters, rest, ...assessFatigueFloorBreach(starters, available) }
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
