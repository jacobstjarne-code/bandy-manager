import type { Player } from '../entities/Player'

export type CounterChoice = 'sprint' | 'build' | 'earlyBall'

export interface CounterInteractionData {
  minute: number
  runnerName: string
  runnerId: string
  runnerSpeed: number
  supportName: string
  supportId: string
  defendersBeat: number  // 1-3
}

export interface CounterOutcome {
  type: 'goal' | 'saved' | 'miss' | 'offside' | 'tackled'
  scorerId?: string
  scorerName?: string
  description: string
}

/** Uppskattad målchans per val (0–1) */
export function counterChoiceSuccessRates(data: CounterInteractionData): Record<CounterChoice, number> {
  const speedFactor = data.runnerSpeed > 70 ? 0.05 : data.runnerSpeed > 50 ? 0 : -0.05
  const outnumbered = data.defendersBeat >= 2
  return {
    sprint:    Math.max(0.10, Math.min(0.60, 0.35 + speedFactor + (outnumbered ? -0.05 : 0.05))),
    earlyBall: Math.max(0.15, Math.min(0.55, 0.40 + (outnumbered ? -0.08 : 0))),
    build:     Math.max(0.10, Math.min(0.45, 0.25 + (outnumbered ? 0.05 : 0))),
  }
}

/** Formats a rate as %, rounded to nearest 5 */
export function formatCounterRate(rate: number): string {
  return `${Math.round(rate * 20) * 5}%`
}

export function resolveCounter(
  choice: CounterChoice,
  runner: Player,
  support: Player,
  gk: Player | undefined,
  rand: () => number,
): CounterOutcome {
  const runnerAtk = (runner.attributes.skating * 0.35 + runner.attributes.shooting * 0.35 + runner.attributes.decisions * 0.30) / 100
  const supportAtk = (support.attributes.passing * 0.4 + support.attributes.shooting * 0.35 + support.attributes.decisions * 0.25) / 100
  const gkStrength = gk ? gk.attributes.goalkeeping / 100 : 0.5

  if (choice === 'sprint') {
    const offsideRisk = 0.18
    if (rand() < offsideRisk) {
      return { type: 'offside', description: `${runner.firstName} ${runner.lastName} springer fritt men flaggan går upp — offside.` }
    }
    const goalChance = Math.max(0.20, Math.min(0.75, 0.45 + (runnerAtk - 0.50) * 0.8 - gkStrength * 0.25))
    if (rand() < goalChance) {
      return {
        type: 'goal',
        scorerId: runner.id,
        scorerName: `${runner.firstName} ${runner.lastName}`,
        description: `${runner.firstName} ${runner.lastName} spurtar förbi sista man och sätter in det!`,
      }
    }
    return rand() < 0.5
      ? { type: 'saved', description: `${runner.firstName} ${runner.lastName} skjuter hårt men målvakten räddar.` }
      : { type: 'miss', description: `${runner.firstName} ${runner.lastName} skjuter för högt — läge bortslösat.` }
  }

  if (choice === 'earlyBall') {
    const passSuccess = Math.max(0.30, Math.min(0.80, 0.55 + (runner.attributes.passing / 100 - 0.50) * 0.6))
    if (rand() < passSuccess) {
      const goalChance = Math.max(0.20, Math.min(0.65, 0.40 + (supportAtk - 0.50) * 0.7 - gkStrength * 0.20))
      if (rand() < goalChance) {
        return {
          type: 'goal',
          scorerId: support.id,
          scorerName: `${support.firstName} ${support.lastName}`,
          description: `Tidig boll till ${support.firstName} ${support.lastName} som nickar in!`,
        }
      }
      return rand() < 0.55
        ? { type: 'saved', description: `${support.firstName} ${support.lastName} avslutar men målvakten är framme.` }
        : { type: 'miss', description: `Bollen kommer bra men avslut går utanför.` }
    }
    return { type: 'tackled', description: `Passprecisionen räcker inte — passet avbryts av försvaret.` }
  }

  // build
  const buildChance = Math.max(0.15, Math.min(0.55, 0.30 + (supportAtk + runnerAtk) / 2 * 0.5 - gkStrength * 0.15))
  if (rand() < buildChance) {
    const scorer = rand() < 0.5 ? runner : support
    return {
      type: 'goal',
      scorerId: scorer.id,
      scorerName: `${scorer.firstName} ${scorer.lastName}`,
      description: `Laget spelar av och hittar luckan — ${scorer.firstName} ${scorer.lastName} sätter in!`,
    }
  }
  return { type: 'tackled', description: `Uppspelet misslyckas. Försvaret hinner tillbaka och bryter kontringen.` }
}
