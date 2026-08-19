import { describe, it, expect } from 'vitest'
import { getConsequenceLines } from '../domain/entities/GameEvent'
import type { EventChoice } from '../domain/entities/GameEvent'

/**
 * D1 (DOM_D1_EVENTVIKTNING_2026-08-19.md) punkt 3 — konsekvensmarkören.
 *
 * Låst copy ur domen, testad ordagrant:
 *   Neutral: ingen markör.
 *   Positiv: ingen markör (facit-förbud, O12 — att märka ut det goda valet
 *     är facit).
 *   Kostsam: costLabel, alltid (exakta pengar eller namngiven resurs).
 *   Irreversibel: en EGEN rad, "Går inte att ändra."
 *   Är valet både kostsamt och irreversibelt: båda raderna, kostnaden först.
 *
 * Samma testmönster som eventRenderRouting.test.ts: ren logik istället för
 * DOM-rendering (@testing-library/react saknas i projektet).
 */

function makeChoice(overrides: Partial<EventChoice> = {}): EventChoice {
  return {
    id: 'choice_a',
    label: 'Sälj honom',
    effect: { type: 'noOp' },
    ...overrides,
  }
}

describe('getConsequenceLines — D1 punkt 3', () => {
  it('neutral (ingen consequenceLevel, inte irreversible) visar ingen rad', () => {
    const choice = makeChoice()
    expect(getConsequenceLines(choice)).toEqual([])
  })

  it('consequenceLevel="neutral" visar ingen rad', () => {
    const choice = makeChoice({ consequenceLevel: 'neutral' })
    expect(getConsequenceLines(choice)).toEqual([])
  })

  it('consequenceLevel="positive" visar ALDRIG en rad — facit-förbud (O12)', () => {
    const choice = makeChoice({ consequenceLevel: 'positive' })
    expect(getConsequenceLines(choice)).toEqual([])
  })

  it('consequenceLevel="positive" med (felaktigt satt) costLabel visar ändå ingen rad', () => {
    // Mekanisk garanti: bara 'costly' triggar kostnadsraden, aldrig 'positive'.
    const choice = makeChoice({ consequenceLevel: 'positive', costLabel: 'Kostar 45 tkr' })
    expect(getConsequenceLines(choice)).toEqual([])
  })

  it('consequenceLevel="costly" med costLabel visar exakt kostnadsraden', () => {
    const choice = makeChoice({ consequenceLevel: 'costly', costLabel: 'Kostar 45 tkr' })
    expect(getConsequenceLines(choice)).toEqual(['Kostar 45 tkr'])
  })

  it('consequenceLevel="costly" med per-månad-format', () => {
    const choice = makeChoice({ consequenceLevel: 'costly', costLabel: 'Kostar 18 tkr/mån' })
    expect(getConsequenceLines(choice)).toEqual(['Kostar 18 tkr/mån'])
  })

  it('consequenceLevel="costly" med sammansatt nu+sen-format', () => {
    const choice = makeChoice({ consequenceLevel: 'costly', costLabel: 'Kostar 45 tkr nu, 6 tkr/mån sen' })
    expect(getConsequenceLines(choice)).toEqual(['Kostar 45 tkr nu, 6 tkr/mån sen'])
  })

  it('consequenceLevel="costly" utan siffra — namngiven resurs (icke-pengar-kostnad)', () => {
    const choice = makeChoice({ consequenceLevel: 'costly', costLabel: 'Kostar en plats i truppen' })
    expect(getConsequenceLines(choice)).toEqual(['Kostar en plats i truppen'])
  })

  it('consequenceLevel="costly" utan costLabel visar ingen rad (mekanisk säkerhet — inget att visa)', () => {
    const choice = makeChoice({ consequenceLevel: 'costly' })
    expect(getConsequenceLines(choice)).toEqual([])
  })

  it('irreversible=true (utan consequenceLevel) visar exakt "Går inte att ändra."', () => {
    const choice = makeChoice({ irreversible: true })
    expect(getConsequenceLines(choice)).toEqual(['Går inte att ändra.'])
  })

  it('kostsam OCH irreversibel: båda raderna, kostnaden FÖRST', () => {
    const choice = makeChoice({ consequenceLevel: 'costly', costLabel: 'Kostar relationen till Mecenaten', irreversible: true })
    expect(getConsequenceLines(choice)).toEqual(['Kostar relationen till Mecenaten', 'Går inte att ändra.'])
  })

  it('irreversible=false med costly visar bara kostnadsraden', () => {
    const choice = makeChoice({ consequenceLevel: 'costly', costLabel: 'Kostar 8 tkr', irreversible: false })
    expect(getConsequenceLines(choice)).toEqual(['Kostar 8 tkr'])
  })
})
