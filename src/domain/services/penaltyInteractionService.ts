export type PenaltyDirection = 'left' | 'center' | 'right'
export type PenaltyHeight = 'low' | 'high'

export interface PenaltyInteractionData {
  minute: number
  shooterName: string
  shooterId: string
  shooterSkill: number
  keeperName: string
  keeperSkill: number
}

export interface PenaltyOutcome {
  type: 'goal' | 'save' | 'miss'
  description: string
  shooterDirection: PenaltyDirection
  keeperDive: PenaltyDirection
}

export function resolveAIPenaltyKeeperDive(
  coachStyle: string,
  rand: () => number,
): PenaltyDirection {
  // Defensiv AI gissar mer (center bias)
  // Offensiv AI gissar brett (left/right bias)
  const r = rand()
  if (coachStyle === 'defensive') {
    if (r < 0.35) return 'left'
    if (r < 0.65) return 'center'
    return 'right'
  }
  if (r < 0.40) return 'left'
  if (r < 0.60) return 'center'
  return 'right'
}

export function resolvePenalty(
  data: PenaltyInteractionData,
  dir: PenaltyDirection,
  height: PenaltyHeight,
  keeperDive: PenaltyDirection,
  rand: () => number,
): PenaltyOutcome {
  const same = dir === keeperDive
  let goalChance = same ? 0.25 : 0.75

  // Skill adjustment
  goalChance += (data.shooterSkill - data.keeperSkill) / 100 * 0.15

  // High = harder to save but easier to miss
  if (height === 'high') {
    goalChance = same ? 0.35 : 0.80
    if (rand() < 0.15) {
      return { type: 'miss', description: 'Skottet seglar över ribban!',
               shooterDirection: dir, keeperDive }
    }
  }

  // Center = high risk/reward
  if (dir === 'center') {
    goalChance = keeperDive === 'center' ? 0.10 : 0.85
  }

  if (rand() < goalChance) {
    const dirText = dir === 'left' ? 'vänstra hörnet'
      : dir === 'right' ? 'högra hörnet' : 'rakt fram'
    return { type: 'goal',
      description: `MÅL! Bollen i ${dirText}. Målvakten chanslös.`,
      shooterDirection: dir, keeperDive }
  }

  return { type: 'save',
    description: 'Räddning! Målvakten läser skottet och parar.',
    shooterDirection: dir, keeperDive }
}
