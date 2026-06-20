import { describe, it, expect } from 'vitest'
import { getTacticConsequence } from '../domain/services/chemistryService'
import { getPhaseConsequence } from '../presentation/components/squad/SeasonArcCard'
import { TacticMentality, TacticPress } from '../domain/enums'
import type { Tactic } from '../domain/entities/Club'
import type { OpponentAnalysis } from '../domain/services/opponentAnalysisService'
import type { Player } from '../domain/entities/Player'

function makeTactic(mentality: TacticMentality, press: TacticPress = TacticPress.Medium): Tactic {
  return { mentality, press, lineupSlots: {} } as unknown as Tactic
}

function makeOpponent(weaknesses: string[], strengths: string[] = [], formation?: string): OpponentAnalysis {
  return {
    opponentClubId: 'opp',
    fixtureId: 'f1',
    level: 'detailed',
    formation,
    weaknesses,
    strengths,
    keyPlayers: [],
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'Kalle',
    lastName: 'Karlsson',
    age: 25,
    sharpness: 60,
    currentAbility: 65,
    isInjured: false,
    attributes: { stamina: 60 },
    periodisationOverride: null,
    ...overrides,
  } as unknown as Player
}

// ─── Surface A: getTacticConsequence ────────────────────────────────────────

describe('getTacticConsequence — Surface A', () => {
  it('offensiv + Sårbart försvar → motrelativ rad (seed 0)', () => {
    const t = makeTactic(TacticMentality.Offensive)
    const opp = makeOpponent(['Sårbart försvar'])
    const result = getTacticConsequence(t, [], {}, opp, 0)
    expect(result).toBe('Offensivt mot deras sårbara försvar — rätt match att trycka på.')
  })

  it('offensiv + Sårbart försvar → alternativ rad (seed 1)', () => {
    const t = makeTactic(TacticMentality.Offensive)
    const opp = makeOpponent(['Sårbart försvar'])
    const result = getTacticConsequence(t, [], {}, opp, 1)
    expect(result).toBe('De läcker bakåt. Spelar ni framåt kan det lossna tidigt.')
  })

  it('hög press + Svag halvlinje → pressrad', () => {
    const t = makeTactic(TacticMentality.Balanced, TacticPress.High)
    const opp = makeOpponent(['Svag halvlinje'])
    const result = getTacticConsequence(t, [], {}, opp, 0)
    expect(result).toBe('Hög press mot deras svaga mittfält — där vinns matchen om någonstans.')
  })

  it('defensiv + Stark anfallslinje → försiktighetsrad', () => {
    const t = makeTactic(TacticMentality.Defensive)
    const opp = makeOpponent([], ['Stark anfallslinje'])
    const result = getTacticConsequence(t, [], {}, opp, 0)
    expect(result).toBe('Ni sitter djupt mot deras farliga forwards. Klokt — men ni måste ta era få lägen.')
  })

  it('offensiv + Stark anfallslinje → riskrad', () => {
    const t = makeTactic(TacticMentality.Offensive)
    const opp = makeOpponent([], ['Stark anfallslinje'])
    const result = getTacticConsequence(t, [], {}, opp, 0)
    expect(result).toBe('Öppet mot deras anfall blir en målrik kväll åt båda håll. Säkert? Nej. Kul? Ja.')
  })

  it('jämn motståndare utan kant → getTacticFeel-fallback (inga matchade rader)', () => {
    const t = makeTactic(TacticMentality.Balanced)
    const opp = makeOpponent([], []) // no weaknesses or strengths
    const result = getTacticConsequence(t, [], {}, opp, 0)
    // Fallback starts with the mentality framing from getTacticFeel
    expect(result).toMatch(/^Balans/)
  })

  it('ingen motståndare → getTacticFeel-fallback', () => {
    const t = makeTactic(TacticMentality.Offensive)
    const result = getTacticConsequence(t, [], {})
    expect(result).toMatch(/^Tyngdpunkten/)
  })
})

// ─── Surface B: getPhaseConsequence ─────────────────────────────────────────

describe('getPhaseConsequence — Surface B', () => {
  it('toppa med 34-åring i elvan → spiken-varningsrad med namn', () => {
    const starters = [makePlayer({ age: 34, firstName: 'Stig' })]
    const result = getPhaseConsequence('toppa', starters, 3, 70)
    expect(result).toMatch(/Stig \(34\) orkar inte spiken/)
  })

  it('toppa utan veteraner → generell toppa-rad', () => {
    const starters = [makePlayer({ age: 25 })]
    const result = getPhaseConsequence('toppa', starters, 3, 70)
    expect(result).toBe('Toppa nu: tre matcher upp, sen faller formen.')
  })

  it('hall, platt kurva, inga varningar → silence', () => {
    const starters = [makePlayer({ age: 28 })]
    const result = getPhaseConsequence('hall', starters, 3, 70)
    expect(result).toBeNull()
  })

  it('bygg med ≥33-åring → varningsrad med namn', () => {
    const starters = [makePlayer({ age: 33, firstName: 'Erik' })]
    const result = getPhaseConsequence('bygg', starters, 2, 65)
    expect(result).toMatch(/Erik \(33\) tål det inte/)
  })

  it('bygg med ung trupp (3+ ≤20) → ung-trupp-rad', () => {
    const starters = [
      makePlayer({ age: 19, firstName: 'A' }),
      makePlayer({ id: 'p2', age: 18, firstName: 'B' }),
      makePlayer({ id: 'p3', age: 20, firstName: 'C' }),
      makePlayer({ id: 'p4', age: 25, firstName: 'D' }),
    ]
    const result = getPhaseConsequence('bygg', starters, 2, 60)
    expect(result).toBe('Bygg passar en ung trupp. De yngsta lyfter snabbast.')
  })

  it('vila med ung/skarp spelare → rostar-rad med namn', () => {
    const starters = [makePlayer({ age: 20, firstName: 'Oskar', sharpness: 78, currentAbility: 72 })]
    const result = getPhaseConsequence('vila', starters, 1, 72)
    expect(result).toMatch(/Oskar rostar av att stå still/)
  })
})
