import type { Player } from '../entities/Player'
import type { Tactic } from '../entities/Club'
import { PlayerPosition } from '../enums'
import { clamp } from '../utils/clamp'
import { FORMATIONS } from '../entities/Formation'

const ADJACENT: Record<PlayerPosition, PlayerPosition[]> = {
  [PlayerPosition.Goalkeeper]: [],
  [PlayerPosition.Defender]: [PlayerPosition.Half],
  [PlayerPosition.Half]: [PlayerPosition.Defender, PlayerPosition.Midfielder],
  [PlayerPosition.Midfielder]: [PlayerPosition.Half, PlayerPosition.Forward],
  [PlayerPosition.Forward]: [PlayerPosition.Midfielder],
}

export function getPositionFit(playerPosition: PlayerPosition, slotPosition: PlayerPosition): number {
  if (playerPosition === slotPosition) return 1.0
  if (ADJACENT[playerPosition]?.includes(slotPosition)) return 0.90
  return 0.75
}

export interface SquadEvaluation {
  offenseScore: number           // 0-100
  defenseScore: number           // 0-100
  cornerScore: number            // 0-100
  goalkeeperScore: number        // 0-100
  disciplineRisk: number         // 0-100 (higher = more risky)
  // How quickly defenders recover position after an offensive corner.
  // Low = exposed in the post-corner counter window. Shown in scouting.
  cornerRecoveryScore: number    // 0-100 (higher = safer)
  // How well a team avoids unnecessary fouls when holding a lead.
  // Low = they gamble with suspensions in the last 20 min. Shown in scouting.
  tacticalDiscipline: number     // 0-100 (higher = more disciplined)
}


function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function playerModifier(player: Player): number {
  return (player.form / 100) * 0.4 + (player.fitness / 100) * 0.6
}

function effectivePlayerModifier(player: Player, tactic: Tactic): number {
  const base = playerModifier(player)
  const lineupSlots = tactic.lineupSlots
  if (!lineupSlots) return base
  const slotId = Object.entries(lineupSlots).find(([, pid]) => pid === player.id)?.[0]
  if (!slotId) return base
  const formation = tactic.formation ?? '3-3-4'
  const slot = FORMATIONS[formation]?.slots.find(s => s.id === slotId)
  if (!slot) return base
  return base * getPositionFit(player.position, slot.position)
}

function offensePlayerScore(player: Player): number {
  const a = player.attributes
  return (
    a.passing * 0.20 +
    a.shooting * 0.25 +
    a.dribbling * 0.15 +
    a.vision * 0.20 +
    a.decisions * 0.10 +
    a.skating * 0.10
  )
}

function defensePlayerScore(player: Player): number {
  const a = player.attributes
  return (
    a.defending * 0.30 +
    a.positioning * 0.25 +
    a.workRate * 0.20 +
    a.skating * 0.15 +
    a.stamina * 0.10
  )
}

function cornerPlayerScore(player: Player): number {
  const a = player.attributes
  return a.cornerSkill * 0.5 + a.passing * 0.3 + a.decisions * 0.2
}

export function evaluateSquad(starters: Player[], tactic: Tactic): SquadEvaluation {
  // --- offenseScore ---
  const forwards = starters.filter(p => p.position === PlayerPosition.Forward)
  const midfielders = starters.filter(p => p.position === PlayerPosition.Midfielder)
  const halfs = starters.filter(p => p.position === PlayerPosition.Half)

  let offensePlayers = [...forwards, ...midfielders]
  if (offensePlayers.length < 3) {
    offensePlayers = [...offensePlayers, ...halfs]
  }

  let offenseScore = 0
  if (offensePlayers.length > 0) {
    const total = offensePlayers.reduce((sum, p) => {
      return sum + offensePlayerScore(p) * effectivePlayerModifier(p, tactic)
    }, 0)
    offenseScore = total / offensePlayers.length
  }

  // --- defenseScore ---
  const defenders = starters.filter(p => p.position === PlayerPosition.Defender)
  const defensePlayers = [...defenders, ...halfs]

  let defenseScore = 0
  if (defensePlayers.length > 0) {
    const total = defensePlayers.reduce((sum, p) => {
      return sum + defensePlayerScore(p) * effectivePlayerModifier(p, tactic)
    }, 0)
    defenseScore = total / defensePlayers.length
  }

  // --- cornerScore ---
  const nonGkPlayers = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
  const sortedByCorner = [...nonGkPlayers].sort(
    (a, b) => b.attributes.cornerSkill - a.attributes.cornerSkill
  )
  const top3 = sortedByCorner.slice(0, 3)

  let cornerScore = 0
  if (top3.length > 0) {
    const weights = [0.5, 0.3, 0.2]
    let weightedSum = 0
    let totalWeight = 0
    for (let i = 0; i < top3.length; i++) {
      const p = top3[i]
      const score = cornerPlayerScore(p) * effectivePlayerModifier(p, tactic)
      weightedSum += score * weights[i]
      totalWeight += weights[i]
    }
    cornerScore = weightedSum / totalWeight
  }

  // --- goalkeeperScore ---
  const goalkeepers = starters.filter(p => p.position === PlayerPosition.Goalkeeper)
  let goalkeeperScore: number

  if (goalkeepers.length === 0) {
    goalkeeperScore = 20
  } else {
    const gk = goalkeepers.reduce((best, p) =>
      p.attributes.goalkeeping > best.attributes.goalkeeping ? p : best
    )
    const a = gk.attributes
    const rawScore = a.goalkeeping * 0.55 + a.positioning * 0.25 + a.decisions * 0.20
    goalkeeperScore = rawScore * effectivePlayerModifier(gk, tactic)
  }

  // --- disciplineRisk ---
  const avgDiscipline = starters.length > 0
    ? starters.reduce((sum, p) => sum + p.discipline, 0) / starters.length
    : 50
  const disciplineRisk = 100 - avgDiscipline

  // --- cornerRecoveryScore: avg cornerRecovery of non-GK starters ---
  const nonGkStarters = starters.filter(p => p.position !== PlayerPosition.Goalkeeper)
  const cornerRecoveryScore = nonGkStarters.length > 0
    ? nonGkStarters.reduce((sum, p) => sum + (p.attributes.cornerRecovery ?? 50), 0) / nonGkStarters.length
    : 50

  // --- tacticalDiscipline: discipline weighted by suspension profile risk ---
  // situation/intensitet/volym profiles drag it down; ren pulls it up
  const profilePenalty = (p: Player): number => {
    switch (p.suspensionProfile) {
      case 'situation':  return -8
      case 'intensitet': return -12
      case 'volym':      return -15
      case 'ren':        return +10
      default:           return 0
    }
  }
  const tacticalDiscipline = nonGkStarters.length > 0
    ? clamp(
        nonGkStarters.reduce((sum, p) => sum + p.discipline + profilePenalty(p), 0) / nonGkStarters.length,
        0, 100
      )
    : 50

  return {
    offenseScore: round1(clamp(offenseScore)),
    defenseScore: round1(clamp(defenseScore)),
    cornerScore: round1(clamp(cornerScore)),
    goalkeeperScore: round1(clamp(goalkeeperScore)),
    disciplineRisk: round1(clamp(disciplineRisk)),
    cornerRecoveryScore: round1(clamp(cornerRecoveryScore)),
    tacticalDiscipline: round1(clamp(tacticalDiscipline)),
  }
}
