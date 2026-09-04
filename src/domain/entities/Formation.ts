import { PlayerPosition } from '../enums'
import type { Player } from './Player'
import { getPositionFit } from '../utils/positionFit'

/**
 * FORMATIONER V2 (DOM_FORMATIONER_V2_2026-09-04.md, dömt av Jacob 2026-09-04):
 * sex uppställningar med femman bak KONSTANT (två backar, libero, två
 * ytterhalvor) i alla utom #4 (samma personer, halvornas y flyttas högre).
 * Formationen bär höjdläget (se heightMode i tacticModifiers.ts) — det enda
 * formationsval bandyns källor ger en effekt. De fyra 5-3-2-formerna har
 * INGEN egen multiplikator; de verkar bara genom slot-kartan (positions-
 * passning, kemi) och truppkraven. Ersätter de gamla fotbollsformationerna
 * (3-3-4/4-3-3/3-4-3/2-3-2-3/4-2-4/5-3-2), vars formations-switch i
 * tacticModifiers.ts (2-3-2-3/4-3-3/4-2-4) hade noll källstöd och togs bort.
 */
export type FormationType = '532_tvatoppar' | '532_triangel' | '532_ytterben' | '532_hogahalvor' | '523_hog' | '541_hem'

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
  '532_tvatoppar': {
    type: '532_tvatoppar',
    label: '5-3-2 två toppar',
    description: 'Platt trea på mitten, två anfallare brett. Styrspel.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      // Femman bak — konstant över alla sex formationer (utom #4, se hogahalvor).
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 22 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 22 },
      // Platt trea på mitten
      { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 28, y: 50 },
      { id: 'mid-c',  label: 'CMF', position: PlayerPosition.Midfielder, x: 50, y: 50 },
      { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 72, y: 50 },
      // Två toppar, brett
      { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 25, y: 74 },
      { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 75, y: 74 },
    ],
  },
  '532_triangel': {
    type: '532_triangel',
    label: '5-3-2 triangel',
    description: 'En spets, två mittfältare höga bakom.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 22 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 22 },
      // Djupliggande mittfältare + två som går högt
      { id: 'mid-c',  label: 'CMF', position: PlayerPosition.Midfielder, x: 50, y: 42 },
      { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 32, y: 60 },
      { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 68, y: 60 },
      // Spetsen väntar, en till formar triangeln bakom honom (5-3-2: 3 MID, 2 FWD).
      { id: 'fwd-c',  label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 78 },
      { id: 'fwd-s',  label: 'SF',  position: PlayerPosition.Forward,    x: 50, y: 64 },
    ],
  },
  '532_ytterben': {
    type: '532_ytterben',
    label: '5-3-2 ytterben',
    description: 'En defensiv mittfältare, två offensiva ytterben. Hammarbys SM-form.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 22 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 22 },
      // Läsande mittfältare + två ytterben i korridorerna
      { id: 'mid-c',  label: 'CMF', position: PlayerPosition.Midfielder, x: 50, y: 42 },
      { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 18, y: 58 },
      { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 82, y: 58 },
      { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 38, y: 76 },
      { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 62, y: 76 },
    ],
  },
  '532_hogahalvor': {
    type: '532_hogahalvor',
    label: '5-3-2 höga halvor',
    description: 'Ytterhalvorna går med i anfallet; bortre halven faller in som extra libero.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      // Samma personer som femman bak — halvornas y flyttas högre (DOM #4).
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 45 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 45 },
      { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 28, y: 52 },
      { id: 'mid-c',  label: 'CMF', position: PlayerPosition.Midfielder, x: 50, y: 52 },
      { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 72, y: 52 },
      { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 38, y: 74 },
      { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 62, y: 74 },
    ],
  },
  '523_hog': {
    type: '523_hog',
    label: '5-2-3 hög',
    description: 'Forechecking. En mittfältare upp, press på utkastet.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 22 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 22 },
      // Bara två mittfältare
      { id: 'mid-l',  label: 'VMF', position: PlayerPosition.Midfielder, x: 32, y: 48 },
      { id: 'mid-r',  label: 'HMF', position: PlayerPosition.Midfielder, x: 68, y: 48 },
      // Tre toppar, press på utkastet
      { id: 'fwd-l',  label: 'VF',  position: PlayerPosition.Forward,    x: 25, y: 74 },
      { id: 'fwd-c',  label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 76 },
      { id: 'fwd-r',  label: 'HF',  position: PlayerPosition.Forward,    x: 75, y: 74 },
    ],
  },
  '541_hem': {
    type: '541_hem',
    label: '5-4-1 hem',
    description: 'Ta hem, tjocka. Fyra på mitten, en topp. Krymper ytorna, bryter lågt.',
    slots: [
      { id: 'gk',     label: 'MV',  position: PlayerPosition.Goalkeeper, x: 50, y: 8 },
      { id: 'half-l', label: 'VYH', position: PlayerPosition.Half,       x: 8,  y: 22 },
      { id: 'def-l',  label: 'VB',  position: PlayerPosition.Defender,   x: 28, y: 22 },
      { id: 'def-c',  label: 'LIB', position: PlayerPosition.Defender,   x: 50, y: 22 },
      { id: 'def-r',  label: 'HB',  position: PlayerPosition.Defender,   x: 72, y: 22 },
      { id: 'half-r', label: 'HYH', position: PlayerPosition.Half,       x: 92, y: 22 },
      // Fyra på mitten, tjocka
      { id: 'mid-ll', label: 'VMF', position: PlayerPosition.Midfielder, x: 18, y: 48 },
      { id: 'mid-cl', label: 'VCF', position: PlayerPosition.Midfielder, x: 40, y: 48 },
      { id: 'mid-cr', label: 'HCF', position: PlayerPosition.Midfielder, x: 60, y: 48 },
      { id: 'mid-rr', label: 'HMF', position: PlayerPosition.Midfielder, x: 82, y: 48 },
      // En topp, ensam
      { id: 'fwd-c',  label: 'CF',  position: PlayerPosition.Forward,    x: 50, y: 76 },
    ],
  },
}

/** DOM_FORMATIONER_V2 §"heightMode": härlett ur formationen, inget eget fält
 *  spelaren sätter eller som lagras på Tactic (att lagra en härledning
 *  öppnar exakt den drift-risk domen stänger genom att ta bort press som
 *  eget axel-fält). `541_hem` → low, alla `532_*` → mid, `523_hog` → high.
 *  `undefined` (formation saknas — bör inte hända efter migrering, men
 *  defensivt) → mid, samma bucket som defaultformationen `532_tvatoppar`. */
export type HeightMode = 'low' | 'mid' | 'high'

export function getHeightMode(formation: FormationType | undefined): HeightMode {
  if (formation === '541_hem') return 'low'
  if (formation === '523_hog') return 'high'
  return 'mid'
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
  for (const slot of template.slots) {
    if (filledSlotIds.has(slot.id)) continue
    const best = players
      .filter(p => {
        if (getPositionFit(p.position, slot.position) !== 0.9) return false
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

  let best: FormationType = '532_tvatoppar'
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

// ── Formation meta: anatomy tags + coach quotes + truppkrav ─────────────────
// Tags reflect slot anatomy (player requirements), NOT match-engine effects
// (HÖGT PRESS/LÅGT undantag: de ÄR höjdläget, se DOM §Tags). TEXT LÅST
// (FORMATIONER_V2_TEXT_2026-09-04.md) — kopierat ordagrant, aldrig omskrivet.
export const FORMATION_META: Record<FormationType, { tags: string[]; coachQuote: string; requires: string }> = {
  '532_tvatoppar': {
    tags: ['FEMMAN BAK', 'TVÅ TOPPAR', 'KRÄVER LIBERO'],
    coachQuote: 'Tre på mitten som håller ihop, två fram som drar isär. Det är så här man spelar när man inte har något att bevisa.',
    requires: 'två anfallare, tre mittfältare som orkar hela vägen',
  },
  '532_triangel': {
    tags: ['FEMMAN BAK', 'SPETS', 'KRÄVER LIBERO'],
    coachQuote: 'En spets som väntar, två som kommer i fart under honom. Han behöver tålamod. De behöver ben.',
    requires: 'en anfallare som kan åka i tomme, två mittfältare som går högt utan att glömma vägen hem',
  },
  '532_ytterben': {
    tags: ['FEMMAN BAK', 'YTTERBEN', 'KRÄVER LIBERO'],
    coachQuote: 'En som städar mitten, två som springer korridorerna. Hammarby vann guld så. Det kostar i benen.',
    requires: 'två snabba mittfältare, en som läser spelet, två anfallare som kan spela med ryggen mot mål',
  },
  '532_hogahalvor': {
    tags: ['FEMMAN BAK', 'HÖGA HALVOR', 'KRÄVER LIBERO'],
    coachQuote: 'Halvorna följer med upp. Den bortre faller in bakom liberon när det vänder. Går det fel är det halvens fel — det vet han.',
    requires: 'två ytterhalvor med lungor för nittio minuter, en libero som pratar',
  },
  '523_hog': {
    tags: ['FEMMAN BAK', 'TRE TOPPAR', 'HÖGT PRESS', 'KRÄVER LIBERO'],
    coachQuote: 'Vi går på utkastet. Det håller inte en hel match, det ska det inte heller. Tjugo minuter när det behövs.',
    requires: 'tre som kan pressa en målvakt, och en trupp som tål att det kostar',
  },
  '541_hem': {
    tags: ['FEMMAN BAK', 'EN TOPP', 'LÅGT', 'KRÄVER LIBERO'],
    coachQuote: 'Vi tar hem det. Fyra på mitten, en där uppe som får jobba ensam. Ytorna blir små och de får skjuta utifrån.',
    requires: 'en anfallare som orkar ensam, fyra som täcker utan att jaga',
  },
}
