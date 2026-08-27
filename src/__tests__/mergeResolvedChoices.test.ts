/**
 * PÅSTÅENDEKARTAN (2026-08-24) — GranskaScreen.tsx:s "Du valde: X" fanns
 * tidigare bara i en flyktig useState, nollställd vid remount/omladdning.
 * Detta testet verifierar att den persisterade sanningen (game.resolvedChoices)
 * täcker exakt det scenariot — utan RTL, ren funktion.
 */
import { describe, it, expect } from 'vitest'
import { mergeResolvedChoices, resolvedWithAssertedLabel } from '../presentation/screens/granska/helpers'

describe('mergeResolvedChoices', () => {
  it('remount-scenariot: ingen optimistisk state kvar, men persisterad sanning finns — "Du valde: X" visas ändå', () => {
    const persisted = [{ eventId: 'ev1', choiceId: 'accept', label: 'Du gav honom chansen' }]
    const { resolvedEventIds, chosenLabels } = mergeResolvedChoices(persisted, new Set(), {})
    expect(resolvedEventIds.has('ev1')).toBe(true)
    expect(chosenLabels['ev1']).toBe('Du gav honom chansen')
  })

  it('precis efter klick (inom 600ms): optimistisk overlay syns även innan game.resolvedChoices hunnit skrivas', () => {
    const { resolvedEventIds, chosenLabels } = mergeResolvedChoices(
      [], new Set(['ev2']), { ev2: 'Du sa nej' },
    )
    expect(resolvedEventIds.has('ev2')).toBe(true)
    expect(chosenLabels['ev2']).toBe('Du sa nej')
  })

  it('båda källorna samtidigt (efter 600ms, innan omladdning): unionen av båda, ingen dubblett', () => {
    const persisted = [{ eventId: 'ev1', choiceId: 'a', label: 'Gammalt val' }]
    const { resolvedEventIds, chosenLabels } = mergeResolvedChoices(
      persisted, new Set(['ev1', 'ev2']), { ev1: 'Gammalt val', ev2: 'Nytt val' },
    )
    expect(resolvedEventIds).toEqual(new Set(['ev1', 'ev2']))
    expect(chosenLabels).toEqual({ ev1: 'Gammalt val', ev2: 'Nytt val' })
  })

  it('inget resolverat alls: tomma resultat', () => {
    const { resolvedEventIds, chosenLabels } = mergeResolvedChoices([], new Set(), {})
    expect(resolvedEventIds.size).toBe(0)
    expect(chosenLabels).toEqual({})
  })
})

/**
 * PÅSTÅENDEGRINDEN nivå 3 — citatkravet (2026-08-25, samma pass som
 * parserfixen i citesDeclaration.ts, Jacobs order: "båda är små och båda
 * i grindkoden"). Vitest kör i DEV-läge (import.meta.env.DEV === true) —
 * produktionsgrenen (tystnad, inget kastat) är en enkel guard-negation av
 * samma villkor och testas inte separat via env-mockning här; den
 * meningsfulla, testbara garantin är att grinden FAKTISKT kastar när ett
 * event är resolved utan citat, och FAKTISKT inte kastar i alla legitima
 * lägen.
 */
describe('resolvedWithAssertedLabel — nivå 3, citatkravet', () => {
  it('kastar när eventet är resolved men chosenLabels saknar ett citat för det', () => {
    const resolvedEventIds = new Set(['ev1'])
    const chosenLabels: Record<string, string> = {}
    expect(() => resolvedWithAssertedLabel('ev1', resolvedEventIds, chosenLabels)).toThrow(/PÅSTÅENDEGRINDEN nivå 3/)
  })

  it('kastar INTE när eventet är resolved OCH har ett citat', () => {
    const resolvedEventIds = new Set(['ev1'])
    const chosenLabels = { ev1: 'Du gav honom chansen' }
    expect(() => resolvedWithAssertedLabel('ev1', resolvedEventIds, chosenLabels)).not.toThrow()
    expect(resolvedWithAssertedLabel('ev1', resolvedEventIds, chosenLabels)).toBe(true)
  })

  it('kastar INTE när eventet inte är resolved alls (inget påstående görs)', () => {
    const resolvedEventIds = new Set<string>()
    const chosenLabels: Record<string, string> = {}
    expect(() => resolvedWithAssertedLabel('ev1', resolvedEventIds, chosenLabels)).not.toThrow()
    expect(resolvedWithAssertedLabel('ev1', resolvedEventIds, chosenLabels)).toBe(false)
  })
})
