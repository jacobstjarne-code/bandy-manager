import { PlayerPosition } from '../enums'
import type { Player } from './Player'

export type FormationType = '3-3-4' | '4-3-3' | '3-4-3' | '2-3-2-3' | '4-2-4' | '5-3-2'

export interface FormationSlot {
  id: string
  label: string
  position: PlayerPosition
  x: number    // 0-100 (left-right on pitch)
  y: number    // 0-100 (0=own goal end, 100=opponent end)
}

export interface FormationTemplate {
  type: FormationType
  label: string
  description: string
  slots: FormationSlot[]
}

export const FORMATIONS: Record<FormationType, FormationTemplate> = {
  '5-3-2': {
    type: '5-3-2',
    label: '5-3-2 (Klassisk)',
    description: 'Traditionell. Libero, två backar, två ytterhalvor, tre mittfältare, två forwards.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 25, y: 15 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 75, y: 15 },
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 10, y: 30 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 90, y: 30 },
      { id: 'mid-l',  label: 'VCH', position: PlayerPosition.Midfielder, x: 30, y: 45 },
      { id: 'mid-c',  label: 'CH',  position: PlayerPosition.Midfielder, x: 50, y: 43 },
      { id: 'mid-r',  label: 'HCH', position: PlayerPosition.Midfielder, x: 70, y: 45 },
      { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 35, y: 70 },
      { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 65, y: 70 },
    ],
  },
  '3-3-4': {
    type: '3-3-4',
    label: '3-3-4 (Offensiv)',
    description: 'Traditionell bandyformation. Tre backar, tre halvar, fyra forwards.',
    slots: [
      { id: 'gk',     label: 'MV', position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'def-l',  label: 'VB', position: PlayerPosition.Defender,   x: 20, y: 20 },
      { id: 'def-c',  label: 'CB', position: PlayerPosition.Defender,   x: 50, y: 18 },
      { id: 'def-r',  label: 'HB', position: PlayerPosition.Defender,   x: 80, y: 20 },
      { id: 'half-l', label: 'VH', position: PlayerPosition.Half,       x: 20, y: 42 },
      { id: 'half-c', label: 'CH', position: PlayerPosition.Half,       x: 50, y: 40 },
      { id: 'half-r', label: 'HR', position: PlayerPosition.Half,       x: 80, y: 42 },
      { id: 'fwd-il', label: 'VI', position: PlayerPosition.Forward,    x: 30, y: 65 },
      { id: 'fwd-ir', label: 'HI', position: PlayerPosition.Forward,    x: 70, y: 65 },
      { id: 'fwd-l',  label: 'VY', position: PlayerPosition.Forward,    x: 10, y: 75 },
      { id: 'fwd-r',  label: 'HY', position: PlayerPosition.Forward,    x: 90, y: 75 },
    ],
  },
  '4-3-3': {
    type: '4-3-3',
    label: '4-3-3 (Defensiv)',
    description: 'Fyra backar ger stabilitet. Tre halvar, tre forwards.',
    slots: [
      { id: 'gk',      label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'def-ll',  label: 'VB',  position: PlayerPosition.Defender,   x: 15, y: 20 },
      { id: 'def-lc',  label: 'VCB', position: PlayerPosition.Defender,   x: 38, y: 18 },
      { id: 'def-rc',  label: 'HCB', position: PlayerPosition.Defender,   x: 62, y: 18 },
      { id: 'def-rr',  label: 'HB',  position: PlayerPosition.Defender,   x: 85, y: 20 },
      { id: 'half-l',  label: 'VH',  position: PlayerPosition.Half,       x: 25, y: 42 },
      { id: 'half-c',  label: 'CH',  position: PlayerPosition.Half,       x: 50, y: 40 },
      { id: 'half-r',  label: 'HR',  position: PlayerPosition.Half,       x: 75, y: 42 },
      { id: 'fwd-l',   label: 'VY',  position: PlayerPosition.Forward,    x: 20, y: 72 },
      { id: 'fwd-c',   label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 70 },
      { id: 'fwd-r',   label: 'HY',  position: PlayerPosition.Forward,    x: 80, y: 72 },
    ],
  },
  '3-4-3': {
    type: '3-4-3',
    label: '3-4-3 (Mittfält)',
    description: 'Starkt mittfält med fyra halvar. Bra bollinnehav.',
    slots: [
      { id: 'gk',      label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'def-l',   label: 'VB',  position: PlayerPosition.Defender,   x: 20, y: 20 },
      { id: 'def-c',   label: 'CB',  position: PlayerPosition.Defender,   x: 50, y: 18 },
      { id: 'def-r',   label: 'HB',  position: PlayerPosition.Defender,   x: 80, y: 20 },
      { id: 'half-ll', label: 'VH',  position: PlayerPosition.Half,       x: 15, y: 42 },
      { id: 'half-lc', label: 'VCH', position: PlayerPosition.Half,       x: 38, y: 40 },
      { id: 'half-rc', label: 'HCH', position: PlayerPosition.Half,       x: 62, y: 40 },
      { id: 'half-rr', label: 'HR',  position: PlayerPosition.Half,       x: 85, y: 42 },
      { id: 'fwd-l',   label: 'VY',  position: PlayerPosition.Forward,    x: 20, y: 72 },
      { id: 'fwd-c',   label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 70 },
      { id: 'fwd-r',   label: 'HY',  position: PlayerPosition.Forward,    x: 80, y: 72 },
    ],
  },
  '2-3-2-3': {
    type: '2-3-2-3',
    label: '2-3-2-3 (Offensiv)',
    description: 'Bara två backar — all vikt framåt. Riskabelt men explosivt.',
    slots: [
      { id: 'gk',     label: 'MV', position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'def-l',  label: 'VB', position: PlayerPosition.Defender,   x: 30, y: 18 },
      { id: 'def-r',  label: 'HB', position: PlayerPosition.Defender,   x: 70, y: 18 },
      { id: 'half-l', label: 'VH', position: PlayerPosition.Half,       x: 20, y: 35 },
      { id: 'half-c', label: 'CH', position: PlayerPosition.Half,       x: 50, y: 33 },
      { id: 'half-r', label: 'HR', position: PlayerPosition.Half,       x: 80, y: 35 },
      { id: 'mid-l',  label: 'VM', position: PlayerPosition.Midfielder, x: 30, y: 55 },
      { id: 'mid-r',  label: 'HM', position: PlayerPosition.Midfielder, x: 70, y: 55 },
      { id: 'fwd-l',  label: 'VY', position: PlayerPosition.Forward,    x: 20, y: 75 },
      { id: 'fwd-c',  label: 'CF', position: PlayerPosition.Forward,    x: 50, y: 72 },
      { id: 'fwd-r',  label: 'HY', position: PlayerPosition.Forward,    x: 80, y: 75 },
    ],
  },
  '4-2-4': {
    type: '4-2-4',
    label: '4-2-4 (Ultra-offensiv)',
    description: 'Maximal bredd med fyra forwards och fyra backar. Tunn halvbackslinje.',
    slots: [
      { id: 'gk',      label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'def-ll',  label: 'VB',  position: PlayerPosition.Defender,   x: 15, y: 20 },
      { id: 'def-lc',  label: 'VCB', position: PlayerPosition.Defender,   x: 38, y: 18 },
      { id: 'def-rc',  label: 'HCB', position: PlayerPosition.Defender,   x: 62, y: 18 },
      { id: 'def-rr',  label: 'HB',  position: PlayerPosition.Defender,   x: 85, y: 20 },
      { id: 'half-l',  label: 'VH',  position: PlayerPosition.Half,       x: 35, y: 42 },
      { id: 'half-r',  label: 'HR',  position: PlayerPosition.Half,       x: 65, y: 42 },
      { id: 'fwd-ll',  label: 'VY',  position: PlayerPosition.Forward,    x: 10, y: 75 },
      { id: 'fwd-il',  label: 'VI',  position: PlayerPosition.Forward,    x: 35, y: 68 },
      { id: 'fwd-ir',  label: 'HI',  position: PlayerPosition.Forward,    x: 65, y: 68 },
      { id: 'fwd-rr',  label: 'HY',  position: PlayerPosition.Forward,    x: 90, y: 75 },
    ],
  },
}

// ── Auto-assign players to formation slots ─────────────────────────────────
// Returns positionAssignments mapping: playerId → FormationSlot
export function autoAssignFormation(
  template: FormationTemplate,
  players: Player[],
): Record<string, FormationSlot> {
  const assignments: Record<string, FormationSlot> = {}
  const usedIds = new Set<string>()
  const filledSlotIndices = new Set<number>()

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i]
    const best = players
      .filter(p => p.position === slot.position && !usedIds.has(p.id))
      .sort((a, b) => b.currentAbility - a.currentAbility)[0]
    if (best) {
      assignments[best.id] = slot
      usedIds.add(best.id)
      filledSlotIndices.add(i)
    }
  }

  // Second pass: fill unfilled slots with best remaining player by CA
  for (let i = 0; i < template.slots.length; i++) {
    if (filledSlotIndices.has(i)) continue
    const slot = template.slots[i]
    const fallback = players
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => b.currentAbility - a.currentAbility)[0]
    if (fallback) {
      assignments[fallback.id] = slot
      usedIds.add(fallback.id)
    }
  }

  return assignments
}
