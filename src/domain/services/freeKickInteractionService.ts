import type { Player } from '../entities/Player'

export type FreeKickChoice = 'shoot' | 'chipPass' | 'layOff'

export interface FreeKickInteractionData {
  minute: number
  kickerName: string
  kickerId: string
  kickerShooting: number
  kickerPassing: number
  distanceMeters: number  // 20-28
  wallSize: number        // 3-5
}

export interface FreeKickOutcome {
  type: 'goal' | 'saved' | 'wall' | 'wide' | 'corner_won'
  description: string
}

export function resolveFreeKick(
  choice: FreeKickChoice,
  kicker: Player,
  gk: Player | undefined,
  data: FreeKickInteractionData,
  rand: () => number,
): FreeKickOutcome {
  const shootingSkill = kicker.attributes.shooting / 100
  const passingSkill = kicker.attributes.passing / 100
  const gkStrength = gk ? gk.attributes.goalkeeping / 100 : 0.5
  const distancePenalty = (data.distanceMeters - 20) / 8 * 0.20  // 0 at 20m, 0.20 at 28m
  const wallFactor = (data.wallSize - 3) / 2 * 0.10  // 0 at 3, 0.10 at 5

  if (choice === 'shoot') {
    const wallHit = rand() < wallFactor + 0.10
    if (wallHit) return { type: 'wall', description: `Frislag av ${kicker.firstName} ${kicker.lastName} — rakt i muren.` }

    const goalChance = Math.max(0.08, Math.min(0.55, 0.35 + (shootingSkill - 0.50) * 0.6 - distancePenalty - gkStrength * 0.20))
    if (rand() < goalChance) {
      return { type: 'goal', description: `${kicker.firstName} ${kicker.lastName} kröker bollen förbi muren och in! Frislagsmål!` }
    }
    if (rand() < 0.40) return { type: 'saved', description: `Frislag av ${kicker.firstName} ${kicker.lastName} — fin räddning av målvakten.` }
    return { type: 'wide', description: `${kicker.firstName} ${kicker.lastName} skjuter men bollen går utanför.` }
  }

  if (choice === 'chipPass') {
    const passSuccess = Math.max(0.25, Math.min(0.70, 0.48 + (passingSkill - 0.50) * 0.5))
    if (rand() < passSuccess) {
      const goalChance = Math.max(0.15, Math.min(0.50, 0.30 + (shootingSkill - 0.50) * 0.4 - gkStrength * 0.15))
      if (rand() < goalChance) {
        return { type: 'goal', description: `Lyftning över muren, rusher möter och sätter in — 1-0!` }
      }
      return { type: 'corner_won', description: `Bollen lyfts bakom muren — avslut blockeras, hörna tillkommer.` }
    }
    return { type: 'wide', description: `Lyftbollen misslyckades. Ingen mötte upp och bollen rullar ut.` }
  }

  // layOff
  const goalChance = Math.max(0.05, Math.min(0.30, 0.15 + (shootingSkill + passingSkill) / 2 * 0.25 - gkStrength * 0.10))
  if (rand() < goalChance) {
    return { type: 'goal', description: `Kort frislag, upplägg — och en välplacerad avslut tar vägen in!` }
  }
  return { type: 'wide', description: `Kort frislag men uppbyggnaden avslutas med ett skott utanför.` }
}
