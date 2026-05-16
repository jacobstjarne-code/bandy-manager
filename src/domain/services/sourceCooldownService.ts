export type SourceKey = 'kommunen' | 'mecenat' | 'lokaltidningen'

export interface SourceCooldown {
  roundsLeft: number
  totalRounds: number
}

export type SourceCooldowns = Partial<Record<SourceKey, SourceCooldown>>

export const SOURCE_COOLDOWN_ROUNDS: Record<SourceKey, number> = {
  kommunen: 8,
  mecenat: 4,
  lokaltidningen: 3,
}

// Event types that map to each source
export const EVENT_SOURCE_MAP: Partial<Record<string, SourceKey>> = {
  hallDebate: 'kommunen',
  kommunMote: 'kommunen',
  licenseHandlingsplan: 'kommunen',
  gentjanst: 'kommunen',
  mecenatDinner: 'mecenat',
  journalistExclusive: 'lokaltidningen',
}

export function startCooldown(
  cooldowns: SourceCooldowns,
  source: SourceKey,
): SourceCooldowns {
  const rounds = SOURCE_COOLDOWN_ROUNDS[source]
  return { ...cooldowns, [source]: { roundsLeft: rounds, totalRounds: rounds } }
}

export function decrementCooldowns(cooldowns: SourceCooldowns): SourceCooldowns {
  const result: SourceCooldowns = {}
  for (const [key, val] of Object.entries(cooldowns) as [SourceKey, SourceCooldown][]) {
    if (val.roundsLeft > 1) {
      result[key] = { ...val, roundsLeft: val.roundsLeft - 1 }
    }
    // roundsLeft === 1: remove (cooldown done)
  }
  return result
}

export function isInCooldown(cooldowns: SourceCooldowns, source: SourceKey): boolean {
  return (cooldowns[source]?.roundsLeft ?? 0) > 0
}
