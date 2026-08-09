import { describe, it, expect } from 'vitest'
import { computeProgressPct, formatMoneyPair, formatOwnerInitial } from '../BoardObjectivesList'
import type { BoardObjective } from '../../../../../domain/entities/Community'

// SLUTTEST RUNDA 3 (2026-08-08, punkt 3): riktig avståndsbaserad progress
// för lägre-är-bättre-mål (topHalf/reduceInjuries). Se computeProgressPct
// i BoardObjectivesList.tsx för rotorsak och formel.
function makeObj(overrides: Partial<BoardObjective>): BoardObjective {
  return {
    id: 'test', type: 'sporting', label: 'Test', description: '',
    ownerId: 'Test Testsson', ownerPersonality: 'traditionalist',
    targetValue: 6, currentValue: 6, measureFn: 'topHalf',
    status: 'active', assignedSeason: 1,
    successReward: '', failureConsequence: '', carryOver: false,
    ...overrides,
  }
}

describe('computeProgressPct — lägre-är-bättre-mål (topHalf, reduceInjuries)', () => {
  it('plats 9 mot topp 6, start på plats 9 → tom stapel (ingen framgång ännu)', () => {
    const obj = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: 9, currentValue: 9 })
    expect(computeProgressPct(obj)).toBe(0)
  })

  it('plats 7 mot topp 6, start på plats 9 → deletsträcka (2/3)', () => {
    const obj = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: 9, currentValue: 7 })
    expect(computeProgressPct(obj)).toBe(67)
  })

  it('uppfyllt mål (plats 6, target 6) → full stapel', () => {
    const obj = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: 9, currentValue: 6 })
    expect(computeProgressPct(obj)).toBe(100)
  })

  it('reduceInjuries: noll skador (bästa utfall) → full stapel, inte tom', () => {
    const obj = makeObj({ measureFn: 'reduceInjuries', targetValue: 5, startValue: 8, currentValue: 0 })
    expect(computeProgressPct(obj)).toBe(100)
  })

  it('sämre än startläget → tom stapel, inte negativ eller klampad fel väg', () => {
    const obj = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: 9, currentValue: 12 })
    expect(computeProgressPct(obj)).toBe(0)
  })

  it('startValue saknas (omigrerat save) → binär fallback, inte NaN/negativ', () => {
    const obj = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: undefined, currentValue: 9 })
    expect(computeProgressPct(obj)).toBe(0)
    const met = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: undefined, currentValue: 4 })
    expect(computeProgressPct(met)).toBe(100)
  })

  it('start redan bättre än/lika med målet (t.ex. laget låg 4:a när målet begärdes) — regression till sämre läge ger inte en falsk full stapel', () => {
    // Rot: (start-current)/(start-target) med start=4, target=6, current=9 blir
    // (4-9)/(4-6) = 2.5, klampat till 100% — fel håll för ett lag som numera
    // MISSAR målet. Guard: start<=target faller tillbaka till binärt.
    const obj = makeObj({ measureFn: 'topHalf', targetValue: 6, startValue: 4, currentValue: 9 })
    expect(computeProgressPct(obj)).toBe(0)
  })
})

describe('computeProgressPct — högre-är-bättre-mål (oförändrad kvot)', () => {
  it('growFanbase: 50/70 ger 71%', () => {
    const obj = makeObj({ measureFn: 'growFanbase', targetValue: 70, currentValue: 50 })
    expect(computeProgressPct(obj)).toBe(71)
  })

  it('klampas till 100 vid överskridet mål', () => {
    const obj = makeObj({ measureFn: 'growFinances', targetValue: 100000, currentValue: 150000 })
    expect(computeProgressPct(obj)).toBe(100)
  })
})

// Regressionsskydd för formatMoneyPair/formatOwnerInitial (tidigare
// oförprövade, redan i produktion sedan uppföljning 1 samma dag).
describe('formatMoneyPair', () => {
  it('väljer samma enhet på båda sidor när talen ligger i olika tior', () => {
    expect(formatMoneyPair(0, 100000)).toEqual(['0 tkr', '100 tkr'])
  })
})

describe('formatOwnerInitial', () => {
  it('förkortar förnamnet, behåller efternamnet', () => {
    expect(formatOwnerInitial('Anna Karlsson')).toBe('A. Karlsson')
  })
})
