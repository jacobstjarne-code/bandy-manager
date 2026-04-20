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
    description: 'Traditionell. Libero, två backar, två ytterhalvor, tre halvbacks, två forwards.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 5 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 25, y: 18 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 24 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 75, y: 18 },
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 10, y: 38 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 90, y: 38 },
      { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 30, y: 52 },
      { id: 'mid-c',  label: 'CMF', position: PlayerPosition.Midfielder, x: 50, y: 50 },
      { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 70, y: 52 },
      { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 35, y: 77 },
      { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 65, y: 77 },
    ],
  },
  '3-3-4': {
    type: '3-3-4',
    label: '3-3-4 (Offensiv)',
    description: 'Traditionell bandyformation. Tre backar, tre halvar, fyra forwards.',
    slots: [
      { id: 'gk',     label: 'MV', position: PlayerPosition.Goalkeeper, x: 50, y: 5 },
      { id: 'def-l',  label: 'VB', position: PlayerPosition.Defender,   x: 20, y: 20 },
      { id: 'def-c',  label: 'CB', position: PlayerPosition.Defender,   x: 50, y: 18 },
      { id: 'def-r',  label: 'HB', position: PlayerPosition.Defender,   x: 80, y: 20 },
      { id: 'half-l', label: 'VH', position: PlayerPosition.Half,       x: 20, y: 52 },
      { id: 'half-c', label: 'CMF', position: PlayerPosition.Midfielder,  x: 50, y: 50 },
      { id: 'half-r', label: 'HR', position: PlayerPosition.Half,       x: 80, y: 52 },
      { id: 'fwd-il', label: 'VI', position: PlayerPosition.Forward,    x: 30, y: 72 },
      { id: 'fwd-ir', label: 'HI', position: PlayerPosition.Forward,    x: 70, y: 72 },
      { id: 'fwd-l',  label: 'VY', position: PlayerPosition.Forward,    x: 10, y: 80 },
      { id: 'fwd-r',  label: 'HY', position: PlayerPosition.Forward,    x: 90, y: 80 },
    ],
  },
  '4-3-3': {
    type: '4-3-3',
    label: '4-3-3 (Defensiv)',
    description: 'Fyra backar ger stabilitet. Tre halvar, tre forwards.',
    slots: [
      { id: 'gk',      label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 5 },
      { id: 'def-ll',  label: 'VB',  position: PlayerPosition.Defender,   x: 15, y: 20 },
      { id: 'def-lc',  label: 'VCB', position: PlayerPosition.Defender,   x: 38, y: 18 },
      { id: 'def-rc',  label: 'HCB', position: PlayerPosition.Defender,   x: 62, y: 18 },
      { id: 'def-rr',  label: 'HB',  position: PlayerPosition.Defender,   x: 85, y: 20 },
      { id: 'half-l',  label: 'VH',  position: PlayerPosition.Half,       x: 25, y: 52 },
      { id: 'half-c',  label: 'CMF', position: PlayerPosition.Midfielder,  x: 50, y: 50 },
      { id: 'half-r',  label: 'HR',  position: PlayerPosition.Half,       x: 75, y: 52 },
      { id: 'fwd-l',   label: 'VY',  position: PlayerPosition.Forward,    x: 20, y: 78 },
      { id: 'fwd-c',   label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 76 },
      { id: 'fwd-r',   label: 'HY',  position: PlayerPosition.Forward,    x: 80, y: 78 },
    ],
  },
  '3-4-3': {
    type: '3-4-3',
    label: '3-4-3 (Halvlinje)',
    description: 'Stark halvlinje med fyra halvar. Bra bollinnehav.',
    slots: [
      { id: 'gk',      label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 5 },
      { id: 'def-l',   label: 'VB',  position: PlayerPosition.Defender,   x: 20, y: 20 },
      { id: 'def-c',   label: 'CB',  position: PlayerPosition.Defender,   x: 50, y: 18 },
      { id: 'def-r',   label: 'HB',  position: PlayerPosition.Defender,   x: 80, y: 20 },
      { id: 'half-ll', label: 'VH',  position: PlayerPosition.Half,       x: 15, y: 52 },
      { id: 'half-lc', label: 'VMF', position: PlayerPosition.Midfielder,  x: 38, y: 50 },
      { id: 'half-rc', label: 'HMF', position: PlayerPosition.Midfielder,  x: 62, y: 50 },
      { id: 'half-rr', label: 'HR',  position: PlayerPosition.Half,       x: 85, y: 52 },
      { id: 'fwd-l',   label: 'VY',  position: PlayerPosition.Forward,    x: 20, y: 78 },
      { id: 'fwd-c',   label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 76 },
      { id: 'fwd-r',   label: 'HY',  position: PlayerPosition.Forward,    x: 80, y: 78 },
    ],
  },
  '2-3-2-3': {
    type: '2-3-2-3',
    label: '2-3-2-3 (Offensiv)',
    description: 'Bara två backar — all vikt framåt. Riskabelt men explosivt.',
    slots: [
      { id: 'gk',     label: 'MV', position: PlayerPosition.Goalkeeper, x: 50, y: 5 },
      { id: 'def-l',  label: 'VB', position: PlayerPosition.Defender,   x: 30, y: 18 },
      { id: 'def-r',  label: 'HB', position: PlayerPosition.Defender,   x: 70, y: 18 },
      { id: 'half-l', label: 'VH', position: PlayerPosition.Half,       x: 20, y: 38 },
      { id: 'half-c', label: 'CMF', position: PlayerPosition.Midfielder,  x: 50, y: 36 },
      { id: 'half-r', label: 'HR', position: PlayerPosition.Half,       x: 80, y: 38 },
      { id: 'mid-l',  label: 'VM', position: PlayerPosition.Midfielder, x: 30, y: 58 },
      { id: 'mid-r',  label: 'HM', position: PlayerPosition.Midfielder, x: 70, y: 58 },
      { id: 'fwd-l',  label: 'VY', position: PlayerPosition.Forward,    x: 20, y: 78 },
      { id: 'fwd-c',  label: 'CF', position: PlayerPosition.Forward,    x: 50, y: 76 },
      { id: 'fwd-r',  label: 'HY', position: PlayerPosition.Forward,    x: 80, y: 78 },
    ],
  },
  '4-2-4': {
    type: '4-2-4',
    label: '4-2-4 (Ultra-offensiv)',
    description: 'Maximal bredd med fyra forwards och fyra backar. Tunn halvbackslinje.',
    slots: [
      { id: 'gk',      label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 5 },
      { id: 'def-ll',  label: 'VB',  position: PlayerPosition.Defender,   x: 15, y: 20 },
      { id: 'def-lc',  label: 'VCB', position: PlayerPosition.Defender,   x: 38, y: 18 },
      { id: 'def-rc',  label: 'HCB', position: PlayerPosition.Defender,   x: 62, y: 18 },
      { id: 'def-rr',  label: 'HB',  position: PlayerPosition.Defender,   x: 85, y: 20 },
      { id: 'half-l',  label: 'VH',  position: PlayerPosition.Half,       x: 35, y: 50 },
      { id: 'half-r',  label: 'HR',  position: PlayerPosition.Half,       x: 65, y: 50 },
      { id: 'fwd-ll',  label: 'VY',  position: PlayerPosition.Forward,    x: 10, y: 78 },
      { id: 'fwd-il',  label: 'VI',  position: PlayerPosition.Forward,    x: 35, y: 73 },
      { id: 'fwd-ir',  label: 'HI',  position: PlayerPosition.Forward,    x: 65, y: 73 },
      { id: 'fwd-rr',  label: 'HY',  position: PlayerPosition.Forward,    x: 90, y: 78 },
    ],
  },
}

// ── Auto-assign players to formation slots ─────────────────────────────────
// Returns lineupSlots mapping: slotId → playerId | null
export function autoAssignFormation(
  template: FormationTemplate,
  players: Player[],
): Record<string, string | null> {
  const lineupSlots: Record<string, string | null> = {}
  // Initialise all slots to null
  for (const slot of template.slots) {
    lineupSlots[slot.id] = null
  }

  const usedIds = new Set<string>()
  const filledSlotIds = new Set<string>()

  // First pass: match by exact position, best CA first
  for (const slot of template.slots) {
    const best = players
      .filter(p => p.position === slot.position && !usedIds.has(p.id))
      .sort((a, b) => b.currentAbility - a.currentAbility)[0]
    if (best) {
      lineupSlots[slot.id] = best.id
      usedIds.add(best.id)
      filledSlotIds.add(slot.id)
    }
  }

  // Second pass: adjacent position match (half↔midfielder, half↔defender, etc.)
  // Only place a player in an adjacent slot if no unfilled slots match their own position.
  const ADJACENT: Record<string, string[]> = {
    goalkeeper: [],
    defender: ['half'],
    half: ['defender', 'midfielder'],
    midfielder: ['half', 'forward'],
    forward: ['midfielder'],
  }
  for (const slot of template.slots) {
    if (filledSlotIds.has(slot.id)) continue
    const adj = ADJACENT[slot.position] ?? []
    const best = players
      .filter(p => {
        if (!adj.includes(p.position)) return false
        if (usedIds.has(p.id)) return false
        // Only use this player here if there are no unfilled slots for their own position
        const hasOwnSlotOpen = template.slots.some(
          s => !filledSlotIds.has(s.id) && s.id !== slot.id && s.position === p.position
        )
        return !hasOwnSlotOpen
      })
      .sort((a, b) => b.currentAbility - a.currentAbility)[0]
    if (best) {
      lineupSlots[slot.id] = best.id
      usedIds.add(best.id)
      filledSlotIds.add(slot.id)
    }
  }

  // Third pass: fill unfilled slots with best remaining player by CA
  for (const slot of template.slots) {
    if (filledSlotIds.has(slot.id)) continue
    const fallback = players
      .filter(p => !usedIds.has(p.id))
      .sort((a, b) => b.currentAbility - a.currentAbility)[0]
    if (fallback) {
      lineupSlots[slot.id] = fallback.id
      usedIds.add(fallback.id)
    }
  }

  return lineupSlots
}

// ── Coach recommendation ────────────────────────────────────────────────────
// Scores each formation by how many available players match required positions.
// Returns the formation type with the highest score.
export function getRecommendedFormation(players: Player[]): FormationType {
  const available = players.filter(p => !p.isInjured && p.suspensionGamesRemaining === 0)
  const countByPos: Record<string, number> = {}
  for (const p of available) {
    countByPos[p.position] = (countByPos[p.position] ?? 0) + 1
  }

  let best: FormationType = '4-3-3'
  let bestScore = -1
  for (const [fType, template] of Object.entries(FORMATIONS) as [FormationType, FormationTemplate][]) {
    const required: Record<string, number> = {}
    for (const slot of template.slots) {
      required[slot.position] = (required[slot.position] ?? 0) + 1
    }
    let score = 0
    for (const [pos, need] of Object.entries(required)) {
      score += Math.min(need, countByPos[pos] ?? 0)
    }
    if (score > bestScore) {
      bestScore = score
      best = fType
    }
  }
  return best
}

// ── Formation meta: anatomy tags + coach quotes ─────────────────────────────
// Tags reflect slot anatomy (player requirements), NOT match-engine effects.
// Texts approved in TEXT_REVIEW_formations_2026-04-20.md — copy exactly.
export const FORMATION_META: Record<FormationType, { tags: string[]; coachQuote: string }> = {
  '5-3-2': {
    tags: ['TRYGG', 'KRÄVER LIBERO'],
    coachQuote: 'Libero bak, tre halvor, två forwards. Så har vi alltid spelat — det finns en trygghet i det kända.',
  },
  '3-3-4': {
    tags: ['4 FORWARDS', 'KLASSISK BANDY'],
    coachQuote: 'Fyra forwards. Så här spelades bandy när jag växte upp — mycket folk framme, straffa dom när dom tappar bollen.',
  },
  '4-3-3': {
    tags: ['STABIL BAKÅT', '4 BACKAR'],
    coachQuote: 'Fyra bak. Tråkigt, kanske — men det vinner poäng när motståndarna är bättre än oss. Stabilitet först, chanser sen.',
  },
  '3-4-3': {
    tags: ['STARK MITTLINJE', 'BOLLKONTROLL'],
    coachQuote: 'Fyra på halvlinjen. Äger du mitten i bandy äger du matchen — så enkelt är det.',
  },
  '2-3-2-3': {
    tags: ['BARA 2 BACKAR', 'RISK/REWARD'],
    coachQuote: 'Bara två bak. Vi gasar. Funkar det inte i första halvlek får vi byta — men jag vill testa.',
  },
  '4-2-4': {
    tags: ['4 FORWARDS', 'TUNN MITTLINJE'],
    coachQuote: 'Fyra forwards, fyra backar — och två stackars halvor som ska hålla ihop det. Allt eller inget.',
  },
}
