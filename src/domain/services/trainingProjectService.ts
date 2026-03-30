import type { TrainingProject, TrainingProjectType } from '../entities/Training'
import type { Player } from '../entities/Player'

export interface ProjectDefinition {
  type: TrainingProjectType
  label: string
  emoji: string
  roundsNormal: number
  roundsHard: number
  description: string
  effectDescription: string
  injuryRisk: 'none' | 'low' | 'medium' | 'high'
  affectedAttribute: string
  attributeBoost: number
  targetCount: number  // how many players benefit
}

export const PROJECT_DEFINITIONS: ProjectDefinition[] = [
  {
    type: 'conditioning',
    label: 'Konditionslyft',
    emoji: '🏋️',
    roundsNormal: 6,
    roundsHard: 3,
    description: 'Intensiv konditionsträning för hela truppen.',
    effectDescription: '+3 Kondition på truppen',
    injuryRisk: 'medium',
    affectedAttribute: 'stamina',
    attributeBoost: 3,
    targetCount: 999,
  },
  {
    type: 'shooting',
    label: 'Skottskärpa',
    emoji: '⚡',
    roundsNormal: 4,
    roundsHard: 2,
    description: 'Fokus på avslut och skotteknik.',
    effectDescription: '+2 Skott på 8 spelare',
    injuryRisk: 'low',
    affectedAttribute: 'shooting',
    attributeBoost: 2,
    targetCount: 8,
  },
  {
    type: 'defense',
    label: 'Defensivträning',
    emoji: '🛡️',
    roundsNormal: 5,
    roundsHard: 3,
    description: 'Taktisk och fysisk defensiv träning.',
    effectDescription: '+2 Försvar på 8 spelare',
    injuryRisk: 'low',
    affectedAttribute: 'defending',
    attributeBoost: 2,
    targetCount: 8,
  },
  {
    type: 'corners',
    label: 'Hörnträning',
    emoji: '🎯',
    roundsNormal: 3,
    roundsHard: 2,
    description: 'Specialiserad träning på hörnor och fasta situationer.',
    effectDescription: '+3 Hörnspel på 5 spelare',
    injuryRisk: 'none',
    affectedAttribute: 'cornerSkill',
    attributeBoost: 3,
    targetCount: 5,
  },
  {
    type: 'physical',
    label: 'Fyspass',
    emoji: '💪',
    roundsNormal: 4,
    roundsHard: 2,
    description: 'Explosivitet och arbetskapacitet.',
    effectDescription: '+2 Acceleration & Arbetsinsats på 8 spelare',
    injuryRisk: 'high',
    affectedAttribute: 'acceleration',
    attributeBoost: 2,
    targetCount: 8,
  },
  {
    type: 'tactical',
    label: 'Spelsinne',
    emoji: '🧠',
    roundsNormal: 8,
    roundsHard: 4,
    description: 'Djup taktisk förståelse och beslutskraft.',
    effectDescription: '+2 Vision & Beslut på 8 spelare',
    injuryRisk: 'none',
    affectedAttribute: 'vision',
    attributeBoost: 2,
    targetCount: 8,
  },
]

// Per-round injury probability for each risk level
const RISK_CHANCE: Record<string, number> = {
  none: 0,
  low: 0.03,
  medium: 0.06,
  high: 0.12,
}

export function createTrainingProject(
  type: TrainingProjectType,
  intensity: 'normal' | 'hard',
): TrainingProject {
  const def = PROJECT_DEFINITIONS.find(d => d.type === type)!
  const rounds = intensity === 'hard' ? def.roundsHard : def.roundsNormal
  return {
    id: `proj_${type}_${Date.now()}`,
    type,
    roundsTotal: rounds,
    roundsRemaining: rounds,
    intensity,
    status: 'active',
  }
}

export function processTrainingProjectsPerRound(
  projects: TrainingProject[],
  players: Player[],
  managedClubId: string,
  rand: () => number,
  currentRound: number,
): {
  updatedProjects: TrainingProject[]
  updatedPlayers: Player[]
  newlyInjuredIds: string[]
} {
  let updatedPlayers = [...players]
  const newlyInjuredIds: string[] = []

  const updatedProjects = projects.map(p => {
    if (p.status !== 'active') return p

    const def = PROJECT_DEFINITIONS.find(d => d.type === p.type)!
    const riskBase = RISK_CHANCE[def.injuryRisk] ?? 0
    const riskMod = p.intensity === 'hard' ? 2.0 : 1.0
    const riskChance = riskBase * riskMod

    // Injury check this round
    if (riskChance > 0 && rand() < riskChance) {
      const eligible = updatedPlayers.filter(
        pl => pl.clubId === managedClubId && !pl.isInjured
      )
      if (eligible.length > 0) {
        const target = eligible[Math.floor(rand() * eligible.length)]
        const days = 7 + Math.floor(rand() * 14)
        const idx = updatedPlayers.findIndex(pl => pl.id === target.id)
        updatedPlayers[idx] = { ...updatedPlayers[idx], isInjured: true, injuryDaysRemaining: days }
        newlyInjuredIds.push(target.id)
      }
    }

    const remaining = p.roundsRemaining - 1

    if (remaining <= 0) {
      // Apply effect to managed club players
      const managedPlayers = updatedPlayers.filter(pl => pl.clubId === managedClubId && !pl.isInjured)
      const sorted = [...managedPlayers].sort((a, b) => b.currentAbility - a.currentAbility)
      const targets = def.targetCount >= 999 ? sorted : sorted.slice(0, def.targetCount)

      for (const target of targets) {
        const idx = updatedPlayers.findIndex(pl => pl.id === target.id)
        if (idx === -1) continue
        const pl = updatedPlayers[idx]
        const attrs = { ...pl.attributes }

        if (def.type === 'conditioning') {
          attrs.stamina = Math.min(100, (attrs.stamina ?? 50) + def.attributeBoost)
        } else if (def.type === 'shooting') {
          attrs.shooting = Math.min(100, (attrs.shooting ?? 50) + def.attributeBoost)
        } else if (def.type === 'defense') {
          attrs.defending = Math.min(100, (attrs.defending ?? 50) + def.attributeBoost)
        } else if (def.type === 'corners') {
          attrs.cornerSkill = Math.min(100, (attrs.cornerSkill ?? 50) + def.attributeBoost)
        } else if (def.type === 'physical') {
          attrs.acceleration = Math.min(100, (attrs.acceleration ?? 50) + def.attributeBoost)
          attrs.workRate = Math.min(100, (attrs.workRate ?? 50) + def.attributeBoost)
        } else if (def.type === 'tactical') {
          attrs.vision = Math.min(100, (attrs.vision ?? 50) + def.attributeBoost)
          attrs.decisions = Math.min(100, (attrs.decisions ?? 50) + def.attributeBoost)
        }

        // Small CA boost from completed project
        const caBoost = p.intensity === 'hard' ? 1.5 : 1.0
        updatedPlayers[idx] = {
          ...pl,
          attributes: attrs,
          currentAbility: Math.min(100, pl.currentAbility + caBoost / targets.length),
        }
      }

      return {
        ...p,
        roundsRemaining: 0,
        status: 'completed' as const,
        completedRound: currentRound,
        injuredPlayerIds: newlyInjuredIds,
      }
    }

    return { ...p, roundsRemaining: remaining }
  })

  return { updatedProjects, updatedPlayers, newlyInjuredIds }
}
