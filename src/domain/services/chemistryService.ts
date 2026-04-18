import type { Player } from '../entities/Player'
import type { FormationSlot } from '../entities/Formation'

export interface PairChemistry {
  playerId1: string
  playerId2: string
  strength: number  // -1 to 1
  reasons: string[]
}

export interface WeakZone {
  centerX: number   // in 0-100 coordinate space
  centerY: number
  label: string
}

export function calculatePairChemistry(
  a: Player,
  b: Player,
  sharedMinutes: number,
): PairChemistry {
  let strength = 0
  const reasons: string[] = []

  // Shared minutes (0–5400 = 60 matches × 90 min)
  const togetherBonus = Math.min(0.4, sharedMinutes / 13500)
  if (togetherBonus > 0.15) {
    strength += togetherBonus
    reasons.push(`${Math.round(sharedMinutes / 90)} matcher ihop`)
  }

  // Same day job
  if (a.dayJob?.title && b.dayJob?.title && a.dayJob.title === b.dayJob.title) {
    strength += 0.25
    reasons.push(`Båda ${a.dayJob.title.toLowerCase()}`)
  }

  // Age gap: big gap between veteran (35+) and young (< 22) adds slight bonus
  const ageDiff = Math.abs(a.age - b.age)
  if (ageDiff >= 12) {
    strength += 0.1
    reasons.push('Veteran-veteran-koppling')
  }

  // Both full-time pros (rare in Swedish amateur bandy — bond over shared commitment)
  if (a.isFullTimePro && b.isFullTimePro) {
    strength += 0.2
    reasons.push('Båda heltidsproffs')
  }

  // Low loyalty on one side → friction
  const minLoyalty = Math.min(a.loyaltyScore ?? 5, b.loyaltyScore ?? 5)
  if (minLoyalty <= 2) {
    strength -= 0.35
    reasons.push('Lojalitetskris')
  }

  return {
    playerId1: a.id,
    playerId2: b.id,
    strength: Math.max(-1, Math.min(1, strength)),
    reasons,
  }
}

export function calculateLineupChemistry(
  players: Player[],
  chemistryStats: Record<string, number>,
): PairChemistry[] {
  const pairs: PairChemistry[] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const key = [players[i].id, players[j].id].sort().join('|')
      const minutes = chemistryStats[key] ?? 0
      pairs.push(calculatePairChemistry(players[i], players[j], minutes))
    }
  }
  return pairs
}

function inferZoneLabel(p1: string, p2: string): string {
  const sorted = [p1, p2].sort()
  if (sorted.every(p => p === 'Defender')) return 'försvarskoppling'
  if (sorted.every(p => p === 'Midfielder' || p === 'Half')) return 'mittfältet'
  if (sorted.every(p => p === 'Forward')) return 'anfallsparet'
  return 'linjeklyfta'
}

export function findWeakZones(
  players: Player[],
  slots: FormationSlot[],
  chemistry: PairChemistry[],
): WeakZone[] {
  // slots[i] corresponds to players[i] — caller must pass pre-sorted starters aligned to slots
  const zones: WeakZone[] = []
  const weakPairs = chemistry.filter(c => c.strength < -0.2)

  // For each weak pair, if both players are in "adjacent" slots, mark a zone
  // We don't have slot→player mapping here, so we approximate using player index in lineup
  for (const pair of weakPairs) {
    const idx1 = players.findIndex(p => p.id === pair.playerId1)
    const idx2 = players.findIndex(p => p.id === pair.playerId2)
    if (idx1 < 0 || idx2 < 0 || idx1 >= slots.length || idx2 >= slots.length) continue

    const slot1 = slots[idx1]
    const slot2 = slots[idx2]

    const dx = slot1.x - slot2.x
    const dy = slot1.y - slot2.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 35) continue  // too far apart to be a "zone"

    zones.push({
      centerX: (slot1.x + slot2.x) / 2,
      centerY: (slot1.y + slot2.y) / 2,
      label: inferZoneLabel(slot1.position, slot2.position),
    })
  }

  return zones
}
