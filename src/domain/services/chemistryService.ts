import type { Player } from '../entities/Player'
import type { FormationSlot } from '../entities/Formation'
import { getHeightMode } from '../entities/Formation'
import type { Tactic } from '../entities/Club'
import type { OpponentAnalysis } from './opponentAnalysisService'
import { TacticMentality } from '../enums'
import { findEmployerForJob } from '../data/localEmployers'

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

  // Delade minuter -> uppbyggd kemi. Tunad så ett sammansvetsat par gel:ar inom en säsong:
  // ~halv säsong (~11 matcher, 990 min) börjar registrera, full säsong (~22, 1980 min) ger
  // tydlig bonus, tak vid ~27 matcher. (Var /13500 + grind 0.15 = fleräsongs-effekt, för trögt.)
  const togetherBonus = Math.min(0.4, sharedMinutes / 6000)
  if (togetherBonus > 0.08) {
    strength += togetherBonus
    reasons.push(`${Math.round(sharedMinutes / 90)} matcher ihop`)
  }

  // Same day job / workplace. Coworker events group by the canonical local-
  // employer lookup, so chemistry must read that same model rather than
  // requiring identical job titles (a teacher and an economist can both work
  // for the municipality). Preserve the old title fallback for legacy/custom
  // clubs whose jobs do not map to a local employer.
  if (a.dayJob?.title && b.dayJob?.title) {
    const employerA = findEmployerForJob(a.clubId, a.dayJob.title)
    const employerB = findEmployerForJob(b.clubId, b.dayJob.title)
    if (a.clubId === b.clubId && employerA && employerB && employerA.name === employerB.name) {
      strength += 0.25
      reasons.push(`Arbetskamrater på ${employerA.name}`)
    } else if (a.dayJob.title === b.dayJob.title) {
      strength += 0.25
      reasons.push(`Båda ${a.dayJob.title.toLowerCase()}`)
    }
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

// ── "Så spelar det": en mening om hur taktiken känns, härledd ur spelstil +
//    faktisk kemi i startelvan (inte canned). Genomgång II B. Opus-text. ────────

export function getTacticFeel(
  tactic: Tactic,
  players: Player[],
  chemistryStats: Record<string, number>,
): string {
  const mentalityPart =
    tactic.mentality === TacticMentality.Offensive ? 'Tyngdpunkten ligger framåt'
    : tactic.mentality === TacticMentality.Defensive ? 'Laget sitter djupt och tätt'
    : 'Balans mellan att hålla och att trycka på'

  const lineupSlots = tactic.lineupSlots ?? {}
  const starters = Object.values(lineupSlots)
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => !!p)

  if (starters.length < 6) {
    return `${mentalityPart}. Sätt en startelva för att läsa kemin.`
  }

  const pairs = calculateLineupChemistry(starters, chemistryStats)
  const weakest = pairs.filter(p => p.strength < -0.15).sort((a, b) => a.strength - b.strength)[0]
  if (weakest) {
    const p1 = starters.find(p => p.id === weakest.playerId1)
    const p2 = starters.find(p => p.id === weakest.playerId2)
    const zone = p1 && p2 ? inferZoneLabel(p1.position, p2.position) : 'en koppling'
    return `${mentalityPart}, men ${zone} saknar kemi — sårbar på omställning.`
  }

  const strongest = pairs.filter(p => p.strength > 0.3).sort((a, b) => b.strength - a.strength)[0]
  if (strongest) {
    return `${mentalityPart}. Inspelta par håller ihop laget.`
  }
  return `${mentalityPart}. Truppen är ny ihop — kemin får växa fram.`
}

// Wrapper around getTacticFeel that adds a motrelativ konsekvensrad when a clear
// tactic/opponent edge exists. Falls back to getTacticFeel (silence rule) when
// no edge is detectable. Seed picks deterministically between pool strings.
export function getTacticConsequence(
  tactic: Tactic,
  players: Player[],
  chemistryStats: Record<string, number>,
  opponent?: OpponentAnalysis,
  seed = 0,
): string {
  if (opponent) {
    const isOffensive = tactic.mentality === TacticMentality.Offensive
    const isDefensive = tactic.mentality === TacticMentality.Defensive
    const isHighPress = getHeightMode(tactic.formation) === 'high'
    const hasWeakDefense = opponent.weaknesses.includes('Sårbart försvar')
    const hasWeakMidfield = opponent.weaknesses.includes('Svag halvlinje')
    const hasStrongAttack = opponent.strengths.includes('Stark anfallslinje')

    if ((isOffensive || isHighPress) && hasWeakDefense) {
      const pool = [
        'Offensivt mot deras sårbara försvar — rätt match att trycka på.',
        'De läcker bakåt. Spelar ni framåt kan det lossna tidigt.',
      ]
      return pool[seed % pool.length]
    }
    if (isHighPress && hasWeakMidfield) {
      return 'Hög press mot deras svaga mittfält — där vinns matchen om någonstans.'
    }
    if (isDefensive && hasStrongAttack) {
      return 'Ni sitter djupt mot deras farliga forwards. Klokt — men ni måste ta era få lägen.'
    }
    if (isOffensive && hasStrongAttack) {
      return 'Öppet mot deras anfall blir en målrik kväll åt båda håll. Säkert? Nej. Kul? Ja.'
    }
    // DOM_FORMATIONER_V2_2026-09-04.md: formationBias (attack/defense per
    // formationstyp) borttagen — ingen av de sex nya formationerna bär en
    // sådan bias (V2, inte nu: "att låta formerna väga i motorn via
    // rollerna" väntar B12-mätning).
  }
  return getTacticFeel(tactic, players, chemistryStats)
}
