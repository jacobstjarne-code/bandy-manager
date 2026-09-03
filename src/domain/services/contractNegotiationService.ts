import type { Player } from '../entities/Player'

export interface ContractSalaryRange {
  min: number
  max: number
}

export interface ContractOfferResult {
  accepted: boolean
  counterSalary?: number
}

function roundSalary(value: number): number {
  return Math.max(1_000, Math.round(value / 1_000) * 1_000)
}

/**
 * Spelarens synliga löneanspråk är medvetet ett spann. Den kanoniska
 * minlönen är marknadens mittpunkt, inte ett facit som förhandlingsytan ska
 * avslöja före budet.
 */
export function getContractSalaryRange(minSalary: number): ContractSalaryRange {
  return {
    min: roundSalary(minSalary * 0.95),
    max: roundSalary(minSalary * 1.15),
  }
}

/**
 * Kontraktslängden är en riktig del av erbjudandet: ett kort kontrakt kräver
 * mer lön, medan tre års trygghet kan kompensera för en något lägre nivå.
 * Spelarens personlighet flyttar kravet, men aldrig utanför det kommunicerade
 * spannet.
 */
export function getRequiredContractSalary(
  player: Pick<Player, 'transferPersonality'>,
  minSalary: number,
  years: number,
): number {
  const lengthFactor = years <= 1 ? 1.10 : years >= 3 ? 0.95 : 1
  const personalityFactor = player.transferPersonality === 'ambitious'
    ? 1.05
    : player.transferPersonality === 'homebound' || player.transferPersonality === 'family'
      ? 0.98
      : 1
  const range = getContractSalaryRange(minSalary)
  return Math.max(range.min, Math.min(range.max, roundSalary(minSalary * lengthFactor * personalityFactor)))
}

/**
 * En enda domänväg för både förlängningar och fria agenter. Tidigare låg
 * osäkerheten bara i ContractsTab; anrop direkt mot store accepterade samma
 * bud. Nu avgör samma erbjudande alltid samma sak oavsett yta.
 */
export function evaluateContractOffer(
  player: Pick<Player, 'currentAbility' | 'form' | 'potentialAbility' | 'transferPersonality'>,
  minSalary: number,
  offeredSalary: number,
  years: number,
  rand: () => number,
): ContractOfferResult {
  const requiredSalary = getRequiredContractSalary(player, minSalary, years)
  if (offeredSalary < requiredSalary) {
    return { accepted: false, counterSalary: requiredSalary }
  }

  // Ett tydligt premiumbud ska inte falla på ett dolt tärningsslag.
  if (offeredSalary >= roundSalary(requiredSalary * 1.15)) return { accepted: true }

  let reluctance = 0
  if (player.currentAbility > 60) reluctance += 0.20
  if (player.form > 65) reluctance += 0.10
  if ((player.potentialAbility ?? 0) > 70) reluctance += 0.10
  if (player.transferPersonality === 'ambitious') reluctance += 0.10

  const premiumShare = Math.max(0, (offeredSalary - requiredSalary) / Math.max(1, requiredSalary * 0.15))
  const rejectChance = Math.max(0, reluctance * (1 - premiumShare))
  return rand() < rejectChance
    ? { accepted: false, counterSalary: roundSalary(requiredSalary * 1.10) }
    : { accepted: true }
}
